import type { Currency, Progress } from '../context/progressSnapshot';
import type { Language } from '../data/vocabulary';

export const GUIDED_CHEST_CATEGORY_ID = 'guided-chests';
export const GUIDED_CHEST_XP = 5;
export const GUIDED_CHEST_AFTER_LEVELS = 4;

/** Chest claims use the existing synced progress ledger, but are not lessons or stars. */
export function planGuidedChestReward({
  progress, currency, language, milestoneIndex, milestoneCount, levelsPerMilestone, lessonCategoryId,
}: {
  progress: Progress;
  currency: Currency;
  language: Language;
  milestoneIndex: number;
  milestoneCount: number;
  levelsPerMilestone: number;
  lessonCategoryId: string;
}): { progress: Progress; currency: Currency; xp: number } | null {
  if (!Number.isInteger(milestoneIndex) || milestoneIndex < 0 || milestoneIndex >= milestoneCount) return null;
  const claimKey = `${language}::${GUIDED_CHEST_CATEGORY_ID}`;
  if (progress[claimKey]?.[milestoneIndex]?.completed) return null;
  const lessons = progress[`${language}::${lessonCategoryId}`] ?? {};
  const firstLevel = milestoneIndex * levelsPerMilestone;
  if (!Array.from({ length: firstLevel + GUIDED_CHEST_AFTER_LEVELS }, (_, index) =>
    lessons[index]?.completed === true,
  ).every(Boolean)) return null;
  return {
    progress: {
      ...progress,
      [claimKey]: { ...progress[claimKey], [milestoneIndex]: { completed: true, stars: 0 } },
    },
    currency: { ...currency, [language]: currency[language] + GUIDED_CHEST_XP },
    xp: GUIDED_CHEST_XP,
  };
}

export function countCompletedLearningLevels(progress: Progress): number {
  return Object.entries(progress).reduce((total, [key, levels]) =>
    key.endsWith(`::${GUIDED_CHEST_CATEGORY_ID}`) || key.includes('::arcade:')
      ? total
      : total + Object.values(levels).filter(level => level.completed).length, 0);
}
