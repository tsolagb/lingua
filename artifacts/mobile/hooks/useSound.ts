import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { useSpeech } from '@/hooks/useSpeech';

const CORRECT_SOUND = require('../assets/sounds/correct-answer-soft.mp3');
const MATCH_CORRECT_SOUND = require('../assets/sounds/correct-answer-soft.mp3');
const WRONG_SOUND = require('../assets/sounds/wrong.wav');

// --- Web Audio helpers (web only) ---
function createAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    return new Ctx();
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  gainValue: number,
  startDelay = 0,
  ctx?: AudioContext,
) {
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain       = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type      = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

  oscillator.start(ctx.currentTime + startDelay);
  oscillator.stop(ctx.currentTime + startDelay + duration);
}

function playWrongTone() {
  const ctx = createAudioContext();
  if (!ctx) return;
  // Low buzzy descending: short double-buzz
  playTone(220, 'sawtooth', 0.15, 0.25, 0.00, ctx);
  playTone(180, 'sawtooth', 0.18, 0.25, 0.18, ctx);
}

// --- Native audio helpers (iOS and Android) ---
let nativeAudioModePromise: Promise<void> | null = null;

function configureNativeAudio() {
  if (!nativeAudioModePromise) {
    nativeAudioModePromise = setAudioModeAsync({
      allowsRecording: false,
      interruptionMode: Platform.OS === 'ios' ? 'mixWithOthers' : 'duckOthers',
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch((error) => {
      nativeAudioModePromise = null;
      throw error;
    });
  }
  return nativeAudioModePromise;
}

type SoundPlayer = ReturnType<typeof useAudioPlayer>;

async function playNativeSound(player: SoundPlayer) {
  await playBundledSound(player, 1);
}

async function playBundledSound(player: SoundPlayer, volume: number) {
  if (Platform.OS !== 'web') await configureNativeAudio();
  await player.seekTo(0);
  player.volume = volume;
  player.play();
}

// --- Public hook ---
export function useSound() {
  const { isMuted } = useGame();
  const speech = useSpeech();
  const correctPlayer = useAudioPlayer(CORRECT_SOUND);
  const matchCorrectPlayer = useAudioPlayer(MATCH_CORRECT_SOUND);
  const wrongPlayer = useAudioPlayer(WRONG_SOUND);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void configureNativeAudio().catch((error) => {
      console.warn('Unable to prepare native audio', error);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') speech.stopSpeaking();
    });
    return () => { subscription.remove(); speech.stopSpeaking(); };
  }, [speech.stopSpeaking]));

  const playCorrect = useCallback(() => {
    if (isMuted) return;
    playBundledSound(correctPlayer, 0.66).catch((error) => {
      console.warn('Unable to play correct sound effect', error);
    });
    // Haptics are handled separately in each game screen for native feel
  }, [correctPlayer, isMuted]);

  const playMatchCorrect = useCallback(() => {
    if (isMuted) return;
    playBundledSound(matchCorrectPlayer, 0.62).catch((error) => {
      console.warn('Unable to play match chime', error);
    });
  }, [isMuted, matchCorrectPlayer]);

  const playWrong = useCallback(() => {
    if (isMuted) return;
    if (Platform.OS === 'web') {
      playWrongTone();
    } else {
      playNativeSound(wrongPlayer).catch((error) => {
        console.warn('Unable to play wrong sound effect', error);
      });
    }
  }, [isMuted, wrongPlayer]);

  return { playCorrect, playMatchCorrect, playWrong, ...speech };
}
