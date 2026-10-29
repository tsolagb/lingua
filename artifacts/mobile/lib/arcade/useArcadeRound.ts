import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useArcadeProgress } from '@/hooks/useArcadeProgress';
import type { ArcadeGameId } from '@/lib/arcade-progress';
import { makeSessionId } from './vocab';

export type ArcadePhase = 'intro' | 'playing' | 'results';

/** Shared phase + save orchestration for arcade games. Saves exactly once per round. */
export function useArcadeRound(gameId: ArcadeGameId, onStart: () => void) {
  const progress = useArcadeProgress(gameId);
  const [phase, setPhase] = useState<ArcadePhase>('intro');
  const [result, setResult] = useState({ score: 0, stars: 0, xp: 0 });
  const [xpEarned, setXpEarned] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const sessionRef = useRef(makeSessionId());
  const savedRef = useRef<string | null>(null);
  const pendingRef = useRef<{ score: number; stars: number; xp: number } | null>(null);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;
  const finishRef = useRef(progress.finishGame);
  finishRef.current = progress.finishGame;

  const save = useCallback(async () => {
    const payload = pendingRef.current;
    const sessionId = sessionRef.current;
    if (!payload || savedRef.current === sessionId) return;
    savedRef.current = sessionId;
    try {
      const res = await finishRef.current({ sessionId, ...payload });
      setXpEarned(res.xpEarned);
      setBest(res.bestScore);
    } catch {
      savedRef.current = null; // allow retry with the same session id
    }
  }, []);

  const finish = useCallback((score: number, stars: number, xp: number) => {
    if (pendingRef.current) return;
    pendingRef.current = { score, stars, xp };
    setResult({ score, stars, xp });
    setPhase('results');
    void save();
  }, [save]);

  const start = useCallback(() => {
    const sessionId = makeSessionId();
    if (!progress.beginSession(sessionId)) return;
    sessionRef.current = sessionId;
    pendingRef.current = null;
    savedRef.current = null;
    setXpEarned(0);
    setBest(null);
    progress.resetSaveError();
    onStartRef.current();
    setPhase('playing');
  }, [progress]);

  const retry = useCallback(() => {
    progress.resetSaveError();
    void save();
  }, [progress, save]);

  return {
    phase,
    start,
    finish,
    retry,
    shell: {
      gameId,
      phase,
      score: result.score,
      bestScore: best ?? progress.bestScore,
      stars: result.stars,
      xp: xpEarned,
      saving: progress.isSaving,
      error: progress.saveError,
      onPlay: start,
      onReplay: start,
      onDone: () => router.replace('/categories?tab=games' as any),
    },
  };
}
