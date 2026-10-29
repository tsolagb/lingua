import { useCallback, useLayoutEffect, useSyncExternalStore } from 'react';
import { useGame } from '@/context/GameContext';
import type { Language } from '@/data/vocabulary';
import { getSpeechPlaybackState, setSpeechPreferences, speakText, stopSpeaking, subscribeSpeechPlayback } from '@/lib/speech-player';
import { preloadSpeechAssets, type SpeechSpeed } from '@/lib/speech-cache';

export function useSpeech() {
  const { isMuted, autoSpeakCorrect } = useGame();
  const speechState = useSyncExternalStore(subscribeSpeechPlayback, getSpeechPlaybackState, getSpeechPlaybackState);
  useLayoutEffect(() => {
    setSpeechPreferences(isMuted, autoSpeakCorrect);
  }, [isMuted, autoSpeakCorrect]);
  const speak = useCallback((text: string, language: Language, enqueue = false, speed: SpeechSpeed = 'normal') => {
    if (!isMuted) speakText(text, language, enqueue, speed);
  }, [isMuted]);
  const speakCorrectAnswer = useCallback((text: string, language: Language) => {
    if (!isMuted && autoSpeakCorrect) speakText(text, language, true, 'normal', 'auto');
  }, [isMuted, autoSpeakCorrect]);
  const preloadSpeech = useCallback((texts: readonly string[], language: Language, speeds?: readonly SpeechSpeed[]) => {
    if (isMuted) return () => {};
    return preloadSpeechAssets(texts, language, speeds);
  }, [isMuted]);
  return { speak, speakCorrectAnswer, preloadSpeech, speechState, stopSpeaking };
}
