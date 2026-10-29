import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import { getVerbTenseHelp, VERB_GAP_EXERCISES, type VerbTenseLabel } from '@/data/verb-exercises';
import { canAdvanceAfterAnswer, getPracticeStars } from '@/data/lesson-practice';
import { VerbTenseFilter, type VerbTenseFilterValue } from '@/components/VerbTenseFilter';
import { goBackOr } from '@/lib/navigation';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';

type Feedback = 'correct' | 'try-again' | null;

export default function VerbFillInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tense: requestedTense } = useLocalSearchParams<{ tense?: string }>();
  const { activeLanguage, completeLevel } = useGame();
  const { speak, speakCorrectAnswer } = useSound();
  const exercises = VERB_GAP_EXERCISES[activeLanguage];
  const initialTense: VerbTenseFilterValue =
    requestedTense === 'Present' || requestedTense === 'Past' || requestedTense === 'Future'
      ? requestedTense
      : 'All';
  const [selectedTense, setSelectedTense] = useState<VerbTenseFilterValue>(initialTense);
  const sessionExercises = useMemo(
    () => selectedTense === 'All' ? exercises : exercises.filter(item => item.tense === selectedTense),
    [exercises, selectedTense],
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const exercise = sessionExercises[questionIndex];
  usePreloadSpeech(sessionExercises.flatMap(item => [item.answer, `${item.before}${item.answer}${item.after}`]), activeLanguage);
  const completedSentence = exercise
    ? `${exercise.before}${exercise.answer}${exercise.after}`
    : '';
  const exerciseHelp = getVerbTenseHelp(activeLanguage, exercise?.tense ?? 'Present');
  const options = useMemo(() => {
    if (!exercise) return [];
    const offset = questionIndex % exercise.options.length;
    return [...exercise.options.slice(offset), ...exercise.options.slice(0, offset)];
  }, [questionIndex, activeLanguage, exercise]);
  const isComplete = questionIndex >= sessionExercises.length;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const resetQuestion = () => {
    setSelectedAnswer(null);
    setFeedback(null);
  };

  const chooseAnswer = (answer: string) => {
    if (feedback === 'correct') return;
    const correct = answer === exercise.answer;
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setSelectedAnswer(answer);
    setFeedback(correct ? 'correct' : 'try-again');
    if (correct) {
      setCorrectAnswers(count => count + 1);
      speakCorrectAnswer(exercise.answer, activeLanguage);
    }
  };

  const nextExercise = async () => {
    if (!canAdvanceAfterAnswer(feedback)) return;
    if (questionIndex === sessionExercises.length - 1) {
      const levelIndex = selectedTense === 'All' ? 0 : selectedTense === 'Present' ? 1 : selectedTense === 'Past' ? 2 : 3;
      const stars = getPracticeStars(correctAnswers, sessionExercises.length);
      setIsSaving(true);
      try {
        await completeLevel('verb-fill-in', levelIndex, stars, activeLanguage);
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
        return;
      } finally {
        setIsSaving(false);
      }
    }
    setQuestionIndex(index => index + 1);
    resetQuestion();
  };

  const restart = () => {
    setQuestionIndex(0);
    setCorrectAnswers(0);
    setSaveFailed(false);
    setIsSaving(false);
    resetQuestion();
  };

  const changeTense = (next: VerbTenseFilterValue) => {
    setSelectedTense(next);
    setQuestionIndex(0);
    setCorrectAnswers(0);
    setSaveFailed(false);
    setIsSaving(false);
    resetQuestion();
  };

  const tenseDescription = selectedTense === 'All'
    ? 'present, past, and future sentences'
    : `the ${selectedTense.toLowerCase()} tense`;
  const back = () => goBackOr('/levels?categoryId=verbs');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel="Go back to verbs"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>VERB PRACTICE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Fill in the verb</Text>
        </View>
        <AutoSpeakToggle />
      </View>

      {isComplete ? (
        <View style={[styles.completeScreen, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}>
          <View style={[styles.completeIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.foreground }]}>Verb tenses complete!</Text>
          <Text style={[styles.completeSub, { color: colors.mutedForeground }]}>
            You chose the right forms for {tenseDescription}.
          </Text>
          <TouchableOpacity
            onPress={restart}
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Play again</Text>
            <Ionicons name="refresh" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={back} accessibilityRole="button" style={styles.textButton}>
            <Text style={[styles.textButtonText, { color: colors.primary }]}>Back to Verbs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <VerbTenseFilter value={selectedTense} onChange={changeTense} />
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>SENTENCE {questionIndex + 1} OF {sessionExercises.length}</Text>
            <Text style={[styles.progressNumber, { color: colors.foreground }]}>{questionIndex + 1}/{sessionExercises.length}</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${((questionIndex + 1) / sessionExercises.length) * 100}%` },
              ]}
            />
          </View>

          <View style={[styles.grammarTip, { backgroundColor: colors.accent }]}>
            <Ionicons name="bulb-outline" size={19} color={colors.primary} />
            <View style={styles.grammarTipCopy}>
              <Text style={[styles.grammarTipLabel, { color: colors.primary }]}>
                GRAMMAR TIP · {exercise.tense.toUpperCase()}
              </Text>
              <Text style={[styles.grammarTipText, { color: colors.foreground }]}>{exerciseHelp}</Text>
            </View>
          </View>

          <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.promptTop}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE THE VERB FORM</Text>
              <TenseTag tense={exercise.tense} colors={colors} />
            </View>
            <Text style={[styles.sentence, { color: colors.foreground }]}>
              {exercise.before}
              <Text
                style={[
                  styles.blank,
                  { color: feedback === 'correct' ? '#15803D' : feedback === 'try-again' ? colors.destructive : colors.primary },
                ]}
              >
                {selectedAnswer ?? '______'}
              </Text>
              {exercise.after}
            </Text>
            <View style={[styles.translation, { backgroundColor: colors.accent }]}>
              <Ionicons name="language-outline" size={17} color={colors.primary} />
              <Text style={[styles.translationText, { color: colors.foreground }]}>{exercise.english}</Text>
            </View>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Pick the best match</Text>
          <View style={styles.options}>
            {options.map((option, index) => {
              const chosen = selectedAnswer === option;
              const isRight = chosen && feedback === 'correct';
              const isWrong = chosen && feedback === 'try-again';
              return (
                <TouchableOpacity
                  key={`${questionIndex}-${option}`}
                  onPress={() => chooseAnswer(option)}
                  disabled={feedback === 'correct'}
                  accessibilityRole="button"
                  accessibilityState={{ selected: chosen, disabled: feedback === 'correct' }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isRight ? '#F0FDF4' : isWrong ? '#FEF2F2' : colors.card,
                      borderColor: isRight ? '#16A34A' : isWrong ? colors.destructive : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.optionLetter, { backgroundColor: isRight ? '#DCFCE7' : isWrong ? '#FEE2E2' : colors.accent }]}>
                    <Text style={[styles.optionLetterText, { color: isWrong ? colors.destructive : colors.primary }]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: isWrong ? colors.destructive : colors.foreground }]}>
                    {option}
                  </Text>
                  {isRight && <Ionicons name="checkmark-circle" size={21} color="#16A34A" />}
                  {isWrong && <Ionicons name="close-circle" size={21} color={colors.destructive} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {feedback && (
            <View
              accessibilityLiveRegion="polite"
              style={[
                styles.feedbackBox,
                { backgroundColor: feedback === 'correct' ? '#F0FDF4' : '#FEF2F2' },
              ]}
            >
              <Ionicons
                name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={feedback === 'correct' ? '#16A34A' : colors.destructive}
              />
              <View style={styles.feedbackCopy}>
                <Text style={[styles.feedbackText, { color: feedback === 'correct' ? colors.success : colors.destructive }]}>
                  {feedback === 'correct'
                    ? `Correct — “${exercise.answer}” fits this ${exercise.tense.toLowerCase()} sentence.`
                    : `The correct form is “${exercise.answer}”.`}
                </Text>
                <Text style={[styles.feedbackRule, { color: colors.foreground }]}>{exerciseHelp}</Text>
              </View>
            </View>
          )}

          {canAdvanceAfterAnswer(feedback) && (
            <>
              <SpeakerButton
                text={completedSentence}
                language={activeLanguage}
                label="Listen to sentence"
                accessibilityLabel={`Hear the completed sentence: ${completedSentence}`}
                testID="verb-fill-in-listen"
                compact
                showSlow
              />
              {saveFailed && (
                <Text style={[styles.saveError, { color: colors.destructive }]}>
                  Progress could not be saved. Tap Finish to try again.
                </Text>
              )}
              <TouchableOpacity
                onPress={nextExercise}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaving }}
                style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                  {isSaving ? 'Saving…' : questionIndex === sessionExercises.length - 1 ? 'Finish' : 'Next sentence'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function TenseTag({ tense, colors }: { tense: VerbTenseLabel; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.tenseTag, { backgroundColor: colors.accent }]}>
      <Text style={[styles.tenseTagText, { color: colors.primary }]}>{tense.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backButtonSpacer: { width: 42 },
  headerText: { flex: 1, gap: 3 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.45 },
  content: { paddingHorizontal: 20, gap: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  progressNumber: { fontSize: 12, fontWeight: '800' },
  saveError: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 4 },
  grammarTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 15, padding: 13 },
  grammarTipCopy: { flex: 1, gap: 4 },
  grammarTipLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  grammarTipText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  promptCard: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 13, marginTop: 3 },
  promptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  tenseTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  tenseTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  sentence: { fontSize: 23, lineHeight: 33, fontWeight: '800', letterSpacing: -0.35 },
  blank: { textDecorationLine: 'underline', textDecorationStyle: 'dotted' },
  translation: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 11 },
  translationText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  sectionHeading: { fontSize: 14, fontWeight: '800', marginTop: 1 },
  options: { gap: 9 },
  option: {
    minHeight: 59,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 12, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '700' },
  feedbackBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 13, padding: 12 },
  feedbackCopy: { flex: 1, gap: 5 },
  feedbackText: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  feedbackRule: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 3,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  listenButton: { minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, marginTop: 3 },
  listenText: { fontSize: 13, fontWeight: '800' },
  completeScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  completeIcon: { width: 72, height: 72, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  completeTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  completeSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 7 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14 },
  textButtonText: { fontSize: 14, fontWeight: '800' },
});
