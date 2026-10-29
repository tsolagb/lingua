import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import { useGame } from '@/context/GameContext';
import { arcadeBestScore, type ArcadeGameId, type ArcadeResult } from '@/lib/arcade-progress';

export function useArcadeProgress(gameId: ArcadeGameId) {
  const { progress, activeLanguage, finishArcadeRound, isProgressReady } = useGame();
  const { userId } = useAuth();
  const [isSaving, setSaving] = useState(false);
  const [saveError, setError] = useState<string | null>(null);
  const pending = useRef<Promise<{ bestScore: number; xpEarned: number }> | null>(null);
  const owner = useRef<{ sessionId: string; language: typeof activeLanguage; userId: string | null; invalid: boolean } | null>(null);
  if (owner.current && (owner.current.language !== activeLanguage || owner.current.userId !== (userId ?? null))) owner.current.invalid = true;
  const beginSession = useCallback((sessionId: string) => {
    if (pending.current || !isProgressReady) {
      setError('Your progress is still loading or saving. Please try again in a moment.');
      return false;
    }
    owner.current = { sessionId, language: activeLanguage, userId: userId ?? null, invalid: false };
    setError(null);
    return true;
  }, [activeLanguage, userId, isProgressReady]);
  const finishGame = useCallback((result: ArcadeResult) => {
    if (pending.current) return pending.current;
    const scope = owner.current;
    if (!scope || scope.invalid || scope.sessionId !== result.sessionId || scope.language !== activeLanguage || scope.userId !== (userId ?? null)) {
      const failure = new Error('Your learner or language changed during this round. Start a new round to keep progress with the right learner.');
      setError(failure.message);
      return Promise.reject(failure);
    }
    setSaving(true); setError(null);
    const operation = finishArcadeRound(gameId, result, activeLanguage).catch(error => {
      setError(error instanceof Error ? error.message : 'Could not save this round. Please try again.');
      throw error;
    }).finally(() => { pending.current = null; setSaving(false); });
    pending.current = operation;
    return operation;
  }, [activeLanguage, userId, gameId, finishArcadeRound]);
  return { bestScore: arcadeBestScore(progress, activeLanguage, gameId), isSaving, saveError, finishGame, beginSession, resetSaveError: useCallback(() => setError(null), []) };
}
