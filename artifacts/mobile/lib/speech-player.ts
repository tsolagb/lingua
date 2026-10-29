import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import type { Language } from '@/data/vocabulary';
import { getSpeechAsset, normalizeSpokenText, protectCachedSpeech, type SpeechAsset, type SpeechSpeed } from './speech-cache';
import { isDeviceSpeechAvailable, selectPreferredSpeechVoice } from './speech-voice';
import { MOTION } from '@/constants/motion';

export interface SpeechPlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'unavailable';
  text: string;
  language: Language | null;
  speed: SpeechSpeed;
  source: 'ai' | 'device' | null;
  origin: 'manual' | 'auto';
}
let state: SpeechPlaybackState = { status: 'idle', text: '', language: null, speed: 'normal', source: null, origin: 'manual' };
const listeners = new Set<() => void>();
export const getSpeechPlaybackState = () => state;
export const subscribeSpeechPlayback = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
function update(patch: Partial<SpeechPlaybackState>) {
  if (Object.entries(patch).every(([key, value]) => state[key as keyof SpeechPlaybackState] === value)) return;
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
}

const LOCALES: Record<Language, string> = { italian: 'it-IT', french: 'fr-FR', spanish: 'es-ES', armenian: 'hy-AM' };
let generation = 0;
let running = false;
let cleanupPlayback: (() => void) | null = null;
const queue: { text: string; language: Language; speed: SpeechSpeed; origin: 'manual' | 'auto' }[] = [];
let preferences = { muted: false, autoSpeakCorrect: true };
let webPlayer: HTMLAudioElement | null = null;
let webPrimed = false;
let voices: Promise<Speech.Voice[]> | null = null;

// Prime the same HTML media element during the tap, before any asynchronous download.
function primeWebPlayer() {
  if (Platform.OS !== 'web' || typeof Audio === 'undefined') return;
  if (!webPlayer) webPlayer = new Audio();
  if (webPrimed) return;
  const wav = new ArrayBuffer(44 + 1600);
  const view = new DataView(wav);
  for (const [offset, text] of [[0, 'RIFF'], [8, 'WAVEfmt '], [36, 'data']] as const) {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  }
  view.setUint32(4, 36 + 1600, true); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); view.setUint32(40, 1600, true);
  const silentUrl = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
  webPlayer.src = silentUrl;
  void webPlayer.play().then(() => {
    webPrimed = true;
    if (webPlayer?.src === silentUrl) webPlayer.pause();
  }).catch(() => {}).finally(() => URL.revokeObjectURL(silentUrl));
}

export function stopSpeaking() {
  generation++;
  queue.length = 0;
  cleanupPlayback?.();
  cleanupPlayback = null;
  void Speech.stop().catch(() => {});
  update({ status: 'idle', source: null });
}

export function setSpeechPreferences(muted: boolean, autoSpeakCorrect: boolean) {
  if (preferences.muted === muted && preferences.autoSpeakCorrect === autoSpeakCorrect) return;
  preferences = { muted, autoSpeakCorrect };
  if (muted) stopSpeaking();
  else if (!autoSpeakCorrect) {
    for (let index = queue.length - 1; index >= 0; index--) {
      if (queue[index].origin === 'auto') queue.splice(index, 1);
    }
    if (state.origin === 'auto' && (state.status === 'loading' || state.status === 'playing')) stopSpeaking();
  }
}

function playAsset(asset: SpeechAsset, token: number) {
  return new Promise<void>((resolve, reject) => {
    let objectUrl: string | null = null;
    let released = false;
    let releaseMedia = () => {};
    const finish = (error?: Error) => {
      if (released) return;
      released = true;
      clearTimeout(watchdog);
      releaseMedia();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      protectCachedSpeech(null);
      if (cleanupPlayback === cancel) cleanupPlayback = null;
      error ? reject(error) : resolve();
    };
    const cancel = () => finish();
    const watchdog = setTimeout(() => finish(new Error('Audio playback timed out')), MOTION.speechPlaybackTimeoutMs);
    cleanupPlayback = cancel;
    if (token !== generation) { finish(); return; }
    if (Platform.OS === 'web') {
      if (!webPlayer) webPlayer = new Audio();
      const player = webPlayer;
      objectUrl = 'blob' in asset ? URL.createObjectURL(asset.blob) : null;
      player.src = objectUrl ?? ('uri' in asset ? asset.uri : '');
      player.onended = () => finish();
      player.onerror = () => finish(new Error('Audio could not be played'));
      releaseMedia = () => { player.pause(); player.onended = null; player.onerror = null; };
      void player.play().then(() => {
        if (token === generation) update({ status: 'playing', source: 'ai' });
      }).catch(error => finish(error));
    } else {
      if (!('uri' in asset)) { finish(new Error('No native audio file')); return; }
      protectCachedSpeech(asset.uri);
      let player: ReturnType<typeof createAudioPlayer> | null = null;
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldPlayInBackground: false })
        .then(() => {
          if (released || token !== generation) { finish(); return; }
          player = createAudioPlayer({ uri: asset.uri }, { updateInterval: 100 });
          const sub = player.addListener('playbackStatusUpdate', status => {
            if (status.playing) update({ status: 'playing', source: 'ai' });
            if (status.didJustFinish) finish();
            if (status.playbackState === 'error') finish(new Error('Audio could not be loaded'));
          });
          releaseMedia = () => { sub.remove(); player?.pause(); player?.remove(); };
          player.play();
        }).catch(error => finish(error));
    }
  });
}

async function deviceFallback(item: typeof queue[number], token: number) {
  if (!isDeviceSpeechAvailable(item.language)) throw new Error('No reliable offline voice for this language');
  // Some browsers never resolve voice enumeration when no OS voice is installed.
  // Bound that wait separately from playback; it must not leave a loading pill stuck.
  voices ??= new Promise<Speech.Voice[]>(resolve => {
    const timeout = setTimeout(() => resolve([]), 1500);
    void Speech.getAvailableVoicesAsync().then(value => {
      clearTimeout(timeout); resolve(value);
    }, () => { clearTimeout(timeout); resolve([]); });
  });
  const available = await voices;
  if (token !== generation) return;
  const voice = selectPreferredSpeechVoice(available, LOCALES[item.language]);
  if ((available.length > 0 && !voice) || (Platform.OS === 'web' && !available.length)) {
    throw new Error('No offline voice installed for this language');
  }
  return new Promise<void>((resolve, reject) => {
    let done = false;
    const finish = (error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      clearTimeout(startTimeout);
      if (cleanupPlayback === cancel) cleanupPlayback = null;
      error ? reject(error) : resolve();
    };
    const cancel = () => { void Speech.stop().catch(() => {}); finish(); };
    const timeout = setTimeout(() => finish(new Error('Device speech timed out')), MOTION.speechPlaybackTimeoutMs);
    const startTimeout = setTimeout(() => {
      void Speech.stop().catch(() => {});
      finish(new Error('Device voice could not start'));
    }, 3000);
    cleanupPlayback = cancel;
    Speech.speak(item.text, {
      language: LOCALES[item.language], ...(voice ? { voice: voice.identifier } : {}),
      pitch: 1, rate: item.speed === 'slow' ? 0.7 : 0.94,
      onStart: () => {
        clearTimeout(startTimeout);
        if (token === generation) update({ status: 'playing', source: 'device' });
      },
      onDone: () => finish(), onStopped: () => finish(), onError: () => finish(new Error('Device voice unavailable')),
    });
  });
}

async function pump() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const item = queue.shift()!;
      const token = generation;
      update({ status: 'loading', text: item.text, language: item.language, speed: item.speed, source: null, origin: item.origin });
      try {
        const asset = await new Promise<SpeechAsset | null>((resolve, reject) => {
          // Cancel only the wait, not the shared cache fill. A different word or
          // mute must respond immediately even while a cold generation is pending.
          const foregroundTimeout = setTimeout(() => {
            if (cleanupPlayback === cancel) cleanupPlayback = null;
            reject(new Error('AI playback is taking too long'));
          }, 8000);
          const cancel = () => { clearTimeout(foregroundTimeout); resolve(null); };
          cleanupPlayback = cancel;
          void getSpeechAsset(item.text, item.language, item.speed).then(value => {
            clearTimeout(foregroundTimeout);
            if (cleanupPlayback === cancel) cleanupPlayback = null;
            resolve(value);
          }, error => {
            clearTimeout(foregroundTimeout);
            if (cleanupPlayback === cancel) cleanupPlayback = null;
            reject(error);
          });
        });
        if (!asset || token !== generation) continue;
        await playAsset(asset, token);
        if (token === generation) update({ status: 'idle', source: null });
      } catch {
        if (token !== generation) continue;
        try {
          await deviceFallback(item, token);
          if (token === generation) update({ status: 'idle', source: null });
        } catch {
          if (token === generation) update({ status: 'unavailable', source: null });
        }
      }
    }
  } finally {
    running = false;
    if (queue.length) void pump();
  }
}

export function speakText(text: string, language: Language, enqueue = false, speed: SpeechSpeed = 'normal', origin: 'manual' | 'auto' = 'manual') {
  // Recheck shared preferences here too: a delayed game callback can retain an
  // older hook closure after the learner changes the mute/auto-speak setting.
  if (preferences.muted || (origin === 'auto' && !preferences.autoSpeakCorrect)) return;
  const normalized = normalizeSpokenText(text);
  if (!normalized) return;
  primeWebPlayer();
  if (!enqueue) stopSpeaking();
  queue.push({ text: normalized, language, speed, origin });
  void pump();
}
