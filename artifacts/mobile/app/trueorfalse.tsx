import React, { useState, useMemo, useCallback } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CATEGORIES, isCategoryAvailable, LANGUAGE_META } from '@/data/vocabulary';
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
import { MOTION } from '@/constants/motion';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question {
  english: string;
  shownTranslation: string;
  isCorrect: boolean;
  correctTranslation: string;
}

export default function TrueOrFalseScreen() {
  const {
    categoryId,
    levelIndex: liStr,
    generalStage: generalStageParam,
    allWords: allWordsParam,
    randomBatch: randomBatchParam,
    batchIndices,
    stageIndex: stageIndexParam,
    returnTo,
  } = useLocalSearchParams<{
    categoryId?: string; levelIndex?: string; generalStage?: string;
    allWords?: string; randomBatch?: string; batchIndices?: string;
    stageIndex?: string; returnTo?: string;
  }>();
  const levelIndex = parseInt(liStr ?? '0', 10);
  const stageIndex = Number.parseInt(stageIndexParam ?? '', 10);
  const isGeneralStage = generalStageParam === '1';
  const isRandomBatch = allWordsParam === '1' && randomBatchParam === '1';
  const isGeneralSession = isGeneralStage || isRandomBatch;
  const insets     = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    getPracticePairs,
    recordWordAnswer,
    getLevelStars,
    isMuted,
    toggleMute,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('trueorfalse');
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const colors     = useColors();
  const topPad     = Platform.OS === 'web' ? 67 : insets.top;
  const [generalComplete, setGeneralComplete] = useState(false);

  const category = CATEGORIES.find(c => c.id === categoryId) ??
    (isGeneralSession
      ? ({ name: 'General vocabulary', accentColor: colors.primary, bgColor: colors.accent } as any)
      : undefined);
  const [pairs]  = useState(() => isGeneralSession
    ? resolveGeneralVocabularySession({
        generalStage: generalStageParam,
        allWords: allWordsParam,
        randomBatch: randomBatchParam,
        batchIndices,
        levelIndex: liStr,
        stageIndex: stageIndexParam,
      }, activeLanguage)?.pairs ?? []
    : getPracticePairs(categoryId ?? '', levelIndex));
  usePreloadSpeech(pairs.map(pair => pair.translations[activeLanguage]), activeLanguage);
  const reviewWordCount = pairs.filter(pair => pair.isReview).length;
  const langMeta = LANGUAGE_META[activeLanguage];

  // Build distractor pool (wrong answers from other pairs)
  const wrongPool = useMemo(() => {
    const correctSet = new Set(pairs.map(p => p.translations[activeLanguage]));
    const pool: string[] = [];
    if (isGeneralSession) {
      pairs.forEach(pair => pool.push(pair.translations[activeLanguage]));
    } else {
      CATEGORIES.forEach(cat => {
        if (!isCategoryAvailable(cat, activeLanguage)) return;
        cat.levels.forEach(lv =>
          lv.pairs.forEach(p => {
            const t = p.translations[activeLanguage];
            if (!correctSet.has(t)) pool.push(t);
          })
        );
      });
    }
    return shuffle(pool);
  }, [activeLanguage, pairs, isGeneralSession]);

  // Build questions: each pair appears once correct + some appear with wrong translation
  const questions = useMemo<Question[]>(() => {
    const shuffled = shuffle(pairs);
    let wrongIdx   = 0;
    return shuffled.map((p, i) => {
      const showCorrect = Math.random() > 0.45; // ~55% correct, 45% false
      const correct     = p.translations[activeLanguage];
      if (showCorrect) {
        return { english: p.english, shownTranslation: correct, isCorrect: true, correctTranslation: correct };
      } else {
        // Pick an incorrect translation from this batch for general-vocabulary games.
        const candidates = wrongPool.filter(translation => translation !== correct);
        const wrong = candidates[wrongIdx++ % candidates.length];
        return { english: p.english, shownTranslation: wrong, isCorrect: false, correctTranslation: correct };
      }
    });
  }, [pairs, activeLanguage, wrongPool]);

  const [qIndex,   setQIndex]   = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null); // null = not yet
  const [correct,  setCorrect]  = useState<boolean | null>(null); // was the answer right?
  const [score,    setScore]    = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const cardScale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  const handleAnswer = useCallback((userSaysTrue: boolean) => {
    if (answered !== null) return;

    const q         = questions[qIndex];
    const isRight   = userSaysTrue === q.isCorrect;
    if (q) {
      recordWordAnswer(
        q.english,
        isRight,
        isGeneralSession ? undefined : categoryId,
        isGeneralSession ? undefined : levelIndex,
        activeLanguage,
      );
    }

    setAnswered(userSaysTrue);
    setCorrect(isRight);

    if (isRight) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playCorrect();
      speakCorrectAnswer(q.correctTranslation, activeLanguage);
      setScore(s => s + 1);
      cardScale.value = withSequence(withSpring(1.05), withSpring(1));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playWrong();
      setMistakes(m => m + 1);
      cardScale.value = withSequence(
        withTiming(0.97, { duration: 80 }),
        withTiming(1.03, { duration: 80 }),
        withTiming(0.97, { duration: 80 }),
        withSpring(1),
      );
    }

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        const finalMistakes = isRight ? mistakes : mistakes + 1;
        const earned        = finalMistakes === 0 ? 3 : finalMistakes <= 2 ? 2 : 1;
        if (isGeneralSession) {
          if (isGeneralStage) {
            void completeGeneralVocabularyStage(
              completeLevel,
              levelIndex,
              stageIndex,
              earned,
              activeLanguage,
              'trueorfalse',
            ).then(() => { reportClassic(earned); setGeneralComplete(true); });
          } else {
            reportClassic(earned);
            setGeneralComplete(true);
          }
          return;
        }
        reportClassic(earned, completeLevel(categoryId!, levelIndex, earned, activeLanguage));
        router.replace({
          pathname: '/results',
          params: { categoryId, levelIndex: String(levelIndex), earned: String(earned), language: activeLanguage },
        });
      } else {
        setQIndex(i => i + 1);
        setAnswered(null);
        setCorrect(null);
      }
    }, MOTION.answerPauseMs);
  }, [
    answered,
    qIndex,
    questions,
    mistakes,
    playCorrect,
    playWrong,
    speakCorrectAnswer,
    recordWordAnswer,
    categoryId,
    levelIndex,
    activeLanguage,
    completeLevel,
    isGeneralSession,
    isGeneralStage,
    stageIndex,
  ]);

  if (!category || qIndex >= questions.length) return null;

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
          <Text style={[styles.generalDoneTitle, { color: colors.foreground }]}>True/False practice complete</Text>
          <Text style={[styles.generalDoneSubtitle, { color: colors.mutedForeground }]}>
            Missed words are saved in Fix your mistakes.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace(returnPath as any)}
            style={[styles.doneReturn, { backgroundColor: category.accentColor }]}
          >
            <Text style={styles.doneReturnText}>{isGeneralStage ? 'Back to stages' : 'Back to words'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const q = questions[qIndex];

  // Card feedback colour
  const cardBg =
    answered === null        ? '#FFFFFF'
    : correct               ? '#D1FAE5'
    : '#FEE2E2';
  const cardBorder =
    answered === null        ? category.accentColor + '33'
    : correct               ? '#10B981'
    : '#EF4444';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: category.accentColor }]}>
          <TouchableOpacity onPress={() => goBackOr(isGeneralSession
            ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
            : `/levels?categoryId=${categoryId}` as any)} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>✓  True or False</Text>
          <Text style={styles.headerSub}>
            {isGeneralStage
              ? `Level ${levelIndex + 1} · Stage ${stageIndex + 1} · ${pairs.length} words · ${langMeta.label}`
              : isRandomBatch
                ? `${pairs.length} random words · every category · ${langMeta.label}`
                : `${category.name} · Level ${levelIndex + 1} · ${langMeta.flag} ${langMeta.label}`}
            {reviewWordCount > 0 ? ` · ${reviewWordCount} review` : ''}
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

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: category.bgColor }]}>
        <View style={[styles.progressFill, {
          backgroundColor: category.accentColor,
          width: `${(qIndex / questions.length) * 100}%` as any,
        }]} />
      </View>

      <View style={styles.content}>
        {/* Score strip */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.scoreNum, { color: '#10B981' }]}>{score}</Text>
          </View>
          <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
          <View style={styles.scoreItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={[styles.scoreNum, { color: '#EF4444' }]}>{mistakes}</Text>
          </View>
        </View>

        {/* Pair card */}
        <Animated.View style={[styles.pairCard, { backgroundColor: cardBg, borderColor: cardBorder }, cardStyle]}>
          <Text style={[styles.pairLabel, { color: colors.mutedForeground }]}>English</Text>
          <Text style={[styles.pairEnglish, { color: category.accentColor }]}>{q.english}</Text>

          <View style={[styles.pairDivider, { backgroundColor: cardBorder }]} />

          <Text style={[styles.pairLabel, { color: colors.mutedForeground }]}>{langMeta.label}</Text>
          <Text style={[styles.pairTranslation, {
            color: answered === null ? colors.foreground : correct ? '#065F46' : '#991B1B'
          }]}>
            {q.shownTranslation}
          </Text>
          {!!getEarlyArmenianReading(activeLanguage, levelIndex, q.shownTranslation) && (
            <Text style={[styles.pairReading, { color: colors.mutedForeground }]}>
              {getEarlyArmenianReading(activeLanguage, levelIndex, q.shownTranslation)}
            </Text>
          )}

          {/* Feedback */}
          {answered !== null && (
            <View style={styles.feedbackRow}>
              {correct ? (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  <Text style={[styles.feedbackTxt, { color: '#10B981' }]}>Correct!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                  <Text style={[styles.feedbackTxt, { color: '#EF4444' }]}>
                    {q.isCorrect ? 'It was True!' : `It's "${q.correctTranslation}"`}
                  </Text>
                </>
              )}
            </View>
          )}
        </Animated.View>

        {/* True / False buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={() => handleAnswer(false)}
            disabled={answered !== null}
            activeOpacity={0.8}
            style={[styles.tfBtn, {
              backgroundColor: answered === false && !correct ? '#FEE2E2' : '#FFF',
              borderColor: '#EF4444',
              opacity: answered !== null ? 0.65 : 1,
            }]}
          >
            <Ionicons name="close" size={32} color="#EF4444" />
            <Text style={[styles.tfTxt, { color: '#EF4444' }]}>False</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAnswer(true)}
            disabled={answered !== null}
            activeOpacity={0.8}
            style={[styles.tfBtn, {
              backgroundColor: answered === true && correct ? '#D1FAE5' : '#FFF',
              borderColor: '#10B981',
              opacity: answered !== null ? 0.65 : 1,
            }]}
          >
            <Ionicons name="checkmark" size={32} color="#10B981" />
            <Text style={[styles.tfTxt, { color: '#10B981' }]}>True</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  generalDone: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  generalDoneTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  generalDoneSubtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 8 },
  doneReturn: {
    minHeight: 52,
    minWidth: '80%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  doneReturnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
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
    flex: 1, padding: 20, gap: 22, justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 24,
  },
  scoreItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreNum:  { fontSize: 22, fontWeight: '800' },
  scoreDivider: { width: 1.5, height: 24 },
  pairCard: {
    borderRadius: 24, padding: 28, alignItems: 'center', gap: 8, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  pairLabel:       { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: '#9CA3AF' },
  pairEnglish:     { fontSize: 34, fontWeight: '800' },
  pairDivider:     { height: 2, width: '50%', borderRadius: 1, marginVertical: 4 },
  pairTranslation: { fontSize: 32, fontWeight: '800' },
  pairReading: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  feedbackRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  feedbackTxt:     { fontSize: 15, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 16 },
  tfBtn:  {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 22, borderRadius: 20, borderWidth: 2.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tfTxt: { fontSize: 18, fontWeight: '800' },
});
