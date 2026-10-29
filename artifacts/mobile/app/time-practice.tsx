import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { goBackOr } from '@/lib/navigation';
import {
  getTimeTellingChoices,
  isTimeTellingAnswerCorrect,
  TIME_TELLING_EXERCISES,
} from '@/data/time-telling';

export default function TimePracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage } = useGame();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const exercise = TIME_TELLING_EXERCISES[questionIndex];
  const isComplete = !exercise;
  const answer = exercise?.answers[activeLanguage];
  const choices = exercise
    ? getTimeTellingChoices(questionIndex, activeLanguage)
    : [];
  const isCorrect = exercise && selectedAnswer !== null
    ? isTimeTellingAnswerCorrect(exercise, activeLanguage, selectedAnswer)
    : false;

  const back = () => goBackOr('/levels?categoryId=time');

  const chooseAnswer = (choice: string) => {
    if (!exercise || selectedAnswer !== null) return;
    const correct = isTimeTellingAnswerCorrect(exercise, activeLanguage, choice);
    void Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    if (correct) setScore(current => current + 1);
    setSelectedAnswer(choice);
  };

  const nextQuestion = () => {
    setQuestionIndex(index => index + 1);
    setSelectedAnswer(null);
  };

  const restart = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  };

  const backToCalendar = () => router.replace('/levels?categoryId=time' as any);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel="Go back to Calendar"
          testID="time-practice-back"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CALENDAR PRACTICE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Tell the time</Text>
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      {isComplete ? (
        <View style={[styles.completeScreen, { paddingBottom: bottomPad + 24 }]}>
          <View style={[styles.completeIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.foreground }]}>Practice complete</Text>
          <Text style={[styles.completeSub, { color: colors.mutedForeground }]}>
            You chose {score} of {TIME_TELLING_EXERCISES.length} time expressions correctly.
          </Text>
          <TouchableOpacity
            onPress={restart}
            accessibilityRole="button"
            testID="time-practice-restart"
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Practice again</Text>
            <Ionicons name="refresh" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={backToCalendar} accessibilityRole="button" style={styles.textButton}>
            <Text style={[styles.textButtonText, { color: colors.primary }]}>Back to Calendar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              QUESTION {questionIndex + 1} OF {TIME_TELLING_EXERCISES.length}
            </Text>
            <Text style={[styles.progressNumber, { color: colors.foreground }]}>
              {questionIndex + 1}/{TIME_TELLING_EXERCISES.length}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${((questionIndex + 1) / TIME_TELLING_EXERCISES.length) * 100}%`,
                },
              ]}
            />
          </View>

          <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.promptTop}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WHAT TIME IS IT?</Text>
              <View style={[styles.stageTag, { backgroundColor: colors.accent }]}>
                <Text style={[styles.stageText, { color: colors.primary }]}>{exercise.stage.toUpperCase()}</Text>
              </View>
            </View>
            <View style={[styles.clockFace, { backgroundColor: colors.accent }]}>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
              <Text
                accessibilityLabel={`Clock shows ${exercise.clock}`}
                testID="time-practice-clock"
                style={[styles.clockText, { color: colors.foreground }]}
              >
                {exercise.clock}
              </Text>
            </View>
            {activeLanguage === 'armenian' && (
              <Text style={[styles.textOnlyNotice, { color: colors.mutedForeground }]}>
                Western Armenian text · no audio
              </Text>
            )}
          </View>

          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            Choose the natural {activeLanguage === 'armenian' ? 'Western Armenian' : activeLanguage[0].toUpperCase() + activeLanguage.slice(1)} expression
          </Text>
          <View style={styles.choices}>
            {choices.map((choice, index) => {
              const chosen = selectedAnswer === choice;
              const rightAnswer = selectedAnswer !== null && choice === answer?.expression;
              const wrongChoice = chosen && !isCorrect;
              return (
                <TouchableOpacity
                  key={`${questionIndex}-${choice}`}
                  onPress={() => chooseAnswer(choice)}
                  disabled={selectedAnswer !== null}
                  accessibilityRole="button"
                  accessibilityState={{ selected: chosen, disabled: selectedAnswer !== null }}
                  testID={`time-practice-answer-${index}`}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: rightAnswer ? colors.accent : colors.card,
                      borderColor: rightAnswer ? colors.primary : wrongChoice ? colors.destructive : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.choiceLetter, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.choiceLetterText, { color: colors.primary }]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[styles.choiceText, { color: colors.foreground }]}>{choice}</Text>
                  {rightAnswer && <Ionicons name="checkmark-circle" size={21} color={colors.primary} />}
                  {wrongChoice && <Ionicons name="close-circle" size={21} color={colors.destructive} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedAnswer !== null && exercise && answer && (
            <View
              accessibilityLiveRegion="polite"
              testID="time-practice-feedback"
              style={[
                styles.feedbackCard,
                { backgroundColor: isCorrect ? colors.accent : colors.card, borderColor: isCorrect ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.feedbackTitle, { color: isCorrect ? colors.primary : colors.foreground }]}>
                {isCorrect ? 'That’s right!' : `The answer is ${answer.expression}`}
              </Text>
              <Text style={[styles.feedbackText, { color: colors.foreground }]}>{answer.explanation}</Text>
              <View style={[styles.englishMeaning, { backgroundColor: colors.background }]}>
                <Ionicons name="language-outline" size={17} color={colors.primary} />
                <Text style={[styles.englishMeaningText, { color: colors.foreground }]}>
                  {exercise.englishMeaning}
                </Text>
              </View>
            </View>
          )}

          {selectedAnswer !== null && (
            <TouchableOpacity
              onPress={nextQuestion}
              accessibilityRole="button"
              testID="time-practice-next"
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                {questionIndex + 1 === TIME_TELLING_EXERCISES.length ? 'Finish' : 'Next time'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
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
  progressTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 4 },
  promptCard: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 14, marginTop: 3 },
  promptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  stageTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  stageText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  clockFace: { minHeight: 132, borderRadius: 17, alignItems: 'center', justifyContent: 'center', gap: 3 },
  clockText: { fontSize: 48, lineHeight: 58, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  textOnlyNotice: { fontSize: 11, fontWeight: '600' },
  sectionHeading: { fontSize: 14, fontWeight: '800', marginTop: 1 },
  choices: { gap: 9 },
  choice: { minHeight: 61, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 11 },
  choiceLetter: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  choiceLetterText: { fontSize: 12, fontWeight: '800' },
  choiceText: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  feedbackCard: { padding: 15, borderWidth: 1, borderRadius: 16, gap: 8 },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  feedbackText: { fontSize: 14, lineHeight: 21 },
  englishMeaning: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 11 },
  englishMeaningText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  primaryButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 3 },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  completeScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  completeIcon: { width: 72, height: 72, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  completeTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  completeSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 7 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14 },
  textButtonText: { fontSize: 14, fontWeight: '800' },
});
