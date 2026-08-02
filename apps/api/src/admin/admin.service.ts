import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AudioDto, ExamDto, FeatureFlagDto, ImportDto, PassageDto, QuestionDto, SectionDto, TestFormDto } from "./admin.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  list() {
    return this.prisma.exam.findMany({ include: { sections: { orderBy: { order: "asc" }, include: { passages: true, audioAssets: true, questions: { orderBy: { order: "asc" }, include: { type: true, options: true, answerKey: true } } } }, testForms: { include: { sections: { orderBy: { order: "asc" } }, _count: { select: { sessions: true } } } } } });
  }
  users() { return this.prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, email: true, name: true, role: true, emailVerifiedAt: true, createdAt: true } }); }
  updateRole(id: string, role: import("@prisma/client").Role) { return this.prisma.user.update({ where: { id }, data: { role }, select: { id: true, email: true, name: true, role: true } }); }
  audit() { return this.prisma.auditLog.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true, email: true } } } }); }
  flags() { return this.prisma.featureFlag.findMany({ orderBy: [{ key: "asc" }, { examId: "asc" }], include: { exam: { select: { code: true, name: true } } } }); }
  async setFlag(dto: FeatureFlagDto) {
    const existing = await this.prisma.featureFlag.findFirst({ where: { key: dto.key, examId: dto.examId ?? null } });
    return existing ? this.prisma.featureFlag.update({ where: { id: existing.id }, data: { enabled: dto.enabled } }) : this.prisma.featureFlag.create({ data: { key: dto.key, enabled: dto.enabled, examId: dto.examId } });
  }
  createExam(dto: ExamDto) { return this.prisma.exam.create({ data: dto }); }
  updateExam(id: string, dto: Partial<ExamDto>) { return this.prisma.exam.update({ where: { id }, data: dto }); }
  deleteExam(id: string) { return this.prisma.exam.delete({ where: { id } }); }
  createSection(dto: SectionDto) { return this.prisma.section.create({ data: dto }); }
  updateSection(id: string, dto: Partial<SectionDto>) { return this.prisma.section.update({ where: { id }, data: dto }); }
  deleteSection(id: string) { return this.prisma.section.delete({ where: { id } }); }
  createPassage(dto: PassageDto) { return this.prisma.passage.create({ data: dto }); }
  updatePassage(id: string, dto: Partial<PassageDto>) { return this.prisma.passage.update({ where: { id }, data: dto }); }
  deletePassage(id: string) { return this.prisma.passage.delete({ where: { id } }); }
  createAudio(dto: AudioDto) { return this.prisma.audioAsset.create({ data: dto }); }
  updateAudio(id: string, dto: Partial<AudioDto>) { return this.prisma.audioAsset.update({ where: { id }, data: dto }); }
  deleteAudio(id: string) { return this.prisma.audioAsset.delete({ where: { id } }); }

  async createQuestion(dto: QuestionDto) {
    const type = await this.prisma.questionType.findFirst({ where: { code: dto.type, exam: { sections: { some: { id: dto.sectionId } } } } });
    if (!type) throw new BadRequestException("Question type is not registered for this exam.");
    return this.prisma.question.create({ data: {
      sectionId: dto.sectionId, passageId: dto.passageId, audioAssetId: dto.audioAssetId, typeId: type.id,
      prompt: dto.prompt, order: dto.order, points: dto.points, metadata: dto.metadata as Prisma.InputJsonValue,
      options: { create: dto.options },
      answerKey: { create: { acceptedAnswers: dto.answerKey.acceptedAnswers as Prisma.InputJsonValue, matchStrategy: dto.answerKey.matchStrategy, tolerance: dto.answerKey.tolerance } },
    }, include: { options: true, answerKey: true, type: true } });
  }
  async updateQuestion(id: string, dto: QuestionDto) {
    const existing = await this.prisma.question.findUnique({ where: { id }, include: { section: { include: { formSections: { include: { testForm: { include: { _count: { select: { sessions: true } } } } } } } } } });
    if (!existing) throw new NotFoundException("Question was not found.");
    if (existing.section.formSections.some((link) => link.testForm.isPublished && link.testForm._count.sessions > 0)) throw new BadRequestException("Published content with attempts is immutable. Create a new test form version.");
    const type = await this.prisma.questionType.findFirstOrThrow({ where: { code: dto.type, exam: { sections: { some: { id: dto.sectionId } } } } });
    return this.prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({ where: { questionId: id } });
      return tx.question.update({ where: { id }, data: { sectionId: dto.sectionId, passageId: dto.passageId, audioAssetId: dto.audioAssetId, typeId: type.id, prompt: dto.prompt, order: dto.order, points: dto.points, metadata: dto.metadata as Prisma.InputJsonValue, options: { create: dto.options }, answerKey: { upsert: { create: { acceptedAnswers: dto.answerKey.acceptedAnswers as Prisma.InputJsonValue, matchStrategy: dto.answerKey.matchStrategy, tolerance: dto.answerKey.tolerance }, update: { acceptedAnswers: dto.answerKey.acceptedAnswers as Prisma.InputJsonValue, matchStrategy: dto.answerKey.matchStrategy, tolerance: dto.answerKey.tolerance } } } }, include: { options: true, answerKey: true, type: true } });
    });
  }
  deleteQuestion(id: string) { return this.prisma.question.delete({ where: { id } }); }

  createForm(dto: TestFormDto) {
    return this.prisma.testForm.create({ data: { examId: dto.examId, name: dto.name, slug: dto.slug, version: dto.version, isPublished: dto.isPublished ?? false, sections: { create: dto.sections } }, include: { sections: true } });
  }
  async updateForm(id: string, dto: TestFormDto) {
    const form = await this.prisma.testForm.findUnique({ where: { id }, include: { _count: { select: { sessions: true } } } });
    if (!form) throw new NotFoundException("Test form was not found.");
    if (form.isPublished && form._count.sessions > 0) throw new BadRequestException("Published forms with attempts are immutable. Create a new version.");
    return this.prisma.$transaction(async (tx) => {
      await tx.testFormSection.deleteMany({ where: { testFormId: id } });
      return tx.testForm.update({ where: { id }, data: { examId: dto.examId, name: dto.name, slug: dto.slug, version: dto.version, isPublished: dto.isPublished ?? false, sections: { create: dto.sections } }, include: { sections: true } });
    });
  }
  deleteForm(id: string) { return this.prisma.testForm.delete({ where: { id } }); }
  async import(dto: ImportDto) { const results: Array<{ index: number; id?: string; error?: string }> = []; for (const [index, question] of dto.questions.entries()) { try { const created = await this.createQuestion(question); results.push({ index, id: created.id }); } catch (error) { results.push({ index, error: error instanceof Error ? error.message : String(error) }); } } return { imported: results.filter((item) => item.id).length, failed: results.filter((item) => item.error).length, results }; }
}
