import { SUPPORTED_LANGUAGES, type Language } from "@/data/vocabulary";
import { arcadeXpTotal, isArcadeProgressKey, normalizeArcadeMetadata, mergeArcadeMetadata } from '../lib/arcade-progress';
import { mergeCompletionDates, normalizeCompletedAt } from '../lib/completion-dates';
import {
  mergeWordReviews,
  normalizeWordReviews,
  type WordReviewMap,
} from "@/data/word-reviews";
import {
  mergeGuidedSentenceReviews,
  normalizeGuidedSentenceReviews,
  type GuidedSentenceReviewMap,
} from "@/data/guided-sentence-reviews";
import { isBetterVocabularyTestScore } from "../lib/vocabulary-test";

export interface LevelProgress {
  completed: boolean;
  stars: number;
  completedAt?: string;
  vocabularyTestBestScore?: number;
  vocabularyTestQuestionCount?: number;
  practiceScores?: Record<string, number>;
  arcadeScore?: number;
  arcadeXp?: number;
  arcadeStars?: number;
  arcadeContentId?: string;
  arcadeWon?: boolean;
  arcadeDate?: string;
  arcadeGrid?: string;
  stages?: { [stageIndex: number]: StageProgress };
}

export interface StageProgress {
  completed: boolean;
  stars: number;
  gameScores?: Record<string, number>;
}

export interface Progress {
  [key: string]: { [levelIndex: number]: LevelProgress };
}

export interface StreakData {
  current: number;
  longest: number;
  lastPlayedDate: string | null;
  playedDates: string[];
}

export interface StarHistory {
  [date: string]: number;
}

export interface DailyGoalData {
  goal: number;
  completed: number;
  date: string;
  celebrationPending: boolean;
}

export interface Currency {
  italian: number;
  french: number;
  spanish: number;
  armenian: number;
}

export interface ProgressSnapshot {
  progress: Progress;
  wordReviews: WordReviewMap;
  guidedSentenceReviews: GuidedSentenceReviewMap;
  activeLanguage: Language;
  streak: StreakData;
  currency: Currency;
  starHistory: StarHistory;
  isMuted: boolean;
  autoSpeakCorrect: boolean;
  earnedBadgeIds: string[];
  dailyGoal: DailyGoalData;
}

export const GUEST_ACCESS_KEY = "@linguamatch_v1_guest_access";
export const GUEST_SNAPSHOT_KEY = "@linguamatch_v1_guest_snapshot";
export const ACTIVE_ACCOUNT_KEY = "@linguamatch_v1_active_account";
export const accountSnapshotKey = (userId: string) =>
  `@linguamatch_v1_account_snapshot:${userId}`;

const LANGUAGES = SUPPORTED_LANGUAGES;

function todayStr() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectValue(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback;
}

function normalizePracticeScores(value: unknown): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [mode, score] of Object.entries(objectValue(value))) {
    if (
      /^[a-z][a-z0-9-]*$/i.test(mode) &&
      typeof score === 'number' &&
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 100
    ) {
      scores[mode] = Math.round(score * 10) / 10;
    }
  }
  return scores;
}

function normalizeProgress(value: unknown): Progress {
  const result: Progress = {};
  for (const [categoryKey, rawLevels] of Object.entries(objectValue(value))) {
    const levels: Record<number, LevelProgress> = {};
    for (const [levelKey, rawLevel] of Object.entries(objectValue(rawLevels))) {
      const level = objectValue(rawLevel);
      const levelIndex = Number(levelKey);
      if (!Number.isInteger(levelIndex) || levelIndex < 0) continue;
      const testTotal = numberValue(level.vocabularyTestQuestionCount);
      const testScore = numberValue(level.vocabularyTestBestScore);
      const hasVocabularyTest = testTotal > 0 && testScore <= testTotal;
      const practiceScores = normalizePracticeScores(level.practiceScores);

      const stages: Record<number, StageProgress> = {};
      for (const [stageKey, rawStage] of Object.entries(objectValue(level.stages))) {
        const stageIndex = Number(stageKey);
        const stage = objectValue(rawStage);
        const gameScores = normalizePracticeScores(stage.gameScores);
        if (
          Number.isInteger(stageIndex) &&
          stageIndex >= 0 &&
          (
            stage.completed === true ||
            typeof stage.stars === "number" ||
            Object.keys(gameScores).length > 0
          )
        ) {
          stages[stageIndex] = {
            completed: stage.completed === true,
            stars: numberValue(stage.stars),
            ...(Object.keys(gameScores).length > 0 ? { gameScores } : {}),
          };
        }
      }

      if (
        level.completed === true ||
        typeof level.stars === "number" ||
        Object.keys(stages).length > 0 ||
        hasVocabularyTest ||
        Object.keys(practiceScores).length > 0
      ) {
        levels[levelIndex] = {
          completed: level.completed === true,
          stars: numberValue(level.stars),
          ...(level.completed === true && normalizeCompletedAt(level.completedAt)
            ? { completedAt: normalizeCompletedAt(level.completedAt) } : {}),
          ...(hasVocabularyTest ? {
            vocabularyTestBestScore: Math.round(testScore * 2) / 2,
            vocabularyTestQuestionCount: Math.floor(testTotal),
          } : {}),
          ...(Object.keys(practiceScores).length > 0 ? { practiceScores } : {}),
          ...(isArcadeProgressKey(categoryKey) ? {
            arcadeScore: numberValue(level.arcadeScore),
            arcadeXp: Math.min(50, numberValue(level.arcadeXp)),
            arcadeStars: Math.min(3, numberValue(level.arcadeStars)),
            ...normalizeArcadeMetadata(level),
          } : {}),
          ...(Object.keys(stages).length > 0 ? { stages } : {}),
        };
      }
    }
    result[categoryKey] = levels;
  }
  return result;
}

export function normalizeProgressSnapshot(value: unknown): ProgressSnapshot {
  const raw = objectValue(value);
  const rawCurrency = objectValue(raw.currency);
  const rawStreak = objectValue(raw.streak);
  const rawDailyGoal = objectValue(raw.dailyGoal);
  const rawHistory = objectValue(raw.starHistory);

  const currency: Currency = {
    italian: numberValue(rawCurrency.italian),
    french: numberValue(rawCurrency.french),
    spanish: numberValue(rawCurrency.spanish),
    armenian: numberValue(rawCurrency.armenian),
  };

  const activeLanguage = LANGUAGES.includes(raw.activeLanguage as Language)
    ? (raw.activeLanguage as Language)
    : "italian";

  const playedDates = Array.isArray(rawStreak.playedDates)
    ? [
        ...new Set(
          rawStreak.playedDates.filter(
            (date): date is string =>
              typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
          ),
        ),
      ].sort()
    : [];
  const lastPlayedDate =
    typeof rawStreak.lastPlayedDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawStreak.lastPlayedDate)
      ? rawStreak.lastPlayedDate
      : null;

  const starHistory: StarHistory = {};
  for (const [date, count] of Object.entries(rawHistory)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      starHistory[date] = numberValue(count);
    }
  }

  const today = todayStr();
  const goalDate =
    typeof rawDailyGoal.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawDailyGoal.date)
      ? rawDailyGoal.date
      : today;
  const goalIsForToday = goalDate === today;
  const dailyGoal: DailyGoalData = {
    goal: Math.min(5, Math.max(1, Math.round(numberValue(rawDailyGoal.goal, 2)))),
    completed: goalIsForToday
      ? numberValue(rawDailyGoal.completed)
      : 0,
    date: today,
    celebrationPending: goalIsForToday && rawDailyGoal.celebrationPending === true,
  };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const currentStreak =
    lastPlayedDate === today || lastPlayedDate === yesterdayString
      ? numberValue(rawStreak.current)
      : 0;

  return {
    progress: normalizeProgress(raw.progress),
    wordReviews: normalizeWordReviews(raw.wordReviews),
    guidedSentenceReviews: normalizeGuidedSentenceReviews(raw.guidedSentenceReviews),
    activeLanguage,
    streak: {
      current: currentStreak,
      longest: numberValue(rawStreak.longest),
      lastPlayedDate,
      playedDates,
    },
    currency,
    starHistory,
    isMuted: raw.isMuted === true,
    autoSpeakCorrect: raw.autoSpeakCorrect !== false,
    earnedBadgeIds: Array.isArray(raw.earnedBadgeIds)
      ? [...new Set(raw.earnedBadgeIds.filter(
          (id): id is string => typeof id === "string",
        ))]
      : [],
    dailyGoal,
  };
}

export function emptyProgressSnapshot(): ProgressSnapshot {
  return normalizeProgressSnapshot({});
}

export function mergeProgressSnapshots(
  existingValue: unknown,
  incomingValue: unknown,
): ProgressSnapshot {
  const existingRaw = objectValue(existingValue);
  const incomingRaw = objectValue(incomingValue);
  const existing = normalizeProgressSnapshot(existingRaw);
  const incoming = normalizeProgressSnapshot(incomingRaw);

  const progress: Progress = {};
  for (const source of [existing.progress, incoming.progress]) {
    for (const [categoryKey, levels] of Object.entries(source)) {
      const category = (progress[categoryKey] ??= {});
      for (const [levelIndex, level] of Object.entries(levels)) {
        const previous = category[Number(levelIndex)];
        const bestVocabularyTest =
          isBetterVocabularyTestScore(
            level.vocabularyTestBestScore ?? -1,
            level.vocabularyTestQuestionCount ?? 0,
            previous?.vocabularyTestBestScore,
            previous?.vocabularyTestQuestionCount,
          )
            ? level
            : previous;
        const practiceScores = { ...(previous?.practiceScores ?? {}) };
        for (const [mode, score] of Object.entries(level.practiceScores ?? {})) {
          practiceScores[mode] = Math.max(practiceScores[mode] ?? 0, score);
        }
        const stages: Record<number, StageProgress> = { ...(previous?.stages ?? {}) };
        for (const [stageIndex, stage] of Object.entries(level.stages ?? {})) {
          const index = Number(stageIndex);
          const priorStage = stages[index];
          const gameScores = { ...(priorStage?.gameScores ?? {}) };
          for (const [mode, score] of Object.entries(stage.gameScores ?? {})) {
            gameScores[mode] = Math.max(gameScores[mode] ?? 0, score);
          }
          stages[index] = {
            completed: priorStage?.completed === true || stage.completed === true,
            stars: Math.max(priorStage?.stars ?? 0, stage.stars),
            ...(Object.keys(gameScores).length > 0 ? { gameScores } : {}),
          };
        }
        category[Number(levelIndex)] = {
          completed: previous?.completed === true || level.completed === true,
          stars: Math.max(previous?.stars ?? 0, level.stars),
          ...(mergeCompletionDates(previous?.completedAt, level.completedAt)
            ? { completedAt: mergeCompletionDates(previous?.completedAt, level.completedAt) } : {}),
          ...(bestVocabularyTest?.vocabularyTestQuestionCount ? {
            vocabularyTestBestScore: bestVocabularyTest.vocabularyTestBestScore ?? 0,
            vocabularyTestQuestionCount: bestVocabularyTest.vocabularyTestQuestionCount,
          } : {}),
          ...(Object.keys(practiceScores).length > 0 ? { practiceScores } : {}),
          ...(isArcadeProgressKey(categoryKey) ? {
            arcadeScore: Math.max(previous?.arcadeScore ?? 0, level.arcadeScore ?? 0),
            arcadeXp: Math.max(previous?.arcadeXp ?? 0, level.arcadeXp ?? 0),
            arcadeStars: Math.max(previous?.arcadeStars ?? 0, level.arcadeStars ?? 0),
            ...mergeArcadeMetadata(previous ?? {}, level),
          } : {}),
          ...(Object.keys(stages).length > 0 ? { stages } : {}),
        };
      }
    }
  }

  const currency = { ...existing.currency };
  const starHistory = { ...existing.starHistory };
  for (const language of LANGUAGES) {
    currency[language] = Math.max(
      0,
      existing.currency[language] - arcadeXpTotal(existing.progress, language),
      incoming.currency[language] - arcadeXpTotal(incoming.progress, language),
    ) + arcadeXpTotal(progress, language);
  }
  for (const [date, count] of Object.entries(incoming.starHistory)) {
    starHistory[date] = Math.max(starHistory[date] ?? 0, count);
  }

  const playedDates = [
    ...new Set([
      ...existing.streak.playedDates,
      ...incoming.streak.playedDates,
    ]),
  ].sort();
  const incomingIsLatest =
    (incoming.streak.lastPlayedDate ?? "") >=
    (existing.streak.lastPlayedDate ?? "");
  const currentStreak = incomingIsLatest
    ? incoming.streak.current
    : existing.streak.current;
  const latestPlayedDate = incomingIsLatest
    ? incoming.streak.lastPlayedDate
    : existing.streak.lastPlayedDate;

  let dailyGoal = existing.dailyGoal;
  if (incoming.dailyGoal.date > existing.dailyGoal.date) {
    dailyGoal = incoming.dailyGoal;
  } else if (incoming.dailyGoal.date === existing.dailyGoal.date) {
    dailyGoal = {
      ...incoming.dailyGoal,
      completed: Math.max(
        existing.dailyGoal.completed,
        incoming.dailyGoal.completed,
      ),
      celebrationPending:
        existing.dailyGoal.celebrationPending ||
        incoming.dailyGoal.celebrationPending,
    };
  }

  return {
    progress,
    wordReviews: mergeWordReviews(existing.wordReviews, incoming.wordReviews),
    guidedSentenceReviews: mergeGuidedSentenceReviews(
      existing.guidedSentenceReviews,
      incoming.guidedSentenceReviews,
    ),
    activeLanguage: LANGUAGES.includes(incomingRaw.activeLanguage as Language)
      ? (incomingRaw.activeLanguage as Language)
      : existing.activeLanguage,
    streak: {
      current: currentStreak,
      longest: Math.max(existing.streak.longest, incoming.streak.longest),
      lastPlayedDate: latestPlayedDate,
      playedDates,
    },
    currency,
    starHistory,
    isMuted:
      typeof incomingRaw.isMuted === "boolean"
        ? incomingRaw.isMuted
        : existing.isMuted,
    autoSpeakCorrect:
      typeof incomingRaw.autoSpeakCorrect === "boolean"
        ? incomingRaw.autoSpeakCorrect
        : existing.autoSpeakCorrect,
    earnedBadgeIds: [
      ...new Set([
        ...existing.earnedBadgeIds,
        ...incoming.earnedBadgeIds,
      ]),
    ],
    dailyGoal,
  };
}
