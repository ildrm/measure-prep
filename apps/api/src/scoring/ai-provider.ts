import { aiScoreSchema, AiScoreResult } from "@exam/shared-types";

export interface ScoringProvider {
  scoreResponse(rubric: string, response: string): Promise<AiScoreResult>;
}

export class OpenAiCompatibleScoringProvider implements ScoringProvider {
  buildPrompt(rubric: string) { return `You are scoring an original practice response. Apply this rubric: ${rubric}. Return JSON only with criteria, overallBand, and feedback. The result is an AI-estimated practice score, never an official score.`; }
  async scoreResponse(rubric: string, response: string): Promise<AiScoreResult> {
    if (process.env.AI_SCORING_ENABLED !== "true") throw new Error("AI scoring is disabled");
    const endpoint = `${process.env.LLM_BASE_URL?.replace(/\/$/, "")}/chat/completions`;
    const prompt = this.buildPrompt(rubric);
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.LLM_API_KEY}` }, body: JSON.stringify({ model: process.env.LLM_MODEL, response_format: { type: "json_object" }, messages: [{ role: "system", content: prompt }, { role: "user", content: response }] }) });
        if (!result.ok) throw new Error(`LLM returned ${result.status}`);
        const json = await result.json() as { choices?: Array<{ message?: { content?: string } }> };
        return aiScoreSchema.parse(JSON.parse(json.choices?.[0]?.message?.content ?? "{}"));
      } catch (error) { lastError = error; }
    }
    throw lastError;
  }
}
