import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { planClassicBestStars } from '@/lib/classic-game-progress';
import {
  getLearnerProgress,
  saveLearnerProgress,
} from '@workspace/api-client-react';
import { Language, type WordPair } from '@/data/vocabulary';
import {
  getDueReviewPairs as buildDueReviewPairs,
  getPracticePairs as buildPracticePairs,
  recordWordAnswer as recordWordReview,
  type WordReviewMap,
} from '@/data/word-reviews';
import {
  getDueGuidedSentences as buildDueGuidedSentences,
  recordGuidedSentenceAnswer as recordGuidedSentenceReview,
  type DueGuidedSentence,
  type GuidedSentenceReviewMap,
} from '@/data/guided-sentence-reviews';
import { trackEvent } from '@/lib/analytics';
import { GUIDED_CATEGORY_ID, GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES } from '@/data/guided-curriculum';
import { countCompletedLearningLevels, planGuidedChestReward } from '@/lib/guided-path-rewards';
import { firstCompletionDate } from '@/lib/completion-dates';
import { isBetterVocabularyTestScore } from '@/lib/vocabulary-test';
import { planArcadeReward, type ArcadeGameId, type ArcadeResult } from '@/lib/arcade-progress';
import { Badge, BADGE_MAP, computeEarnedBadges } from '@/data/badges';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import {
  accountSnapshotKey,
  ACTIVE_ACCOUNT_KEY,
  emptyProgressSnapshot,
  GUEST_SNAPSHOT_KEY,
  mergeProgressSnapshots,
  normalizeProgressSnapshot,
  type Currency,
  type DailyGoalData,
  type LevelProgress,
  type Progress,
  type ProgressSnapshot,
  type StarHistory,
  type StreakData,
} from './progressSnapshot';

export type { Currency, StarHistory } from './progressSnapshot';

const STORAGE_KEY  = '@linguamatch_v2_progress';
const LANGUAGE_KEY = '@linguamatch_v1_language';
const STREAK_KEY   = '@linguamatch_v1_streak';
const CURRENCY_KEY = '@linguamatch_v1_currency';
const MUTE_KEY     = '@linguamatch_v1_muted';
const AUTO_SPEAK_KEY = '@linguamatch_v1_auto_speak_correct';
const STAR_HISTORY_KEY = '@linguamatch_v1_star_history';
const DAILY_GOAL_KEY = '@linguamatch_v1_daily_goal';
const BADGES_KEY   = '@linguamatch_v1_badges';
const WORD_REVIEWS_KEY = '@linguamatch_v1_word_reviews';
const GUIDED_SENTENCE_REVIEWS_KEY = '@linguamatch_v1_guided_sentence_reviews';
interface GameContextType {
  progress: Progress;
  getPracticePairs: (
    categoryId: string,
    levelIndex: number,
    language?: Language,
  ) => WordPair[];
  dueReviewPairs: WordPair[];
  wordReviews: WordReviewMap;
  dueGuidedSentences: DueGuidedSentence[];
  recordWordAnswer: (
    english: string,
    isCorrect: boolean,
    categoryId?: string,
    levelIndex?: number,
    language?: Language,
  ) => void;
  recordGuidedSentenceAnswer: (
    sentence: Pick<DueGuidedSentence, 'sentenceId' | 'english' | 'target'>,
    isCorrect: boolean,
    language?: Language,
  ) => void;
  activeLanguage: Language;
  setLanguage: (lang: Language) => void;
  completeLevel: (
    categoryId: string,
    levelIndex: number,
    stars: number,
    language?: Language,
    stageIndex?: number,
    stageCount?: number,
    stageGameResult?: { mode: string; score: number },
  ) => Promise<void>;
  isLevelUnlocked: (categoryId: string, levelIndex: number) => boolean;
  getLevelStars: (categoryId: string, levelIndex: number) => number;
  isLevelCompleted: (categoryId: string, levelIndex: number) => boolean;
  getLevelPracticeScores: (
    categoryId: string,
    levelIndex: number,
    language?: Language,
  ) => Record<string, number> | undefined;
  recordLevelPracticeScore: (
    categoryId: string,
    levelIndex: number,
    mode: string,
    score: number,
    language: Language,
    ownerId: string | null,
  ) => void;
  getVocabularyTestBestScore: (
    categoryId: string,
    levelIndex: number,
    language?: Language,
  ) => { score: number; total: number } | null;
  saveVocabularyTestBestScore: (
    categoryId: string,
    levelIndex: number,
    score: number,
    total: number,
    language?: Language,
  ) => Promise<{ score: number; total: number; improved: boolean }>;
  claimGuidedChest: (milestoneIndex: number) => Promise<boolean>;
  finishArcadeRound: (game: ArcadeGameId, result: ArcadeResult, language: Language) => Promise<{ bestScore: number; xpEarned: number }>;
  recordClassicBestStars: (mode: string, stars: number, language: Language, ownerId: string | null) => void;
  totalCompleted: number;
  streak: StreakData;
  currency: Currency;
  starHistory: StarHistory;
  isMuted: boolean;
  toggleMute: () => void;
  autoSpeakCorrect: boolean;
  toggleAutoSpeakCorrect: () => void;
  // Badges
  earnedBadgeIds: Set<string>;
  newlyUnlockedBadges: Badge[];
  clearNewBadges: () => void;
  dailyGoal: DailyGoalData;
  setDailyGoal: (goal: number) => void;
  consumeDailyGoalCelebration: () => void;
  cloudSyncStatus: 'local' | 'syncing' | 'synced' | 'error';
  isAccountSignedIn: boolean;
  isProgressReady: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

function makeKey(language: Language, categoryId: string) {
  return `${language}::${categoryId}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_STREAK: StreakData   = { current: 0, longest: 0, lastPlayedDate: null, playedDates: [] };
const DEFAULT_CURRENCY: Currency   = { italian: 0, french: 0, spanish: 0, armenian: 0 };

function defaultDailyGoal(): DailyGoalData {
  return { goal: 2, completed: 0, date: todayStr(), celebrationPending: false };
}

async function readLocalSnapshot(): Promise<ProgressSnapshot> {
  const keys = [
    STORAGE_KEY,
    LANGUAGE_KEY,
    STREAK_KEY,
    CURRENCY_KEY,
    MUTE_KEY,
    AUTO_SPEAK_KEY,
    BADGES_KEY,
    DAILY_GOAL_KEY,
    STAR_HISTORY_KEY,
    WORD_REVIEWS_KEY,
    GUIDED_SENTENCE_REVIEWS_KEY,
  ];
  const values = await AsyncStorage.multiGet(keys);
  const stored = Object.fromEntries(values);
  const parse = (key: string) => {
    const value = stored[key];
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  };
  const snapshot = normalizeProgressSnapshot({
    progress: parse(STORAGE_KEY),
    wordReviews: parse(WORD_REVIEWS_KEY),
    guidedSentenceReviews: parse(GUIDED_SENTENCE_REVIEWS_KEY),
    activeLanguage: stored[LANGUAGE_KEY],
    streak: parse(STREAK_KEY) ?? DEFAULT_STREAK,
    currency: parse(CURRENCY_KEY) ?? DEFAULT_CURRENCY,
    isMuted: stored[MUTE_KEY] === 'true',
    autoSpeakCorrect: stored[AUTO_SPEAK_KEY] !== 'false',
    earnedBadgeIds: parse(BADGES_KEY) ?? [],
    dailyGoal: parse(DAILY_GOAL_KEY) ?? defaultDailyGoal(),
    starHistory: parse(STAR_HISTORY_KEY) ?? {},
  });

  if (snapshot.dailyGoal.date !== todayStr()) {
    snapshot.dailyGoal = {
      ...snapshot.dailyGoal,
      completed: 0,
      date: todayStr(),
      celebrationPending: false,
    };
  }
  return snapshot;
}

async function writeLocalSnapshot(snapshot: ProgressSnapshot) {
  await AsyncStorage.multiSet([
    [STORAGE_KEY, JSON.stringify(snapshot.progress)],
    [LANGUAGE_KEY, snapshot.activeLanguage],
    [STREAK_KEY, JSON.stringify(snapshot.streak)],
    [CURRENCY_KEY, JSON.stringify(snapshot.currency)],
    [MUTE_KEY, String(snapshot.isMuted)],
    [AUTO_SPEAK_KEY, String(snapshot.autoSpeakCorrect)],
    [BADGES_KEY, JSON.stringify(snapshot.earnedBadgeIds)],
    [DAILY_GOAL_KEY, JSON.stringify(snapshot.dailyGoal)],
    [STAR_HISTORY_KEY, JSON.stringify(snapshot.starHistory)],
    [WORD_REVIEWS_KEY, JSON.stringify(snapshot.wordReviews)],
    [GUIDED_SENTENCE_REVIEWS_KEY, JSON.stringify(snapshot.guidedSentenceReviews)],
  ]);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, userId, getToken } = useAuth();
  const [progress,             setProgress]             = useState<Progress>({});
  const [wordReviews,          setWordReviews]          = useState<WordReviewMap>({});
  const [guidedSentenceReviews, setGuidedSentenceReviews] = useState<GuidedSentenceReviewMap>({});
  const [activeLanguage,       setActiveLanguage]       = useState<Language>('italian');
  const [streak,               setStreak]               = useState<StreakData>(DEFAULT_STREAK);
  const [currency,             setCurrency]             = useState<Currency>(DEFAULT_CURRENCY);
  const [starHistory,          setStarHistory]          = useState<StarHistory>({});
  const [isMuted,              setIsMuted]              = useState(false);
  const [autoSpeakCorrect,     setAutoSpeakCorrect]     = useState(true);
  const [earnedBadgeIds,       setEarnedBadgeIds]       = useState<Set<string>>(new Set());
  const [newlyUnlockedBadges,  setNewlyUnlockedBadges]  = useState<Badge[]>([]);
  const [dailyGoal,            setDailyGoalState]       = useState<DailyGoalData>(defaultDailyGoal);
  const [localHydrated, setLocalHydrated] = useState(false);
  const [syncReadyUserId, setSyncReadyUserId] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] =
    useState<GameContextType['cloudSyncStatus']>('local');

  const snapshot = useMemo<ProgressSnapshot>(() => ({
    progress,
    wordReviews,
    guidedSentenceReviews,
    activeLanguage,
    streak,
    currency,
    starHistory,
    isMuted,
    autoSpeakCorrect,
    earnedBadgeIds: [...earnedBadgeIds],
    dailyGoal,
  }), [
    progress,
    wordReviews,
    guidedSentenceReviews,
    activeLanguage,
    streak,
    currency,
    starHistory,
    isMuted,
    autoSpeakCorrect,
    earnedBadgeIds,
    dailyGoal,
  ]);
  const snapshotRef = useRef(snapshot);
  const chestClaimInFlight = useRef(false);
  const accountUserIdRef = useRef<string | null>(userId ?? null);
  snapshotRef.current = snapshot;
  accountUserIdRef.current = userId ?? null;

  const applySnapshot = useCallback(async (value: unknown) => {
    const next = normalizeProgressSnapshot(value);
    await writeLocalSnapshot(next);
    setProgress(next.progress);
    setWordReviews(next.wordReviews);
    setGuidedSentenceReviews(next.guidedSentenceReviews);
    setActiveLanguage(next.activeLanguage);
    setStreak(next.streak);
    setCurrency(next.currency);
    setStarHistory(next.starHistory);
    setIsMuted(next.isMuted);
    setAutoSpeakCorrect(next.autoSpeakCorrect);
    setEarnedBadgeIds(new Set(next.earnedBadgeIds));
    setDailyGoalState(next.dailyGoal);
    return next;
  }, []);

  const getPracticePairs = useCallback(
    (categoryId: string, levelIndex: number, language = activeLanguage) =>
      buildPracticePairs(categoryId, levelIndex, language, wordReviews, progress),
    [activeLanguage, wordReviews, progress],
  );
  const dueReviewPairs = useMemo(
    () => buildDueReviewPairs(activeLanguage, wordReviews, progress),
    [activeLanguage, wordReviews, progress],
  );
  const dueGuidedSentences = useMemo(
    () => buildDueGuidedSentences(guidedSentenceReviews, activeLanguage),
    [guidedSentenceReviews, activeLanguage],
  );

  const recordWordAnswer = useCallback(
    (
      english: string,
      isCorrect: boolean,
      categoryId?: string,
      levelIndex?: number,
      language = activeLanguage,
    ) => {
      setWordReviews(current => {
        const next = recordWordReview(
          current,
          language,
          english,
          isCorrect,
          categoryId,
          levelIndex,
        );
        if (next !== current) {
          AsyncStorage.setItem(WORD_REVIEWS_KEY, JSON.stringify(next)).catch(() => {});
        }
        return next;
      });
    },
    [activeLanguage],
  );

  const recordGuidedSentenceAnswer = useCallback(
    (
      sentence: Pick<DueGuidedSentence, 'sentenceId' | 'english' | 'target'>,
      isCorrect: boolean,
      language = activeLanguage,
    ) => {
      setGuidedSentenceReviews(current => {
        const next = recordGuidedSentenceReview(current, language, sentence, isCorrect);
        if (next !== current) {
          AsyncStorage.setItem(GUIDED_SENTENCE_REVIEWS_KEY, JSON.stringify(next)).catch(() => {});
        }
        return next;
      });
    },
    [activeLanguage],
  );

  // Load existing device progress before deciding whether it belongs to a
  // guest, the active learner, or an account restored from secure auth storage.
  useEffect(() => {
    let cancelled = false;
    void readLocalSnapshot()
      .then(applySnapshot)
      .catch(() => emptyProgressSnapshot())
      .then(() => {
        if (!cancelled) setLocalHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  // Keep guest and account progress isolated on shared devices. Signing in
  // imports guest progress once; switching accounts loads only that learner's
  // saved device/cloud data. Signing out restores the preserved guest snapshot.
  useEffect(() => {
    if (!localHydrated || !authLoaded) return;
    let cancelled = false;

    const syncAccount = async () => {
      const activeAccountId =
        (await AsyncStorage.getItem(ACTIVE_ACCOUNT_KEY)) || null;
      const nextAccountId = userId ?? null;

      if (!nextAccountId) {
        setAuthTokenGetter(null);
        if (activeAccountId) {
          await AsyncStorage.setItem(
            accountSnapshotKey(activeAccountId),
            JSON.stringify(snapshotRef.current),
          );
          const guestData = await AsyncStorage.getItem(GUEST_SNAPSHOT_KEY);
          await applySnapshot(
            guestData ? JSON.parse(guestData) : emptyProgressSnapshot(),
          );
          await AsyncStorage.removeItem(ACTIVE_ACCOUNT_KEY);
        }
        if (!cancelled) {
          setSyncReadyUserId(null);
          setCloudSyncStatus('local');
        }
        return;
      }

      setAuthTokenGetter(() => getToken());
      setCloudSyncStatus('syncing');
      let startingSnapshot = snapshotRef.current;

      if (activeAccountId && activeAccountId !== nextAccountId) {
        await AsyncStorage.setItem(
          accountSnapshotKey(activeAccountId),
          JSON.stringify(startingSnapshot),
        );
        const storedAccountSnapshot = await AsyncStorage.getItem(
          accountSnapshotKey(nextAccountId),
        );
        startingSnapshot = storedAccountSnapshot
          ? normalizeProgressSnapshot(JSON.parse(storedAccountSnapshot))
          : emptyProgressSnapshot();
        await applySnapshot(startingSnapshot);
      } else if (!activeAccountId) {
        // This is the one-time guest-to-account transfer. Preserve the guest
        // copy before a cloud request can fail or the user later signs out.
        await AsyncStorage.setItem(
          GUEST_SNAPSHOT_KEY,
          JSON.stringify(startingSnapshot),
        );
      }

      await AsyncStorage.multiSet([
        [ACTIVE_ACCOUNT_KEY, nextAccountId],
        [accountSnapshotKey(nextAccountId), JSON.stringify(startingSnapshot)],
      ]);

      try {
        const remote = await getLearnerProgress();
        if (cancelled || accountUserIdRef.current !== nextAccountId) return;
        const merged = mergeProgressSnapshots(
          startingSnapshot,
          remote.snapshot,
        );
        const saved = await saveLearnerProgress({
          snapshot: merged as unknown as Record<string, unknown>,
        });
        if (cancelled || accountUserIdRef.current !== nextAccountId) return;
        const finalSnapshot = mergeProgressSnapshots(
          merged,
          saved.snapshot,
        );
        await applySnapshot(finalSnapshot);
        await AsyncStorage.setItem(
          accountSnapshotKey(nextAccountId),
          JSON.stringify(finalSnapshot),
        );
        if (!cancelled) {
          setSyncReadyUserId(nextAccountId);
          setCloudSyncStatus('synced');
        }
      } catch {
        // Keep the learner in the app with local progress intact; foreground
        // re-entry and the next progress change will retry cloud sync.
        if (!cancelled && accountUserIdRef.current === nextAccountId) {
          setSyncReadyUserId(nextAccountId);
          setCloudSyncStatus('error');
        }
      }
    };

    void syncAccount().catch(() => {
      if (!cancelled) setCloudSyncStatus(userId ? 'error' : 'local');
    });
    return () => {
      cancelled = true;
    };
  }, [localHydrated, authLoaded, userId, getToken, applySnapshot]);

  const refreshCloudProgress = useCallback(async () => {
    if (!userId || syncReadyUserId !== userId) return;
    setCloudSyncStatus('syncing');
    try {
      const remote = await getLearnerProgress();
      if (accountUserIdRef.current !== userId) return;
      const merged = mergeProgressSnapshots(
        remote.snapshot,
        snapshotRef.current,
      );
      const saved = await saveLearnerProgress({
        snapshot: merged as unknown as Record<string, unknown>,
      });
      if (accountUserIdRef.current !== userId) return;
      const latest = mergeProgressSnapshots(
        saved.snapshot,
        snapshotRef.current,
      );
      if (JSON.stringify(latest) !== JSON.stringify(snapshotRef.current)) {
        await applySnapshot(latest);
      }
      await AsyncStorage.setItem(
        accountSnapshotKey(userId),
        JSON.stringify(latest),
      );
      setCloudSyncStatus('synced');
    } catch {
      if (accountUserIdRef.current === userId) {
        setCloudSyncStatus('error');
      }
    }
  }, [userId, syncReadyUserId, applySnapshot]);

  // Send local changes after a short pause and pull remote changes whenever a
  // learner returns to the app on another device.
  useEffect(() => {
    if (!userId || syncReadyUserId !== userId) return;
    const timer = setTimeout(() => {
      setCloudSyncStatus('syncing');
      void saveLearnerProgress({
        snapshot: snapshot as unknown as Record<string, unknown>,
      }).then(async (saved) => {
        if (accountUserIdRef.current !== userId) return;
        const latest = mergeProgressSnapshots(
          saved.snapshot,
          snapshotRef.current,
        );
        if (JSON.stringify(latest) !== JSON.stringify(snapshotRef.current)) {
          await applySnapshot(latest);
        }
        await AsyncStorage.setItem(
          accountSnapshotKey(userId),
          JSON.stringify(latest),
        );
        setCloudSyncStatus('synced');
      }).catch(() => {
        if (accountUserIdRef.current === userId) {
          setCloudSyncStatus('error');
        }
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [snapshot, userId, syncReadyUserId, applySnapshot]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshCloudProgress();
    });
    return () => subscription.remove();
  }, [refreshCloudProgress]);

  const setDailyGoal = useCallback((goal: number) => {
    const safeGoal = Math.max(1, Math.min(5, Math.round(goal)));
    setDailyGoalState(prev => {
      const today = todayStr();
      const completed = prev.date === today ? prev.completed : 0;
      const updated: DailyGoalData = {
        goal: safeGoal,
        completed,
        date: today,
        celebrationPending: completed >= safeGoal && (prev.goal !== safeGoal || prev.date !== today),
      };
      AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const consumeDailyGoalCelebration = useCallback(() => {
    setDailyGoalState(prev => {
      if (!prev.celebrationPending) return prev;
      const updated = { ...prev, celebrationPending: false };
      AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // ── Mute ──────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      AsyncStorage.setItem(MUTE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleAutoSpeakCorrect = useCallback(() => {
    setAutoSpeakCorrect(previous => {
      const next = !previous;
      AsyncStorage.setItem(AUTO_SPEAK_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  // ── Language ──────────────────────────────────────────────────────────────
  const setLanguage = useCallback((lang: Language) => {
    setActiveLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
    trackEvent('language_selected', { language: lang });
  }, []);

  // ── Clear new badges (called by results screen after showing celebration) ──
  const clearNewBadges = useCallback(() => {
    setNewlyUnlockedBadges([]);
  }, []);

  // ── Complete level ────────────────────────────────────────────────────────
  const claimGuidedChest = useCallback(async (milestoneIndex: number) => {
    if (chestClaimInFlight.current || !localHydrated || (userId && syncReadyUserId !== userId)) return false;
    const accountAtStart = accountUserIdRef.current;
    const current = snapshotRef.current;
    const reward = planGuidedChestReward({
      progress: current.progress,
      currency: current.currency,
      language: activeLanguage,
      milestoneIndex,
      milestoneCount: GUIDED_MILESTONES.length,
      levelsPerMilestone: GUIDED_LEVELS_PER_MILESTONE,
      lessonCategoryId: GUIDED_CATEGORY_ID,
    });
    if (!reward) return false;
    chestClaimInFlight.current = true;
    try {
      const next = { ...current, progress: reward.progress, currency: reward.currency };
      // Persist the reward marker and balance together, including the account/guest
      // snapshot read on reload. The existing cloud snapshot effect syncs the ledger.
      await AsyncStorage.multiSet([
        [STORAGE_KEY, JSON.stringify(reward.progress)],
        [CURRENCY_KEY, JSON.stringify(reward.currency)],
        [accountAtStart ? accountSnapshotKey(accountAtStart) : GUEST_SNAPSHOT_KEY, JSON.stringify(next)],
      ]);
      if (accountUserIdRef.current !== accountAtStart) return false;
      snapshotRef.current = next;
      setProgress(reward.progress);
      setCurrency(reward.currency);
      return true;
    } finally {
      chestClaimInFlight.current = false;
    }
  }, [activeLanguage, localHydrated, syncReadyUserId, userId]);

  const finishArcadeRound = useCallback(async (game: ArcadeGameId, result: ArcadeResult, language: Language) => {
    if (chestClaimInFlight.current || !localHydrated || (userId && syncReadyUserId !== userId)) {
      throw new Error('Progress is still loading or saving. Please try again.');
    }
    const accountAtStart = accountUserIdRef.current;
    if (accountAtStart !== (userId ?? null) || language !== activeLanguage) throw new Error('Your learner or language changed. Please restart the game.');
    const current = snapshotRef.current;
    const reward = planArcadeReward(current.progress, current.currency, language, game, result, {
      categoryId: GUIDED_CATEGORY_ID, levelsPerMilestone: GUIDED_LEVELS_PER_MILESTONE, milestoneCount: GUIDED_MILESTONES.length,
    });
    if (reward.progress === current.progress) return { bestScore: reward.bestScore, xpEarned: 0 };
    chestClaimInFlight.current = true;
    try {
      const newBossBadge = game === 'boss-battle' && result.won === true && !current.earnedBadgeIds.includes('boss_champion');
      const earnedBadgeIds = newBossBadge ? [...current.earnedBadgeIds, 'boss_champion'] : current.earnedBadgeIds;
      const next = { ...current, progress: reward.progress, currency: reward.currency, earnedBadgeIds };
      await AsyncStorage.multiSet([
        [STORAGE_KEY, JSON.stringify(reward.progress)],
        [CURRENCY_KEY, JSON.stringify(reward.currency)],
        [BADGES_KEY, JSON.stringify(earnedBadgeIds)],
        [accountAtStart ? accountSnapshotKey(accountAtStart) : GUEST_SNAPSHOT_KEY, JSON.stringify(next)],
      ]);
      if (accountUserIdRef.current !== accountAtStart) throw new Error('Your account changed before the result was saved.');
      snapshotRef.current = next;
      setProgress(reward.progress);
      setCurrency(reward.currency);
      if (newBossBadge) {
        setEarnedBadgeIds(new Set(earnedBadgeIds));
        setNewlyUnlockedBadges([BADGE_MAP.boss_champion]);
      }
      return { bestScore: reward.bestScore, xpEarned: reward.xpEarned };
    } finally { chestClaimInFlight.current = false; }
  }, [activeLanguage, localHydrated, syncReadyUserId, userId]);

  const completeLevel = useCallback(
    async (
      categoryId: string,
      levelIndex: number,
      stars: number,
      language = activeLanguage,
      stageIndex?: number,
      stageCount?: number,
      stageGameResult?: { mode: string; score: number },
    ) => {
      const key = makeKey(language, categoryId);
      const categoryProgress = progress[key] ?? {};
      const existing = categoryProgress[levelIndex];
      const isStageCompletion =
        Number.isInteger(stageIndex) &&
        stageIndex! >= 0 &&
        Number.isInteger(stageCount) &&
        stageCount! > 0 &&
        stageIndex! < stageCount!;
      let levelCompleted = true;
      let newlyCompletedLevel = !existing?.completed;
      let parentStars = stars;
      let progressChanged = !(existing?.completed && existing.stars >= stars);
      const existingVocabularyTest = existing?.vocabularyTestQuestionCount
        ? {
            vocabularyTestBestScore: existing.vocabularyTestBestScore ?? 0,
            vocabularyTestQuestionCount: existing.vocabularyTestQuestionCount,
          }
        : {};
      const existingPracticeScores = existing?.practiceScores
        ? { practiceScores: existing.practiceScores }
        : {};
      let nextLevelProgress: LevelProgress = {
        completed: true,
        stars,
        ...(existing?.stages ? { stages: existing.stages } : {}),
        ...existingVocabularyTest,
        ...existingPracticeScores,
      };

      if (isStageCompletion) {
        const stageProgress = { ...(existing?.stages ?? {}) };
        const previousStage = stageProgress[stageIndex!];
        const stageStars = Math.max(previousStage?.stars ?? 0, stars);
        const gameScores = { ...(previousStage?.gameScores ?? {}) };
        let improvedGameScore = false;
        if (
          stageGameResult &&
          typeof stageGameResult.mode === 'string' &&
          stageGameResult.mode.length > 0 &&
          Number.isFinite(stageGameResult.score)
        ) {
          const score = Math.round(Math.max(0, Math.min(100, stageGameResult.score)) * 10) / 10;
          if (gameScores[stageGameResult.mode] === undefined || score > gameScores[stageGameResult.mode]) {
            gameScores[stageGameResult.mode] = score;
            improvedGameScore = true;
          }
        }
        progressChanged =
          !previousStage?.completed ||
          stageStars > (previousStage?.stars ?? 0) ||
          improvedGameScore;
        stageProgress[stageIndex!] = {
          completed: true,
          stars: stageStars,
          ...(Object.keys(gameScores).length > 0 ? { gameScores } : {}),
        };
        levelCompleted =
          existing?.completed === true ||
          Array.from({ length: stageCount! }, (_, index) =>
            stageProgress[index]?.completed === true,
          ).every(Boolean);
        newlyCompletedLevel = levelCompleted && !existing?.completed;
        const completedStageStars = Array.from(
          { length: stageCount! },
          (_, index) => stageProgress[index]?.stars,
        );
        parentStars = levelCompleted
          ? Math.max(
              existing?.stars ?? 0,
              Math.min(...completedStageStars.filter((value): value is number => typeof value === 'number')),
            )
          : existing?.stars ?? 0;
        progressChanged =
          progressChanged ||
          (levelCompleted && (!existing?.completed || parentStars > (existing?.stars ?? 0)));
        nextLevelProgress = {
          completed: levelCompleted,
          stars: parentStars,
          stages: stageProgress,
          ...existingVocabularyTest,
          ...existingPracticeScores,
        };

        trackEvent('vocabulary_stage_completed', {
          category: categoryId,
          language,
          level: levelIndex + 1,
          stage: stageIndex! + 1,
          stageCount: stageCount!,
        });
      }

      if (categoryId === GUIDED_CATEGORY_ID) {
        const completedAt = firstCompletionDate(existing, levelCompleted);
        if (completedAt) nextLevelProgress.completedAt = completedAt;
      }

      if (
        levelCompleted &&
        (!existing?.completed || parentStars > (existing?.stars ?? 0))
      ) {
        trackEvent('level_completed', {
          category: categoryId,
          language,
          level: levelIndex + 1,
          stars: parentStars,
        });
      }

      const updatedProgress: Progress = progressChanged
        ? {
            ...progress,
            [key]: { ...categoryProgress, [levelIndex]: nextLevelProgress },
          }
        : progress;

      // Do not leave the completion screen until the unlock/progress record is durable.
      if (progressChanged) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
        setProgress(current => {
          // A classic result can arrive while the lesson's durable save is pending.
          const combined = { ...updatedProgress };
          for (const [key, levels] of Object.entries(current)) {
            if (key.includes('::arcade:classic-') && (levels[0]?.arcadeScore ?? -1) > (combined[key]?.[0]?.arcadeScore ?? -1)) combined[key] = levels;
          }
          if (current !== progress) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(combined)).catch(() => {});
          return combined;
        });
      }

      // Award currency and weekly stars only for a new personal best.
      const prevStars = existing?.stars ?? 0;
      const earned = levelCompleted ? Math.max(0, parentStars - prevStars) : 0;
      if (earned > 0) {
        setStarHistory(history => {
          const today = todayStr();
          const updated = { ...history, [today]: (history[today] ?? 0) + earned };
          AsyncStorage.setItem(STAR_HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
        setCurrency(current => {
          const updated = { ...current, [language]: current[language] + earned };
          AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }

      if (newlyCompletedLevel) {
        setDailyGoalState(current => {
          const today = todayStr();
          const completed = current.date === today ? current.completed + 1 : 1;
          const updated: DailyGoalData = {
            ...current,
            completed,
            date: today,
            celebrationPending:
              current.celebrationPending ||
              completed === current.goal,
          };
          AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }

      // Streak
      const today = todayStr();
      const playedDates = streak.playedDates ?? [];
      const updatedStreak: StreakData = streak.lastPlayedDate === today
        ? {
            ...streak,
            playedDates: playedDates.includes(today) ? playedDates : [...playedDates, today],
          }
        : {
            current: streak.lastPlayedDate === yesterdayStr() ? streak.current + 1 : 1,
            longest: Math.max(
              streak.lastPlayedDate === yesterdayStr() ? streak.current + 1 : 1,
              streak.longest,
            ),
            lastPlayedDate: today,
            playedDates: playedDates.includes(today) ? playedDates : [...playedDates, today],
          };
      setStreak(updatedStreak);
      AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updatedStreak)).catch(() => {});

      // ── Badge check (runs after state setters schedule but before re-render) ──
      // We pass the computed values directly to avoid reading stale state.
      const newEarned = computeEarnedBadges(updatedProgress, updatedStreak);
      const justUnlocked = [...newEarned].filter(id => !earnedBadgeIds.has(id));
      setEarnedBadgeIds(newEarned);

      if (justUnlocked.length > 0) {
        AsyncStorage.setItem(BADGES_KEY, JSON.stringify([...newEarned])).catch(() => {});
        import('@/data/badges').then(({ BADGE_MAP }) => {
          const badges = justUnlocked.map(id => BADGE_MAP[id]).filter(Boolean);
          if (badges.length > 0) setNewlyUnlockedBadges(badges);
        });
      }
    },
    [activeLanguage, progress, streak, starHistory, currency, dailyGoal, earnedBadgeIds],
  );

  const recordClassicBestStars = useCallback((mode: string, stars: number, language: Language, ownerId: string | null) => {
    if (!localHydrated || (userId && syncReadyUserId !== userId) || ownerId !== (userId ?? null) || accountUserIdRef.current !== ownerId || language !== activeLanguage) return;
    setProgress(current => {
      if (accountUserIdRef.current !== ownerId) return current;
      const next = planClassicBestStars(current, language, mode, stars);
      if (next !== current) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [activeLanguage, localHydrated, userId, syncReadyUserId]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isLevelUnlocked = useCallback(
    (_categoryId: string, _levelIndex: number) => true,
    [],
  );

  const getLevelStars = useCallback(
    (categoryId: string, levelIndex: number) =>
      progress[makeKey(activeLanguage, categoryId)]?.[levelIndex]?.stars ?? 0,
    [progress, activeLanguage],
  );

  const isLevelCompleted = useCallback(
    (categoryId: string, levelIndex: number) =>
      progress[makeKey(activeLanguage, categoryId)]?.[levelIndex]?.completed === true,
    [progress, activeLanguage],
  );

  const getLevelPracticeScores = useCallback(
    (categoryId: string, levelIndex: number, language = activeLanguage) =>
      progress[makeKey(language, categoryId)]?.[levelIndex]?.practiceScores,
    [progress, activeLanguage],
  );

  const recordLevelPracticeScore = useCallback((
    categoryId: string,
    levelIndex: number,
    mode: string,
    score: number,
    language: Language,
    ownerId: string | null,
  ) => {
    if (
      !localHydrated ||
      (userId && syncReadyUserId !== userId) ||
      ownerId !== (userId ?? null) ||
      accountUserIdRef.current !== ownerId ||
      language !== activeLanguage ||
      !Number.isInteger(levelIndex) ||
      levelIndex < 0 ||
      !/^[a-z][a-z0-9-]*$/i.test(mode) ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100
    ) return;

    const normalizedScore = Math.round(score * 10) / 10;
    const key = makeKey(language, categoryId);
    setProgress(current => {
      if (accountUserIdRef.current !== ownerId) return current;
      const categoryProgress = current[key] ?? {};
      const existingLevel = categoryProgress[levelIndex];
      const existingScore = existingLevel?.practiceScores?.[mode];
      if (typeof existingScore === 'number' && existingScore >= normalizedScore) return current;

      const updatedProgress: Progress = {
        ...current,
        [key]: {
          ...categoryProgress,
          [levelIndex]: {
            ...(existingLevel ?? { completed: false, stars: 0 }),
            practiceScores: {
              ...(existingLevel?.practiceScores ?? {}),
              [mode]: normalizedScore,
            },
          },
        },
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress)).catch(() => {});
      return updatedProgress;
    });
  }, [activeLanguage, localHydrated, syncReadyUserId, userId]);

  const getVocabularyTestBestScore = useCallback(
    (categoryId: string, levelIndex: number, language = activeLanguage) => {
      const level = progress[makeKey(language, categoryId)]?.[levelIndex];
      if (!level?.vocabularyTestQuestionCount) return null;
      return {
        score: level.vocabularyTestBestScore ?? 0,
        total: level.vocabularyTestQuestionCount,
      };
    },
    [progress, activeLanguage],
  );

  const saveVocabularyTestBestScore = useCallback(
    async (
      categoryId: string,
      levelIndex: number,
      score: number,
      total: number,
      language = activeLanguage,
    ) => {
      if (!localHydrated) throw new Error('Learning progress is still loading.');
      if (!Number.isInteger(levelIndex) || levelIndex < 0 || !Number.isInteger(total) || total <= 0) {
        throw new Error('This vocabulary test could not be saved.');
      }

      const safeScore = Math.min(total, Math.max(0, Math.round(score * 2) / 2));
      const key = makeKey(language, categoryId);
      const currentLevel = progress[key]?.[levelIndex];
      if (!currentLevel?.completed) {
        throw new Error('Complete this vocabulary level before taking its test.');
      }
      const currentScore = currentLevel?.vocabularyTestBestScore;
      const currentTotal = currentLevel?.vocabularyTestQuestionCount;
      const improved = isBetterVocabularyTestScore(
        safeScore,
        total,
        currentScore,
        currentTotal,
      );

      if (improved) {
        const updatedProgress: Progress = {
          ...progress,
          [key]: {
            ...(progress[key] ?? {}),
            [levelIndex]: {
              ...(currentLevel ?? { completed: true, stars: 0 }),
              vocabularyTestBestScore: safeScore,
              vocabularyTestQuestionCount: total,
            },
          },
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
        setProgress(updatedProgress);
        return { score: safeScore, total, improved: true };
      }

      return {
        score: currentScore ?? 0,
        total: currentTotal ?? total,
        improved: false,
      };
    },
    [activeLanguage, localHydrated, progress],
  );

  const totalCompleted = countCompletedLearningLevels(progress);

  return (
    <GameContext.Provider value={{
      progress, getPracticePairs, dueReviewPairs, dueGuidedSentences, wordReviews,
      recordWordAnswer, recordGuidedSentenceAnswer, activeLanguage, setLanguage,
      completeLevel, isLevelUnlocked, getLevelStars, isLevelCompleted,
      getLevelPracticeScores, recordLevelPracticeScore,
      getVocabularyTestBestScore, saveVocabularyTestBestScore,
      claimGuidedChest, finishArcadeRound, recordClassicBestStars,
      totalCompleted, streak, currency, starHistory,
       isMuted, toggleMute, autoSpeakCorrect, toggleAutoSpeakCorrect,
      earnedBadgeIds, newlyUnlockedBadges, clearNewBadges,
      dailyGoal, setDailyGoal, consumeDailyGoalCelebration,
      cloudSyncStatus,
      isAccountSignedIn: Boolean(userId),
      isProgressReady: localHydrated && authLoaded && (!userId || syncReadyUserId === userId),
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
