import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MOTION } from '@/constants/motion';
import { CATEGORIES, LANGUAGE_META } from '@/data/vocabulary';
import { getEarlyArmenianReading } from '@/data/armenian-transliteration';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { useColors } from '@/hooks/useColors';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import { goBackOr } from '@/lib/navigation';
import {
  completeGeneralVocabularyStage,
  getGeneralVocabularyReturnPath,
  resolveGeneralVocabularySession,
} from '@/lib/general-vocabulary-session';
import { usePreloadSpeech } from '@/components/SpeakerButton';

const SCREEN_W   = Dimensions.get('window').width;
const EXTRA_POOL = 'LRSMNDTPBCF';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Extract display letters from a word (preserving accents). */
function wordLetters(word: string): string[] {
  return word.toUpperCase().split('').filter(c => /\S/.test(c));
}

/** Build a shuffled pool of tiles: word letters + 4 extras */
function buildPool(word: string): string[] {
  const base   = wordLetters(word);
  const extras = Array.from({ length: 4 }, () =>
    EXTRA_POOL[Math.floor(Math.random() * EXTRA_POOL.length)]
  );
  return shuffle([...base, ...extras]);
}

// ── Per-question component (re-mounts on each question via key) ────────────────
function SpellingQuestion({
  english,
  target,
  readingHint,
  accentColor,
  bgColor,
  onCorrect,
  onWrongAttempt,
  onPlayCorrect,
  onPlayWrong,
}: {
  english: string;
  target: string;
  readingHint?: string;
  accentColor: string;
  bgColor: string;
  onCorrect: () => void;
  onWrongAttempt: () => void;
  onPlayCorrect: () => void;
  onPlayWrong: () => void;
}) {
  const colors      = useColors();
  const letters     = wordLetters(target);
  const [pool]      = useState(() => buildPool(target));
  const [answer,    setAnswer]      = useState<string[]>([]);
  const [used,      setUsed]        = useState<number[]>([]);
  const [status,    setStatus]      = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Dynamic blank size so long words still fit
  const blankSize = Math.max(30, Math.min(42, Math.floor((SCREEN_W - 80) / letters.length) - 6));
  const fontSize  = Math.max(14, Math.min(22, blankSize - 14));

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const handleTile = useCallback((letter: string, idx: number) => {
    if (status !== 'idle' || used.includes(idx) || answer.length >= letters.length) return;

    const newAns  = [...answer, letter];
    const newUsed = [...used, idx];
    setAnswer(newAns);
    setUsed(newUsed);

    if (newAns.length < letters.length) return;

    // Auto-check
    const typed   = newAns.join('').toUpperCase();
    const correct = letters.join('').toUpperCase();
    if (typed === correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPlayCorrect();
      setStatus('correct');
      setTimeout(onCorrect, MOTION.answerPauseMs);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onPlayWrong();
      setStatus('wrong');
      onWrongAttempt();
      shake.value = withSequence(
        withTiming(-10, { duration: 55 }),
        withTiming(10,  { duration: 55 }),
        withTiming(-8,  { duration: 55 }),
        withTiming(8,   { duration: 55 }),
        withTiming(0,   { duration: 55 }),
      );
      setTimeout(() => {
        setAnswer([]);
        setUsed([]);
        setStatus('idle');
      }, MOTION.wrongPauseMs);
    }
  }, [status, used, answer, letters, onCorrect, onWrongAttempt, onPlayCorrect, onPlayWrong]);

  const handleDelete = useCallback(() => {
    if (status !== 'idle' || answer.length === 0) return;
    setAnswer(a => a.slice(0, -1));
    setUsed(u => u.slice(0, -1));
  }, [status, answer]);

  const blankBg     = status === 'correct' ? '#D1FAE5' : status === 'wrong' ? '#FEE2E2' : colors.muted;
  const blankBorder = status === 'correct' ? '#10B981'  : status === 'wrong' ? '#EF4444'  : colors.border;
  const letterColor = status === 'correct' ? '#065F46'  : status === 'wrong' ? '#991B1B'  : colors.foreground;

  return (
    <View style={qStyles.wrap}>
      {/* English prompt */}
      <View style={[qStyles.questionCard, { backgroundColor: bgColor, borderColor: accentColor + '44' }]}>
        <Text style={[qStyles.questionLabel, { color: '#6B7280' }]}>Spell the word for…</Text>
        <Text style={[qStyles.questionWord, { color: accentColor }]}>{english}</Text>
        {!!readingHint && (
          <Text style={[qStyles.readingHint, { color: accentColor }]}>
            Latin reading: {readingHint}
          </Text>
        )}
      </View>

      {/* Blank squares */}
      <Animated.View style={[qStyles.blanksRow, shakeStyle]}>
        {letters.map((_, i) => (
          <View key={i} style={[qStyles.blank, {
            width: blankSize, height: blankSize + 4,
            borderRadius: 10, borderColor: i < answer.length ? blankBorder : colors.border,
            backgroundColor: i < answer.length ? blankBg : colors.muted,
          }]}>
            <Text style={[qStyles.blankLetter, { fontSize, color: letterColor }]}>
              {answer[i] ?? ''}
            </Text>
          </View>
        ))}
      </Animated.View>

      <Text style={[qStyles.hint, { color: '#9B9BB4' }]}>
        {letters.length} letters · tap tiles to spell
      </Text>

      {/* Letter tiles */}
      <View style={qStyles.tilesWrap}>
        {pool.map((letter, i) => {
          const isUsed = used.includes(i);
          return (
            <TouchableOpacity key={i} onPress={() => handleTile(letter, i)}
              activeOpacity={0.7}
              style={[qStyles.tile, {
                backgroundColor: isUsed ? '#F3F4F6' : bgColor,
                borderColor: isUsed ? '#E5E7EB' : accentColor,
                opacity: isUsed ? 0.4 : 1,
              }]}>
              <Text style={[qStyles.tileLetter, { color: isUsed ? '#9B9BB4' : accentColor }]}>
                {letter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Delete button */}
      <TouchableOpacity onPress={handleDelete}
        style={[qStyles.deleteBtn, { borderColor: '#E5E7EB' }]}>
        <Ionicons name="backspace-outline" size={20} color="#9B9BB4" />
        <Text style={qStyles.deleteTxt}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const qStyles = StyleSheet.create({
  wrap:         { gap: 18 },
  questionCard: {
    borderRadius: 22, padding: 26, alignItems: 'center', gap: 8, borderWidth: 2,
  },
  questionLabel: { fontSize: 14, fontWeight: '600' },
  questionWord:  { fontSize: 36, fontWeight: '800' },
  readingHint: { fontSize: 14, fontWeight: '700' },
  blanksRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 7,
    justifyContent: 'center', paddingHorizontal: 8,
  },
  blank: {
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  blankLetter: { fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 13, fontWeight: '600' },
  tilesWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    justifyContent: 'center', paddingHorizontal: 4,
  },
  tile: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tileLetter: { fontSize: 20, fontWeight: '800' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1.5,
  },
  deleteTxt: { fontSize: 14, fontWeight: '600', color: '#9B9BB4' },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function SpellingScreen() {
  const {
    categoryId,
    levelIndex: liStr,
    review: reviewParam,
    generalStage: generalStageParam,
    allWords: allWordsParam,
    randomBatch: randomBatchParam,
    batchIndices,
    stageIndex: stageIndexParam,
    returnTo,
  } = useLocalSearchParams<{
    categoryId?: string; levelIndex?: string; review?: string;
    generalStage?: string; allWords?: string; randomBatch?: string;
    batchIndices?: string; stageIndex?: string; returnTo?: string;
  }>();
  const isMistakeReview = reviewParam === '1';
  const isGeneralStage = generalStageParam === '1';
  const isRandomBatch = allWordsParam === '1' && randomBatchParam === '1';
  const isGeneralSession = isGeneralStage || isRandomBatch;
  const levelIndex = parseInt(liStr ?? '0', 10);
  const stageIndex = Number.parseInt(stageIndexParam ?? '', 10);
  const insets     = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    dueReviewPairs,
    getLevelStars,
    getPracticePairs,
    recordWordAnswer,
    isMuted,
    toggleMute,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('spelling');
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const colors     = useColors();
  const topPad     = Platform.OS === 'web' ? 67 : insets.top;

  const category = CATEGORIES.find(c => c.id === categoryId) ??
    (isMistakeReview ? CATEGORIES[0] : isGeneralSession
      ? ({ name: 'General vocabulary', accentColor: colors.primary, bgColor: colors.accent } as any)
      : undefined);
  const [pairs]  = useState(() =>
    isMistakeReview
      ? dueReviewPairs
      : isGeneralSession
        ? resolveGeneralVocabularySession({
            generalStage: generalStageParam,
            allWords: allWordsParam,
            randomBatch: randomBatchParam,
            batchIndices,
            levelIndex: liStr,
            stageIndex: stageIndexParam,
          }, activeLanguage)?.pairs ?? []
        : getPracticePairs(categoryId ?? '', levelIndex),
  );
  usePreloadSpeech(pairs.map(pair => pair.translations[activeLanguage]), activeLanguage);
  const reviewWordCount = pairs.filter(pair => pair.isReview).length;
  const langMeta = LANGUAGE_META[activeLanguage];

  const [questions] = useState(() => isMistakeReview ? [...pairs] : shuffle(pairs));
  const [qIndex,    setQIndex]    = useState(0);
  const [mistakes,  setMistakes]  = useState(0);
  const [generalComplete, setGeneralComplete] = useState(false);
  const wrongWordsInSession = useRef(new Set<string>());
  const currentQ = questions[qIndex];

  const handleCorrect = useCallback(() => {
    if (currentQ) {
      recordWordAnswer(
        currentQ.english,
        true,
        isMistakeReview || isGeneralSession ? undefined : categoryId,
        isMistakeReview || isGeneralSession ? undefined : levelIndex,
        activeLanguage,
      );
      speakCorrectAnswer(currentQ.translations[activeLanguage], activeLanguage);
    }
    if (qIndex + 1 >= questions.length) {
      if (isMistakeReview) {
        reportClassic(mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
        if (router.canGoBack()) router.back();
        else router.replace('/mistake-review' as any);
        return;
      }
      if (isGeneralSession) {
        const finish = () => setGeneralComplete(true);
        if (isGeneralStage) {
          const earned = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
          void completeGeneralVocabularyStage(
            completeLevel,
            levelIndex,
            stageIndex,
            earned,
            activeLanguage,
            'spelling',
          ).then(() => { reportClassic(earned); finish(); });
        } else {
          reportClassic(mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
          finish();
        }
        return;
      }
      const earned = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      reportClassic(earned, completeLevel(categoryId!, levelIndex, earned, activeLanguage));
      router.replace({
        pathname: '/results',
        params: { categoryId, levelIndex: String(levelIndex), earned: String(earned), language: activeLanguage },
      });
    } else {
      setQIndex(i => i + 1);
    }
  }, [
    currentQ,
    qIndex,
    questions.length,
    mistakes,
    recordWordAnswer,
    speakCorrectAnswer,
    categoryId,
    levelIndex,
    activeLanguage,
    completeLevel,
    isMistakeReview,
    isGeneralSession,
    isGeneralStage,
    stageIndex,
  ]);

  const handleWrongAttempt = useCallback(() => {
    setMistakes(m => m + 1);
    if (!currentQ) return;
    const key = currentQ.english.trim().toLocaleLowerCase();
    if (wrongWordsInSession.current.has(key)) return;
    wrongWordsInSession.current.add(key);
    recordWordAnswer(
      currentQ.english,
      false,
      isMistakeReview || isGeneralSession ? undefined : categoryId,
      isMistakeReview || isGeneralSession ? undefined : levelIndex,
      activeLanguage,
    );
  }, [currentQ, recordWordAnswer, categoryId, levelIndex, activeLanguage, isMistakeReview, isGeneralSession]);

  if (!category) return null;

  if (!currentQ) return null;

  if (generalComplete) {
    const returnPath = getGeneralVocabularyReturnPath(returnTo, levelIndex);
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: category.accentColor }]}>
          <TouchableOpacity onPress={() => router.replace(returnPath as any)} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isGeneralStage ? 'Stage complete' : 'Round complete'}</Text>
        </View>
        <View style={styles.generalDone}>
          <Ionicons name="checkmark-circle" size={58} color={category.accentColor} />
          <Text style={[styles.generalDoneTitle, { color: colors.foreground }]}>Spelling practice complete</Text>
          <Text style={[styles.generalDoneSubtitle, { color: colors.mutedForeground }]}>
            Missed words are saved in Fix your mistakes.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace(returnPath as any)}
            style={[styles.startBtn, { backgroundColor: category.accentColor }]}
          >
            <Text style={styles.startBtnTxt}>{isGeneralStage ? 'Back to stages' : 'Back to words'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: category.accentColor }]}>
        <TouchableOpacity
          onPress={() => goBackOr(isMistakeReview
            ? '/mistake-review' as any
            : isGeneralSession
              ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
              : `/levels?categoryId=${categoryId}` as any)}
          style={styles.backCircle}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>
            {isMistakeReview ? 'Fix your mistakes · Spell it' : isGeneralSession ? 'General vocabulary · Spell it' : 'Spell It'}
          </Text>
          <Text style={styles.headerSub}>
            {isMistakeReview
              ? `${pairs.length} focus words · ${langMeta.label}`
              : isGeneralStage
                ? `Level ${levelIndex + 1} · Stage ${stageIndex + 1} · ${pairs.length} words · ${langMeta.label}`
                : isRandomBatch
                  ? `${pairs.length} random words · every category · ${langMeta.label}`
                  : `${category.name} · Level ${levelIndex + 1} · ${langMeta.flag} ${langMeta.label}${reviewWordCount > 0 ? ` · ${reviewWordCount} review` : ''}`}
          </Text>
        </View>
        <AutoSpeakToggle />
        <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={20} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{qIndex + 1} / {questions.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: category.bgColor }]}>
        <View style={[styles.progressFill, {
          backgroundColor: category.accentColor,
          width: `${(qIndex / questions.length) * 100}%` as any,
        }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hearts */}
        <View style={styles.heartsRow}>
          {[0, 1, 2].map(i => (
            <Ionicons key={i}
              name={i < mistakes ? 'heart-dislike' : 'heart'}
              size={24}
              color={i < mistakes ? '#EF4444' : category.accentColor}
            />
          ))}
        </View>

        {/* Question (re-mounts when qIndex changes via key) */}
        <SpellingQuestion
          key={qIndex}
          english={currentQ.english}
          target={currentQ.translations[activeLanguage]}
          readingHint={isMistakeReview
            ? undefined
            : getEarlyArmenianReading(
                activeLanguage,
                levelIndex,
                currentQ.translations[activeLanguage],
              )}
          accentColor={category.accentColor}
          bgColor={category.bgColor}
          onCorrect={handleCorrect}
          onWrongAttempt={handleWrongAttempt}
          onPlayCorrect={playCorrect}
          onPlayWrong={playWrong}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  generalDone: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  generalDoneTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  generalDoneSubtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 8 },
  startBtn: {
    minHeight: 52,
    minWidth: '80%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  startBtnTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
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
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heartsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
});
