import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { fetch as expoFetch } from 'expo/fetch';
import type { Language } from '@/data/vocabulary';
import { MOTION } from '@/constants/motion';

export type SpeechSpeed = 'normal' | 'slow';
export type SpeechAsset = { uri: string } | { blob: Blob };
const VERSION = 'lingua-neural-v1-coral';
const CACHE_NAME = VERSION;
const pending = new Map<string, Promise<SpeechAsset>>();
const memory = new Map<string, SpeechAsset>();
let unavailableUntil = 0;
let protectedUri: string | null = null;
let directory: Directory | null = null;

export function speechApiUrl(path: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/api/speech/${path}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/api/speech/${path}`;
  throw new Error('Speech service address is unavailable');
}

export function normalizeSpokenText(text: string) {
  return text.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

function nativeDirectory() {
  if (!directory) {
    directory = new Directory(Paths.document, 'lingua-speech');
    directory.create({ idempotent: true, intermediates: true });
  }
  return directory;
}

export function protectCachedSpeech(uri: string | null) { protectedUri = uri; }

function pruneNativeCache(keepUri: string) {
  try {
    const files = nativeDirectory().list().filter((file): file is File => file instanceof File);
    let size = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
    let count = files.length;
    files.sort((left, right) => (left.modificationTime ?? 0) - (right.modificationTime ?? 0));
    for (const file of files) {
      if (count <= 256 && size <= 64 * 1024 * 1024) break;
      if (file.uri === protectedUri || file.uri === keepUri) continue;
      size -= file.size ?? 0;
      count--;
      file.delete();
    }
  } catch { /* Cache maintenance must never interrupt a lesson. */ }
}

function remember(key: string, asset: SpeechAsset) {
  memory.delete(key);
  memory.set(key, asset);
  if (memory.size > 48) memory.delete(memory.keys().next().value!);
}

async function cached(key: string): Promise<SpeechAsset | null> {
  const asset = memory.get(key);
  if (asset && ('blob' in asset || new File(asset.uri).exists)) { remember(key, asset); return asset; }
  if (Platform.OS !== 'web') {
    const file = new File(nativeDirectory(), `${key}.mp3`);
    if (file.exists && file.size > 0) return { uri: file.uri };
    return null;
  }
  try {
    if (typeof caches === 'undefined') return null;
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(`https://lingua-cache.invalid/${key}.mp3`);
    return response ? { blob: await response.blob() } : null;
  } catch { return null; }
}

export async function getSpeechAsset(text: string, language: Language, speed: SpeechSpeed): Promise<SpeechAsset> {
  const normalized = normalizeSpokenText(text);
  const key = await digestStringAsync(CryptoDigestAlgorithm.SHA256, JSON.stringify([VERSION, language, speed, normalized]));
  const hit = await cached(key);
  if (hit) { remember(key, hit); return hit; }
  const existing = pending.get(key);
  if (existing) return existing;
  const operation = (async () => {
    if (!normalized || normalized.length > 1200) throw new Error('Text is too long for AI speech');
    if (Date.now() < unavailableUntil) throw new Error('AI speech is temporarily unavailable');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MOTION.speechRequestTimeoutMs);
    try {
      const response = await expoFetch(speechApiUrl('synthesize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text: normalized, language, speed }),
        signal: controller.signal,
        credentials: 'omit',
      });
      if (!response.ok) throw new Error(`Speech unavailable (${response.status})`);
      if (!response.headers.get('content-type')?.includes('audio/')) throw new Error('Speech service returned no audio');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength < 32 || bytes.byteLength > 8 * 1024 * 1024) throw new Error('Invalid audio response');
      let asset: SpeechAsset;
      if (Platform.OS === 'web') {
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        asset = { blob };
        try {
          if (typeof caches !== 'undefined') {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(`https://lingua-cache.invalid/${key}.mp3`, new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } }));
            const keys = await cache.keys();
            for (const old of keys.slice(0, Math.max(0, keys.length - 256))) await cache.delete(old);
          }
        } catch { /* Memory playback still works in private/restricted browsers. */ }
      } else {
        const file = new File(nativeDirectory(), `${key}.mp3`);
        file.write(bytes);
        asset = { uri: file.uri };
        pruneNativeCache(file.uri);
      }
      remember(key, asset);
      return asset;
    } catch (error) {
      unavailableUntil = Date.now() + 20_000;
      throw error;
    } finally { clearTimeout(timeout); }
  })();
  pending.set(key, operation);
  try { return await operation; } finally { pending.delete(key); }
}

const prefetchQueue: { cancelled: () => boolean; text: string; language: Language; speed: SpeechSpeed }[] = [];
let workers = 0;
function pumpPrefetch() {
  while (workers < 2 && prefetchQueue.length) {
    const item = prefetchQueue.shift()!;
    if (item.cancelled()) continue;
    workers++;
    void getSpeechAsset(item.text, item.language, item.speed).catch(() => {}).finally(() => { workers--; pumpPrefetch(); });
  }
}

export function preloadSpeechAssets(texts: readonly string[], language: Language, speeds: readonly SpeechSpeed[] = ['normal']) {
  let cancelled = false;
  const unique = [...new Set(texts.map(normalizeSpokenText).filter(text => text && text.length <= 1200))].slice(0, 40);
  for (const text of unique) for (const speed of speeds) {
    prefetchQueue.push({ text, language, speed, cancelled: () => cancelled });
  }
  pumpPrefetch();
  return () => {
    cancelled = true;
    for (let index = prefetchQueue.length - 1; index >= 0; index--) {
      if (prefetchQueue[index].cancelled()) prefetchQueue.splice(index, 1);
    }
  };
}
