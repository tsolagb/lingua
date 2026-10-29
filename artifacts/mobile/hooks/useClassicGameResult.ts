import { useCallback, useRef } from 'react';
import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { practiceScoreFromStars } from '@/lib/practice-grading';

/**
 * Reports a classic game's best stars (no XP, no lesson credit). The learner and
 * language are captured when the round opens; a report is dropped if either has
 * changed since, and only fires after the original completion write resolves.
 */
export function useClassicGameResult(mode: string) {
  const { activeLanguage, recordClassicBestStars, recordLevelPracticeScore } = useGame();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{
    categoryId?: string;
    levelIndex?: string;
    review?: string;
    allWords?: string;
    generalStage?: string;
  }>();
  const rawLevelIndex = params.levelIndex ?? '';
  const parsedLevelIndex = /^\d+$/.test(rawLevelIndex) ? Number(rawLevelIndex) : null;
  const categoryId = params.categoryId;
  const practiceTargetRef = useRef({
    categoryId: categoryId &&
      parsedLevelIndex !== null &&
      params.review !== '1' &&
      params.allWords !== '1' &&
      params.generalStage !== '1'
      ? categoryId
      : undefined,
    levelIndex: parsedLevelIndex,
  });
  practiceTargetRef.current = {
    categoryId: categoryId &&
      parsedLevelIndex !== null &&
      params.review !== '1' &&
      params.allWords !== '1' &&
      params.generalStage !== '1'
      ? categoryId
      : undefined,
    levelIndex: parsedLevelIndex,
  };
  const scope = useRef({ language: activeLanguage, ownerId: userId ?? null });
  const live = useRef({ language: activeLanguage, ownerId: userId ?? null });
  live.current = { language: activeLanguage, ownerId: userId ?? null };
  const recordRef = useRef(recordClassicBestStars);
  recordRef.current = recordClassicBestStars;
  const levelPracticeRecordRef = useRef(recordLevelPracticeScore);
  levelPracticeRecordRef.current = recordLevelPracticeScore;

  const beginRound = useCallback(() => {
    scope.current = { ...live.current };
  }, []);

  const report = useCallback((stars: number, pending?: unknown) => {
    const captured = { ...scope.current };
    const practiceTarget = { ...practiceTargetRef.current };
    const send = () => {
      if (captured.language !== live.current.language || captured.ownerId !== live.current.ownerId) return;
      const clamped = Math.max(0, Math.min(3, Math.round(Number(stars) || 0)));
      recordRef.current(mode, clamped, captured.language, captured.ownerId);
      if (practiceTarget.categoryId && practiceTarget.levelIndex !== null) {
        levelPracticeRecordRef.current(
          practiceTarget.categoryId,
          practiceTarget.levelIndex,
          mode,
          practiceScoreFromStars(clamped),
          captured.language,
          captured.ownerId,
        );
      }
    };
    if (pending && typeof (pending as Promise<unknown>).then === 'function') {
      (pending as Promise<unknown>).then(send, () => { /* original completion failed: no best recorded */ });
    } else {
      send();
    }
    return pending;
  }, [mode]);

  return { report, beginRound };
}
