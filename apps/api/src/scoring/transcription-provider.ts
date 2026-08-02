export class OpenAiCompatibleTranscriptionProvider {
  async transcribe(bytes: Uint8Array, contentType: string, filename: string) {
    if (!process.env.STT_BASE_URL || !process.env.STT_API_KEY) throw new Error("Transcription provider is not configured.");
    const form = new FormData(); form.append("file", new Blob([bytes as BlobPart], { type: contentType }), filename); form.append("model", process.env.STT_MODEL ?? "whisper-1");
    const response = await fetch(process.env.STT_BASE_URL, { method: "POST", headers: { authorization: `Bearer ${process.env.STT_API_KEY}` }, body: form });
    if (!response.ok) throw new Error(`Transcription provider returned ${response.status}.`);
    const result = await response.json() as { text?: string }; if (!result.text) throw new Error("Transcription provider returned no text."); return result.text;
  }
}
