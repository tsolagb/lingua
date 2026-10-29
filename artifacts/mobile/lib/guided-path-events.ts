import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Language } from '@/data/vocabulary';

export interface GuidedPathReturnEvent {
  language: Language;
  globalLevelIndex: number;
  stars: number;
  xp: number;
  isCheckpoint: boolean;
  passed: boolean;
}

// Ephemeral presentation event, never a source of progress/unlocking truth.
// Read only on path focus, so a background path cannot celebrate over the lesson results.
let pendingReturn: GuidedPathReturnEvent | null = null;

export function publishGuidedPathReturn(event: GuidedPathReturnEvent) {
  pendingReturn = event;
}

export function useGuidedPathReturn() {
  const [event, setEvent] = useState<GuidedPathReturnEvent | null>(null);
  useFocusEffect(useCallback(() => {
    setEvent(pendingReturn);
  }, []));
  const consume = useCallback(() => {
    setEvent(current => {
      if (pendingReturn === current) pendingReturn = null;
      return null;
    });
  }, []);
  return { event, consume };
}
