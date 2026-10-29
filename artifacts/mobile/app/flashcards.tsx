import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CATEGORIES, getUniqueVocabularyPairs, LANGUAGE_META } from '@/data/vocabulary';
import { getEarlyArmenianReading } from '@/data/armenian-transliteration';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { useColors } from '@/hooks/useColors';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import { goBackOr } from '@/lib/navigation';
import {
  createLessonReviewExit,
  resolveLessonLanguage,
} from '@/lib/lessonReviewNavigation';
import {
  completeGeneralVocabularyStage,
  resolveGeneralVocabularySession,
} from '@/lib/general-vocabulary-session';
import { usePreloadSpeech } from '@/components/SpeakerButton';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Single flip card ──────────────────────────────────────────────────────────
function FlipCard({
  front,
  back,
  backReadingHint,
  frontExample,
  backExample,
  accentColor,
  bgColor,
  onReveal,
}: {
  front: string;
  back: string;
  backReadingHint?: string;
  frontExample?: string;
  backExample?: string;
  accentColor: string;
  bgColor: string;
  onReveal: () => void;
}) {
  const flip = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: interpolate(flip.value, [0, 0.49, 0.5, 1], [1, 1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: interpolate(flip.value, [0, 0.49, 0.5, 1], [0, 0, 1, 1]),
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  }));

  const handleFlip = () => {
    const next = flipped ? 0 : 1;
    flip.value = withSpring(next, { damping: 18, stiffness: 130 });
    const wasFlipped = flipped;
    setFlipped(!flipped);
    Haptics.selectionAsync();
    // Speak the translation when revealing the back
    if (!wasFlipped) onReveal();
  };

  return (
    <TouchableOpacity
      onPress={handleFlip}
      activeOpacity={0.95}
      style={[fcStyles.cardWrap, (frontExample || backExample) && fcStyles.cardWrapWithExample]}
    >
      {/* Front */}
      <Animated.View style={[fcStyles.card, { backgroundColor: bgColor, borderColor: accentColor + '55' }, frontStyle]}>
        <Text style={[fcStyles.cardHint, { color: accentColor + '99' }]}>English</Text>
        <Text style={[fcStyles.cardWord, { color: accentColor }]}>{front}</Text>
        {frontExample && <CardExample text={frontExample} color={accentColor} />}
        <Text style={[fcStyles.tapHint, { color: accentColor + '66' }]}>tap to reveal</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[fcStyles.card, { backgroundColor: accentColor, borderColor: accentColor }, backStyle]}>
        <Text style={[fcStyles.cardHint, { color: 'rgba(255,255,255,0.7)' }]}>Translation</Text>
        <Text style={[fcStyles.cardWord, { color: '#FFFFFF' }]}>{back}</Text>
        {!!backReadingHint && (
          <Text style={fcStyles.cardReading}>{backReadingHint}</Text>
        )}
        {backExample && <CardExample text={backExample} color="rgba(255,255,255,0.88)" />}
        <Text style={[fcStyles.tapHint, { color: 'rgba(255,255,255,0.55)' }]}>tap to flip back</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CardExample({ text, color }: { text: string; color: string }) {
  return (
    <View style={fcStyles.exampleWrap}>
      <Text style={[fcStyles.exampleLabel, { color }]}>Example</Text>
      <Text style={[fcStyles.exampleText, { color }]}>{text}</Text>
    </View>
  );
}

const fcStyles = StyleSheet.create({
  cardWrap: { height: 220, marginHorizontal: 4 },
  cardWrapWithExample: { height: 280 },
  card: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    padding: 24,
  },
  cardHint: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  cardWord: { fontSize: 42, fontWeight: '800', textAlign: 'center' },
  cardReading: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.84)', textAlign: 'center' },
  tapHint:  { fontSize: 12, fontWeight: '600' },
  exampleWrap: { alignItems: 'center', gap: 2, maxWidth: '100%' },
  exampleLabel: { fontSize: 10, fontWeight: '700', opacity: 0.72 },
  exampleText: { fontSize: 14, fontWeight: '600', fontStyle: 'italic', textAlign: 'center' },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function FlashCardsScreen() {
  const {
    categoryId,
    levelIndex: liStr,
    language: languageParam,
    returnTo,
    allWords: allWordsParam,
    returnStars,
    returnMistakes,
    returnEarned,
    returnLanguage,
    review: reviewParam,
    randomBatch: randomBatchParam,
    generalStage: generalStageParam,
    stageIndex: stageIndexParam,
    batchIndices,
  } = useLocalSearchParams<{
    categoryId: string;
    levelIndex: string;
    language?: string;
    returnTo?: string;
    allWords?: string;
    returnStars?: string;
    returnMistakes?: string;
    returnEarned?: string;
    returnLanguage?: string;
    review?: string;
    randomBatch?: string;
    generalStage?: string;
    stageIndex?: string;
    batchIndices?: string;
  }>();
  const levelIndex = parseInt(liStr ?? '0', 10);
  const generalLevelIndex = levelIndex;
  const generalStageIndex = parseInt(stageIndexParam ?? '0', 10);
  const isLessonReview = returnTo === 'results';
  const isAllWords = allWordsParam === '1';
  const isRandomBatch = isAllWords && randomBatchParam === '1';
  const isGeneralStage = generalStageParam === '1';
  const isMistakeReview = reviewParam === '1';
  const insets     = useSafeAreaInsets();
  const {
    activeLanguage,
    dueReviewPairs,
    getPracticePairs,
    recordWordAnswer,
    completeLevel,
    isMuted,
    toggleMute,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('flashcards');
  const reviewLanguage = resolveLessonLanguage(
    languageParam ?? returnLanguage,
    activeLanguage,
  );
  const sessionLanguage = isLessonReview ? reviewLanguage : activeLanguage;
  const { speak, speakCorrectAnswer } = useSound();
  const colors     = useColors();
  const topPad     = Platform.OS === 'web' ? 67 : insets.top;
  const botPad     = Platform.OS === 'web' ? 34 : insets.bottom;

  const category = CATEGORIES.find(c => c.id === categoryId);
  const categoryName = isMistakeReview ? 'Fix your mistakes' : category?.name ?? 'General vocabulary';
  const accentColor = category?.accentColor ?? colors.primary;
  const bgColor = category?.bgColor ?? colors.muted;
  const [pairs]  = useState(() =>
    isMistakeReview
      ? dueReviewPairs
      : isAllWords
        ? isRandomBatch
          ? resolveGeneralVocabularySession({
              allWords: allWordsParam,
              randomBatch: randomBatchParam,
              batchIndices,
            }, activeLanguage)?.pairs ?? []
          : getUniqueVocabularyPairs(activeLanguage)
        : isGeneralStage
          ? resolveGeneralVocabularySession({
              generalStage: generalStageParam,
              levelIndex: liStr,
              stageIndex: stageIndexParam,
            }, sessionLanguage)?.pairs ?? []
          : getPracticePairs(categoryId ?? '', levelIndex, sessionLanguage),
  );
  usePreloadSpeech(pairs.map(pair => pair.translations[sessionLanguage]), sessionLanguage);
  const reviewWordCount = pairs.filter(pair => pair.isReview).length;
  const langMeta = LANGUAGE_META[sessionLanguage];

  const [cards]    = useState(() => isMistakeReview ? [...pairs] : shuffle(pairs));
  const [index,    setIndex]    = useState(0);
  const [known,    setKnown]    = useState(0);
  const [practice, setPractice] = useState(0);
  const [done,     setDone]     = useState(false);
  const stageCompletionSaved = useRef(false);

  const classicReported = useRef(false);
  useEffect(() => {
    if (!done || isGeneralStage || classicReported.current || cards.length === 0) return;
    classicReported.current = true;
    reportClassic(known === cards.length ? 3 : known >= cards.length * 0.75 ? 2 : 1);
  }, [done, isGeneralStage, cards.length, known, reportClassic]);

  useEffect(() => {
    if (!done || !isGeneralStage || stageCompletionSaved.current || cards.length === 0) return;
    stageCompletionSaved.current = true;
    const stars = known === cards.length ? 3 : known >= cards.length * 0.75 ? 2 : 1;
    void reportClassic(stars, completeGeneralVocabularyStage(
      completeLevel,
      generalLevelIndex,
      generalStageIndex,
      stars,
      sessionLanguage,
      'flashcards',
    ));
  }, [
    done,
    isGeneralStage,
    cards.length,
    known,
    completeLevel,
    generalLevelIndex,
    sessionLanguage,
    generalStageIndex,
  ]);

  const handleExit = useCallback(() => {
    if (isMistakeReview) {
      goBackOr('/mistake-review' as any);
      return;
    }

    if (isGeneralStage) {
      goBackOr(`/general-vocabulary-levels?levelIndex=${generalLevelIndex}` as any);
      return;
    }

    if (isAllWords) {
      goBackOr(
        returnTo === 'general-vocabulary-levels'
          ? '/general-vocabulary-levels'
          : '/random-practice' as any,
      );
      return;
    }

    if (!isLessonReview) {
      goBackOr(`/levels?categoryId=${categoryId}` as any);
      return;
    }

    const exit = createLessonReviewExit(router.canGoBack(), {
      categoryId: categoryId ?? '',
      levelIndex,
      stars: Number(returnStars ?? 1),
      mistakes: Number(returnMistakes ?? 0),
      earned: Number(returnEarned ?? 0),
      language: reviewLanguage,
    });
    if (exit.kind === 'back') {
      router.back();
      return;
    }

    router.replace({ pathname: exit.pathname, params: exit.params } as any);
  }, [
    isAllWords,
    isMistakeReview,
    isGeneralStage,
    isLessonReview,
    categoryId,
    levelIndex,
    generalLevelIndex,
    returnTo,
    returnStars,
    returnMistakes,
    returnEarned,
    returnLanguage,
    reviewLanguage,
  ]);

  // Slide animation
  const slideX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));

  const advance = useCallback((gotIt: boolean) => {
    const currentCard = cards[index];
    if (currentCard) {
      recordWordAnswer(
        currentCard.english,
        gotIt,
        isAllWords || isMistakeReview || isGeneralStage ? undefined : categoryId,
        isAllWords || isMistakeReview || isGeneralStage ? undefined : levelIndex,
        sessionLanguage,
      );
      if (gotIt) {
        speakCorrectAnswer(currentCard.translations[sessionLanguage], sessionLanguage);
      }
    }
    Haptics.notificationAsync(
      gotIt ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    if (gotIt) setKnown(k => k + 1);
    else        setPractice(p => p + 1);

    // Slide out
    slideX.value = withTiming(gotIt ? -400 : 400, { duration: 280 }, () => {
      // Reset
      slideX.value = gotIt ? 400 : -400;
      slideX.value = withSpring(0, { damping: 16, stiffness: 140 });
    });

    if (index + 1 >= cards.length) {
      setTimeout(() => setDone(true), 350);
    } else {
      setTimeout(() => setIndex(i => i + 1), 300);
    }
  }, [
    index,
    cards,
    isAllWords,
    isGeneralStage,
    isMistakeReview,
    categoryId,
    levelIndex,
    sessionLanguage,
    recordWordAnswer,
    speakCorrectAnswer,
  ]);

  if (!category && !isAllWords && !isMistakeReview && !isGeneralStage) return null;

  const current = cards[index];

  // ── Done screen ──
  if (done) {
    const total = cards.length;
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: accentColor }]}>
          <TouchableOpacity onPress={handleExit} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isMistakeReview
              ? 'Fix your mistakes'
              : isLessonReview
                ? 'Lesson Review'
                : isGeneralStage
                  ? `Level ${generalLevelIndex + 1} · Stage ${generalStageIndex + 1}`
                  : isRandomBatch
                    ? 'Random Level'
                    : isAllWords ? 'General vocabulary' : '📚  Flash Cards'}
          </Text>
          <AutoSpeakToggle />
          <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <View style={[styles.doneWrap, { paddingBottom: botPad + 24 }]}>
          <Text style={styles.doneEmoji}>{known === total ? '🏆' : known >= total / 2 ? '👍' : '💪'}</Text>
          <Text style={[styles.doneTitle, { color: accentColor }]}>
            {isLessonReview
              ? 'Lesson review complete'
              : isMistakeReview
                ? 'Mistake practice complete'
                : isGeneralStage
                  ? 'Stage complete'
                : isAllWords
                ? 'General vocabulary complete'
                : known === total
                  ? 'Perfect round!'
                  : 'Round complete!'}
          </Text>
          <View style={[styles.doneCard, { backgroundColor: bgColor, borderColor: accentColor + '44' }]}>
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={26} color="#10B981" />
              <Text style={styles.doneStat}><Text style={{ color: '#10B981', fontWeight: '800' }}>{known}</Text> known</Text>
            </View>
            {practice > 0 && (
              <View style={styles.doneRow}>
                <Ionicons name="reload-circle" size={26} color="#1F6FEB" />
                <Text style={styles.doneStat}><Text style={{ color: '#1F6FEB', fontWeight: '800' }}>{practice}</Text> need review</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              stageCompletionSaved.current = false;
              setIndex(0);
              setKnown(0);
              setPractice(0);
              setDone(false);
            }}
            style={[styles.doneBtn, { backgroundColor: accentColor }]}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.doneBtnTxt}>Study Again</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleExit} style={[styles.doneSecBtn, { borderColor: accentColor }]}>
            <Text style={[styles.doneSecBtnTxt, { color: accentColor }]}>
              {isLessonReview
                ? 'Back to lesson results'
                : isMistakeReview
                  ? 'Back to Fix your mistakes'
                  : isGeneralStage
                    ? 'Back to stages'
                  : isAllWords
                  ? isRandomBatch
                    ? returnTo === 'random-practice' ? 'Back to all words' : 'Back to vocabulary levels'
                    : 'Back to all words'
                  : 'Back to Levels'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: accentColor }]}>
        <TouchableOpacity onPress={handleExit} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>
            {isMistakeReview
              ? 'Fix your mistakes · Flash cards'
              : isLessonReview
                ? 'Lesson Review'
                : isGeneralStage
                  ? `Level ${generalLevelIndex + 1} · Stage ${generalStageIndex + 1}`
                  : isRandomBatch
                    ? 'Random Level'
                    : isAllWords ? 'General vocabulary' : '📚  Flash Cards'}
          </Text>
          <Text style={styles.headerSub}>
            {isMistakeReview
              ? `${pairs.length} focus words · ${langMeta.label} · toughest first`
              : isAllWords
                ? isRandomBatch
                  ? `${pairs.length} words · every category · ${langMeta.label}`
                  : `${pairs.length} words · ${langMeta.label} · shuffled`
                : isGeneralStage
                  ? `${pairs.length} words · all categories · ${langMeta.label}`
                : `${categoryName} · Level ${levelIndex + 1} · ${langMeta.flag} ${langMeta.label}`}
            {!isAllWords && !isMistakeReview && reviewWordCount > 0 ? ` · ${reviewWordCount} review` : ''}
          </Text>
        </View>
        <AutoSpeakToggle />
        <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={20} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{index + 1} / {cards.length}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: bgColor }]}>
        <View style={[styles.progressFill, {
          backgroundColor: accentColor,
          width: `${(index / cards.length) * 100}%` as any,
        }]} />
      </View>

      <View style={styles.content}>
        {/* Dot indicators */}
        {!isAllWords && (
          <View style={styles.dots}>
            {cards.map((_, i) => (
              <View key={i} style={[styles.dot, {
                backgroundColor: i < index ? '#10B981' : i === index ? accentColor : colors.border,
                width: i === index ? 16 : 8,
              }]} />
            ))}
          </View>
        )}

        {/* Card */}
        <Animated.View style={[styles.cardArea, slideStyle]}>
          {current && (
            <FlipCard
              front={current.english}
              back={current.translations[sessionLanguage]}
              backReadingHint={isAllWords || isMistakeReview
                ? undefined
                : getEarlyArmenianReading(sessionLanguage, levelIndex, current.translations[sessionLanguage])}
              frontExample={current.examples?.english}
              backExample={current.examples?.[sessionLanguage]}
              accentColor={accentColor}
              bgColor={bgColor}
              onReveal={() => speak(current.translations[sessionLanguage], sessionLanguage)}
            />
          )}
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => advance(false)}
            style={[styles.actionBtn, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
          >
            <Ionicons name="refresh" size={22} color="#EF4444" />
            <Text style={[styles.actionTxt, { color: '#EF4444' }]}>Study more</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => advance(true)}
            style={[styles.actionBtn, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}
          >
            <Ionicons name="checkmark" size={22} color="#10B981" />
            <Text style={[styles.actionTxt, { color: '#10B981' }]}>Got it!</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.tapNote, { color: colors.mutedForeground }]}>
          Tap the card to flip it
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 10,
  },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid:   { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  progressBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  progressText:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  progressTrack: { height: 6 },
  progressFill:  { height: 6 },
  muteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    flex: 1, padding: 20, gap: 20, justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center' },
  dot:  { height: 8, borderRadius: 4 },
  cardArea: {},
  actions: { flexDirection: 'row', gap: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 2,
  },
  actionTxt: { fontSize: 16, fontWeight: '800' },
  tapNote:   { textAlign: 'center', fontSize: 13, fontWeight: '600' },
  // Done screen
  doneWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20,
  },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 30, fontWeight: '800' },
  doneCard: {
    width: '100%', borderRadius: 20, padding: 24, gap: 14, borderWidth: 2,
  },
  doneRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doneStat: { fontSize: 18, fontWeight: '600', color: '#374151' },
  doneBtn:  {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 18,
  },
  doneBtnTxt: { fontSize: 17, fontWeight: '800', color: '#fff' },
  doneSecBtn: {
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, borderWidth: 2,
  },
  doneSecBtnTxt: { fontSize: 15, fontWeight: '700' },
});
