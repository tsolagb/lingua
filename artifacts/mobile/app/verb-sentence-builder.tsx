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
import { getVerbTenseHelp, VERB_SENTENCE_EXERCISES, type VerbTenseLabel } from '@/data/verb-exercises';
import { VerbTenseFilter, type VerbTenseFilterValue } from '@/components/VerbTenseFilter';
import { goBackOr } from '@/lib/navigation';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';

type Feedback = 'correct' | 'try-again' | null;

function shuffleIndexes(length: number) {
  return Array.from({ length }, (_, index) => index).sort(() => Math.random() - 0.5);
}

export default function VerbSentenceBuilderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tense: requestedTense } = useLocalSearchParams<{ tense?: string }>();
  const { activeLanguage, completeLevel } = useGame();
  const { speak, speakCorrectAnswer } = useSound();
  const exercises = VERB_SENTENCE_EXERCISES[activeLanguage];
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
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const exercise = sessionExercises[questionIndex];
  usePreloadSpeech(sessionExercises.map(item => item.words.join(' ')), activeLanguage);
  const completedSentence = exercise?.words.join(' ') ?? '';
  const exerciseHelp = getVerbTenseHelp(activeLanguage, exercise?.tense ?? 'Present');
  const shuffledIndexes = useMemo(
    () => (exercise ? shuffleIndexes(exercise.words.length) : []),
    [questionIndex, activeLanguage, exercise],
  );
  const isComplete = questionIndex >= sessionExercises.length;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const resetQuestion = () => {
    setSelectedTiles([]);
    setFeedback(null);
  };

  const selectTile = (tileIndex: number) => {
    if (feedback) return;
    setSelectedTiles(current => (
      current.includes(tileIndex)
        ? current.filter(index => index !== tileIndex)
        : [...current, tileIndex]
    ));
  };

  const removeAnswerWord = (selectedIndex: number) => {
    if (feedback) return;
    setSelectedTiles(current => current.filter((_, index) => index !== selectedIndex));
  };

  const checkSentence = () => {
    if (!exercise || selectedTiles.length !== exercise.words.length || feedback) return;
    const answer = selectedTiles.map(index => exercise.words[shuffledIndexes[index]]);
    const correct = answer.every((word, index) => word === exercise.words[index]);
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setFeedback(correct ? 'correct' : 'try-again');
    if (correct) {
      setCorrectAnswers(count => count + 1);
      speakCorrectAnswer(exercise.words.join(' '), activeLanguage);
    }
  };

  const nextExercise = async () => {
    if (questionIndex === sessionExercises.length - 1) {
      const levelIndex = selectedTense === 'All' ? 0 : selectedTense === 'Present' ? 1 : selectedTense === 'Past' ? 2 : 3;
      const stars = correctAnswers >= Math.ceil(sessionExercises.length * 0.9)
        ? 3
        : correctAnswers >= Math.ceil(sessionExercises.length * 0.6) ? 2 : 1;
      setIsSaving(true);
      try {
        await completeLevel('verb-sentence-builder', levelIndex, stars, activeLanguage);
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
    ? 'present, past, and future verbs'
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
          <Text style={[styles.title, { color: colors.foreground }]}>Build a sentence</Text>
        </View>
        <AutoSpeakToggle />
      </View>

      {isComplete ? (
        <View style={[styles.completeScreen, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}>
          <View style={[styles.completeIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.foreground }]}>Sentence builder complete!</Text>
          <Text style={[styles.completeSub, { color: colors.mutedForeground }]}>
            You built {sessionExercises.length} sentences and practiced {tenseDescription}.
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
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MAKE THIS SENTENCE</Text>
              <TenseTag tense={exercise.tense} colors={colors} />
            </View>
            <Text style={[styles.englishPrompt, { color: colors.foreground }]}>{exercise.english}</Text>
            <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
              Tap each word in the order you would say it.
            </Text>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Your sentence</Text>
          <View
            style={[
              styles.answerArea,
              {
                backgroundColor: colors.card,
                borderColor: feedback === 'correct' ? '#16A34A' : feedback === 'try-again' ? colors.destructive : colors.border,
              },
            ]}
          >
            {selectedTiles.length === 0 ? (
              <Text style={[styles.answerPlaceholder, { color: colors.mutedForeground }]}>Your words will appear here</Text>
            ) : (
              selectedTiles.map((tileIndex, selectedIndex) => (
                <TouchableOpacity
                  key={`${tileIndex}-${selectedIndex}`}
                  onPress={() => removeAnswerWord(selectedIndex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${exercise.words[shuffledIndexes[tileIndex]]}`}
                  style={[
                    styles.wordTile,
                    {
                      backgroundColor: feedback === 'correct' ? '#DCFCE7' : colors.accent,
                      borderColor: feedback === 'correct' ? '#86EFAC' : colors.primary + '35',
                    },
                  ]}
                >
                  <Text style={[styles.wordTileText, { color: feedback === 'correct' ? '#166534' : colors.foreground }]}>
                    {exercise.words[shuffledIndexes[tileIndex]]}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Word bank</Text>
          <View style={styles.wordBank}>
            {shuffledIndexes.map((wordIndex, tileIndex) => {
              const used = selectedTiles.includes(tileIndex);
              return (
                <TouchableOpacity
                  key={`${wordIndex}-${tileIndex}`}
                  onPress={() => selectTile(tileIndex)}
                  disabled={used || Boolean(feedback)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: used || Boolean(feedback) }}
                  style={[
                    styles.wordTile,
                    {
                      backgroundColor: used ? colors.muted : colors.card,
                      borderColor: used ? colors.muted : colors.border,
                      opacity: used ? 0.45 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.wordTileText, { color: colors.foreground }]}>{exercise.words[wordIndex]}</Text>
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
                    ? 'That’s right! Your sentence matches the expected word order.'
                    : `Try again with this word order: ${completedSentence}`}
                </Text>
                <Text style={[styles.feedbackRule, { color: colors.foreground }]}>{exerciseHelp}</Text>
              </View>
            </View>
          )}

          {feedback === 'try-again' ? (
            <TouchableOpacity
              onPress={resetQuestion}
              accessibilityRole="button"
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Try again</Text>
              <Ionicons name="refresh" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          ) : feedback === 'correct' ? (
            <>
              <SpeakerButton
                text={completedSentence}
                language={activeLanguage}
                label="Listen to sentence"
                accessibilityLabel={`Hear the completed sentence: ${completedSentence}`}
                testID="sentence-builder-listen"
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
          ) : (
            <TouchableOpacity
              onPress={checkSentence}
              disabled={selectedTiles.length !== exercise.words.length}
              accessibilityRole="button"
              accessibilityState={{ disabled: selectedTiles.length !== exercise.words.length }}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: selectedTiles.length === exercise.words.length ? colors.primary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: selectedTiles.length === exercise.words.length ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                Check sentence
              </Text>
              <Ionicons
                name="checkmark"
                size={18}
                color={selectedTiles.length === exercise.words.length ? colors.primaryForeground : colors.mutedForeground}
              />
            </TouchableOpacity>
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
  promptCard: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 10, marginTop: 3 },
  promptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  tenseTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  tenseTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  englishPrompt: { fontSize: 21, fontWeight: '800', letterSpacing: -0.3, lineHeight: 28 },
  instruction: { fontSize: 13, lineHeight: 19 },
  sectionHeading: { fontSize: 14, fontWeight: '800', marginTop: 1 },
  answerArea: {
    minHeight: 72,
    borderWidth: 1.5,
    borderRadius: 17,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  answerPlaceholder: { fontSize: 13, fontWeight: '500', paddingHorizontal: 3 },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  wordTile: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, borderWidth: 1 },
  wordTileText: { fontSize: 14, fontWeight: '700' },
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
