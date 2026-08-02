import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { Prisma, Role, SessionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ScoringService } from "../scoring/scoring.service";
import { IntegrityEventDto, SaveAnswerDto } from "./sessions.dto";
import { RedisService } from "./redis.service";

const formInclude = {
  exam: true,
  sections: { orderBy: { order: "asc" as const }, include: { section: { include: {
    passages: true, audioAssets: true,
    questions: { orderBy: { order: "asc" as const }, include: { type: true, options: { orderBy: { order: "asc" as const } } } },
  } } } },
};

@Injectable()
export class SessionsService {
  private advancing = new Set<string>();
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService, private readonly scoring: ScoringService) {}

  async start(userId: string, testFormId: string) {
    const form = await this.prisma.testForm.findFirst({ where: { id: testFormId, isPublished: true }, include: formInclude });
    if (!form || !form.sections[0]) throw new NotFoundException("Published test form was not found.");
    const first = form.sections[0].section;
    const now = new Date(); const endsAt = new Date(now.getTime() + first.timeLimitSec * 1000);
    const session = await this.prisma.testSession.create({ data: { userId, testFormId, status: SessionStatus.IN_PROGRESS, activeSectionId: first.id, startedAt: now, sectionStartedAt: now, sectionEndsAt: endsAt, sectionAttempts: { create: { sectionId: first.id, order: form.sections[0].order, startedAt: now, endsAt } } } });
    await this.redis.setTimer(session.id, first.id, endsAt);
    return { ...session, endsAt: endsAt.toISOString(), form: this.publicForm(form), answers: [] };
  }

  async get(user: { id: string; role: Role }, id: string) {
    const session = await this.owned(user, id);
    if (session.status === SessionStatus.IN_PROGRESS && session.sectionEndsAt && session.sectionEndsAt <= new Date()) await this.advance(id, "timeout");
    const fresh = await this.prisma.testSession.findUniqueOrThrow({ where: { id }, include: { testForm: { include: formInclude }, answers: true, scores: true } });
    return { ...fresh, endsAt: fresh.sectionEndsAt?.toISOString(), form: this.publicForm(fresh.testForm) };
  }

  async save(user: { id: string; role: Role }, sessionId: string, questionId: string, dto: SaveAnswerDto) {
    const session = await this.owned(user, sessionId);
    if (session.status !== SessionStatus.IN_PROGRESS) throw new BadRequestException("This test is no longer accepting answers.");
    if (session.sectionEndsAt && session.sectionEndsAt <= new Date()) { await this.advance(sessionId, "timeout"); throw new BadRequestException("This section has ended. Your answers were submitted automatically."); }
    const question = await this.prisma.question.findUnique({ where: { id: questionId }, select: { sectionId: true } });
    if (!question || question.sectionId !== session.activeSectionId) throw new BadRequestException("The question is not in the active section.");
    return this.prisma.sessionAnswer.upsert({ where: { sessionId_questionId: { sessionId, questionId } }, update: { response: dto.response as Prisma.InputJsonValue, flagged: dto.flagged ?? false }, create: { sessionId, questionId, response: dto.response as Prisma.InputJsonValue, flagged: dto.flagged ?? false } });
  }

  async submitSection(user: { id: string; role: Role }, sessionId: string, sectionId: string) {
    const session = await this.owned(user, sessionId);
    if (session.activeSectionId !== sectionId) throw new BadRequestException("This section is not active.");
    return this.advance(sessionId, "candidate_submit");
  }

  async submit(user: { id: string; role: Role }, sessionId: string) {
    const session = await this.owned(user, sessionId);
    if (session.status !== SessionStatus.IN_PROGRESS && session.status !== SessionStatus.SECTION_BREAK) throw new BadRequestException("This test has already been submitted.");
    await this.redis.clearTimer(sessionId);
    if (session.activeSectionId) await this.prisma.sessionSection.updateMany({ where: { sessionId, sectionId: session.activeSectionId, submittedAt: null }, data: { status: "SUBMITTED", submittedAt: new Date() } });
    await this.prisma.testSession.update({ where: { id: sessionId }, data: { status: SessionStatus.SUBMITTED, submittedAt: new Date(), activeSectionId: null, sectionEndsAt: null } });
    return this.scoring.scoreSession(sessionId);
  }

  async integrity(user: { id: string; role: Role }, sessionId: string, event: IntegrityEventDto) {
    await this.owned(user, sessionId);
    await this.prisma.$transaction([
      this.prisma.testSession.update({ where: { id: sessionId }, data: { integrityEventCount: { increment: 1 } } }),
      this.prisma.auditLog.create({ data: { actorId: user.id, action: `integrity.${event.type}`, entity: "test_session", entityId: sessionId, diff: (event.detail ?? {}) as Prisma.InputJsonValue } }),
    ]);
    return { logged: true };
  }

  async review(user: { id: string; role: Role }, sessionId: string) {
    const session = await this.owned(user, sessionId);
    if (session.status === SessionStatus.IN_PROGRESS || session.status === SessionStatus.NOT_STARTED) throw new ForbiddenException("Submit the test before opening answer review.");
    return this.prisma.testSession.findUnique({ where: { id: sessionId }, include: { scores: true, answers: { include: { question: { include: { answerKey: true, options: true, type: true, section: true } }, aiScore: true } }, testForm: { include: { exam: true, sections: { include: { section: { include: { audioAssets: true } } } } } } } });
  }

  @Interval(5000)
  async expireSections() {
    const expired = await this.prisma.testSession.findMany({ where: { status: SessionStatus.IN_PROGRESS, sectionEndsAt: { lte: new Date() } }, select: { id: true }, take: 50 });
    for (const session of expired) await this.advance(session.id, "timeout");
  }

  private async advance(sessionId: string, reason: string) {
    if (this.advancing.has(sessionId)) return { advancing: true };
    this.advancing.add(sessionId);
    try {
      const session = await this.prisma.testSession.findUnique({ where: { id: sessionId }, include: { answers: true, testForm: { include: { sections: { orderBy: { order: "asc" }, include: { section: { include: { questions: { include: { answerKey: true } } } } } } } } } });
      if (!session || session.status !== SessionStatus.IN_PROGRESS) return session;
      const current = session.testForm.sections.find((item) => item.sectionId === session.activeSectionId);
      if (!current) throw new BadRequestException("The active section is not part of this form.");
      const answerMap = new Map(session.answers.map((answer) => [answer.questionId, answer])); let earned = 0; let possible = 0;
      for (const question of current.section.questions) { possible += question.points; const answer = answerMap.get(question.id); if (answer && question.answerKey) earned += this.scoring.grade(question.answerKey.matchStrategy, question.answerKey.acceptedAnswers, answer.response, question.answerKey.tolerance).pointsFactor * question.points; }
      const percent = possible ? earned / possible * 100 : 0;
      const later = session.testForm.sections.filter((item) => item.order > current.order); const nextOrder = later[0]?.order;
      const candidates = nextOrder === undefined ? [] : later.filter((item) => item.order === nextOrder);
      const next = candidates.find((item) => (item.routeMinPercent == null || percent >= item.routeMinPercent) && (item.routeMaxPercent == null || percent <= item.routeMaxPercent)) ?? candidates[0];
      await this.prisma.sessionSection.updateMany({ where: { sessionId, sectionId: current.sectionId, submittedAt: null }, data: { status: reason === "timeout" ? "AUTO_SUBMITTED" : "SUBMITTED", submittedAt: new Date() } });
      await this.prisma.auditLog.create({ data: { actorId: session.userId, action: `section.${reason}`, entity: "test_session", entityId: session.id, diff: { sectionId: session.activeSectionId, percent, routedTo: next?.sectionId ?? null } } });
      if (!next) {
        await this.redis.clearTimer(sessionId);
        await this.prisma.testSession.update({ where: { id: sessionId }, data: { status: SessionStatus.SUBMITTED, submittedAt: new Date(), activeSectionId: null, sectionEndsAt: null } });
        return this.scoring.scoreSession(sessionId);
      }
      const now = new Date(); const endsAt = new Date(now.getTime() + next.section.timeLimitSec * 1000);
      const updated = await this.prisma.testSession.update({ where: { id: sessionId }, data: { activeSectionId: next.sectionId, sectionStartedAt: now, sectionEndsAt: endsAt } });
      await this.prisma.sessionSection.upsert({ where: { sessionId_sectionId: { sessionId, sectionId: next.sectionId } }, update: { status: "IN_PROGRESS", startedAt: now, endsAt, submittedAt: null }, create: { sessionId, sectionId: next.sectionId, order: next.order, startedAt: now, endsAt } });
      await this.redis.setTimer(sessionId, next.sectionId, endsAt);
      return { ...updated, endsAt: endsAt.toISOString() };
    } finally { this.advancing.delete(sessionId); }
  }

  private async owned(user: { id: string; role: Role }, id: string) {
    const session = await this.prisma.testSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException("Test session was not found.");
    if (session.userId !== user.id && user.role !== Role.ADMIN) throw new ForbiddenException("This test session belongs to another user.");
    return session;
  }

  private publicForm<T extends { sections: Array<{ section: { audioAssets: Array<{ transcript: string | null }>; questions: Array<{ options: Array<{ isCorrect: boolean }> }> } }> }>(form: T) {
    return { ...form, sections: form.sections.map(({ section, ...join }) => ({ ...join, section: { ...section, audioAssets: section.audioAssets.map(({ transcript: _, ...audio }) => audio), questions: section.questions.map((q) => ({ ...q, options: q.options.map(({ isCorrect: _, ...option }) => option) })) } })) };
  }
}
