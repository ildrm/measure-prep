import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}
  async progress(userId: string) {
    const sessions = await this.prisma.testSession.findMany({ where: { userId, submittedAt: { not: null } }, orderBy: { submittedAt: "asc" }, include: { testForm: { include: { exam: true } }, scores: true, answers: { include: { question: { include: { type: true } } } } } });
    const weak = new Map<string, { correct: number; total: number }>();
    for (const session of sessions) for (const answer of session.answers) { const key = answer.question.type.code; const value = weak.get(key) ?? { correct: 0, total: 0 }; value.total++; if (answer.isCorrect) value.correct++; weak.set(key, value); }
    return { history: sessions.map((s) => ({ id: s.id, exam: s.testForm.exam.name, form: s.testForm.name, submittedAt: s.submittedAt, scores: s.scores })), weakAreas: [...weak.entries()].map(([type, data]) => ({ type, accuracy: data.total ? data.correct / data.total : 0, ...data })).sort((a, b) => a.accuracy - b.accuracy) };
  }
  async questions() {
    const [questions, started, completed, sectionAttempts, unclearReports] = await Promise.all([
      this.prisma.question.findMany({ include: { type: true, section: true, sessionAnswers: { include: { session: { include: { scores: true } } } } } }),
      this.prisma.testSession.count(), this.prisma.testSession.count({ where: { submittedAt: { not: null } } }),
      this.prisma.sessionSection.findMany({ where: { submittedAt: { not: null } } }),
      this.prisma.auditLog.findMany({ where: { action: "integrity.question_unclear" }, select: { diff: true } }),
    ]);
    const unclearByQuestion = new Map<string, number>();
    for (const report of unclearReports) {
      const questionId = String((report.diff as { questionId?: unknown } | null)?.questionId ?? "");
      if (questionId) unclearByQuestion.set(questionId, (unclearByQuestion.get(questionId) ?? 0) + 1);
    }
    const items = questions.map((q) => {
      const graded = q.sessionAnswers.filter((a) => a.isCorrect !== null); const correct = graded.filter((a) => a.isCorrect).length;
      const pairs = graded.flatMap((answer) => { const score = answer.session.scores.find((s) => s.skill === q.section.skill); return score ? [[answer.isCorrect ? 1 : 0, score.maxScore ? score.rawScore / score.maxScore : 0] as [number, number]] : []; });
      return { id: q.id, prompt: q.prompt, type: q.type.code, section: q.section.name, attempts: graded.length, percentCorrect: graded.length ? correct / graded.length : null, discrimination: this.correlation(pairs), flaggedAsUnclear: unclearByQuestion.get(q.id) ?? 0 };
    });
    const averageSectionSeconds = sectionAttempts.length ? sectionAttempts.reduce((sum, attempt) => sum + ((attempt.submittedAt!.getTime() - attempt.startedAt.getTime()) / 1000), 0) / sectionAttempts.length : 0;
    return { items, funnel: { started, completed, completionRate: started ? completed / started : 0 }, timing: { averageSectionSeconds } };
  }
  private correlation(pairs: Array<[number, number]>) { if (pairs.length < 3) return null; const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length; const my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length; const numerator = pairs.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0); const dx = Math.sqrt(pairs.reduce((s, p) => s + (p[0] - mx) ** 2, 0)); const dy = Math.sqrt(pairs.reduce((s, p) => s + (p[1] - my) ** 2, 0)); return dx && dy ? numerator / (dx * dy) : null; }
}
