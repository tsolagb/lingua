import React, { useState, useMemo, useCallback } from 'react';
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
import { CATEGORIES, getUniqueVocabularyPairs, isCategoryAvailable, LANGUAGE_META } from '@/data/vocabulary';
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

const QUIZ_WRONG_FEEDBACK_PAUSE_MS = 2000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Animated option button ──────────────────────────────────────────────────────
function OptionBtn({
  label,
  readingHint,
  state,
  onPress,
  accentColor,
}: {
  label: string;
  readingHint?: string;
  state: 'idle' | 'correct' | 'wrong' | 'reveal';
  onPress: () => void;
  accentColor: string;
}) {
  const scale = useSharedValue(1);

  const bgColor =
    state === 'correct' ? '#D1FAE5'
    : state === 'wrong'   ? '#FEE2E2'
    : state === 'reveal'  ? '#D1FAE5'
    : '#FFFFFF';
  const borderColor =
    state === 'correct' ? '#10B981'
    : state === 'wrong'   ? '#EF4444'
    : state === 'reveal'  ? '#10B981'
    : '#E5E7EB';
  const textColor =
    state === 'correct' ? '#065F46'
    : state === 'wrong'   ? '#991B1B'
    : state === 'reveal'  ? '#065F46'
    : '#1A1A1A';
  const icon =
    state === 'correct' ? 'checkmark-circle'
    : state === 'wrong'   ? 'close-circle'
    : state === 'reveal'  ? 'checkmark-circle'
    : null;
  const iconColor = state === 'wrong' ? '#EF4444' : '#10B981';

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (state !== 'idle') return;
    scale.value = withSequence(withSpring(0.94), withSpring(1));
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={state === 'idle' ? 0.75 : 1}
        style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
      >
        <View style={styles.optionCopy}>
          <Text style={[styles.optionText, { color: textColor }]}>{label}</Text>
          {!!readingHint && (
            <Text style={[styles.optionReading, { color: textColor }]}>{readingHint}</Text>
          )}
        </View>
        {icon && <Ionicons name={icon as any} size={24} color={iconColor} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function QuizScreen() {
  const {
    categoryId,
    levelIndex: liStr,
    review: reviewParam,
    allWords: allWordsParam,
    randomBatch: randomBatchParam,
    generalStage: generalStageParam,
    returnTo,
    batchIndices,
    stageIndex: stageIndexParam,
  } = useLocalSearchParams<{
    categoryId?: string;
    levelIndex?: string;
    review?: string;
    allWords?: string;
    randomBatch?: string;
    generalStage?: string;
    returnTo?: string;
    batchIndices?: string;
    stageIndex?: string;
  }>();
  const isMistakeReview = reviewParam === '1';
  const isAllWords = allWordsParam === '1';
  const isRandomBatch = isAllWords && randomBatchParam === '1';
  const isGeneralStage = generalStageParam === '1';
  const isGeneralSession = isGeneralStage || isRandomBatch;
  const levelIndex = parseInt(liStr ?? '0', 10);
  const generalStageIndex = Number.parseInt(stageIndexParam ?? '', 10);
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
  const { report: reportClassic } = useClassicGameResult('quiz');
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const colors     = useColors();
  const topPad     = Platform.OS === 'web' ? 67 : insets.top;

  const category = CATEGORIES.find(c => c.id === categoryId) ?? (isMistakeReview ? CATEGORIES[0] : undefined);
  const accentColor = category?.accentColor ?? colors.primary;
  const bgColor = category?.bgColor ?? colors.accent;
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
            }, activeLanguage)?.pairs ?? []
        : getPracticePairs(categoryId ?? '', levelIndex),
  );
  usePreloadSpeech(pairs.map(pair => pair.translations[activeLanguage]), activeLanguage);
  const reviewWordCount = pairs.filter(pair => pair.isReview).length;
  const langMeta = LANGUAGE_META[activeLanguage];

  // Pool of all translations in the app for distractors
  const distractorPool = useMemo(() => {
    const inQuestionSet = new Set(pairs.map(p => p.translations[activeLanguage]));
    const seen = new Set<string>();
    const pool: string[] = [];
    const addTranslation = (translation: string) => {
      if (
        !translation ||
        seen.has(translation) ||
        (!isAllWords && !isGeneralSession && inQuestionSet.has(translation))
      ) return;
      seen.add(translation);
      pool.push(translation);
    };

    if (isGeneralSession) {
      pairs.forEach(pair => addTranslation(pair.translations[activeLanguage]));
    } else if (isAllWords) {
      getUniqueVocabularyPairs(activeLanguage).forEach(pair => addTranslation(pair.translations[activeLanguage]));
    } else {
      CATEGORIES.forEach(cat => {
        if (!isCategoryAvailable(cat, activeLanguage)) return;
        cat.levels.forEach(lv =>
          lv.pairs.forEach(pair => addTranslation(pair.translations[activeLanguage])),
        );
      });
    }
    return shuffle(pool);
  }, [activeLanguage, isAllWords, pairs]);

  const [questions] = useState(() => isMistakeReview ? [...pairs] : shuffle(pairs));
  const [qIndex,    setQIndex]    = useState(0);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [mistakes,  setMistakes]  = useState(0);
  const [randomQuizComplete, setRandomQuizComplete] = useState(false);
  const [randomQuizScore, setRandomQuizScore] = useState(0);

  const currentQ = questions[qIndex];
  const correct  = currentQ?.translations[activeLanguage];

  // Build 4 options per question (new set each time qIndex changes)
  const options = useMemo(() => {
    if (!currentQ) return [];
    const d = distractorPool.filter(d => d !== correct);
    return shuffle([correct, d[0], d[1], d[2]]);
  }, [qIndex]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt === correct;
    if (currentQ) {
      recordWordAnswer(
        currentQ.english,
        isCorrect,
        isMistakeReview || isGeneralSession ? undefined : categoryId,
        isMistakeReview || isGeneralSession ? undefined : levelIndex,
        activeLanguage,
      );
    }

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playCorrect();
      speakCorrectAnswer(correct, activeLanguage);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playWrong();
      setMistakes(m => m + 1);
    }

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        if (isMistakeReview) {
          const reviewMistakes = isCorrect ? mistakes : mistakes + 1;
          reportClassic(reviewMistakes === 0 ? 3 : reviewMistakes <= 2 ? 2 : 1);
          if (router.canGoBack()) router.back();
          else router.replace('/mistake-review' as any);
          return;
        }
        const finalMistakes = isCorrect ? mistakes : mistakes + 1;
        if (isAllWords || isGeneralStage) {
          setRandomQuizScore(questions.length - finalMistakes);
          if (isGeneralStage) {
            const stars = finalMistakes === 0 ? 3 : finalMistakes <= 2 ? 2 : 1;
            void completeGeneralVocabularyStage(
              completeLevel,
              levelIndex,
              generalStageIndex,
              stars,
              activeLanguage,
              'quiz',
            ).then(() => { reportClassic(stars); setRandomQuizComplete(true); });
          } else {
            reportClassic(finalMistakes === 0 ? 3 : finalMistakes <= 2 ? 2 : 1);
            setRandomQuizComplete(true);
          }
          return;
        }
        const earned        = finalMistakes === 0 ? 3 : finalMistakes <= 2 ? 2 : 1;
        const prev          = getLevelStars(categoryId!, levelIndex);
        reportClassic(earned, completeLevel(categoryId!, levelIndex, earned, activeLanguage));
        router.replace({
          pathname: '/results',
          params: { categoryId, levelIndex: String(levelIndex), earned: String(earned), language: activeLanguage },
        });
      } else {
        setQIndex(i => i + 1);
        setSelected(null);
      }
    }, isCorrect ? MOTION.answerPauseMs : QUIZ_WRONG_FEEDBACK_PAUSE_MS);
  }, [
    selected,
    correct,
    currentQ,
    qIndex,
    questions.length,
    mistakes,
    playCorrect,
    playWrong,
    speakCorrectAnswer,
    activeLanguage,
    recordWordAnswer,
    categoryId,
    levelIndex,
    isMistakeReview,
    isAllWords,
    isGeneralSession,
    isGeneralStage,
    generalStageIndex,
    returnTo,
    completeLevel,
    getLevelStars,
  ]);

  if ((isAllWords || isGeneralStage) && randomQuizComplete) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: accentColor }]}>
          <TouchableOpacity
            onPress={() => goBackOr(getGeneralVocabularyReturnPath(returnTo, levelIndex) as any)}
            accessibilityRole="button"
            accessibilityLabel="Back to all vocabulary"
            style={styles.backCircle}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.headerTitle}>
              {isGeneralStage ? `Level ${levelIndex + 1} · Stage ${generalStageIndex + 1}` : 'Random vocabulary quiz'}
            </Text>
            <Text style={styles.headerSub}>{langMeta.flag} {langMeta.label} · {questions.length} words</Text>
          </View>
        </View>
        <View style={styles.randomDoneContent}>
          <Ionicons
            name={randomQuizScore === questions.length ? 'trophy' : 'checkmark-circle'}
            size={58}
            color={accentColor}
          />
          <Text style={[styles.randomDoneTitle, { color: colors.foreground }]}>Round complete</Text>
          <Text style={[styles.randomDoneScore, { color: accentColor }]}>
            {randomQuizScore} of {questions.length} correct
          </Text>
          <Text style={[styles.randomDoneHint, { color: colors.mutedForeground }]}>
            Missed words are saved in Fix your mistakes.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace(
              isGeneralStage || (isRandomBatch && randomQuizScore === questions.length)
                ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
                : randomQuizScore === questions.length
                  ? '/flashcards?allWords=1' as any
                  : '/mistake-review' as any,
            )}
            accessibilityRole="button"
            style={[styles.randomDonePrimary, { backgroundColor: accentColor }]}
          >
            <Ionicons
              name={randomQuizScore === questions.length ? 'albums-outline' : 'refresh-outline'}
              size={19}
              color={colors.primaryForeground}
            />
            <Text style={[styles.randomDonePrimaryText, { color: colors.primaryForeground }]}>
              {isGeneralStage || (isRandomBatch && randomQuizScore === questions.length)
                ? isGeneralStage ? 'Back to stages' : 'Back to all words'
                : randomQuizScore === questions.length ? 'Study all words' : 'Review missed words'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace(getGeneralVocabularyReturnPath(returnTo, levelIndex) as any)}
            accessibilityRole="button"
            style={[styles.randomDoneSecondary, { borderColor: colors.border }]}
          >
            <Text style={[styles.randomDoneSecondaryText, { color: colors.foreground }]}>
              {isGeneralStage ? 'Back to stages' : 'Back to all words'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if ((!category && !isAllWords && !isGeneralStage) || !currentQ) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: accentColor }]}>
        <TouchableOpacity
          onPress={() => goBackOr(
            isMistakeReview
              ? '/mistake-review' as any
              : isGeneralSession
                ? getGeneralVocabularyReturnPath(returnTo, levelIndex) as any
                : isAllWords
                ? '/random-practice' as any
                : `/levels?categoryId=${categoryId}` as any,
          )}
          style={styles.backCircle}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>
            {isMistakeReview
              ? 'Fix your mistakes'
              : isGeneralStage
                ? 'Vocabulary stage quiz'
                : isAllWords ? 'Random vocabulary quiz' : 'Quiz'}
          </Text>
          <Text style={styles.headerSub}>
            {isMistakeReview
              ? `${pairs.length} focus words · ${langMeta.label}`
              : isGeneralStage
                ? `${questions.length} stage words · ${langMeta.flag} ${langMeta.label}`
                : isAllWords
                ? `${questions.length} ${isRandomBatch ? 'random words' : 'words'} · every category · ${langMeta.flag} ${langMeta.label}`
                : `${category?.name ?? 'Vocabulary'} · Level ${levelIndex + 1} · ${langMeta.flag} ${langMeta.label}${reviewWordCount > 0 ? ` · ${reviewWordCount} review` : ''}`}
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
      <View style={[styles.progressTrack, { backgroundColor: bgColor }]}>
        <View style={[styles.progressFill, {
          backgroundColor: accentColor,
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
              color={i < mistakes ? '#EF4444' : accentColor}
            />
          ))}
        </View>

        {/* Question card */}
        <View style={[styles.questionCard, { backgroundColor: bgColor, borderColor: accentColor + '44' }]}>
          <Text style={[styles.questionLabel, { color: colors.mutedForeground }]}>
            What is the {langMeta.label} word for…
          </Text>
          <Text style={[styles.questionWord, { color: accentColor }]}>
            {currentQ.english}
          </Text>
        </View>

        {selected !== null && selected !== correct && (
          <View style={[styles.answerFeedback, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={21} color={accentColor} />
            <View style={styles.answerFeedbackCopy}>
              <Text style={[styles.answerFeedbackTitle, { color: colors.foreground }]}>Not quite</Text>
              <Text style={[styles.answerFeedbackText, { color: colors.mutedForeground }]}>
                Correct answer: <Text style={{ color: accentColor, fontWeight: '800' }}>{correct}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Options */}
        <View style={styles.optionsGrid}>
          {options.map((opt, i) => {
            let state: 'idle' | 'correct' | 'wrong' | 'reveal' = 'idle';
            if (selected !== null) {
              if (opt === correct)    state = selected === correct ? 'correct' : 'reveal';
              if (opt === selected && opt !== correct) state = 'wrong';
            }
            return (
              <OptionBtn key={i} label={opt} state={state}
                readingHint={isMistakeReview || isAllWords
                  ? undefined
                  : getEarlyArmenianReading(activeLanguage, levelIndex, opt)}
                onPress={() => handleSelect(opt)} accentColor={accentColor} />
            );
          })}
        </View>
      </ScrollView>
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
  headerMid:  { flex: 1 },
  headerTitle:{ fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:  { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  muteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  progressBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  progressText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  progressTrack: { height: 6 },
  progressFill:  { height: 6 },
  content:  { padding: 20, gap: 16, paddingBottom: 40 },
  randomDoneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 15,
  },
  randomDoneTitle: { fontSize: 25, fontWeight: '800', textAlign: 'center' },
  randomDoneScore: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  randomDoneHint: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 8 },
  randomDonePrimary: {
    width: '100%',
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 16,
  },
  randomDonePrimaryText: { fontSize: 15, fontWeight: '800' },
  randomDoneSecondary: {
    width: '100%',
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  randomDoneSecondaryText: { fontSize: 14, fontWeight: '700' },
  heartsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  questionCard: {
    borderRadius: 22, padding: 28, alignItems: 'center', gap: 10, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  questionLabel: { fontSize: 14, fontWeight: '600' },
  questionWord:  { fontSize: 38, fontWeight: '800' },
  answerFeedback: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  answerFeedbackCopy: { flex: 1, gap: 2 },
  answerFeedbackTitle: { fontSize: 14, fontWeight: '800' },
  answerFeedbackText: { fontSize: 14, fontWeight: '600' },
  optionsGrid:   { gap: 12 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 18, paddingHorizontal: 20, borderRadius: 16, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  optionCopy: { flex: 1, gap: 2 },
  optionText: { fontSize: 20, fontWeight: '700' },
  optionReading: { fontSize: 13, fontWeight: '700', opacity: 0.72 },
});
