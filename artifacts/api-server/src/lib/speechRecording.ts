import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const exec = promisify(execFile);
export class InvalidRecordingError extends Error {}

export function recordingExtension(data: Buffer): string | null {
  if (data.length < 12) return null;
  if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WAVE") return "wav";
  if (data.toString("ascii", 0, 3) === "ID3" || (data[0] === 255 && (data[1] & 224) === 224)) return "mp3";
  if (data.toString("ascii", 4, 8) === "ftyp") return "m4a";
  if (data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "webm";
  if (data.toString("ascii", 0, 4) === "OggS") return "ogg";
  if (data.toString("ascii", 0, 4) === "fLaC") return "flac";
  return null;
}

export async function normalizeRecording(data: Buffer) {
  const extension = recordingExtension(data);
  if (!extension) throw new InvalidRecordingError("Use a WAV, MP3, M4A, WebM, Ogg or FLAC recording.");
  const dir = await mkdtemp(join(tmpdir(), "lingua-recording-"));
  try {
    const input = join(dir, `input.${extension}`);
    const output = join(dir, "speech.wav");
    await writeFile(input, data);
    // Bound both decoding CPU time and output length; playlists cannot fetch remote URLs.
    await exec("ffmpeg", [
      "-nostdin", "-v", "error", "-protocol_whitelist", "file,pipe",
      "-i", input, "-t", "30.1", "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", output,
    ], { timeout: 12_000, maxBuffer: 128 * 1024 });
    const wav = await readFile(output);
    // 16kHz mono signed16 WAV: >30s is rejected, never silently clipped/scored.
    if (wav.length > 30 * 16000 * 2 + 1024) throw new InvalidRecordingError("Recordings must be 30 seconds or shorter.");
    if (wav.length < 1600) throw new InvalidRecordingError("The recording is too short to transcribe.");
    return wav;
  } catch (error) {
    if (error instanceof InvalidRecordingError) throw error;
    throw new InvalidRecordingError("The recording could not be decoded. Please record it again.");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
