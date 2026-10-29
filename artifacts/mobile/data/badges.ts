import { CATEGORIES, SUPPORTED_LANGUAGES } from './vocabulary';
import { GUIDED_CHEST_CATEGORY_ID } from '../lib/guided-path-rewards';

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  /** Category for grouping in the badge screen */
  group: 'progress' | 'streak' | 'mastery' | 'stars';
}

export const ALL_BADGES: Badge[] = [
  { id: 'boss_champion', emoji: '🛡️', title: 'Boss Champion', description: 'Defeat a milestone boss after passing its checkpoint.', group: 'mastery' },
  // ── Progress ───────────────────────────────────────────────────────────────
  {
    id: 'first_level',
    emoji: '🎯',
    title: 'First Step',
    description: 'Complete your very first level',
    group: 'progress',
  },
  {
    id: 'levels_10',
    emoji: '🚀',
    title: 'Rising Star',
    description: 'Complete 10 levels',
    group: 'progress',
  },
  {
    id: 'levels_25',
    emoji: '🎓',
    title: 'Scholar',
    description: 'Complete 25 levels',
    group: 'progress',
  },
  {
    id: 'levels_50',
    emoji: '🏅',
    title: 'Champion',
    description: 'Complete 50 levels',
    group: 'progress',
  },
  {
    id: 'polyglot',
    emoji: '🌍',
    title: 'Polyglot',
    description: 'Play in all 4 study languages',
    group: 'progress',
  },
  {
    id: 'explorer',
    emoji: '🗺️',
    title: 'Explorer',
    description: 'Complete a level in every category',
    group: 'progress',
  },

  // ── Stars ──────────────────────────────────────────────────────────────────
  {
    id: 'first_perfect',
    emoji: '⭐',
    title: 'Shooting Star',
    description: 'Earn 3 stars on a level',
    group: 'stars',
  },
  {
    id: 'perfect_5',
    emoji: '💫',
    title: 'Star Power',
    description: 'Earn 3 stars on 5 levels',
    group: 'stars',
  },
  {
    id: 'perfect_10',
    emoji: '💎',
    title: 'Perfectionist',
    description: 'Earn 3 stars on 10 levels',
    group: 'stars',
  },
  {
    id: 'stars_50',
    emoji: '🌟',
    title: 'Star Collector',
    description: 'Earn 50 stars total',
    group: 'stars',
  },
  {
    id: 'stars_100',
    emoji: '✨',
    title: 'Stardust',
    description: 'Earn 100 stars total',
    group: 'stars',
  },

  // ── Streak ─────────────────────────────────────────────────────────────────
  {
    id: 'streak_3',
    emoji: '🔥',
    title: 'On Fire',
    description: '3-day streak',
    group: 'streak',
  },
  {
    id: 'streak_7',
    emoji: '🌶️',
    title: 'Week Warrior',
    description: '7-day streak',
    group: 'streak',
  },
  {
    id: 'streak_30',
    emoji: '🏆',
    title: 'Unstoppable',
    description: '30-day streak',
    group: 'streak',
  },

  // ── Mastery ────────────────────────────────────────────────────────────────
  {
    id: 'animals_master',
    emoji: '🐾',
    title: 'Animal Expert',
    description: 'Complete all Animals levels',
    group: 'mastery',
  },
  {
    id: 'food_master',
    emoji: '🍎',
    title: 'Foodie',
    description: 'Complete all Food levels',
    group: 'mastery',
  },
  {
    id: 'category_master',
    emoji: '🎪',
    title: 'Category Master',
    description: 'Complete all levels in any category',
    group: 'mastery',
  },
  {
    id: 'all_categories',
    emoji: '👑',
    title: 'Grand Master',
    description: 'Complete all levels in every category',
    group: 'mastery',
  },
];

export const BADGE_MAP: Record<string, Badge> = Object.fromEntries(
  ALL_BADGES.map(b => [b.id, b]),
);

// ── Milestone checker ──────────────────────────────────────────────────────────

interface Progress {
  [key: string]: { [levelIndex: number]: { completed: boolean; stars: number } };
}

interface StreakData {
  current: number;
  longest: number;
  lastPlayedDate: string | null;
  playedDates: string[];
}

export function computeEarnedBadges(
  progress: Progress,
  streak: StreakData,
): Set<string> {
  const earned = new Set<string>();

  // ── Progress counts ──
  let totalCompleted = 0;
  let totalStars = 0;
  let threeStarCount = 0;
  const categoriesWithAnyLevel = new Set<string>();
  const languagesPlayed = new Set<string>();

  for (const [key, levels] of Object.entries(progress)) {
    const [lang, catId] = key.split('::');
    if (catId === GUIDED_CHEST_CATEGORY_ID) continue;
    if (catId?.startsWith('arcade:')) {
      if (catId === 'arcade:boss-battle' && Object.values(levels).some(level => 'arcadeWon' in level && level.arcadeWon === true)) earned.add('boss_champion');
      continue;
    }
    let catCompleted = false;
    for (const lvl of Object.values(levels)) {
      if (lvl.completed) {
        totalCompleted++;
        totalStars += lvl.stars;
        if (lvl.stars === 3) threeStarCount++;
        catCompleted = true;
        languagesPlayed.add(lang);
        categoriesWithAnyLevel.add(catId);
      }
    }
  }

  // First level
  if (totalCompleted >= 1)  earned.add('first_level');
  if (totalCompleted >= 10) earned.add('levels_10');
  if (totalCompleted >= 25) earned.add('levels_25');
  if (totalCompleted >= 50) earned.add('levels_50');

  // Stars
  if (threeStarCount >= 1)  earned.add('first_perfect');
  if (threeStarCount >= 5)  earned.add('perfect_5');
  if (threeStarCount >= 10) earned.add('perfect_10');
  if (totalStars >= 50)     earned.add('stars_50');
  if (totalStars >= 100)    earned.add('stars_100');

  // Streak
  const longestStreak = streak.longest;
  if (longestStreak >= 3)  earned.add('streak_3');
  if (longestStreak >= 7)  earned.add('streak_7');
  if (longestStreak >= 30) earned.add('streak_30');

  // Polyglot — played in every supported language
  if (SUPPORTED_LANGUAGES.every(language => languagesPlayed.has(language))) {
    earned.add('polyglot');
  }

  // Explorer — at least one level in every category (any language)
  const allCatIds = new Set(CATEGORIES.map(c => c.id));
  if ([...allCatIds].every(id => categoriesWithAnyLevel.has(id))) {
    earned.add('explorer');
  }

  // Category mastery (any language)
  for (const cat of CATEGORIES) {
    for (const lang of SUPPORTED_LANGUAGES) {
      const key = `${lang}::${cat.id}`;
      const levels = progress[key] ?? {};
      const allDone = cat.levels.every((_, i) => levels[i]?.completed === true);
      if (allDone && cat.levels.length > 0) {
        earned.add('category_master');
        if (cat.id === 'animals') earned.add('animals_master');
        if (cat.id === 'food')    earned.add('food_master');
      }
    }
  }

  // Grand master — every category fully completed (any language)
  const allMastered = CATEGORIES.every(cat =>
    SUPPORTED_LANGUAGES.some(lang => {
      const key = `${lang}::${cat.id}`;
      const levels = progress[key] ?? {};
      return cat.levels.every((_, i) => levels[i]?.completed === true);
    }),
  );
  if (allMastered && CATEGORIES.length > 0) earned.add('all_categories');

  return earned;
}
