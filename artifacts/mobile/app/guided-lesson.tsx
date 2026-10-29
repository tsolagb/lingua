import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from '@/components/native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { journeyLineTitle } from '@/lib/guided-path-presentation';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import {
  GUIDED_CATEGORY_ID,
  GUIDED_LEVELS_PER_MILESTONE,
  GUIDED_MILESTONES,
  getGuidedCurrentLevelIndex,
  getGuidedLevel,
  getGuidedLevelCount,
  scoreGuidedLesson,
  type GuidedExercise,
  type GuidedLessonLevel,
  type GuidedWord,
} from '@/data/guided-curriculum';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';
import { GuidedTipsSheet } from '@/components/GuidedTipsSheet';
import { isSpeechAvailable } from '@/lib/speech-voice';
import { publishGuidedPathReturn } from '@/lib/guided-path-events';

type Feedback = { correct: boolean; explanation: string; answer: string } | null;
type Completion = { stars: number; xp: number; accuracy: number; passed: boolean } | null;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
}

function normalizeAnswer(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[.,!?;:¡¿"]/g, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row++) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column++) {
      const old = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
      diagonal = old;
    }
  }
  return previous[b.length];
}

function forgivingMatch(input: string, expected: string) {
  const cleanInput = normalizeAnswer(input);
  const cleanExpected = normalizeAnswer(expected);
  if (cleanInput === cleanExpected) return true;
  const threshold = cleanExpected.length >= 12 ? 2 : cleanExpected.length >= 6 ? 1 : 0;
  return threshold > 0 && editDistance(cleanInput, cleanExpected) <= threshold;
}

function openPath() {
  router.dismissTo('/guided-path' as any);
}

function GuidedLessonRun({ level }: { level: GuidedLessonLevel }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    getLevelStars,
    recordWordAnswer,
    recordGuidedSentenceAnswer,
  } = useGame();
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const preloadTexts = useMemo(() => {
    const out = new Set<string>();
    for (const ex of level.exercises) {
      if (ex.kind === 'intro') {
        out.add(ex.pair.translations[activeLanguage]);
        if (ex.example?.target) out.add(ex.example.target);
      } else if (ex.kind === 'match') {
        ex.pairs.forEach(pair => out.add(pair.translations[activeLanguage]));
      } else if (ex.kind === 'choice') {
        out.add(ex.pair?.translations[activeLanguage] ?? ex.answer);
      } else if (ex.kind === 'build') {
        out.add(ex.target);
      } else if (ex.kind === 'type') {
        out.add(ex.pair.translations[activeLanguage]);
      }
    }
    return [...out].filter(text => text.trim().length > 0);
  }, [level, activeLanguage]);
  usePreloadSpeech(preloadTexts, activeLanguage);
  const audioAvailable = isSpeechAvailable(activeLanguage);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [scoredAnswers, setScoredAnswers] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [completion, setCompletion] = useState<Completion>(null);
  const [tipsOpen, setTipsOpen] = useState(level.levelIndex === 0);
  const [sessionRound, setSessionRound] = useState(0);
  const feedbackMotion = useSharedValue(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 18 : Math.max(insets.bottom, 10);
  const exercise = level.exercises[exerciseIndex];
  const questionTotal = level.exercises.length;
  const progress = questionTotal > 0 ? Math.min(1, (exerciseIndex + (feedback ? 1 : 0)) / questionTotal) : 0;
  const matchRightOrder = useMemo(
    () => exercise?.kind === 'match' ? shuffle(exercise.pairs.map((_, index) => index)) : [],
    [exercise?.id, sessionRound],
  );
  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackMotion.value,
    transform: [{ translateY: (1 - feedbackMotion.value) * 20 }],
  }));

  React.useEffect(() => {
    feedbackMotion.value = feedback ? withSpring(1, { damping: 20, stiffness: 180 }) : 0;
  }, [feedback, feedbackMotion]);

  const resetExercise = () => {
    setSelectedAnswer(null);
    setSelectedTiles([]);
    setTypedAnswer('');
    setMatchedPairs([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setFeedback(null);
  };

  const recordLinkedReview = (current: GuidedExercise, correct: boolean) => {
    if (current.kind === 'choice' || current.kind === 'type') {
      const pair = current.kind === 'type' ? current.pair : current.pair;
      if (pair) {
        recordWordAnswer(
          pair.english,
          correct,
          pair.categoryId,
          pair.categoryLevelIndex,
          activeLanguage,
        );
      }
      if (current.kind === 'choice' && current.sentence) {
        recordGuidedSentenceAnswer({
          sentenceId: current.sentence.id,
          english: current.sentence.english,
          target: current.sentence.target,
        }, correct, activeLanguage);
      }
    }
    if (current.kind === 'build' && current.sentence) {
      recordGuidedSentenceAnswer({
        sentenceId: current.sentence.id,
        english: current.sentence.english,
        target: current.sentence.target,
      }, correct, activeLanguage);
    }
  };

  const setAnswerFeedback = (current: GuidedExercise, correct: boolean, answer: string, explanation: string) => {
    recordLinkedReview(current, correct);
    setScoredAnswers(count => count + 1);
    if (correct) {
      setCorrectAnswers(count => count + 1);
      playCorrect();
      speakCorrectAnswer(answer, activeLanguage);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setMistakes(count => count + 1);
      playWrong();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    setFeedback({ correct, explanation, answer });
  };

  const finishLevel = async () => {
    setSaving(true);
    setSaveError(false);
    const previousStars = getLevelStars(GUIDED_CATEGORY_ID, level.globalLevelIndex);
    const result = scoreGuidedLesson(correctAnswers, scoredAnswers, level.isCheckpoint, previousStars);
    try {
      if (result.passed) {
        await completeLevel(GUIDED_CATEGORY_ID, level.globalLevelIndex, result.stars, activeLanguage);
        publishGuidedPathReturn({
          language: activeLanguage,
          globalLevelIndex: level.globalLevelIndex,
          stars: result.stars,
          xp: result.xp,
          isCheckpoint: level.isCheckpoint,
          passed: true,
        });
      }
      setCompletion(result);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const advance = async () => {
    if (saving) return;
    if (feedback) {
      if (exerciseIndex >= questionTotal - 1) {
        await finishLevel();
        return;
      }
      setExerciseIndex(index => index + 1);
      resetExercise();
      return;
    }
    if (exercise?.kind === 'intro') {
      if (exerciseIndex >= questionTotal - 1) {
        await finishLevel();
        return;
      }
      setExerciseIndex(index => index + 1);
      resetExercise();
    }
  };

  const checkAnswer = () => {
    if (!exercise || feedback) return;
    if (exercise.kind === 'choice') {
      if (selectedAnswer === null) return;
      const correct = normalizeAnswer(selectedAnswer) === normalizeAnswer(exercise.answer);
      setAnswerFeedback(
        exercise,
        correct,
        exercise.answer,
        correct ? 'Great recall. You used the pattern in context.' : exercise.explanation,
      );
    } else if (exercise.kind === 'build') {
      if (selectedTiles.length !== exercise.tiles.length) return;
      const built = selectedTiles.map(index => exercise.tiles[index]).join(' ');
      const correct = normalizeAnswer(built) === normalizeAnswer(exercise.target);
      setAnswerFeedback(
        exercise,
        correct,
        exercise.target,
        correct ? 'That sentence is in the right order.' : `Use this word order: ${exercise.target}`,
      );
    } else if (exercise.kind === 'type') {
      if (!typedAnswer.trim()) return;
      const correct = forgivingMatch(typedAnswer, exercise.answer);
      setAnswerFeedback(
        exercise,
        correct,
        exercise.answer,
        correct ? 'Nice work. The accent marks do not have to be perfect here.' : `The expected form is “${exercise.answer}.”`,
      );
    }
  };

  const selectTile = (tileIndex: number) => {
    if (feedback || exercise?.kind !== 'build') return;
    setSelectedTiles(current => current.includes(tileIndex)
      ? current.filter(index => index !== tileIndex)
      : [...current, tileIndex]);
  };

  const onMatchSelect = (side: 'left' | 'right', index: number) => {
    if (feedback || exercise?.kind !== 'match' || matchedPairs.includes(side === 'left' ? index : matchRightOrder[index])) return;
    const nextLeft = side === 'left' ? index : selectedLeft;
    const nextRight = side === 'right' ? index : selectedRight;
    setSelectedLeft(nextLeft);
    setSelectedRight(nextRight);
    if (nextLeft === null || nextRight === null) return;

    const leftPair = exercise.pairs[nextLeft];
    const rightPairIndex = matchRightOrder[nextRight];
    const rightPair = exercise.pairs[rightPairIndex];
    const correct = nextLeft === rightPairIndex;
    recordWordAnswer(
      leftPair.english,
      correct,
      leftPair.categoryId,
      leftPair.categoryLevelIndex,
      activeLanguage,
    );
    setScoredAnswers(count => count + 1);
    if (correct) {
      const nextMatches = [...matchedPairs, nextLeft];
      setMatchedPairs(nextMatches);
      setCorrectAnswers(count => count + 1);
      playCorrect();
      speakCorrectAnswer(leftPair.translations[activeLanguage], activeLanguage);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSelectedLeft(null);
      setSelectedRight(null);
      if (nextMatches.length === exercise.pairs.length) {
        setFeedback({ correct: true, explanation: 'Every pair is matched. Great recall.', answer: 'All pairs matched' });
      }
    } else {
      setMistakes(count => count + 1);
      playWrong();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setFeedback({
        correct: false,
        explanation: `“${leftPair.english}” matches “${leftPair.translations[activeLanguage]},” not “${rightPair.translations[activeLanguage]}.”`,
        answer: leftPair.translations[activeLanguage],
      });
    }
  };

  const answerReady = Boolean(exercise && (
    exercise.kind === 'intro' ||
    feedback ||
    (exercise.kind === 'choice' && selectedAnswer !== null) ||
    (exercise.kind === 'build' && selectedTiles.length === exercise.tiles.length) ||
    (exercise.kind === 'type' && typedAnswer.trim().length > 0)
  ));

  if (completion) {
    return (
      <View style={[styles.resultRoot, { backgroundColor: colors.groupedBackground, paddingTop: topPad + 16, paddingBottom: bottomPad + 12 }]}>
        <View style={[styles.resultCard, { backgroundColor: colors.card, shadowColor: colors.glassShadow }]}>
          <LinearGradient
            colors={[colors.homePrimary, colors.homePrimaryDark]}
            style={styles.resultIcon}
          >
            <Ionicons name="trophy" size={34} color={colors.onAccent} />
          </LinearGradient>
          <Text style={[styles.resultEyebrow, { color: colors.primary }]}>{journeyLineTitle(level.milestoneIndex)}</Text>
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>
            {completion.passed ? (level.isCheckpoint ? 'Checkpoint cleared!' : 'Level complete!') : 'Let’s strengthen this'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.mutedForeground }]}>
            {completion.passed
              ? 'You brought grammar and vocabulary together in real sentences.'
              : `Reach ${level.isCheckpoint ? '80' : '70'}% accuracy to pass. Review the tips, then try again — the next level stays locked until you pass.`}
          </Text>
          <View style={styles.resultStats}>
            <View style={[styles.resultStat, { backgroundColor: colors.muted }]}>
              <Text style={[styles.resultValue, { color: colors.primary }]}>{'★'.repeat(completion.stars)}{'☆'.repeat(3 - completion.stars)}</Text>
              <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>STARS</Text>
            </View>
            <View style={[styles.resultStat, { backgroundColor: colors.muted }]}>
              <Text style={[styles.resultValue, { color: colors.primary }]}>+{completion.xp}</Text>
              <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>XP EARNED</Text>
            </View>
            <View style={[styles.resultStat, { backgroundColor: colors.muted }]}>
              <Text style={[styles.resultValue, { color: colors.primary }]}>{completion.accuracy}%</Text>
              <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>ACCURACY</Text>
            </View>
          </View>
          <View style={[styles.wordsLearned, { backgroundColor: colors.primary + '12' }]}>
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <Text style={[styles.wordsLearnedText, { color: colors.primary }]}>
              {level.isCheckpoint ? `${level.vocabulary.length} words reviewed` : `${level.newWordCount} new words practiced`}
            </Text>
          </View>
          {saveError ? (
            <Text style={[styles.saveError, { color: colors.destructive }]}>
              Progress could not be saved. Please try finishing this lesson again.
            </Text>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Return to the Learn path"
            onPress={completion.passed ? openPath : () => {
              setCompletion(null);
              setExerciseIndex(0);
              setCorrectAnswers(0);
              setScoredAnswers(0);
              setMistakes(0);
              setSessionRound(round => round + 1);
              resetExercise();
              setTipsOpen(true);
            }}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.86}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              {!completion.passed ? 'Try this lesson again' : level.globalLevelIndex + 1 < getGuidedLevelCount() ? 'Back to the path' : 'Finish learning path'}
            </Text>
            <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close lesson and return to the Learn path"
          onPress={openPath}
          style={[styles.closeButton, { backgroundColor: colors.card }]}
          hitSlop={5}
        >
          <Ionicons name="close" size={23} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Lesson progress: ${exerciseIndex + (feedback ? 1 : 0)} of ${questionTotal}`}
            accessibilityValue={{ min: 0, max: questionTotal, now: Math.min(questionTotal, exerciseIndex + (feedback ? 1 : 0)) }}
            style={[styles.progressTrack, { backgroundColor: colors.muted }]}
          >
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressCount, { color: colors.mutedForeground }]}>{Math.min(questionTotal, exerciseIndex + 1)}/{questionTotal}</Text>
        </View>
        <View style={[styles.heartsPill, { backgroundColor: mistakes >= 5 ? colors.destructive + '18' : colors.card }]}>
          <Ionicons name="heart" size={17} color={mistakes >= 5 ? colors.destructive : colors.primary} />
          <Text style={[styles.heartCount, { color: mistakes >= 5 ? colors.destructive : colors.foreground }]}>
            {Math.max(0, 5 - mistakes)}
          </Text>
          {mistakes > 5 ? <Text style={[styles.extraMistakes, { color: colors.destructive }]}>+{mistakes - 5}</Text> : null}
        </View>
      </View>

      <View style={styles.lessonHeading}>
        <View style={styles.lessonEyebrowRow}>
          <Text style={[styles.lessonEyebrow, { color: colors.mutedForeground }]}>
            {journeyLineTitle(level.milestoneIndex)} · {level.isCheckpoint ? 'CHECKPOINT' : `LEVEL ${level.levelIndex + 1}`}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Open grammar tips for ${journeyLineTitle(level.milestoneIndex)}`}
            onPress={() => setTipsOpen(true)}
            style={styles.tipsInline}
            testID="guided-lesson-tips"
          >
            <Ionicons name="bulb-outline" size={16} color={colors.primary} />
            <Text style={[styles.tipsInlineText, { color: colors.primary }]}>Tips</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.lessonTitle, { color: colors.foreground }]} numberOfLines={2}>
          {exercise?.kind === 'intro' ? 'Meet a new word' : exercise?.kind === 'match' ? 'Match the words' : exercise?.kind === 'build' ? exercise.prompt : exercise?.kind === 'type' ? 'Type from memory' : exercise?.mode === 'blank' ? 'Fill in the blank' : exercise?.mode === 'grammar' ? 'Choose the right form' : exercise?.mode === 'listen' ? 'Listen and choose' : 'Translate the word'}
        </Text>
        <Text style={[styles.lessonSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
          {exercise?.kind === 'intro'
            ? 'Say it, hear it, and connect it to a sentence.'
            : exercise?.kind === 'match'
              ? 'Pair each English word with its meaning.'
              : exercise?.kind === 'choice' && exercise.mode === 'blank'
                ? 'Use the grammar tip in a complete sentence.'
                : exercise?.kind === 'choice' && exercise.mode === 'listen'
                  ? 'Listen closely before choosing a meaning.'
                  : 'Use today’s words in a real example.'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.exerciseScroll}
          contentContainerStyle={styles.exerciseContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {exercise?.kind === 'intro' ? (
            <Animated.View entering={FadeInDown.duration(220)} style={[styles.introCard, { backgroundColor: colors.card, shadowColor: colors.glassShadow }]}>
              <View style={[styles.introIcon, { backgroundColor: colors.primary + '14' }]}>
                <Ionicons name="sparkles" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>NEW WORD</Text>
              <Text style={[styles.introTarget, { color: colors.foreground }]}>{exercise.pair.translations[activeLanguage]}</Text>
              <Text style={[styles.introEnglish, { color: colors.mutedForeground }]}>{exercise.pair.english}</Text>
              {audioAvailable ? <SpeakerButton
                text={exercise.pair.translations[activeLanguage]}
                language={activeLanguage}
                label="Hear it"
                accessibilityLabel={`Hear ${exercise.pair.translations[activeLanguage]}`}
                showSlow
                style={styles.audioPill}
              /> : null}
              {exercise.example ? (
                <View style={[styles.exampleBox, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>IN A SENTENCE</Text>
                  <Text style={[styles.exampleTarget, { color: colors.foreground }]}>{exercise.example.target}</Text>
                  <Text style={[styles.exampleEnglish, { color: colors.mutedForeground }]}>{exercise.example.english}</Text>
                  {audioAvailable ? <SpeakerButton
                    text={exercise.example.target}
                    language={activeLanguage}
                    label="Listen"
                    compact
                    showSlow
                    accessibilityLabel="Hear the example sentence"
                    style={styles.exampleAudio}
                  /> : null}
                </View>
              ) : null}
            </Animated.View>
          ) : null}

          {exercise?.kind === 'match' ? (
            <View style={styles.matchArea}>
              <View style={styles.matchColumn}>
                {exercise.pairs.map((pair, index) => {
                  const matched = matchedPairs.includes(index);
                  const selected = selectedLeft === index;
                  return (
                    <TouchableOpacity
                      key={`match-en-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${pair.english}${matched ? ', matched' : ''}`}
                      onPress={() => onMatchSelect('left', index)}
                      style={[
                        styles.matchTile,
                        { backgroundColor: matched ? colors.cardMatchedBg : selected ? colors.cardSelectedBg : colors.card, borderColor: matched ? colors.cardMatchedBorder : selected ? colors.cardSelectedBorder : colors.border },
                      ]}
                    >
                      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.matchText, { color: colors.foreground }]}>{pair.english}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.matchColumn}>
                {matchRightOrder.map((pairIndex, position) => {
                  const pair = exercise.pairs[pairIndex];
                  const matched = matchedPairs.includes(pairIndex);
                  const selected = selectedRight === position;
                  return (
                    <TouchableOpacity
                      key={`match-target-${pairIndex}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${pair.translations[activeLanguage]}${matched ? ', matched' : ''}`}
                      onPress={() => onMatchSelect('right', position)}
                      style={[
                        styles.matchTile,
                        { backgroundColor: matched ? colors.cardMatchedBg : selected ? colors.cardSelectedBg : colors.card, borderColor: matched ? colors.cardMatchedBorder : selected ? colors.cardSelectedBorder : colors.border },
                      ]}
                    >
                      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.matchText, { color: colors.foreground }]}>{pair.translations[activeLanguage]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {exercise?.kind === 'choice' ? (
            <>
              {exercise.mode === 'listen' ? (
                <View style={[styles.listenCard, { backgroundColor: colors.card }]}>
                  <SpeakerButton
                    text={exercise.pair?.translations[activeLanguage] ?? exercise.answer}
                    language={activeLanguage}
                    label="Play"
                    accessibilityLabel="Play the word"
                    showSlow
                  />
                  <Text style={[styles.listenPrompt, { color: colors.foreground }]}>Tap to listen</Text>
                </View>
              ) : (
                <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
                    {exercise.mode === 'translation' ? 'TRANSLATE' : 'COMPLETE THE SENTENCE'}
                  </Text>
                  <Text style={[styles.questionText, { color: colors.foreground }]}>{exercise.prompt}</Text>
                  {exercise.translation ? (
                    <Text style={[styles.questionTranslation, { color: colors.mutedForeground }]}>{exercise.translation}</Text>
                  ) : null}
                </View>
              )}
              <View style={styles.options}>
                {exercise.options.map((option, index) => {
                  const selected = selectedAnswer === option;
                  const isAnswer = feedback?.answer === option;
                  return (
                    <TouchableOpacity
                      key={`${exercise.id}-option-${index}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option}
                      onPress={() => !feedback && setSelectedAnswer(option)}
                      style={[
                        styles.optionTile,
                        { backgroundColor: feedback?.correct && isAnswer ? colors.cardMatchedBg : selected ? colors.cardSelectedBg : colors.card, borderColor: feedback?.correct && isAnswer ? colors.cardMatchedBorder : selected ? colors.cardSelectedBorder : colors.border },
                      ]}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          {exercise?.kind === 'build' ? (
            <>
              {exercise.prompt !== 'Listen, then build what you hear.' ? (
                <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>ENGLISH</Text>
                  <Text style={[styles.questionText, { color: colors.foreground }]}>{exercise.english}</Text>
                </View>
              ) : (
                <View style={[styles.listenCard, { backgroundColor: colors.card }]}>
                  <SpeakerButton
                    text={exercise.target}
                    language={activeLanguage}
                    label="Play"
                    accessibilityLabel="Listen to the sentence"
                    showSlow
                  />
                  <Text style={[styles.listenPrompt, { color: colors.foreground }]}>Listen to the sentence</Text>
                </View>
              )}
              <View style={[styles.answerTray, { backgroundColor: colors.card }]}>
                {selectedTiles.length === 0 ? (
                  <Text style={[styles.answerPlaceholder, { color: colors.mutedForeground }]}>Tap words to build the sentence</Text>
                ) : selectedTiles.map((tileIndex, selectedIndex) => (
                  <TouchableOpacity
                    key={`answer-${selectedIndex}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${exercise.tiles[tileIndex]}`}
                    onPress={() => !feedback && setSelectedTiles(current => current.filter((_, index) => index !== selectedIndex))}
                    style={[styles.answerChip, { backgroundColor: colors.primary + '12' }]}
                  >
                    <Text style={[styles.answerChipText, { color: colors.primary }]}>{exercise.tiles[tileIndex]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tileBank}>
                {exercise.tiles.map((word, tileIndex) => {
                  const used = selectedTiles.includes(tileIndex);
                  return (
                    <TouchableOpacity
                      key={`word-tile-${tileIndex}`}
                      accessibilityRole="button"
                      accessibilityLabel={word}
                      accessibilityState={{ disabled: used || Boolean(feedback) }}
                      disabled={used || Boolean(feedback)}
                      onPress={() => selectTile(tileIndex)}
                      style={[
                        styles.wordTile,
                        { backgroundColor: used ? colors.muted : colors.card, borderColor: used ? colors.muted : colors.border },
                      ]}
                    >
                      <Text style={[styles.wordTileText, { color: used ? colors.mutedForeground : colors.foreground }]}>{word}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          {exercise?.kind === 'type' ? (
            <View style={[styles.typeCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>TYPE YOUR ANSWER</Text>
              <Text style={[styles.questionText, { color: colors.foreground }]}>{exercise.prompt}</Text>
              <TextInput
                accessibilityLabel="Type the translation"
                value={typedAnswer}
                onChangeText={setTypedAnswer}
                onSubmitEditing={checkAnswer}
                placeholder="Your answer"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                editable={!feedback}
                style={[styles.answerInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              {audioAvailable ? <SpeakerButton
                text={exercise.pair.translations[activeLanguage]}
                language={activeLanguage}
                label="Hear the word"
                compact
                showSlow
                accessibilityLabel={`Hear ${exercise.pair.translations[activeLanguage]}`}
                style={styles.typeAudio}
              /> : null}
            </View>
          ) : null}
        </ScrollView>

        {feedback ? (
          <Animated.View
            entering={FadeInDown.duration(180)}
            style={[
              styles.feedbackSheet,
              {
                backgroundColor: feedback.correct ? colors.success + '16' : colors.destructive + '12',
                borderColor: feedback.correct ? colors.success + '35' : colors.destructive + '32',
              },
              feedbackStyle,
            ]}
          >
            <View style={[styles.feedbackIcon, { backgroundColor: feedback.correct ? colors.success : colors.destructive }]}>
              <Ionicons name={feedback.correct ? 'checkmark' : 'close'} size={18} color={colors.primaryForeground} />
            </View>
            <View style={styles.feedbackCopy}>
              <Text style={[styles.feedbackTitle, { color: feedback.correct ? colors.success : colors.destructive }]}>
                {feedback.correct ? 'That’s right!' : 'Keep practicing'}
              </Text>
              <Text style={[styles.feedbackText, { color: colors.foreground }]}>{feedback.explanation}</Text>
              {!feedback.correct ? (
                <Text style={[styles.feedbackAnswer, { color: colors.primary }]}>Answer: {feedback.answer}</Text>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {saveError ? (
          <Text style={[styles.saveError, { color: colors.destructive }]}>We could not save this lesson. Try again.</Text>
        ) : null}
        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={feedback || exercise?.kind === 'intro' ? 'Continue' : 'Check answer'}
            disabled={!answerReady || saving}
            onPress={feedback || exercise?.kind === 'intro' ? advance : checkAnswer}
            style={[
              styles.primaryButton,
              { backgroundColor: answerReady ? colors.primary : colors.muted },
            ]}
            activeOpacity={0.85}
            testID="guided-lesson-check"
          >
            <Text style={[styles.primaryButtonText, { color: answerReady ? colors.primaryForeground : colors.mutedForeground }]}>
              {saving ? 'Saving…' : feedback || exercise?.kind === 'intro' ? 'Continue' : 'Check'}
            </Text>
            <Ionicons name="arrow-forward" size={19} color={answerReady ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <GuidedTipsSheet
        visible={tipsOpen}
        milestoneIndex={level.milestoneIndex}
        language={activeLanguage}
        onClose={() => setTipsOpen(false)}
      />
    </View>
  );
}

function ReadyGuidedLessonScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ milestoneIndex?: string; levelIndex?: string; current?: string }>();
  const { activeLanguage, isLevelCompleted } = useGame();
  const total = getGuidedLevelCount();
  const requestedCurrent = params.current === '1' || params.milestoneIndex === undefined;
  const [globalIndex] = useState(() => requestedCurrent
    ? getGuidedCurrentLevelIndex(isLevelCompleted)
    : Number(params.milestoneIndex) * GUIDED_LEVELS_PER_MILESTONE + Number(params.levelIndex ?? 0));
  const pathComplete = requestedCurrent && globalIndex >= total;
  const milestoneIndex = Math.floor(globalIndex / GUIDED_LEVELS_PER_MILESTONE);
  const levelIndex = globalIndex % GUIDED_LEVELS_PER_MILESTONE;
  const unlocked = globalIndex <= getGuidedCurrentLevelIndex(isLevelCompleted);
  const validIndex = Number.isInteger(globalIndex) && globalIndex >= 0 && globalIndex < total;
  const level = useMemo(
    () => validIndex && unlocked ? getGuidedLevel(activeLanguage, milestoneIndex, levelIndex) : null,
    [activeLanguage, globalIndex, milestoneIndex, levelIndex, validIndex, unlocked],
  );
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (pathComplete) {
    return (
      <View style={[styles.lockedRoot, { backgroundColor: colors.groupedBackground, paddingTop: topPad + 30 }]}>
        <View style={[styles.lockedCard, { backgroundColor: colors.card }]}>
          <View style={[styles.lockedIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="trophy" size={30} color={colors.primary} />
          </View>
          <Text style={[styles.lockedTitle, { color: colors.foreground }]}>You completed the Journey</Text>
          <Text style={[styles.lockedBody, { color: colors.mutedForeground }]}>
            All 30 Milestones are complete. Keep using your vocabulary in the other practice games.
          </Text>
          <TouchableOpacity onPress={openPath} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Return to Learn</Text>
            <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!validIndex || !unlocked || !level) {
    const finishMilestone = Math.max(1, Math.floor(Math.max(globalIndex - 1, 0) / GUIDED_LEVELS_PER_MILESTONE) + 1);
    return (
      <View style={[styles.lockedRoot, { backgroundColor: colors.groupedBackground, paddingTop: topPad + 30 }]}>
        <View style={[styles.lockedCard, { backgroundColor: colors.card }]}>
          <View style={[styles.lockedIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="lock-closed" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.lockedTitle, { color: colors.foreground }]}>Not unlocked yet</Text>
          <Text style={[styles.lockedBody, { color: colors.mutedForeground }]}>
            Finish Milestone {finishMilestone} to unlock this level.
          </Text>
          <TouchableOpacity onPress={openPath} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Return to Learn</Text>
            <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <GuidedLessonRun key={`${activeLanguage}-${globalIndex}`} level={level} />;
}

export default function GuidedLessonScreen() {
  const { isProgressReady, activeLanguage } = useGame();
  const colors = useColors();
  if (!isProgressReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.groupedBackground }}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Loading your learning progress…</Text>
      </View>
    );
  }
  return <ReadyGuidedLessonScreen key={activeLanguage} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 10, gap: 13 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progressWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { height: 8, flex: 1, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  progressCount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, minWidth: 34, textAlign: 'right' },
  heartsPill: { minWidth: 58, height: 38, borderRadius: 19, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  heartCount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  extraMistakes: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10 },
  lessonHeading: { paddingHorizontal: 21, paddingTop: 5, paddingBottom: 12, gap: 4 },
  lessonEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lessonEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.7, flex: 1 },
  tipsInline: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  tipsInlineText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  lessonTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, lineHeight: 30 },
  lessonSubtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 19 },
  body: { flex: 1 },
  exerciseScroll: { flex: 1 },
  exerciseContent: { paddingHorizontal: 18, paddingBottom: 18, gap: 12 },
  introCard: { minHeight: 350, padding: 20, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 5, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  introIcon: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  smallLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.9, textAlign: 'center' },
  introTarget: { fontFamily: 'Nunito_800ExtraBold', fontSize: 30, lineHeight: 39, textAlign: 'center', marginTop: 2 },
  introEnglish: { fontFamily: 'Nunito_700Bold', fontSize: 17, lineHeight: 23, textAlign: 'center' },
  audioPill: { marginTop: 10 },
  audioPillText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  exampleBox: { alignSelf: 'stretch', marginTop: 18, borderRadius: 18, padding: 14, gap: 5 },
  exampleTarget: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 3 },
  exampleEnglish: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  exampleAudio: { alignSelf: 'center', marginTop: 6 },
  exampleAudioText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },
  matchArea: { flexDirection: 'row', gap: 10, paddingTop: 5 },
  matchColumn: { flex: 1, gap: 9 },
  matchTile: { minHeight: 68, borderRadius: 17, borderWidth: 1, padding: 9, alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  matchText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, lineHeight: 19, textAlign: 'center' },
  questionCard: { borderRadius: 22, minHeight: 144, padding: 18, justifyContent: 'center', gap: 9 },
  questionText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, lineHeight: 28 },
  questionTranslation: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20, marginTop: 2 },
  options: { gap: 9 },
  optionTile: { minHeight: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, shadowColor: '#000000', shadowOpacity: 0.035, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  optionText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, lineHeight: 22 },
  listenCard: { minHeight: 158, borderRadius: 23, alignItems: 'center', justifyContent: 'center', gap: 10 },
  listenIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  listenPrompt: { fontFamily: 'Nunito_700Bold', fontSize: 15 },
  answerTray: { minHeight: 80, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  answerPlaceholder: { fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  answerChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  answerChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  tileBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wordTile: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minHeight: 42, justifyContent: 'center' },
  wordTileText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  typeCard: { minHeight: 255, borderRadius: 22, padding: 18, gap: 13 },
  answerInput: { minHeight: 52, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'Nunito_700Bold', fontSize: 16 },
  typeAudio: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  typeAudioText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  feedbackSheet: { marginHorizontal: 17, marginTop: 2, padding: 13, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  feedbackIcon: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  feedbackCopy: { flex: 1, gap: 3 },
  feedbackTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  feedbackText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 18 },
  feedbackAnswer: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 18, paddingTop: 10 },
  primaryButton: { minHeight: 55, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  saveError: { fontFamily: 'Nunito_700Bold', fontSize: 12, textAlign: 'center', marginHorizontal: 18, marginTop: 4 },
  resultRoot: { flex: 1, paddingHorizontal: 18, justifyContent: 'center' },
  resultCard: { alignItems: 'center', borderRadius: 28, padding: 22, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  resultIcon: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  resultEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.7, textAlign: 'center' },
  resultTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, lineHeight: 33, textAlign: 'center', marginTop: 3 },
  resultSubtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 5 },
  resultStats: { flexDirection: 'row', gap: 7, width: '100%', marginTop: 20 },
  resultStat: { flex: 1, minHeight: 74, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3 },
  resultValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  resultLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 0.6 },
  wordsLearned: { width: '100%', minHeight: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 11, marginBottom: 16 },
  wordsLearnedText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  lockedRoot: { flex: 1, paddingHorizontal: 20, justifyContent: 'flex-start' },
  lockedCard: { borderRadius: 25, padding: 22, alignItems: 'center', gap: 12 },
  lockedIcon: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, textAlign: 'center' },
  lockedBody: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 5 },
});
