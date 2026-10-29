import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { useClassicGameResult } from '@/hooks/useClassicGameResult';
import { CATEGORIES, LANGUAGE_META, getUniqueVocabularyPairs } from '@/data/vocabulary';
import { getFillBlankGrammarPrompts } from '@/data/fill-blank-grammar';
import { useSound } from '@/hooks/useSound';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';
import { goBackOr } from '@/lib/navigation';
import {
  buildFillBlankLevels,
  fillBlankStars,
  type FillBlankLevel,
  type FillBlankQuestion,
} from '@/lib/fill-blank-game';
import { usePreloadSpeech } from '@/components/SpeakerButton';

type Phase = 'levels' | 'playing' | 'complete';
const MAX_HEARTS = 5;

export default function FillInTheBlankScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    activeLanguage,
    completeLevel,
    getLevelStars,
    isLevelCompleted,
    recordWordAnswer,
    isMuted,
    toggleMute,
  } = useGame();
  const { report: reportClassic } = useClassicGameResult('fillblank');
  const { playCorrect, playWrong, speakCorrectAnswer } = useSound();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom;
  const vocabulary = useMemo(() => getUniqueVocabularyPairs(activeLanguage), [activeLanguage]);
  const grammarPrompts = useMemo(
    () => getFillBlankGrammarPrompts(activeLanguage),
    [activeLanguage],
  );
  const levels = useMemo(
    () => buildFillBlankLevels(CATEGORIES, vocabulary, activeLanguage, undefined, undefined, grammarPrompts),
    [activeLanguage, grammarPrompts, vocabulary],
  );
  const [phase, setPhase] = useState<Phase>('levels');
  const [levelIndex, setLevelIndex] = useState<number | null>(null);
  const [session, setSession] = useState<FillBlankQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [saving, setSaving] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const current = session[questionIndex];
  usePreloadSpeech(session.map(question => question.answer), activeLanguage);
  const heartsRemaining = Math.max(0, MAX_HEARTS - mistakes);
  const extraMistakes = Math.max(0, mistakes - MAX_HEARTS);
  const selectedOption = current && selectedOptionIndex !== null
    ? current.options[selectedOptionIndex]
    : undefined;

  const startLevel = (level: FillBlankLevel) => {
    setLevelIndex(level.index);
    setSession(level.questions);
    setQuestionIndex(0);
    setSelectedOptionIndex(null);
    setFeedback(null);
    setMistakes(0);
    setEarnedStars(0);
    setPhase('playing');
  };

  const checkAnswer = () => {
    if (!current || feedback || selectedOptionIndex === null) return;
    const isCorrect = selectedOption?.word === current.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      setMistakes(count => count + 1);
      shake.value = withSequence(
        withTiming(-7, { duration: 45 }),
        withTiming(7, { duration: 45 }),
        withTiming(-5, { duration: 40 }),
        withTiming(0, { duration: 45 }),
      );
    }
    if (current.reviewWordEnglish) {
      recordWordAnswer(current.reviewWordEnglish, isCorrect, undefined, undefined, activeLanguage);
    }
    speakCorrectAnswer(current.answer, activeLanguage);
    if (isCorrect) {
      playCorrect();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      playWrong();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const continueQuestion = async () => {
    if (!feedback || levelIndex === null) return;
    if (questionIndex < session.length - 1) {
      setQuestionIndex(index => index + 1);
      setSelectedOptionIndex(null);
      setFeedback(null);
      return;
    }
    const stars = fillBlankStars(mistakes);
    setSaving(true);
    try {
      await completeLevel('fill-in-the-blank', levelIndex, stars, activeLanguage);
      reportClassic(stars);
      setEarnedStars(stars);
      setPhase('complete');
    } finally {
      setSaving(false);
    }
  };

  const leaveGame = () => {
    if (phase === 'playing' || phase === 'complete') {
      setPhase('levels');
      setLevelIndex(null);
      return;
    }
    goBackOr('/categories');
  };

  const languageName = LANGUAGE_META[activeLanguage].label;
  const heartsColor = mistakes > 2 ? colors.destructive : colors.primary;
  const levelTitle = levelIndex === null ? '' : `Level ${levelIndex + 1}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.header, { paddingTop: topPad + 7 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={phase === 'levels' ? 'Go back to lessons' : 'Back to fill-in levels'}
          onPress={leaveGame}
          activeOpacity={0.75}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="arrow-back" size={19} color={colors.foreground} />
        </TouchableOpacity>
        {phase !== 'levels' ? (
          <>
            <View style={styles.progressCopy}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {phase === 'complete' ? 'SET COMPLETE' : `${questionIndex + 1} / ${session.length}`}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${phase === 'complete' ? 100 : ((questionIndex + (feedback ? 1 : 0)) / Math.max(session.length, 1)) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={[styles.heartPill, { backgroundColor: colors.card }]}>
              <Ionicons name="heart" size={15} color={heartsColor} />
              <Text style={[styles.heartText, { color: colors.foreground }]}>{heartsRemaining}</Text>
              {extraMistakes > 0 && <Text style={[styles.extraMistakes, { color: colors.destructive }]}>+{extraMistakes}</Text>}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Turn sound on' : 'Turn sound off'}
              onPress={toggleMute}
              activeOpacity={0.75}
              style={[styles.soundButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={17} color={colors.foreground} />
            </TouchableOpacity>
          </>
        ) : <View style={styles.headerSpacer} />}
      </View>

      {phase === 'levels' && (
        <ScrollView
          contentContainerStyle={[styles.levelContent, { paddingBottom: bottomPad + 26 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{languageName.toUpperCase()} · WORDS IN CONTEXT</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Fill in the blank</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Recall vocabulary from every topic, including grammar words and verb forms.
          </Text>
          {levels.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.destructive} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>
                No fill-in questions are available for {languageName} yet.
              </Text>
            </View>
          ) : (
            <View style={styles.levelGrid}>
              {levels.map(level => {
                const stars = getLevelStars('fill-in-the-blank', level.index);
                const completed = isLevelCompleted('fill-in-the-blank', level.index);
                return (
                  <TouchableOpacity
                    key={level.index}
                    accessibilityRole="button"
                    accessibilityLabel={`Start level ${level.index + 1}, ${level.questions.length} questions${completed ? `, ${stars} stars earned` : ''}`}
                    testID={`fill-in-the-blank-level-${level.index + 1}`}
                    onPress={() => startLevel(level)}
                    activeOpacity={0.82}
                    style={[styles.levelCard, { backgroundColor: colors.card }]}
                  >
                    <View style={styles.levelTop}>
                      <View style={[styles.levelNumber, { backgroundColor: completed ? colors.primary : colors.accent }]}>
                        {completed
                          ? <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
                          : <Text style={[styles.levelNumberText, { color: colors.primary }]}>{level.index + 1}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                    </View>
                    <Text style={[styles.levelTitle, { color: colors.foreground }]}>Level {level.index + 1}</Text>
                    <Text style={[styles.levelSubtitle, { color: colors.mutedForeground }]}>{level.questions.length} questions</Text>
                    <View style={styles.stars}>
                      {[0, 1, 2].map(star => (
                        <Ionicons
                          key={star}
                          name={star < stars ? 'star' : 'star-outline'}
                          size={12}
                          color={star < stars ? colors.primary : colors.mutedForeground}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {phase === 'playing' && current && (
        <>
          <ScrollView
            contentContainerStyle={styles.playContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              {current.categoryName.toUpperCase()} · {levelTitle.toUpperCase()}
            </Text>
            <Text style={[styles.playTitle, { color: colors.foreground }]}>Choose the missing word</Text>
            <View style={[styles.sentenceCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sentenceLabel, { color: colors.mutedForeground }]}>
                {LANGUAGE_META[activeLanguage].flag} {languageName.toUpperCase()}
              </Text>
              <Animated.View style={[styles.sentenceLine, shakeStyle]}>
                <Text style={[styles.sentenceBefore, { color: colors.foreground }]}>{current.beforeBlank}</Text>
                <View
                  style={[
                    styles.blankPill,
                    {
                      backgroundColor: feedback === 'correct'
                        ? colors.success + '20'
                        : feedback === 'wrong'
                          ? colors.destructive + '18'
                          : colors.accent,
                      borderColor: feedback === 'wrong' ? colors.destructive : colors.primary,
                    },
                  ]}
                >
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[
                      styles.blankText,
                      { color: feedback === 'wrong' ? colors.destructive : colors.primary },
                    ]}
                  >
                    {feedback === 'wrong' ? current.answer : selectedOption?.word ?? '_____'}
                  </Text>
                </View>
                <Text style={[styles.sentenceAfter, { color: colors.foreground }]}>{current.afterBlank}</Text>
              </Animated.View>
              <Text style={[styles.englishTranslation, { color: colors.mutedForeground }]}>
                {current.englishTranslation}
              </Text>
            </View>

            {feedback && (
              <View style={[
                styles.feedbackCard,
                { backgroundColor: feedback === 'correct' ? colors.success + '18' : colors.destructive + '15' },
              ]}>
                <Ionicons
                  name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={feedback === 'correct' ? colors.success : colors.destructive}
                />
                <View style={styles.feedbackCopy}>
                  <Text style={[
                    styles.feedbackTitle,
                    { color: feedback === 'correct' ? colors.success : colors.destructive },
                  ]}>
                    {feedback === 'correct' ? 'Correct' : 'The correct word is'}
                  </Text>
                  <Text style={[styles.feedbackAnswer, { color: colors.foreground }]}>{current.answer}</Text>
                  {current.explanation ? (
                    <Text style={[styles.feedbackExplanation, { color: colors.mutedForeground }]}>
                      {current.explanation}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE A WORD</Text>
            <View style={styles.optionGrid}>
              {current.options.map((option, index) => {
                const selected = selectedOptionIndex === index;
                const isAnswer = option.word === current.answer;
                let backgroundColor = colors.card;
                let borderColor = colors.border;
                if (feedback && isAnswer) {
                  backgroundColor = colors.success + '18';
                  borderColor = colors.success;
                } else if (feedback === 'wrong' && selected) {
                  backgroundColor = colors.destructive + '16';
                  borderColor = colors.destructive;
                } else if (selected) {
                  backgroundColor = colors.accent;
                  borderColor = colors.primary;
                }
                return (
                  <TouchableOpacity
                    key={`${option.english}-${index}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Choice ${index + 1}: ${option.word}`}
                    testID={`fill-in-the-blank-option-${index + 1}`}
                    disabled={Boolean(feedback)}
                    onPress={() => setSelectedOptionIndex(index)}
                    activeOpacity={0.8}
                    style={[styles.optionTile, { backgroundColor, borderColor }]}
                  >
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.78}
                      numberOfLines={2}
                      style={[styles.optionText, { color: colors.foreground }]}
                    >
                      {option.word}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <View style={[styles.bottomAction, { paddingBottom: Math.max(14, bottomPad + 8), backgroundColor: colors.groupedBackground }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={feedback ? 'Continue to the next fill-in question' : 'Check selected word'}
              testID="fill-in-the-blank-check"
              disabled={saving || (!feedback && selectedOptionIndex === null)}
              onPress={feedback ? continueQuestion : checkAnswer}
              activeOpacity={0.82}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                (!feedback && selectedOptionIndex === null) && { opacity: 0.52 },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                {saving ? 'Saving…' : feedback ? (questionIndex === session.length - 1 ? 'Finish level' : 'Continue') : 'Check'}
              </Text>
              <Ionicons name={feedback ? 'arrow-forward' : 'checkmark'} size={19} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {phase === 'complete' && (
        <View style={styles.completeWrap}>
          <View style={[styles.completeCard, { backgroundColor: colors.card }]}>
            <View style={[styles.completeIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="trophy" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.completeTitle, { color: colors.foreground }]}>Level complete</Text>
            <Text style={[styles.completeSubtitle, { color: colors.mutedForeground }]}>
              {levelTitle} · {session.length} words practiced across topics
            </Text>
            <View style={styles.completeStars}>
              {[0, 1, 2].map(star => (
                <Ionicons
                  key={star}
                  name={star < earnedStars ? 'star' : 'star-outline'}
                  size={25}
                  color={star < earnedStars ? colors.primary : colors.mutedForeground}
                />
              ))}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose another fill-in level"
              onPress={() => {
                setPhase('levels');
                setLevelIndex(null);
              }}
              activeOpacity={0.82}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Choose another level</Text>
              <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Return to lessons"
              onPress={() => goBackOr('/categories')}
              activeOpacity={0.8}
              style={styles.backToLessons}
            >
              <Text style={[styles.backToLessonsText, { color: colors.primary }]}>Back to lessons</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 13 },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { flex: 1 },
  progressCopy: { flex: 1, gap: 6 },
  progressLabel: { ...typography.micro, fontSize: 10 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  heartPill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, borderRadius: 17, paddingHorizontal: 10 },
  heartText: { fontSize: 12, fontWeight: '800' },
  extraMistakes: { fontSize: 9, fontWeight: '800' },
  soundButton: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  levelContent: { paddingHorizontal: 20, paddingTop: 4 },
  eyebrow: { ...typography.micro, fontSize: 10, marginBottom: 6 },
  title: { ...typography.largeTitle },
  subtitle: { ...typography.caption, lineHeight: 19, marginTop: 6 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 20 },
  levelCard: {
    width: '48.2%',
    minHeight: 116,
    borderRadius: 18,
    padding: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },
  levelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelNumber: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levelNumberText: { fontSize: 13, fontWeight: '800' },
  levelTitle: { ...typography.headline, marginTop: 8 },
  levelSubtitle: { fontSize: 9, marginTop: 3 },
  stars: { flexDirection: 'row', gap: 2, marginTop: 6 },
  emptyCard: { marginTop: 22, borderRadius: 18, padding: 18, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  playContent: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 20 },
  playTitle: { ...typography.title, marginBottom: 15 },
  sentenceCard: { borderRadius: 18, padding: 15, marginBottom: 16 },
  sentenceLabel: { ...typography.micro, fontSize: 10, marginBottom: 9 },
  sentenceLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  sentenceBefore: { ...typography.body, flexShrink: 1, lineHeight: 25 },
  sentenceAfter: { ...typography.body, flexShrink: 1, lineHeight: 25 },
  blankPill: { minHeight: 32, maxWidth: '100%', borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  blankText: { ...typography.caption },
  englishTranslation: { fontSize: 12, lineHeight: 17, marginTop: 11 },
  feedbackCard: { flexDirection: 'row', gap: 9, borderRadius: 15, padding: 11, marginBottom: 15, alignItems: 'flex-start' },
  feedbackCopy: { flex: 1, gap: 4 },
  feedbackTitle: { ...typography.caption },
  feedbackAnswer: { ...typography.body },
  feedbackExplanation: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  sectionLabel: { ...typography.micro, fontSize: 10, marginBottom: 8 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 9 },
  optionTile: { width: '48.5%', minHeight: 56, borderWidth: 1, borderBottomWidth: 3, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 8 },
  optionText: { ...typography.wordTile, fontSize: 15, lineHeight: 19, textAlign: 'center', flexShrink: 1 },
  bottomAction: { paddingHorizontal: 18, paddingTop: 10 },
  primaryButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { ...typography.body },
  completeWrap: { flex: 1, justifyContent: 'center', padding: 22 },
  completeCard: { borderRadius: 24, padding: 22, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  completeIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  completeTitle: { ...typography.title, textAlign: 'center' },
  completeSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 6 },
  completeStars: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  backToLessons: { minHeight: 42, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  backToLessonsText: { ...typography.caption },
});
