import React, { useCallback, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { WordCard } from '@/components/WordCard';
import { CATEGORIES, LANGUAGE_META } from '@/data/vocabulary';
import { getCategoryGeneralPairs } from '@/data/word-reviews';
import { getEarlyArmenianReading } from '@/data/armenian-transliteration';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';
import { buildWordBatches, shouldReverseReviewRound, type WordBatch } from '@/lib/match-game';
import {
  completeGeneralVocabularyStage,
  getGeneralVocabularyReturnPath,
  resolveGeneralVocabularySession,
} from '@/lib/general-vocabulary-session';
import { usePreloadSpeech } from '@/components/SpeakerButton';

const MAX_HEARTS = 5;
const WRONG_FEEDBACK_DURATION_MS = 350;
const MATCH_BATCH_TRANSITION_MS = 160;
const RESULT_NAVIGATION_SETTLE_MS = 120;

// ─── Main game screen ─────────────────────────────────────────────────────────
export default function GameScreen() {
  const colors = useColors();
  const {
    categoryId,
    levelIndex: liStr,
    review: reviewParam,
    allCategory: allCategoryParam,
    generalStage: generalStageParam,
    allWords: allWordsParam,
    randomBatch: randomBatchParam,
    batchIndices,
    stageIndex: stageIndexParam,
    returnTo,
  } = useLocalSearchParams<{
    categoryId: string;
    levelIndex: string;
    review?: string;
    allCategory?: string;
    generalStage?: string;
    allWords?: string;
    randomBatch?: string;
    batchIndices?: string;
    stageIndex?: string;
    returnTo?: string;
  }>();
  const isDedicatedReview = reviewParam === '1';
  const isCategoryGeneral = allCategoryParam === '1';
  const isGeneralStage = generalStageParam === '1';
  const isRandomBatch = allWordsParam === '1' && randomBatchParam === '1';
  const isGeneralSession = isGeneralStage || isRandomBatch;
  const levelIndex = parseInt(liStr ?? '0', 10);
  const stageIndex = Number.parseInt(stageIndexParam ?? '', 10);
  const insets     = useSafeAreaInsets();
  const {
    completeLevel,
    activeLanguage,
    getLevelStars,
    getPracticePairs,
    dueReviewPairs,
    recordWordAnswer,
    isMuted,
    toggleMute,
    autoSpeakCorrect,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('match');
  const { playMatchCorrect, playWrong, speak, speakCorrectAnswer } = useSound();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const category  = CATEGORIES.find(c => c.id === categoryId);
  const [wordPairs] = useState(() =>
    isGeneralSession
      ? resolveGeneralVocabularySession({
          generalStage: generalStageParam,
          allWords: allWordsParam,
          randomBatch: randomBatchParam,
          batchIndices,
          levelIndex: liStr,
          stageIndex: stageIndexParam,
        }, activeLanguage)?.pairs ?? []
      : isDedicatedReview
      ? dueReviewPairs
      : isCategoryGeneral
        ? getCategoryGeneralPairs(categoryId ?? '', dueReviewPairs)
        : getPracticePairs(categoryId ?? '', levelIndex),
  );
  usePreloadSpeech(wordPairs.map(pair => pair.translations[activeLanguage]), activeLanguage);
  const reviewWordCount = wordPairs.filter(pair => pair.isReview).length;
  const langMeta  = LANGUAGE_META[activeLanguage];

  // Keep every lesson/review word, but only render a touch-friendly batch at once.
  const [mainBatches] = useState(() =>
    buildWordBatches(wordPairs.map((_, id) => id), wordPairs, activeLanguage),
  );
  const [mainBatchIndex, setMainBatchIndex] = useState(0);

  // ── Game phase ─────────────────────────────────────────────────────────────
  // 'main'   – standard play through all pairs
  // 'review' – retry the pairs that were answered wrong at least once
  const [phase, setPhase]           = useState<'main' | 'review'>('main');
  const [reviewBatches, setReviewBatches] = useState<WordBatch[]>([]);
  const [reviewBatchIndex, setReviewBatchIndex] = useState(0);
  const [reviewRoundIds, setReviewRoundIds] = useState<number[]>([]);
  const [reviewTargetIds, setReviewTargetIds] = useState<number[]>([]);

  // Derived: which word lists are currently active
  const activeBatch = phase === 'main'
    ? mainBatches[mainBatchIndex]
    : reviewBatches[reviewBatchIndex];
  const activeLeft = activeBatch?.left ?? [];
  const activeRight = activeBatch?.right ?? [];
  const isReversedBatch = activeBatch?.reversed ?? false;

  // ── Shared selection/error state (reset on phase transition) ───────────────
  const [selectedLeftIdx,  setSelectedLeftIdx]  = useState<number | null>(null);
  const [selectedRightIdx, setSelectedRightIdx] = useState<number | null>(null);
  const [errorLeftIdx,     setErrorLeftIdx]     = useState<number | null>(null);
  const [errorRightIdx,    setErrorRightIdx]    = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // ── Matched sets (separate per phase) ─────────────────────────────────────
  const [matchedIds,       setMatchedIds]       = useState<Set<number>>(new Set()); // main
  const [reviewMatchedIds, setReviewMatchedIds] = useState<Set<number>>(new Set()); // review
  const [reviewCorrectCounts, setReviewCorrectCounts] = useState<Record<number, number>>({});
  const reviewMatchedIdsRef = useRef<Set<number>>(new Set());
  const reviewCorrectCountsRef = useRef<Record<number, number>>({});
  const reviewRoundNumberRef = useRef(0);

  const activeMatchedIds = phase === 'main' ? matchedIds : reviewMatchedIds;

  // ── Tracking ───────────────────────────────────────────────────────────────
  const [mainMistakes,     setMainMistakes]     = useState(0);
  const [incorrectPairIds, setIncorrectPairIds] = useState<Set<number>>(new Set());
  //   ^ pair IDs (= word pair index) that were ever involved in a wrong attempt
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const [reviewSessionComplete, setReviewSessionComplete] = useState(false);
  const [retryMistakes, setRetryMistakes] = useState(0);
  const completionInProgressRef = useRef(false);
  const batchTransitionPendingRef = useRef(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (isGeneralSession && router.canGoBack()) {
      router.back();
    } else if (isGeneralSession) {
      router.replace(getGeneralVocabularyReturnPath(returnTo, levelIndex) as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(isDedicatedReview
        ? '/mistake-review' as any
        : categoryId
          ? `/levels?categoryId=${categoryId}`
          : '/categories');
    }
  }, [categoryId, isDedicatedReview, isGeneralSession, returnTo, levelIndex]);

  React.useEffect(() => {
    if (isDedicatedReview && wordPairs.length === 0) {
      setReviewSessionComplete(true);
    }
  }, [isDedicatedReview, wordPairs.length]);

  const endGame = useCallback(
    (mistakes: number) => {
      if (completionInProgressRef.current) return;
      completionInProgressRef.current = true;

      if (isDedicatedReview || isCategoryGeneral) {
        reportClassic(mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
        setReviewSessionComplete(true);
        return;
      }
      if (isRandomBatch) {
        reportClassic(mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
        setReviewSessionComplete(true);
        return;
      }
      if (isGeneralStage) {
        setRetryMistakes(mistakes);
        setCompletionError(false);
        setIsSavingCompletion(true);
        void completeGeneralVocabularyStage(
          completeLevel,
          levelIndex,
          stageIndex,
          mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1,
          activeLanguage,
          'game',
        ).then(() => setReviewSessionComplete(true)).catch(() => {
          completionInProgressRef.current = false;
          setCompletionError(true);
        }).finally(() => setIsSavingCompletion(false));
        return;
      }

      const stars     = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      const prevStars = getLevelStars(categoryId!, levelIndex);
      const earned    = Math.max(0, stars - prevStars);
      const hasNextLevel = levelIndex + 1 < (category?.levels.length ?? 0);
      setRetryMistakes(mistakes);
      setCompletionError(false);
      setIsSavingCompletion(true);

      void (async () => {
        try {
          await completeLevel(categoryId!, levelIndex, stars);
          reportClassic(stars);
          setTimeout(() => {
            router.replace(
              `/results?categoryId=${categoryId}&levelIndex=${levelIndex}&stars=${stars}&mistakes=${mistakes}&earned=${earned}&language=${activeLanguage}&autoAdvance=${hasNextLevel ? '1' : '0'}`,
            );
          }, RESULT_NAVIGATION_SETTLE_MS);
        } catch {
          completionInProgressRef.current = false;
          setCompletionError(true);
        } finally {
          setIsSavingCompletion(false);
        }
      })();
    },
    [category, categoryId, levelIndex, completeLevel, getLevelStars, activeLanguage, isDedicatedReview, isCategoryGeneral, isRandomBatch, isGeneralStage, stageIndex],
  );

  const startReviewPhase = useCallback(
    (errorIds: Set<number>, isFirstReview = false) => {
      batchTransitionPendingRef.current = false;
      const ids = [...errorIds];
      if (isFirstReview) reviewRoundNumberRef.current = 0;
      reviewRoundNumberRef.current += 1;
      // Every second recall round flips the columns so learners retrieve from both directions.
      const reverseDirection = shouldReverseReviewRound(reviewRoundNumberRef.current);
      setReviewRoundIds(ids);
      setReviewBatches(buildWordBatches(
        ids,
        wordPairs,
        activeLanguage,
        reverseDirection,
        wordPairs.map((_, id) => id),
      ));
      setReviewBatchIndex(0);
      if (isFirstReview) setReviewTargetIds(ids);
      reviewMatchedIdsRef.current = new Set();
      setReviewMatchedIds(reviewMatchedIdsRef.current);
      setSelectedLeftIdx(null);
      setSelectedRightIdx(null);
      setErrorLeftIdx(null);
      setErrorRightIdx(null);
      setPhase('review');
    },
    [wordPairs, activeLanguage],
  );

  // ── Core match logic ───────────────────────────────────────────────────────
  const checkMatch = useCallback(
    (leftIdx: number, rightIdx: number) => {
      const leftItem  = activeLeft[leftIdx];
      const rightItem = activeRight[rightIdx];

      if (leftItem.id === rightItem.id) {
        // ✅ Correct
        recordWordAnswer(
          wordPairs[leftItem.id].english,
          true,
          isDedicatedReview || isGeneralSession ? undefined : categoryId,
          isDedicatedReview || isCategoryGeneral || isGeneralSession ? undefined : levelIndex,
          activeLanguage,
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playMatchCorrect();
        speakCorrectAnswer(wordPairs[leftItem.id].translations[activeLanguage], activeLanguage);
        setSelectedLeftIdx(null);
        setSelectedRightIdx(null);

        if (phase === 'main') {
          setMatchedIds(prev => {
            const next = new Set([...prev, leftItem.id]);
            if (
              activeLeft.every(item => next.has(item.id)) &&
              !batchTransitionPendingRef.current
            ) {
              batchTransitionPendingRef.current = true;
              // Advance to the next screen-sized set, then review or end.
              setTimeout(() => {
                if (mainBatchIndex + 1 < mainBatches.length) {
                  setMainBatchIndex(current => current + 1);
                  batchTransitionPendingRef.current = false;
                } else {
                  batchTransitionPendingRef.current = false;
                  setIncorrectPairIds(currentErrors => {
                    if (currentErrors.size > 0) {
                      startReviewPhase(currentErrors, true);
                    } else {
                      endGame(mainMistakes);
                    }
                    return currentErrors;
                  });
                }
              }, MATCH_BATCH_TRANSITION_MS);
            }
            return next;
          });
        } else {
          // A missed pair must be matched correctly three times in total.
          // Wrong review attempts don't erase successful matches.
          if (reviewMatchedIdsRef.current.has(leftItem.id)) return;

          const nextCounts = {
            ...reviewCorrectCountsRef.current,
            [leftItem.id]: (reviewCorrectCountsRef.current[leftItem.id] ?? 0) + 1,
          };
          reviewCorrectCountsRef.current = nextCounts;
          setReviewCorrectCounts(nextCounts);

          const nextMatched = new Set(reviewMatchedIdsRef.current);
          nextMatched.add(leftItem.id);
          reviewMatchedIdsRef.current = nextMatched;
          setReviewMatchedIds(nextMatched);

          if (
            nextMatched.size === activeLeft.length &&
            !batchTransitionPendingRef.current
          ) {
            batchTransitionPendingRef.current = true;
            setTimeout(() => {
              if (reviewBatchIndex + 1 < reviewBatches.length) {
                reviewMatchedIdsRef.current = new Set();
                setReviewMatchedIds(reviewMatchedIdsRef.current);
                setReviewBatchIndex(current => current + 1);
                batchTransitionPendingRef.current = false;
              } else {
                batchTransitionPendingRef.current = false;
                const remainingIds = new Set(
                  reviewRoundIds.filter(id => (nextCounts[id] ?? 0) < 3),
                );
                if (remainingIds.size > 0) {
                  startReviewPhase(remainingIds);
                } else {
                  endGame(mainMistakes);
                }
              }
            }, MATCH_BATCH_TRANSITION_MS);
          }
        }
      } else {
        // ❌ Wrong
        recordWordAnswer(
          wordPairs[leftItem.id].english,
          false,
          isDedicatedReview || isGeneralSession ? undefined : categoryId,
          isDedicatedReview || isCategoryGeneral || isGeneralSession ? undefined : levelIndex,
          activeLanguage,
        );
        recordWordAnswer(
          wordPairs[rightItem.id].english,
          false,
          isDedicatedReview ? undefined : categoryId,
          isDedicatedReview || isCategoryGeneral ? undefined : levelIndex,
          activeLanguage,
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playWrong();
        if (phase === 'main') {
          setMainMistakes(m => m + 1);
          setIncorrectPairIds(prev => {
            const next = new Set(prev);
            next.add(leftItem.id);
            next.add(rightItem.id);
            return next;
          });
        }
        setErrorLeftIdx(leftIdx);
        setErrorRightIdx(rightIdx);
        setIsChecking(true);
        setTimeout(() => {
          setErrorLeftIdx(null);
          setErrorRightIdx(null);
          setSelectedLeftIdx(null);
          setSelectedRightIdx(null);
          setIsChecking(false);
        }, WRONG_FEEDBACK_DURATION_MS);
      }
    },
    [
      activeLeft,
      activeRight,
      phase,
      mainBatches,
      mainBatchIndex,
      reviewBatches,
      reviewBatchIndex,
      reviewRoundIds,
      wordPairs,
      mainMistakes,
      endGame,
      startReviewPhase,
      recordWordAnswer,
      playMatchCorrect,
      playWrong,
      speakCorrectAnswer,
      categoryId,
      levelIndex,
      isCategoryGeneral,
      isGeneralSession,
      activeLanguage,
    ],
  );

  const handleLeftPress = useCallback(
    (idx: number) => {
      if (isChecking || activeMatchedIds.has(activeLeft[idx].id)) return;
      if (isReversedBatch && !autoSpeakCorrect) speak(activeLeft[idx].word, activeLanguage);
      const newIdx = selectedLeftIdx === idx ? null : idx;
      setSelectedLeftIdx(newIdx);
      if (newIdx !== null && selectedRightIdx !== null) checkMatch(newIdx, selectedRightIdx);
    },
    [
      isChecking,
      activeMatchedIds,
      activeLeft,
      selectedLeftIdx,
      selectedRightIdx,
      checkMatch,
      isReversedBatch,
      autoSpeakCorrect,
      speak,
      activeLanguage,
    ],
  );

  const handleRightPress = useCallback(
    (idx: number) => {
      if (isChecking || activeMatchedIds.has(activeRight[idx].id)) return;
      // Speak the foreign word so kids hear pronunciation
      if (!autoSpeakCorrect && !isReversedBatch) speak(activeRight[idx].word, activeLanguage);
      const newIdx = selectedRightIdx === idx ? null : idx;
      setSelectedRightIdx(newIdx);
      if (selectedLeftIdx !== null && newIdx !== null) checkMatch(selectedLeftIdx, newIdx);
    },
    [
      isChecking,
      activeMatchedIds,
      activeRight,
      selectedRightIdx,
      selectedLeftIdx,
      checkMatch,
      speak,
      activeLanguage,
      autoSpeakCorrect,
      isReversedBatch,
    ],
  );

  const getLeftState = (idx: number) => {
    if (activeMatchedIds.has(activeLeft[idx].id))  return 'matched'  as const;
    if (errorLeftIdx === idx)                        return 'error'    as const;
    if (selectedLeftIdx === idx)                     return 'selected' as const;
    return 'default' as const;
  };

  const getRightState = (idx: number) => {
    if (activeMatchedIds.has(activeRight[idx].id)) return 'matched'  as const;
    if (errorRightIdx === idx)                      return 'error'    as const;
    if (selectedRightIdx === idx)                   return 'selected' as const;
    return 'default' as const;
  };

  const isReview = phase === 'review';
  const reviewCorrectTotal = reviewTargetIds.reduce(
    (total, id) => total + Math.min(3, reviewCorrectCounts[id] ?? 0),
    0,
  );
  const totalActive   = isReview ? reviewTargetIds.length * 3 : wordPairs.length;
  const matched       = isReview ? reviewCorrectTotal : matchedIds.size;
  const progressPct   = totalActive > 0 ? matched / totalActive : 0;
  const heartsFilled  = Math.min(mainMistakes, MAX_HEARTS);
  const gridRowCount = Math.max(activeLeft.length, activeRight.length);
  const rowGap = gridRowCount >= 8 ? 6 : gridRowCount >= 6 ? 7 : 8;
  const minTileHeight = gridRowCount >= 8 ? 40 : gridRowCount <= 5 ? 56 : 48;
  const gridMinHeight = gridRowCount * minTileHeight + Math.max(0, gridRowCount - 1) * rowGap;
  const matchCaption = [
    isGeneralStage
      ? `Level ${levelIndex + 1} · Stage ${stageIndex + 1}`
      : isRandomBatch
        ? 'Random Level'
        : `${category?.name ?? 'Practice'} · Level ${levelIndex + 1}`,
    mainBatches.length > 1 ? `Set ${mainBatchIndex + 1} of ${mainBatches.length}` : '',
    reviewWordCount > 0 ? 'Earlier words included' : '',
  ].filter(Boolean).join(' · ');

  const reviewMatchesRemaining = reviewTargetIds.reduce(
    (total, id) => total + Math.max(0, 3 - (reviewCorrectCounts[id] ?? 0)),
    0,
  );

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: colors.groupedBackground }]}>
      <View style={styles.headerArea}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="game-back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isReview ? colors.primary : (category?.accentColor ?? colors.primary),
                    width: `${progressPct * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{matched}/{totalActive}</Text>
          </View>

          <View style={[styles.soundControls, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AutoSpeakToggle grouped />
            <TouchableOpacity onPress={toggleMute} style={styles.soundButton}>
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Hearts */}
          <View style={[styles.heartsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="heart" size={14} color={mainMistakes > 0 ? colors.destructive : colors.mutedForeground} />
            <Text style={[styles.heartCount, { color: colors.foreground }]}>{Math.max(0, MAX_HEARTS - heartsFilled)}</Text>
            {mainMistakes > MAX_HEARTS && (
              <Text style={[styles.extraMistakes, { color: colors.destructive }]}>+{mainMistakes - MAX_HEARTS}</Text>
            )}
          </View>
        </View>

        {/* Review banner */}
        {isDedicatedReview ? (
          <View style={styles.titleBlock}>
            <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
              Review all due words · {wordPairs.length} {wordPairs.length === 1 ? 'word' : 'words'} across every category
              {mainBatches.length > 1 ? ` · Set ${mainBatchIndex + 1} of ${mainBatches.length}` : ''}
            </Text>
            <Text style={[styles.levelTitle, { color: colors.foreground }]}>Tap the matching pairs</Text>
          </View>
        ) : isReview ? (
          <View style={styles.reviewPhase}>
            <View style={[styles.reviewBanner, { backgroundColor: colors.accent }]}>
              <View style={[styles.reviewIcon, { backgroundColor: colors.card }]}><Ionicons name="refresh" size={16} color={colors.primary} /></View>
              <View>
                <Text style={[styles.reviewBannerTitle, { color: colors.primary }]}>Fix your mistakes · {reviewMatchesRemaining} left</Text>
                <Text style={[styles.reviewBannerSub, { color: colors.mutedForeground }]}>
                  3 correct matches per word · Set {reviewBatchIndex + 1} of {reviewBatches.length}
                </Text>
              </View>
            </View>
            <View style={styles.titleBlock}>
              <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
                Review set · {reviewBatchIndex + 1} of {reviewBatches.length}
              </Text>
              <Text style={[styles.levelTitle, { color: colors.foreground }]}>Tap the matching pairs</Text>
            </View>
          </View>
        ) : isCategoryGeneral ? (
          <View style={styles.titleBlock}>
            <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
              General review · {category?.name} · All {wordPairs.length} words
              {mainBatches.length > 1 ? ` · Set ${mainBatchIndex + 1} of ${mainBatches.length}` : ''}
            </Text>
            <Text style={[styles.levelTitle, { color: colors.foreground }]}>Tap the matching pairs</Text>
          </View>
        ) : (
          <View style={styles.titleBlock}>
            <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
              {isGeneralStage || isRandomBatch ? `${matchCaption} · ${wordPairs.length} selected words` : matchCaption}
            </Text>
            <Text style={[styles.levelTitle, { color: colors.foreground }]}>Tap the matching pairs</Text>
          </View>
        )}

        {/* Column labels */}
        <View style={styles.colLabels}>
          <View style={styles.colLabel}>
            <Text style={[styles.colLabelText, { color: colors.mutedForeground }]}>
              {isReversedBatch ? `${langMeta.flag}  ${langMeta.label.toUpperCase()}` : '🇬🇧  ENGLISH'}
            </Text>
          </View>
          <View style={[
            styles.colLabel,
          ]}>
            <Text style={[styles.colLabelText, { color: colors.mutedForeground }]}>
              {isReversedBatch ? '🇬🇧  ENGLISH' : `${langMeta.flag}  ${langMeta.label.toUpperCase()}`}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Word grid ── */}
      <View style={[styles.gameArea, { paddingBottom: (Platform.OS === 'web' ? 16 : insets.bottom) + 8 }]}>
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={[styles.columns, { minHeight: gridMinHeight, gap: rowGap }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.col, { gap: rowGap }]}>
            {activeLeft.map((item, idx) => (
              <WordCard
                key={`l-${phase}-${idx}`}
                word={item.word}
                readingHint={!isDedicatedReview && !isCategoryGeneral && isReversedBatch
                  ? getEarlyArmenianReading(activeLanguage, levelIndex, item.word)
                  : undefined}
                state={getLeftState(idx)}
                onPress={() => handleLeftPress(idx)}
                side="left"
                compact
                rows={activeLeft.length}
              />
            ))}
          </View>
          <View style={[styles.col, { gap: rowGap }]}>
            {activeRight.map((item, idx) => (
              <WordCard
                key={`r-${phase}-${idx}`}
                word={item.word}
                readingHint={!isDedicatedReview && !isCategoryGeneral && !isReversedBatch
                  ? getEarlyArmenianReading(activeLanguage, levelIndex, item.word)
                  : undefined}
                state={getRightState(idx)}
                onPress={() => handleRightPress(idx)}
                side="right"
                compact
                rows={activeRight.length}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {(isSavingCompletion || completionError || reviewSessionComplete) && (
        <View style={styles.completionOverlay}>
          <View style={[styles.completionCard, { backgroundColor: colors.card }]}>
            <View style={[styles.completionIcon, { backgroundColor: colors.accent }]}><Ionicons name={reviewSessionComplete ? 'checkmark' : completionError ? 'alert-circle-outline' : 'cloud-upload-outline'} size={24} color={colors.primary} /></View>
            <Text style={[styles.completionTitle, { color: colors.foreground }]}>
              {reviewSessionComplete
                ? isGeneralStage
                  ? 'Stage complete!'
                  : isRandomBatch
                    ? 'Random round complete!'
                    : isCategoryGeneral
                  ? 'General review complete!'
                  : wordPairs.length === 0
                  ? 'You’re all caught up!'
                  : 'Review session complete!'
                : isSavingCompletion
                  ? 'Saving your progress…'
                  : 'Couldn’t save your progress'}
            </Text>
            {reviewSessionComplete && (
              <>
                <Text style={[styles.completionMessage, { color: colors.mutedForeground }]}>
                  {isGeneralStage
                    ? `You matched the ${wordPairs.length} words in this stage. Your general-vocabulary progress is saved.`
                    : isRandomBatch
                      ? `You matched ${wordPairs.length} words from your random batch. Your recall progress is saved.`
                      : isCategoryGeneral
                    ? `You practiced all ${wordPairs.length} words in ${category?.name}. Your recall progress is saved.`
                    : wordPairs.length === 0
                    ? 'There are no due words to review right now.'
                    : `You practiced ${wordPairs.length} ${wordPairs.length === 1 ? 'word' : 'words'} in ${langMeta.label}. Your review progress is saved.`}
                </Text>
                <TouchableOpacity
                  onPress={() => isGeneralSession
                    ? router.replace(getGeneralVocabularyReturnPath(returnTo, levelIndex) as any)
                    : handleBack()}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  testID="finish-review-session"
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.retryButtonText}>
                    {isGeneralSession || isCategoryGeneral
                      ? isRandomBatch
                        ? returnTo === 'random-practice' ? 'Back to all words' : 'Back to vocabulary levels'
                        : 'Back to stages'
                      : 'Back to Fix your mistakes'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {completionError && (
              <>
                <Text style={[styles.completionMessage, { color: colors.mutedForeground }]}>
                  Please try again before leaving this level.
                </Text>
                <TouchableOpacity
                  onPress={() => endGame(retryMistakes)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  testID="retry-save-progress"
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 7,
    paddingBottom: 12,
    gap: 8,
  },
  closeBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(127,127,127,0.10)',
  },
  soundControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    padding: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 99,
  },
  soundButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(127,127,127,0.17)',
    overflow: 'hidden',
    borderWidth: 0,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressLabel: {
    ...typography.caption,
    minWidth: 32,
    textAlign: 'right',
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  heartCount: { fontSize: 12, fontWeight: '700' },
  extraMistakes: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 2,
  },
  titleBlock: { marginBottom: 10, gap: 3 },
  reviewPhase: { gap: 8, marginBottom: 10 },
  reviewIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  levelTitle: {
    ...typography.largeTitle,
  },
  instruction: {
    ...typography.bodyRegular,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 0,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  reviewBannerTitle: {
    ...typography.caption,
  },
  reviewBannerSub: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  colLabels: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
    marginBottom: 4,
  },
  colLabel: {
    flex: 1,
    alignItems: 'flex-start',
  },
  colLabelText: {
    ...typography.micro,
    letterSpacing: 0.7,
    color: '#374151',
  },
  gameArea: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  columns: {
    flexGrow: 1,
    flexDirection: 'row',
    gap: 9,
  },
  col: {
    flex: 1,
  },
  gridScroll: { flex: 1, minHeight: 0 },
  completionOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(8,12,22,0.42)',
  },
  completionCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 25,
  },
  completionIcon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  completionTitle: {
    color: '#202027',
    ...typography.title,
    textAlign: 'center',
  },
  completionMessage: {
    color: '#686873',
    ...typography.bodyRegular,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#1F6FEB',
    marginTop: 18,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...typography.body,
  },
});
