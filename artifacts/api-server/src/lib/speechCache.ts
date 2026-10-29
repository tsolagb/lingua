import { createHash } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import {
  SPEECH_MODEL, SPEECH_VOICE, SPEECH_VERSION, synthesize,
  type SpeechLanguage, type SpeechSpeed,
} from "./speechProvider";

const storage = new Storage({
  credentials: {
    audience: "replit", subject_token_type: "access_token", type: "external_account",
    token_url: "http://127.0.0.1:1106/token",
    credential_source: {
      url: "http://127.0.0.1:1106/credential",
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});
const memory = new Map<string, Buffer>();
const pending = new Map<string, Promise<Buffer>>();
let memoryBytes = 0;
let generating = 0;
const waiters: (() => void)[] = [];
const MAX_MEMORY = 32 * 1024 * 1024;

export function normalizeSpeechText(text: string) {
  return text.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function speechCacheKey(text: string, language: SpeechLanguage, speed: SpeechSpeed) {
  return createHash("sha256").update(JSON.stringify([
    SPEECH_VERSION, SPEECH_MODEL, SPEECH_VOICE, language, speed, normalizeSpeechText(text),
  ])).digest("hex");
}

function objectFile(key: string) {
  const dir = process.env.PRIVATE_OBJECT_DIR?.replace(/^\/+|\/+$/g, "");
  if (!dir) throw new Error("Speech cache storage is not configured");
  const [bucket, ...prefix] = dir.split("/");
  return storage.bucket(bucket).file(`${prefix.join("/")}/speech/${SPEECH_VERSION}/${key}.mp3`);
}

function remember(key: string, audio: Buffer) {
  const previous = memory.get(key);
  if (previous) memoryBytes -= previous.length;
  memory.delete(key);
  memory.set(key, audio);
  memoryBytes += audio.length;
  while (memoryBytes > MAX_MEMORY && memory.size > 1) {
    const oldest = memory.keys().next().value!;
    memoryBytes -= memory.get(oldest)!.length;
    memory.delete(oldest);
  }
}

export async function withGenerationSlot<T>(operation: () => Promise<T>) {
  if (generating >= 4) {
    if (waiters.length >= 20) throw new Error("Speech generation queue is full");
    await new Promise<void>(resolve => waiters.push(resolve));
  } else {
    generating++;
  }
  try {
    return await operation();
  } finally {
    const next = waiters.shift();
    if (next) next();
    else generating--;
  }
}

export async function getSpeechAudio(
  text: string, language: SpeechLanguage, speed: SpeechSpeed,
  beforeGenerate: () => void,
): Promise<{ buffer: Buffer; key: string; cache: "hit" | "miss" | "shared" }> {
  const key = speechCacheKey(text, language, speed);
  const cached = memory.get(key);
  if (cached) { remember(key, cached); return { buffer: cached, key, cache: "hit" }; }
  const existing = pending.get(key);
  if (existing) return { buffer: await existing, key, cache: "shared" };
  let hit = false;
  const operation = (async () => {
    const file = objectFile(key);
    try {
      const [bytes] = await file.download();
      hit = true;
      remember(key, bytes);
      return bytes;
    } catch (error) {
      if ((error as { code?: number }).code !== 404) throw error;
    }
    beforeGenerate();
    const bytes = await withGenerationSlot(() => synthesize(normalizeSpeechText(text), language, speed));
    // Durable cache is private App Storage, not the deployment filesystem or Git.
    await file.save(bytes, {
      resumable: false,
      contentType: "audio/mpeg",
      metadata: { cacheControl: "private, max-age=31536000, immutable" },
    });
    remember(key, bytes);
    return bytes;
  })();
  pending.set(key, operation);
  try {
    return { buffer: await operation, key, cache: hit ? "hit" : "miss" };
  } finally {
    pending.delete(key);
  }
}
