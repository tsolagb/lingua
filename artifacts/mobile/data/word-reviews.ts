import {
  CATEGORIES,
  getCumulativePairs,
  isCategoryAvailable,
  type Language,
  type WordPair,
} from '@/data/vocabulary';
import { getCategoryScopedReviewPairs } from '@/lib/category-review-scope';
import type { Progress } from '@/context/progressSnapshot';

export const FIRST_TRY_REVIEW_GOAL = 5;
export const MISSED_WORD_REVIEW_GOAL = 3;
export const MAX_PRIOR_REVIEW_WORDS = 5;

export interface WordReviewRecord {
  correctReviews: number;
  requiredReviews: number;
  missCount: number;
  lastAnsweredAt: number;
  lastCategoryId: string | null;
  lastLevelIndex: number | null;
}

export type WordReviewMap = Record<string, WordReviewRecord>;

export function normalizeEnglishWord(english: string): string {
  return english.trim().toLocaleLowerCase();
}

export function wordReviewKey(language: Language, english: string): string {
  return `${language}::${normalizeEnglishWord(english)}`;
}

export function isWordReviewDue(record: WordReviewRecord | undefined): boolean {
  return Boolean(record && record.correctReviews < record.requiredReviews);
}

export function recordWordAnswer(
  reviews: WordReviewMap,
  language: Language,
  english: string,
  isCorrect: boolean,
  categoryId?: string,
  levelIndex?: number,
  answeredAt = Date.now(),
): WordReviewMap {
  const key = wordReviewKey(language, english);
  const previous = reviews[key];

  if (!previous) {
    return {
      ...reviews,
      [key]: {
        correctReviews: 0,
        requiredReviews: isCorrect
          ? FIRST_TRY_REVIEW_GOAL
          : MISSED_WORD_REVIEW_GOAL,
        missCount: isCorrect ? 0 : 1,
        lastAnsweredAt: answeredAt,
        lastCategoryId: categoryId ?? null,
        lastLevelIndex: Number.isInteger(levelIndex) && levelIndex! >= 0
          ? levelIndex!
          : null,
      },
    };
  }

  if (!isCorrect) {
    return {
      ...reviews,
      [key]: {
        ...previous,
        correctReviews: 0,
        requiredReviews: Math.max(
          previous.requiredReviews,
          MISSED_WORD_REVIEW_GOAL,
        ),
        missCount: previous.missCount + 1,
        lastAnsweredAt: answeredAt,
        lastCategoryId: categoryId ?? previous.lastCategoryId,
        lastLevelIndex: Number.isInteger(levelIndex) && levelIndex! >= 0
          ? levelIndex!
          : previous.lastLevelIndex,
      },
    };
  }

  if (!isWordReviewDue(previous)) return reviews;

  return {
    ...reviews,
    [key]: {
      ...previous,
      correctReviews: Math.min(
        previous.requiredReviews,
        previous.correctReviews + 1,
      ),
      lastAnsweredAt: answeredAt,
      lastCategoryId: categoryId ?? previous.lastCategoryId,
      lastLevelIndex: Number.isInteger(levelIndex) && levelIndex! >= 0
        ? levelIndex!
        : previous.lastLevelIndex,
    },
  };
}

export function normalizeWordReviews(value: unknown): WordReviewMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  const normalized: WordReviewMap = {};
  for (const [key, raw] of Object.entries(value)) {
    const separator = key.indexOf('::');
    const language = key.slice(0, separator);
    const english = key.slice(separator + 2);
    if (
      separator < 1 ||
      !['italian', 'french', 'spanish', 'armenian'].includes(language) ||
      !english.trim() ||
      typeof raw !== 'object' ||
      raw === null ||
      Array.isArray(raw)
    ) {
      continue;
    }

    const item = raw as Record<string, unknown>;
    const requiredReviews = item.requiredReviews === FIRST_TRY_REVIEW_GOAL
      ? FIRST_TRY_REVIEW_GOAL
      : MISSED_WORD_REVIEW_GOAL;
    const correctReviews = typeof item.correctReviews === 'number' &&
      Number.isFinite(item.correctReviews)
      ? Math.max(0, Math.min(requiredReviews, Math.floor(item.correctReviews)))
      : 0;
    const missCount = typeof item.missCount === 'number' && Number.isFinite(item.missCount)
      ? Math.max(0, Math.floor(item.missCount))
      : 0;
    const lastAnsweredAt = typeof item.lastAnsweredAt === 'number' &&
      Number.isFinite(item.lastAnsweredAt)
      ? Math.max(0, item.lastAnsweredAt)
      : 0;
    const lastCategoryId = typeof item.lastCategoryId === 'string'
      ? item.lastCategoryId
      : null;
    const lastLevelIndex = typeof item.lastLevelIndex === 'number' &&
      Number.isInteger(item.lastLevelIndex) && item.lastLevelIndex >= 0
      ? item.lastLevelIndex
      : null;

    normalized[`${language}::${normalizeEnglishWord(english)}`] = {
      correctReviews,
      requiredReviews,
      missCount,
      lastAnsweredAt,
      lastCategoryId,
      lastLevelIndex,
    };
  }
  return normalized;
}

export function mergeWordReviews(
  existing: WordReviewMap,
  incoming: WordReviewMap,
): WordReviewMap {
  const merged = { ...existing };
  for (const [key, next] of Object.entries(incoming)) {
    const previous = merged[key];
    if (!previous) {
      merged[key] = next;
      continue;
    }

    if (next.lastAnsweredAt > previous.lastAnsweredAt) {
      merged[key] = next;
      continue;
    }
    if (next.lastAnsweredAt < previous.lastAnsweredAt) continue;

    // If two devices answered at the same timestamp, keep the safer state:
    // don't let a conflicting sync erase a miss or award mastery prematurely.
    const requiredReviews = Math.max(
      previous.requiredReviews,
      next.requiredReviews,
    );
    merged[key] = {
      ...previous,
      correctReviews: Math.min(
        requiredReviews,
        previous.correctReviews,
        next.correctReviews,
      ),
      requiredReviews,
      missCount: Math.max(previous.missCount, next.missCount),
    };
  }
  return merged;
}

const PAIR_BY_ENGLISH = new Map<string, WordPair>();
for (const category of CATEGORIES) {
  for (const level of category.levels) {
    for (const pair of level.pairs) {
      const key = normalizeEnglishWord(pair.english);
      if (!PAIR_BY_ENGLISH.has(key)) PAIR_BY_ENGLISH.set(key, pair);
    }
  }
}

function levelProgressKey(language: Language, categoryId: string) {
  return `${language}::${categoryId}`;
}

/**
 * Builds a level's usual pool and mixes in prioritized unresolved words from
 * earlier levels in the same category only.
 */
export function getPracticePairs(
  categoryId: string,
  levelIndex: number,
  language: Language,
  reviews: WordReviewMap,
  progress: Progress,
): WordPair[] {
  const category = CATEGORIES.find(item => item.id === categoryId);
  if (!category || !isCategoryAvailable(category, language)) return [];
  const base = getCumulativePairs(category, levelIndex);

  const baseKeys = new Set(base.map(pair => normalizeEnglishWord(pair.english)));
  const duePairs = getDueReviewPairs(language, reviews, progress);
  const dueKeys = new Set(duePairs.map(pair => normalizeEnglishWord(pair.english)));

  const rankedPairs = getCategoryScopedReviewPairs(
    duePairs,
    category.levels.flatMap(level => level.pairs),
    base,
  );
  const importedPairs = rankedPairs.slice(0, MAX_PRIOR_REVIEW_WORDS);

  return [
    ...base.map(pair => {
      const key = normalizeEnglishWord(pair.english);
      return dueKeys.has(key) ? { ...pair, isReview: true } : pair;
    }),
    ...importedPairs,
  ];
}

/**
 * Returns every unique word belonging to one category for its general review.
 * Due words are marked for UI/progress purposes, but no words from other
 * categories are imported into this category-wide session.
 */
export function getCategoryGeneralPairs(
  categoryId: string,
  duePairs: readonly WordPair[],
): WordPair[] {
  const category = CATEGORIES.find(item => item.id === categoryId);
  if (!category) return [];

  const dueKeys = new Set(duePairs.map(pair => normalizeEnglishWord(pair.english)));
  const seen = new Set<string>();
  const pairs: WordPair[] = [];

  for (const level of category.levels) {
    for (const pair of level.pairs) {
      const key = normalizeEnglishWord(pair.english);
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push(dueKeys.has(key) ? { ...pair, isReview: true } : pair);
    }
  }

  return pairs;
}

/**
 * Returns every unresolved word for the selected language, including words
 * from previously completed levels that predate per-word review tracking.
 */
export function getDueReviewPairs(
  language: Language,
  reviews: WordReviewMap,
  progress: Progress,
): WordPair[] {
  const historicalKeys = new Set<string>();
  for (const priorCategory of CATEGORIES) {
    if (!isCategoryAvailable(priorCategory, language)) continue;
    const completedLevels =
      progress[levelProgressKey(language, priorCategory.id)] ?? {};
    priorCategory.levels.forEach((level, index) => {
      if (completedLevels[index]?.completed) {
        level.pairs.forEach(pair =>
          historicalKeys.add(normalizeEnglishWord(pair.english)),
        );
      }
    });
  }

  const dueKeys = new Set<string>();
  for (const [key, record] of Object.entries(reviews)) {
    if (!key.startsWith(`${language}::`) || !isWordReviewDue(record)) continue;
    dueKeys.add(key.slice(language.length + 2));
  }

  // Older app versions didn't save per-word results. Revisit words from levels
  // they completed rather than silently assuming those words were mastered.
  for (const key of historicalKeys) {
    if (!reviews[wordReviewKey(language, key)]) dueKeys.add(key);
  }

  const rankedKeys = [...dueKeys]
    .filter(key => {
      const pair = PAIR_BY_ENGLISH.get(key);
      return Boolean(pair?.translations[language]?.trim());
    })
    .sort((a, b) => {
      const aReview = reviews[wordReviewKey(language, a)];
      const bReview = reviews[wordReviewKey(language, b)];
      const aMisses = aReview?.missCount ?? 0;
      const bMisses = bReview?.missCount ?? 0;
      if (aMisses !== bMisses) return bMisses - aMisses;
      const aLastSeen = aReview?.lastAnsweredAt ?? 0;
      const bLastSeen = bReview?.lastAnsweredAt ?? 0;
      if (aLastSeen !== bLastSeen) return aLastSeen - bLastSeen;
      return a.localeCompare(b);
    });
  return rankedKeys.flatMap(key => {
    const pair = PAIR_BY_ENGLISH.get(key);
    return pair ? [{ ...pair, isReview: true }] : [];
  });
}
