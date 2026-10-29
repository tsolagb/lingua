import type { Language } from '@/data/vocabulary';
import { GUIDED_CATEGORY_ID, GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES } from '@/data/guided-curriculum';
import type { Progress } from '@/context/progressSnapshot';
import { normalizeCompletedAt } from './completion-dates';

export interface PassportStamp {
  milestoneIndex: number;
  title: string;
  theme: string;
  /** ISO date of first successful checkpoint completion, only when actually recorded. */
  completedAt?: string;
}

/** Pure: derives stamps from real per-language guided progress. Never invents dates. */
export function getJourneyPassport(progress: Progress, language: Language): PassportStamp[] {
  const levels = progress[`${language}::${GUIDED_CATEGORY_ID}`] ?? {};
  const stamps: PassportStamp[] = [];
  GUIDED_MILESTONES.forEach((milestone, milestoneIndex) => {
    const first = milestoneIndex * GUIDED_LEVELS_PER_MILESTONE;
    for (let i = 0; i < GUIDED_LEVELS_PER_MILESTONE; i++) {
      if (levels[first + i]?.completed !== true) return;
    }
    const checkpoint = levels[first + GUIDED_LEVELS_PER_MILESTONE - 1];
    const completedAt = normalizeCompletedAt(checkpoint?.completedAt);
    stamps.push({
      milestoneIndex,
      title: milestone.title,
      theme: milestone.categoryId,
      ...(completedAt ? { completedAt } : {}),
    });
  });
  return stamps;
}
