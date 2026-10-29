import { Router, type IRouter } from "express";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { SynthesizeSpeechBody, TranscribeSpeechBody } from "@workspace/api-zod";
import { getSpeechAudio, withGenerationSlot } from "../lib/speechCache";
import { transcribeRecording } from "../lib/speechProvider";
import { normalizeRecording, InvalidRecordingError } from "../lib/speechRecording";
import { transcriptSimilarity } from "../lib/speechComparison";

const router: IRouter = Router();
const limiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });
const transcriptionLimiter = rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: "draft-8", legacyHeaders: false });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 1, fields: 3, fieldSize: 4096 } });
const generationBudget = new Map<string, { start: number; count: number }>();
class GenerationLimitError extends Error {}

function consumeGenerationBudget(key: string) {
  const now = Date.now();
  const budget = generationBudget.get(key);
  if (budget && now - budget.start < 3_600_000) {
    if (budget.count >= 360) throw new GenerationLimitError();
    budget.count++;
  } else {
    if (generationBudget.size > 5000) {
      for (const [id, entry] of generationBudget) if (now - entry.start >= 3_600_000) generationBudget.delete(id);
      if (generationBudget.size > 5000) throw new GenerationLimitError();
    }
    generationBudget.set(key, { start: now, count: 1 });
  }
}

router.post("/speech/synthesize", limiter, async (req, res) => {
  const parsed = SynthesizeSpeechBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Provide text (1–1200 characters), a supported language and normal/slow speed." }); return; }
  const { text, language, speed } = parsed.data;
  if (!text.trim()) { res.status(400).json({ error: "Text cannot be empty." }); return; }
  try {
    const result = await getSpeechAudio(text, language, speed ?? "normal", () => consumeGenerationBudget(req.ip ?? "guest"));
    res.set({
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Audio-Cache": result.cache,
      "X-Audio-Key": result.key,
      "X-Content-Type-Options": "nosniff",
    }).send(result.buffer);
  } catch (error) {
    const limited = error instanceof GenerationLimitError;
    req.log.warn({ reason: limited ? "budget" : "provider_or_cache", code: (error as { code?: unknown }).code, status: (error as { status?: number }).status }, "Speech unavailable");
    res.status(limited ? 429 : 503).json({ error: limited ? "Speech generation limit reached. Try again later." : "AI speech is temporarily unavailable. Cached or device audio can still be used." });
  }
});

router.post("/speech/transcribe", transcriptionLimiter, (req, res) => {
  upload.single("audio")(req, res, async error => {
    if (error) { res.status(400).json({ error: "Upload one audio recording, no larger than 6 MB." }); return; }
    const parsed = TranscribeSpeechBody.omit({ audio: true }).safeParse(req.body);
    if (!parsed.success || !req.file) { res.status(400).json({ error: "Provide audio, expectedText and a supported language." }); return; }
    try {
      const transcription = await withGenerationSlot(async () => {
        const recording = await normalizeRecording(req.file!.buffer);
        return transcribeRecording(recording, parsed.data.language);
      });
      const similarity = transcriptSimilarity(parsed.data.expectedText, transcription);
      // Recordings are temporary; neither recordings nor transcripts enter the audio cache.
      res.setHeader("Cache-Control", "no-store");
      res.json({ transcription, similarity, similarityScore: Math.round(similarity * 100), scoreType: "transcript_similarity", language: parsed.data.language });
    } catch (error) {
      const invalid = error instanceof InvalidRecordingError;
      req.log.warn({ reason: invalid ? "invalid_recording" : "provider" }, "Transcription unavailable");
      res.status(invalid ? 400 : 503).json({ error: invalid ? error.message : "Transcription is temporarily unavailable. Please try again." });
    }
  });
});

export default router;
