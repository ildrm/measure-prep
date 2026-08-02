import { z } from "zod";

export const roles = ["STUDENT", "CONTENT_EDITOR", "ADMIN"] as const;
export type Role = (typeof roles)[number];

export const examCodes = ["IELTS_AC", "IELTS_GT", "TOEFL", "GRE"] as const;
export type ExamCode = (typeof examCodes)[number];

export const skills = ["READING", "LISTENING", "WRITING", "SPEAKING", "QUANT", "VERBAL"] as const;
export type Skill = (typeof skills)[number];

export const questionTypes = [
  "SINGLE_CHOICE", "MULTI_SELECT", "TRUE_FALSE_NOT_GIVEN", "MATCHING",
  "GAP_FILL", "NUMERIC_ENTRY", "QUANT_COMPARISON", "ESSAY", "SPEAKING_TASK",
] as const;
export type QuestionTypeCode = (typeof questionTypes)[number];

export const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });
export const registerSchema = loginSchema.extend({ name: z.string().trim().min(2).max(80) });

export const aiScoreSchema = z.object({
  criteria: z.array(z.object({ name: z.string(), score: z.number(), feedback: z.string() })),
  overallBand: z.number(),
  feedback: z.string(),
});
export type AiScoreResult = z.infer<typeof aiScoreSchema>;

export interface AuthUser { id: string; email: string; name: string; role: Role }
export interface ExamSummary { id: string; code: ExamCode; name: string; description: string | null; forms: TestFormSummary[] }
export interface TestFormSummary { id: string; name: string; version: number; sectionCount: number; durationMinutes: number }
export interface SessionStart { id: string; status: string; activeSectionId: string; endsAt: string; form: TestFormDetail }
export interface TestFormDetail { id: string; name: string; exam: { code: ExamCode; name: string }; sections: SectionDetail[] }
export interface SectionDetail {
  id: string; name: string; skill: Skill; timeLimitSec: number; order: number;
  passages: Array<{ id: string; title: string; bodyRichtext: string }>;
  audioAssets: Array<{ id: string; storageKey: string; durationSec: number; transcript?: string }>;
  questions: QuestionDetail[];
}
export interface QuestionDetail {
  id: string; type: QuestionTypeCode; prompt: string; order: number; points: number;
  passageId?: string | null; audioAssetId?: string | null; metadata?: Record<string, unknown> | null;
  options: Array<{ id: string; label: string; value: string; order: number }>;
}
