import { useCallback, useRef, useState } from 'react';
import { useArcadeProgress } from '@/hooks/useArcadeProgress';
import { makeSessionId } from '@/lib/arcade/voice-utils';

export type ArcadePhase = 'intro' | 'playing' | 'results';
export type RoundOutcome = Omit<import('@/lib/arcade-progress').ArcadeResult, 'sessionId'>;

/**
 * Round lifecycle + exactly-once save. Each round gets a stable unique sessionId;
 * a ref guard prevents duplicate XP; failures are surfaced for retry (never claimed as saved).
 */
export function useArcadeRound(gameId: Parameters<typeof useArcadeProgress>[0]) {
  const { bestScore, isSaving, saveError, finishGame, beginSession, resetSaveError } = useArcadeProgress(gameId);
  const [phase, setPhase] = useState<ArcadePhase>('intro');
  const [outcome, setOutcome] = useState<RoundOutcome>({ score: 0, stars: 0, xp: 0 });
  const [xpEarned, setXpEarned] = useState(0);
  const [savedBest, setSavedBest] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const sessionRef = useRef('');
  const savedRef = useRef(false);
  const inFlightRef = useRef(false);
  const outcomeRef = useRef(outcome);

  const save = useCallback(async (o: RoundOutcome) => {
    if (savedRef.current || inFlightRef.current || !sessionRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await finishGame({ sessionId: sessionRef.current, ...o });
      savedRef.current = true;
      setXpEarned(res.xpEarned);
      setSavedBest(res.bestScore);
    } catch {
      // saveError from hook drives retry UI
    } finally {
      inFlightRef.current = false;
    }
  }, [finishGame]);

  const begin = useCallback(() => {
    const sessionId = makeSessionId(gameId);
    if (!beginSession(sessionId)) return;
    sessionRef.current = sessionId;
    savedRef.current = false;
    setXpEarned(0);
    setSavedBest(null);
    resetSaveError();
    setRound(r => r + 1);
    setPhase('playing');
  }, [gameId, beginSession, resetSaveError]);

  const finish = useCallback((o: RoundOutcome) => {
    outcomeRef.current = o;
    setOutcome(o);
    setPhase('results');
    void save(o);
  }, [save]);

  const retrySave = useCallback(() => {
    resetSaveError();
    void save(outcomeRef.current);
  }, [resetSaveError, save]);

  return {
    phase,
    round,
    outcome,
    xpEarned,
    bestScore: Math.max(bestScore ?? 0, savedBest ?? 0),
    saving: isSaving,
    error: saveError ? (typeof saveError === 'string' ? saveError : 'Progress could not be saved.') : undefined,
    begin,
    finish,
    retrySave,
  };
}

export function starsFor(ratio: number) {
  return ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
}
