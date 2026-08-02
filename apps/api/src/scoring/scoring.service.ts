import { Injectable } from "@nestjs/common";
import { ExamCode, MatchStrategy, Prisma, QuestionTypeCode, SessionStatus, Skill } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MediaService } from "../media/media.service";
import { OpenAiCompatibleScoringProvider } from "./ai-provider";
import { OpenAiCompatibleTranscriptionProvider } from "./transcription-provider";

type JsonAnswer = { value?: string | number | string[]; text?: string; audioKey?: string };

@Injectable()
export class ScoringService {
  private readonly provider = new OpenAiCompatibleScoringProvider();
  private readonly transcription = new OpenAiCompatibleTranscriptionProvider();
  constructor(private readonly prisma: PrismaService, private readonly media?: MediaService) {}

  normalizeWord(value: unknown) {
    return String(value ?? "").trim().toLocaleLowerCase().replace(/[.,!?;:]$/g, "");
  }
  lemmatize(value: unknown) {
    const word = this.normalizeWord(value);
    if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
    if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3).replace(/(.)\1$/, "$1");
    if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
    if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    return word;
  }
  precheck(text: string) {
    const words = text.trim() ? text.trim().split(/\s+/) : []; const issues: string[] = [];
    if (/\s{2,}/.test(text)) issues.push("Repeated spacing detected.");
    if (/\b(\w+)\s+\1\b/i.test(text)) issues.push("A repeated word was detected.");
    if (text && !/^[A-Z0-9"“]/u.test(text.trim())) issues.push("The response may need an initial capital letter.");
    return { wordCount: words.length, issues };
  }
  grade(strategy: MatchStrategy, acceptedRaw: Prisma.JsonValue, responseRaw: Prisma.JsonValue, tolerance?: number | null) {
    const accepted = Array.isArray(acceptedRaw) ? acceptedRaw : [acceptedRaw];
    const response = (responseRaw ?? {}) as JsonAnswer;
    const value = response.value ?? response.text ?? "";
    if (strategy === MatchStrategy.MANUAL || strategy === MatchStrategy.AI) return { correct: null, pointsFactor: 0 };
    if (strategy === MatchStrategy.MULTI_EXACT || strategy === MatchStrategy.MULTI_PARTIAL) {
      const expected = accepted.map(this.normalizeWord.bind(this));
      const actual = (Array.isArray(value) ? value : [value]).map(this.normalizeWord.bind(this));
      const hits = actual.filter((v) => expected.includes(v)).length;
      const wrong = actual.filter((v) => !expected.includes(v)).length;
      const exact = hits === expected.length && wrong === 0;
      return { correct: exact, pointsFactor: strategy === MatchStrategy.MULTI_EXACT ? Number(exact) : Math.max(0, (hits - wrong) / expected.length) };
    }
    if (strategy === MatchStrategy.NUMERIC_TOLERANCE) {
      const actual = Number(value); const expected = Number(accepted[0]); const valid = Number.isFinite(actual) && Math.abs(actual - expected) <= (tolerance ?? 0);
      return { correct: valid, pointsFactor: Number(valid) };
    }
    const normalize = strategy === MatchStrategy.LEMMATIZED ? this.lemmatize.bind(this) : strategy === MatchStrategy.EXACT ? (v: unknown) => String(v ?? "").trim() : this.normalizeWord.bind(this);
    const valid = accepted.some((answer) => normalize(answer) === normalize(value));
    return { correct: valid, pointsFactor: Number(valid) };
  }

  async scoreSession(sessionId: string) {
    const session = await this.prisma.testSession.findUniqueOrThrow({ where: { id: sessionId }, include: { sectionAttempts: true, testForm: { include: { exam: true, sections: { include: { section: { include: { questions: { include: { answerKey: true, type: true } } } } } } } }, answers: true } });
    const servedSections = new Set(session.sectionAttempts.map((attempt) => attempt.sectionId));
    const answerByQuestion = new Map(session.answers.map((a) => [a.questionId, a]));
    const totals = new Map<Skill, { raw: number; max: number }>();
    for (const formSection of session.testForm.sections.filter((item) => servedSections.has(item.sectionId))) {
      const skill = formSection.section.skill;
      const total = totals.get(skill) ?? { raw: 0, max: 0 };
      for (const question of formSection.section.questions) {
        total.max += question.points;
        const answer = answerByQuestion.get(question.id);
        if (!answer || !question.answerKey) continue;
        const result = this.grade(question.answerKey.matchStrategy, question.answerKey.acceptedAnswers, answer.response, question.answerKey.tolerance);
        const points = result.pointsFactor * question.points;
        total.raw += points;
        await this.prisma.sessionAnswer.update({ where: { id: answer.id }, data: { isCorrect: result.correct, pointsAwarded: points } });
      }
      totals.set(skill, total);
    }
    for (const [skill, total] of totals) {
      const roundedRaw = Math.round(total.raw);
      const scaleRaw = session.testForm.exam.code === ExamCode.TOEFL ? Math.round((total.raw / Math.max(1, total.max)) * 30) : roundedRaw;
      const cttRaw = session.testForm.exam.code === ExamCode.IELTS_AC || session.testForm.exam.code === ExamCode.IELTS_GT ? Math.round((total.raw / Math.max(1, total.max)) * 40) : session.testForm.exam.code === ExamCode.TOEFL ? scaleRaw : roundedRaw;
      const ctt = await this.prisma.cttBandTable.findFirst({ where: { examCode: session.testForm.exam.code, skill, rawMin: { lte: cttRaw }, rawMax: { gte: cttRaw } } });
      const scale = await this.prisma.scaleTable.findFirst({ where: { examCode: session.testForm.exam.code, skill, rawMin: { lte: scaleRaw }, rawMax: { gte: scaleRaw } } });
      await this.prisma.score.upsert({ where: { sessionId_skill: { sessionId, skill } }, update: { rawScore: total.raw, maxScore: total.max, band: ctt?.band, scaledScore: scale?.scaledScore }, create: { sessionId, skill, rawScore: total.raw, maxScore: total.max, band: ctt?.band, scaledScore: scale?.scaledScore } });
    }
    const constructed = session.testForm.sections.filter((item) => servedSections.has(item.sectionId)).flatMap((s) => s.section.questions.filter((q) => q.type.code === QuestionTypeCode.ESSAY || q.type.code === QuestionTypeCode.SPEAKING_TASK).map((q) => ({ question: q, skill: s.section.skill })));
    let needsManual = false; const constructedScores = new Map<Skill, number[]>();
    const globalFlag = await this.prisma.featureFlag.findFirst({ where: { key: "AI_SCORING", examId: null } });
    const examFlag = await this.prisma.featureFlag.findFirst({ where: { key: "AI_SCORING", examId: session.testForm.exam.id } });
    const globalTranscription = await this.prisma.featureFlag.findFirst({ where: { key: "TRANSCRIPTION", examId: null } });
    const examTranscription = await this.prisma.featureFlag.findFirst({ where: { key: "TRANSCRIPTION", examId: session.testForm.exam.id } });
    const aiEnabled = process.env.AI_SCORING_ENABLED === "true" && (examFlag?.enabled ?? globalFlag?.enabled ?? false);
    const transcriptionEnabled = Boolean(process.env.STT_BASE_URL && process.env.STT_API_KEY) && (examTranscription?.enabled ?? globalTranscription?.enabled ?? false);
    for (const item of constructed) {
      const answer = answerByQuestion.get(item.question.id); if (!answer) { needsManual = true; continue; }
      const response = answer.response as JsonAnswer; let text = response.text ?? "";
      if (!text && response.audioKey && this.media && transcriptionEnabled) {
        try { const object = await this.media.getObject(response.audioKey); const bytes = await object.Body?.transformToByteArray(); if (bytes) text = await this.transcription.transcribe(bytes, object.ContentType ?? "audio/webm", "response.webm"); }
        catch { needsManual = true; }
      }
      const precheck = this.precheck(text); const rubric = this.rubric(session.testForm.exam.code, item.question.type.code);
      const prompt = this.provider.buildPrompt(rubric);
      if (!aiEnabled || !text) {
        needsManual = true;
        await this.prisma.aiScore.upsert({ where: { sessionAnswerId: answer.id }, update: { status: "MANUAL_REVIEW", prompt, rawResponse: null, criteria: { deterministicPrecheck: precheck } }, create: { sessionAnswerId: answer.id, provider: "disabled", model: "none", status: "MANUAL_REVIEW", prompt, criteria: { deterministicPrecheck: precheck } } });
        continue;
      }
      try {
        const result = await this.provider.scoreResponse(rubric, text); const values = constructedScores.get(item.skill) ?? []; values.push(result.overallBand); constructedScores.set(item.skill, values);
        await this.prisma.aiScore.upsert({ where: { sessionAnswerId: answer.id }, update: { provider: "openai-compatible", model: process.env.LLM_MODEL ?? "configured-model", status: "COMPLETED", prompt, rawResponse: JSON.stringify(result), criteria: { rubric: result.criteria, deterministicPrecheck: precheck }, overallBand: result.overallBand, feedback: result.feedback }, create: { sessionAnswerId: answer.id, provider: "openai-compatible", model: process.env.LLM_MODEL ?? "configured-model", status: "COMPLETED", prompt, rawResponse: JSON.stringify(result), criteria: { rubric: result.criteria, deterministicPrecheck: precheck }, overallBand: result.overallBand, feedback: result.feedback } });
      } catch (error) {
        needsManual = true; await this.prisma.aiScore.upsert({ where: { sessionAnswerId: answer.id }, update: { status: "MANUAL_REVIEW", prompt, rawResponse: error instanceof Error ? error.message : String(error), criteria: { deterministicPrecheck: precheck } }, create: { sessionAnswerId: answer.id, provider: "openai-compatible", model: process.env.LLM_MODEL ?? "configured-model", status: "MANUAL_REVIEW", prompt, rawResponse: error instanceof Error ? error.message : String(error), criteria: { deterministicPrecheck: precheck } } });
      }
    }
    for (const [skill, values] of constructedScores) { const overall = values.reduce((a, b) => a + b, 0) / values.length; const band = session.testForm.exam.code === ExamCode.IELTS_AC || session.testForm.exam.code === ExamCode.IELTS_GT || session.testForm.exam.code === ExamCode.TOEFL ? overall : undefined; await this.prisma.score.upsert({ where: { sessionId_skill: { sessionId, skill } }, update: { rawScore: overall, maxScore: session.testForm.exam.code === ExamCode.GRE || session.testForm.exam.code === ExamCode.TOEFL ? 6 : 9, band, scaledScore: null }, create: { sessionId, skill, rawScore: overall, maxScore: session.testForm.exam.code === ExamCode.GRE || session.testForm.exam.code === ExamCode.TOEFL ? 6 : 9, band, scaledScore: null } }); }
    return this.prisma.testSession.update({ where: { id: sessionId }, data: { status: needsManual ? SessionStatus.MANUAL_REVIEW : SessionStatus.SCORED, submittedAt: session.submittedAt ?? new Date() }, include: { scores: true } });
  }
  private rubric(exam: ExamCode, type: QuestionTypeCode) {
    if (exam === ExamCode.IELTS_AC || exam === ExamCode.IELTS_GT) return type === QuestionTypeCode.SPEAKING_TASK ? "IELTS Speaking, 0–9: Fluency and Coherence; Lexical Resource; Grammatical Range and Accuracy; Pronunciation, each weighted 25%." : "IELTS Writing, 0–9: Task Achievement/Response; Coherence and Cohesion; Lexical Resource; Grammatical Range and Accuracy, each weighted 25%.";
    if (exam === ExamCode.TOEFL) return "Current TOEFL iBT practice rubric, 1–6 in half-point increments: evaluate effective communication, language use, and task fulfillment; return a practice-estimate section band.";
    return "GRE Analytical Writing holistic rubric, 0–6: critical thinking, argument strength, organization, and command of written English.";
  }
}
