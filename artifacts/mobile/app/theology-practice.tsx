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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CATEGORIES } from '@/data/vocabulary';
import { goBackOr } from '@/lib/navigation';
import { router } from 'expo-router';

const churchCategory = CATEGORIES.find(category => category.id === 'church');
const theologyPairs = churchCategory?.levels[5]?.pairs.filter(pair => pair.context) ?? [];

const prompts: Record<string, { scenario: string; choices: string[] }> = {
  ecclesiology: {
    scenario: 'A class explores how a church is organized and how its people care for one another.',
    choices: ['ecclesiology', 'hermeneutics', 'pneumatology'],
  },
  eschatology: {
    scenario: 'A class discusses Christian beliefs about the future and the end of the world.',
    choices: ['theodicy', 'eschatology', 'soteriology'],
  },
  hermeneutics: {
    scenario: 'A class studies a Bible story’s words and setting to understand its meaning.',
    choices: ['hermeneutics', 'ecclesiology', 'eschatology'],
  },
  soteriology: {
    scenario: 'A class learns about how God saves people in Christian belief.',
    choices: ['pneumatology', 'theodicy', 'soteriology'],
  },
  theodicy: {
    scenario: 'A student asks why suffering happens if God is good and powerful.',
    choices: ['eschatology', 'theodicy', 'hermeneutics'],
  },
  pneumatology: {
    scenario: 'A class explores what Christians believe about the Holy Spirit.',
    choices: ['pneumatology', 'ecclesiology', 'soteriology'],
  },
};

export default function TheologyPracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const isComplete = questionIndex >= theologyPairs.length;
  const pair = theologyPairs[questionIndex];
  const prompt = pair ? prompts[pair.english] : undefined;

  const back = () => goBackOr('/theology-guide');

  const chooseAnswer = (answer: string) => {
    if (!pair || selectedAnswer !== null) return;
    const correct = answer === pair.english;
    void Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    if (correct) setScore(current => current + 1);
    setSelectedAnswer(answer);
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

  const returnToGuide = () => router.replace('/theology-guide' as any);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel="Go back to the theology guide"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CHURCH · LEVEL 6</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Theology word practice</Text>
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      {isComplete ? (
        <View style={[styles.completeScreen, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}>
          <View style={[styles.completeIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.foreground }]}>Practice complete!</Text>
          <Text style={[styles.completeSub, { color: colors.mutedForeground }]}>
            You matched {score} of {theologyPairs.length} theology words to their meanings.
          </Text>
          <TouchableOpacity
            onPress={restart}
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Practice again</Text>
            <Ionicons name="refresh" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={returnToGuide} accessibilityRole="button" style={styles.textButton}>
            <Text style={[styles.textButtonText, { color: colors.primary }]}>Back to the word guide</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              QUESTION {questionIndex + 1} OF {theologyPairs.length}
            </Text>
            <Text style={[styles.progressNumber, { color: colors.foreground }]}>
              {questionIndex + 1}/{theologyPairs.length}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${((questionIndex + 1) / theologyPairs.length) * 100}%` },
              ]}
            />
          </View>

          <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.promptIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WHICH FIELD IS THE CLASS STUDYING?</Text>
            <Text style={[styles.scenario, { color: colors.foreground }]}>{prompt?.scenario}</Text>
          </View>

          <View style={styles.choices}>
            {prompt?.choices.map(choice => {
              const choicePair = theologyPairs.find(item => item.english === choice);
              const isSelected = selectedAnswer === choice;
              const isCorrectAnswer = selectedAnswer !== null && choice === pair?.english;
              const isWrongSelection = isSelected && choice !== pair?.english;
              return (
                <TouchableOpacity
                  key={choice}
                  onPress={() => chooseAnswer(choice)}
                  disabled={selectedAnswer !== null}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: selectedAnswer !== null }}
                  testID={`theology-answer-${choice}`}
                  style={[
                    styles.choiceButton,
                    {
                      backgroundColor: isCorrectAnswer ? colors.accent : colors.card,
                      borderColor: isCorrectAnswer ? colors.primary : isWrongSelection ? colors.destructive : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.choiceText, { color: colors.foreground }]}>{choice}</Text>
                  {isCorrectAnswer && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  {isWrongSelection && <Ionicons name="close-circle" size={22} color={colors.destructive} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedAnswer !== null && pair?.context && (
            <View
              accessibilityLiveRegion="polite"
              style={[
                styles.feedbackCard,
                {
                  backgroundColor: selectedAnswer === pair.english ? colors.accent : colors.card,
                  borderColor: selectedAnswer === pair.english ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.feedbackTitle, { color: selectedAnswer === pair.english ? colors.primary : colors.foreground }]}>
                {selectedAnswer === pair.english ? 'That’s right!' : `The answer is ${pair.english}.`}
              </Text>
              <Text style={[styles.feedbackText, { color: colors.foreground }]}>{pair.context.explanation}</Text>
            </View>
          )}

          {selectedAnswer !== null && (
            <TouchableOpacity
              onPress={nextQuestion}
              accessibilityRole="button"
              testID="theology-next-question"
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                {questionIndex + 1 === theologyPairs.length ? 'See my score' : 'Next question'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: { width: 40 },
  headerText: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  title: { fontSize: 20, fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  progressNumber: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  promptCard: { padding: 18, borderWidth: 1, borderRadius: 20, gap: 12 },
  promptIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  scenario: { fontSize: 18, lineHeight: 27, fontWeight: '700' },
  choices: { gap: 9 },
  choiceButton: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceText: { fontSize: 15, fontWeight: '700' },
  feedbackCard: { padding: 15, borderWidth: 1, borderRadius: 16, gap: 6 },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  feedbackText: { fontSize: 14, lineHeight: 21 },
  primaryButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  completeScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 14 },
  completeIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  completeTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  completeSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 6 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  textButtonText: { fontSize: 14, fontWeight: '700' },
});
