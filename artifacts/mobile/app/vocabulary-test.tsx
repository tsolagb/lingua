import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, getCumulativePairs, type Language } from '@/data/vocabulary';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { SpeakerButton } from '@/components/SpeakerButton';
import { gradeVocabularyTest, scoreVocabularyAnswer, type VocabularyTestGrade } from '@/lib/vocabulary-test';

type Feedback = {
  kind: 'correct' | 'close' | 'wrong';
  credit: number;
};

const LANGUAGE_NAMES: Record<Language, string> = {
  italian: 'Italian',
  french: 'French',
  spanish: 'Spanish',
  armenian: 'Western Armenian',
};

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function exactCredit(value: string, expected: string) {
  return scoreVocabularyAnswer(value, expected) === 1;
}

function gradeColor(grade: VocabularyTestGrade, colors: ReturnType<typeof useColors>) {
  if (grade === 'A') return colors.success;
  if (grade === 'B') return colors.primary;
  if (grade === 'C') return colors.secondary;
  if (grade === 'D') return '#D97706';
  return colors.destructive;
}

export default function VocabularyTestScreen() {
  const params = useLocalSearchParams<{
    categoryId?: string;
    levelIndex?: string;
    language?: string;
    returnTo?: string;
  }>();
  const categoryId = params.categoryId ?? '';
  const parsedLevel = Number.parseInt(params.levelIndex ?? '', 10);
  const levelIndex = Number.isInteger(parsedLevel) && parsedLevel >= 0 ? parsedLevel : 0;
  const {
    activeLanguage,
    getVocabularyTestBestScore,
    saveVocabularyTestBestScore,
    recordWordAnswer,
  } = useGame();
  const language = (['italian', 'french', 'spanish', 'armenian'].includes(params.language ?? '')
    ? params.language
    : activeLanguage) as Language;
  const category = CATEGORIES.find(item => item.id === categoryId);
  const pairs = useMemo(
    () => getCumulativePairs(category, levelIndex),
    [category, levelIndex],
  );
  const bestScore = getVocabularyTestBestScore(categoryId, levelIndex, language);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playCorrect, playWrong } = useSound();

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [correction, setCorrection] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const answeredRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savedResult, setSavedResult] = useState<{
    score: number;
    total: number;
    bestScore: number;
    bestTotal: number;
    improved: boolean;
  } | null>(null);

  const currentPair = pairs[index];
  const expected = currentPair?.translations[language] ?? '';
  const currentGrade = gradeVocabularyTest(score, pairs.length);
  const bestGrade = savedResult
    ? gradeVocabularyTest(savedResult.bestScore, savedResult.bestTotal)
    : bestScore
      ? gradeVocabularyTest(bestScore.score, bestScore.total)
      : null;
  const correctionIsExact = feedback ? exactCredit(correction, expected) : false;
  const topPad = Platform.OS === 'web' ? 24 : insets.top;
  const bottomPad = Math.max(Platform.OS === 'web' ? 20 : insets.bottom, 12);

  const leaveTest = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(categoryId ? `/levels?categoryId=${categoryId}` as any : '/categories' as any);
    }
  };

  const continueToNext = async () => {
    Keyboard.dismiss();
    if (index + 1 < pairs.length) {
      setIndex(current => current + 1);
      setAnswer('');
      setCorrection('');
      setFeedback(null);
      answeredRef.current = false;
      return;
    }

    setIsSaving(true);
    setSaveError(false);
    try {
      const best = await saveVocabularyTestBestScore(
        categoryId,
        levelIndex,
        score,
        pairs.length,
        language,
      );
      setSavedResult({
        score,
        total: pairs.length,
        bestScore: best.score,
        bestTotal: best.total,
        improved: best.improved,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    if (!feedback) {
      if (answeredRef.current) return;
      answeredRef.current = true;
      const credit = scoreVocabularyAnswer(answer, expected);
      const kind: Feedback['kind'] = credit === 1 ? 'correct' : credit === 0.5 ? 'close' : 'wrong';
      setFeedback({ kind, credit });
      setScore(current => current + credit);
      recordWordAnswer(currentPair.english, credit === 1, categoryId, levelIndex, language);
      if (credit === 1) {
        playCorrect();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        playWrong();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Keyboard.dismiss();
      return;
    }
    if (feedback.kind !== 'correct' && !correctionIsExact) return;
    void continueToNext();
  };

  const restartTest = () => {
    setStarted(true);
    setIndex(0);
    setAnswer('');
    setCorrection('');
    setFeedback(null);
    setScore(0);
    answeredRef.current = false;
    setSavedResult(null);
    setSaveError(false);
  };

  if (!category || !category.levels[levelIndex] || pairs.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.groupedBackground }]}>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>This test isn’t available</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Return to the lesson list and choose a vocabulary level.
        </Text>
        <TouchableOpacity onPress={leaveTest} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryButtonText}>Back to lessons</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = pairs.length ? (index / pairs.length) * 100 : 0;
  const actionDisabled =
    (started && !feedback && !answer.trim()) ||
    (started && feedback !== null && feedback.kind !== 'correct' && !correctionIsExact) ||
    isSaving;

  return (
    <View style={[styles.screen, { backgroundColor: colors.groupedBackground, paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={leaveTest}
          accessibilityRole="button"
          accessibilityLabel="Exit vocabulary test"
          testID="vocabulary-test-back"
          style={[styles.iconButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="close" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.progressBlock}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${savedResult ? 100 : progress}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {savedResult ? `${pairs.length} / ${pairs.length}` : started ? `${index + 1} / ${pairs.length}` : `${pairs.length} words`}
          </Text>
        </View>
        <View style={[styles.pointsPill, { backgroundColor: colors.card }]}>
          <Ionicons name="star" size={15} color="#F4B740" />
          <Text style={[styles.pointsText, { color: colors.foreground }]}>{formatScore(score)}</Text>
        </View>
      </View>

      {savedResult ? (
        <ScrollView
          contentContainerStyle={[styles.resultContent, { paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.resultIcon, { backgroundColor: gradeColor(currentGrade, colors) + '1A' }]}>
            <Text style={[styles.resultGrade, { color: gradeColor(currentGrade, colors) }]}>{currentGrade}</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Word test complete</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {category.name} · Level {levelIndex + 1}
          </Text>
          <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>This attempt</Text>
              <Text style={[styles.scoreValue, { color: gradeColor(currentGrade, colors) }]}>
                {currentGrade} · {formatScore(savedResult.score)} / {savedResult.total}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Personal best</Text>
              <Text style={[styles.scoreValue, { color: gradeColor(bestGrade ?? 'F', colors) }]}>
                {bestGrade} · {formatScore(savedResult.bestScore)} / {savedResult.bestTotal}
              </Text>
            </View>
          </View>
          <Text style={[styles.resultMessage, { color: colors.mutedForeground }]}>
            {savedResult.improved
              ? 'New personal best saved for this level.'
              : 'Your previous best is safe. Replay this test whenever you want to improve it.'}
          </Text>
          <TouchableOpacity
            onPress={restartTest}
            accessibilityRole="button"
            accessibilityLabel="Retake vocabulary test to improve your grade"
            testID="vocabulary-test-retry"
            activeOpacity={0.86}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="refresh" size={19} color={colors.primaryForeground} />
            <Text style={styles.primaryButtonText}>Try to improve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={leaveTest}
            accessibilityRole="button"
            testID="vocabulary-test-done"
            style={[styles.secondaryButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : !started ? (
        <ScrollView
          contentContainerStyle={[styles.introContent, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#2F6BEA', '#766BEA']}
            style={styles.introHero}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="create" size={28} color="#2563EB" />
            </View>
            <Text style={styles.heroEyebrow}>OPTIONAL · LEVEL {levelIndex + 1}</Text>
            <Text style={styles.heroTitle}>Show what you know</Text>
            <Text style={styles.heroSubtitle}>
              Type {pairs.length} {LANGUAGE_NAMES[language]} words from “{category.name}” and earn a lasting grade.
            </Text>
          </LinearGradient>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark-circle" size={19} color={colors.primary} />
              </View>
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                Exact spelling earns 1 point; a small typo earns half a point.
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="refresh" size={19} color="#B7791F" />
              </View>
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                If you miss a word, type the correct spelling once before moving on.
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="bookmark" size={19} color="#6D5BD0" />
              </View>
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                Your best grade is saved. Retake the test later to improve it.
              </Text>
            </View>
          </View>
          {bestScore && (
            <View style={[styles.bestNotice, { backgroundColor: colors.card }]}>
              <Ionicons name="trophy" size={18} color="#E1A72D" />
              <Text style={[styles.bestNoticeText, { color: colors.foreground }]}>
                Current best: {gradeVocabularyTest(bestScore.score, bestScore.total)} · {formatScore(bestScore.score)} / {bestScore.total}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleAction}
            accessibilityRole="button"
            accessibilityLabel="Begin optional vocabulary test"
            testID="vocabulary-test-start"
            activeOpacity={0.86}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryButtonText}>Begin test</Text>
            <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={styles.playArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? topPad + 20 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.questionContent, { paddingBottom: 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.questionEyebrow, { color: colors.mutedForeground }]}>
              {category.name.toUpperCase()} · TYPE THE WORD
            </Text>
            <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
              <View style={[styles.questionIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="chatbubble-ellipses" size={21} color={colors.primary} />
              </View>
              <Text style={[styles.questionLabel, { color: colors.mutedForeground }]}>How do you say</Text>
              <Text style={[styles.englishPrompt, { color: colors.foreground }]}>{currentPair.english}</Text>
              <Text style={[styles.questionLabel, { color: colors.mutedForeground }]}>
                in {LANGUAGE_NAMES[language]}?
              </Text>
              {!feedback ? (
                <TextInput
                  value={answer}
                  onChangeText={setAnswer}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  returnKeyType="done"
                  onSubmitEditing={handleAction}
                  accessibilityLabel={`Type the ${LANGUAGE_NAMES[language]} word for ${currentPair.english}`}
                  testID="vocabulary-test-answer"
                  placeholder="Type your answer"
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.answerInput,
                    { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.groupedBackground },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.feedbackBox,
                    {
                      backgroundColor: feedback.kind === 'correct' ? colors.success + '18' : colors.destructive + '12',
                      borderColor: feedback.kind === 'correct' ? colors.success + '55' : colors.destructive + '44',
                    },
                  ]}
                >
                  <View style={styles.feedbackHeading}>
                    <Ionicons
                      name={feedback.kind === 'correct' ? 'checkmark-circle' : 'information-circle'}
                      size={20}
                      color={feedback.kind === 'correct' ? colors.success : colors.destructive}
                    />
                    <Text style={[
                      styles.feedbackTitle,
                      { color: feedback.kind === 'correct' ? colors.success : colors.destructive },
                    ]}>
                      {feedback.kind === 'correct' ? 'Correct · 1 point' : feedback.kind === 'close' ? 'Close · half a point' : 'Not quite · 0 points'}
                    </Text>
                  </View>
                  <View style={styles.correctAnswerRow}>
                    <Text style={[styles.correctAnswer, { color: colors.foreground }]}>{expected}</Text>
                    <SpeakerButton
                      text={expected}
                      language={language}
                      accessibilityLabel={`Hear ${expected}`}
                      testID="vocabulary-test-hear-answer"
                      compact
                    />
                  </View>
                  {feedback.kind !== 'correct' && (
                    <>
                      <Text style={[styles.correctionHint, { color: colors.mutedForeground }]}>
                        Type the correct spelling once to continue.
                      </Text>
                      <TextInput
                        value={correction}
                        onChangeText={setCorrection}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        returnKeyType="done"
                        onSubmitEditing={() => correctionIsExact && void continueToNext()}
                        accessibilityLabel={`Retype ${expected} to continue`}
                        testID="vocabulary-test-correction"
                        placeholder="Type the word again"
                        placeholderTextColor={colors.mutedForeground}
                        style={[
                          styles.correctionInput,
                          {
                            color: colors.foreground,
                            borderColor: correctionIsExact ? colors.success : colors.border,
                            backgroundColor: colors.card,
                          },
                        ]}
                      />
                    </>
                  )}
                </View>
              )}
            </View>
            {saveError && (
              <View style={[styles.saveError, { backgroundColor: colors.destructive + '12' }]}>
                <Text style={[styles.saveErrorText, { color: colors.destructive }]}>
                  Your grade couldn’t be saved. Try again; your answers are still here.
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: bottomPad }]}>
            <TouchableOpacity
              onPress={handleAction}
              disabled={actionDisabled}
              accessibilityRole="button"
              accessibilityLabel={!feedback ? 'Check answer' : feedback.kind === 'correct' || correctionIsExact ? 'Continue to next word' : 'Type the correct word to continue'}
              testID="vocabulary-test-check"
              activeOpacity={0.85}
              style={[
                styles.primaryButton,
                { backgroundColor: actionDisabled ? colors.muted : colors.primary },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Text style={[
                    styles.primaryButtonText,
                    actionDisabled && { color: colors.mutedForeground },
                  ]}>
                    {!feedback ? 'Check' : feedback.kind !== 'correct' && !correctionIsExact ? 'Type it to continue' : index === pairs.length - 1 ? 'See my grade' : 'Continue'}
                  </Text>
                  <Ionicons
                    name={!feedback ? 'checkmark' : 'arrow-forward'}
                    size={19}
                    color={actionDisabled ? colors.mutedForeground : colors.primaryForeground}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  progressBlock: { flex: 1, gap: 5 },
  progressTrack: { height: 8, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  progressLabel: { fontFamily: 'Nunito_700Bold', fontSize: 11, textAlign: 'right' },
  pointsPill: { height: 36, borderRadius: 18, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pointsText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  introContent: { flexGrow: 1, padding: 20, paddingTop: 10, justifyContent: 'center', gap: 16 },
  introHero: { borderRadius: 26, padding: 22, minHeight: 214, justifyContent: 'flex-end', overflow: 'hidden' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  heroEyebrow: { fontFamily: 'Nunito_800ExtraBold', color: 'rgba(255,255,255,0.82)', fontSize: 11, letterSpacing: 1.1 },
  heroTitle: { fontFamily: 'Nunito_800ExtraBold', color: 'white', fontSize: 27, lineHeight: 34, marginTop: 4 },
  heroSubtitle: { fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 20, marginTop: 4 },
  infoCard: { borderRadius: 22, padding: 16, gap: 15, shadowColor: '#172A5C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20 },
  bestNotice: { minHeight: 46, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  bestNoticeText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  primaryButton: { minHeight: 54, borderRadius: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryButtonText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  secondaryButton: { minHeight: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  playArea: { flex: 1 },
  questionContent: { flexGrow: 1, padding: 20, paddingTop: 14, justifyContent: 'center', gap: 12 },
  questionEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 1, textAlign: 'center' },
  questionCard: { borderRadius: 25, padding: 20, alignItems: 'center', gap: 8, shadowColor: '#172A5C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.055, shadowRadius: 12, elevation: 2 },
  questionIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  questionLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  englishPrompt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 29, lineHeight: 36, textAlign: 'center', marginVertical: 2 },
  answerInput: { width: '100%', minHeight: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, marginTop: 12, fontFamily: 'Nunito_700Bold', fontSize: 18, textAlign: 'center' },
  feedbackBox: { width: '100%', borderRadius: 17, borderWidth: 1, padding: 14, marginTop: 12 },
  feedbackHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  feedbackTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, flex: 1 },
  correctAnswerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 7 },
  correctAnswer: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, textAlign: 'center' },
  correctionHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 8 },
  correctionInput: { width: '100%', minHeight: 48, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 13, marginTop: 9, fontFamily: 'Nunito_700Bold', fontSize: 16, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 10 },
  saveError: { borderRadius: 13, padding: 12 },
  saveErrorText: { fontFamily: 'Nunito_700Bold', fontSize: 13, textAlign: 'center' },
  resultContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  resultIcon: { width: 104, height: 104, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  resultGrade: { fontFamily: 'Nunito_800ExtraBold', fontSize: 52 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 27, lineHeight: 34, textAlign: 'center' },
  body: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  scoreCard: { width: '100%', borderRadius: 20, padding: 16, gap: 13, marginTop: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scoreLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  scoreValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth },
  resultMessage: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 330 },
  errorTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, textAlign: 'center' },
});
