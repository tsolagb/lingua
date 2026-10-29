import type { Language } from '@/data/vocabulary';

export interface LessonResultsSnapshot {
  categoryId: string;
  levelIndex: number;
  stars: number;
  mistakes: number;
  earned: number;
  language: Language;
}

export type LessonReviewExit =
  | { kind: 'back' }
  | {
      kind: 'replace';
      pathname: '/results';
      params: Record<string, string>;
    };

export function resolveLessonLanguage(
  requestedLanguage: string | undefined,
  fallbackLanguage: Language,
): Language {
  switch (requestedLanguage) {
    case 'italian':
    case 'french':
    case 'spanish':
    case 'armenian':
      return requestedLanguage;
    default:
      return fallbackLanguage;
  }
}

export function createLessonReviewRoute(snapshot: LessonResultsSnapshot) {
  return {
    pathname: '/flashcards' as const,
    params: {
      categoryId: snapshot.categoryId,
      levelIndex: String(snapshot.levelIndex),
      language: snapshot.language,
      returnTo: 'results',
      returnStars: String(snapshot.stars),
      returnMistakes: String(snapshot.mistakes),
      returnEarned: String(snapshot.earned),
      returnLanguage: snapshot.language,
    },
  };
}

export function createLessonReviewExit(
  hasNavigationHistory: boolean,
  snapshot: LessonResultsSnapshot,
): LessonReviewExit {
  if (hasNavigationHistory) return { kind: 'back' };

  return {
    kind: 'replace',
    pathname: '/results',
    params: {
      categoryId: snapshot.categoryId,
      levelIndex: String(snapshot.levelIndex),
      stars: String(snapshot.stars),
      mistakes: String(snapshot.mistakes),
      earned: String(snapshot.earned),
      language: snapshot.language,
      autoAdvance: '0',
    },
  };
}
