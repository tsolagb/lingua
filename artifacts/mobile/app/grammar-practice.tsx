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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { LANGUAGE_META, type Language } from '@/data/vocabulary';
import {
  getGrammarCourse,
  type GrammarBand,
  type GrammarPracticeQuestion,
  type GrammarUnit,
  type GrammarUnitId,
} from '@/data/grammar-curriculum';
import { getPracticeStars } from '@/data/lesson-practice';
import { transliterateWesternArmenian } from '@/data/armenian-transliteration';
import { goBackOr } from '@/lib/navigation';
import { usePreloadSpeech } from '@/components/SpeakerButton';

type Feedback = 'correct' | 'try-again' | null;
type TotalDifficulty = 'easy' | 'medium' | 'hard';
type TotalQuestionEntry = { question: GrammarPracticeQuestion; unit: GrammarUnit };

const TOTAL_DIFFICULTIES: { id: TotalDifficulty; label: string; help: string }[] = [
  { id: 'easy', label: 'Easy', help: 'Grammar rule and English translation' },
  { id: 'medium', label: 'Medium', help: 'Tense or topic hint, no translation' },
  { id: 'hard', label: 'Hard', help: 'No hints before you answer' },
];
const TOTAL_DIFFICULTY_INDEX: Record<TotalDifficulty, number> = { easy: 0, medium: 1, hard: 2 };

function shuffleEntries<T>(entries: readonly T[]): T[] {
  const shuffled = [...entries];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function grammarUnitCue(unit: GrammarUnit): string {
  const cues: Partial<Record<GrammarUnitId, string>> = {
    presentTense: 'Present tense',
    pastTenses: 'Past tense',
    futureTenses: 'Future tense',
    conditionalMood: 'Conditional mood',
    conditionalClauses: 'Conditional clauses',
    subjunctive: 'Subjunctive mood',
    advancedSubjunctive: 'Subjunctive mood',
    compoundTenses: 'Compound tense',
    imperatives: 'Imperative',
  };
  return cues[unit.id as GrammarUnitId] ?? unit.title;
}

function foundationRoute(
  language: Language,
  area: 'articles' | 'numbers' | 'alphabet' | 'prepositions' | 'verbs',
) {
  return {
    pathname: language === 'italian' ? '/italian-foundations' : '/language-foundations',
    params: { area },
  } as any;
}

export default function GrammarPracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage, completeLevel, getLevelStars } = useGame();
  const { speakCorrectAnswer } = useSound();
  const course = useMemo(() => getGrammarCourse(activeLanguage), [activeLanguage]);
  const allUnits = useMemo(() => course.flatMap(section => section.units), [course]);
  const [activeBand, setActiveBand] = useState<GrammarBand>('A1');
  const [activeUnitId, setActiveUnitId] = useState<GrammarUnitId | null>(null);
  const [selectedTotalDifficulty, setSelectedTotalDifficulty] = useState<TotalDifficulty>('easy');
  const [activeDifficulty, setActiveDifficulty] = useState<TotalDifficulty | null>(null);
  const [totalEntries, setTotalEntries] = useState<TotalQuestionEntry[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [roundKey, setRoundKey] = useState(0);

  const activeSection = course.find(section => section.band === activeBand) ?? course[0];
  const activeUnit = allUnits.find(unit => unit.id === activeUnitId);
  const activeUnitIndex = activeUnit ? allUnits.findIndex(unit => unit.id === activeUnit.id) : -1;
  const questions = useMemo(
    () => activeDifficulty ? totalEntries.map(entry => entry.question) : activeUnit?.questions ?? [],
    [activeDifficulty, activeUnit, totalEntries],
  );
  const totalEntry = activeDifficulty ? totalEntries[questionIndex] : undefined;
  const questionUnit = totalEntry?.unit ?? activeUnit;
  const question = questions[questionIndex];
  const isInPractice = Boolean(activeUnit || activeDifficulty);
  const showRuleHelp = !activeDifficulty || activeDifficulty === 'easy';
  const showTranslation = !activeDifficulty || activeDifficulty === 'easy';
  usePreloadSpeech(questions.map(item => item.answer), activeLanguage);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const unitProgress = (unit: GrammarUnit) => {
    if (unit.foundationArea && unit.foundationProgressIndexes?.length) {
      const completed = unit.foundationProgressIndexes.filter(index =>
        getLevelStars(`${activeLanguage}-foundations`, index) > 0,
      ).length;
      return Math.round((completed / unit.foundationProgressIndexes.length) * 100);
    }
    const index = allUnits.findIndex(candidate => candidate.id === unit.id);
    return getLevelStars('grammar-course', index) > 0 ? 100 : 0;
  };

  const bandProgress = course.map(section => {
    const completed = section.units.filter(unit => unitProgress(unit) === 100).length;
    return { ...section, percentage: Math.round((completed / Math.max(section.units.length, 1)) * 100) };
  });
  const totalCompleted = allUnits.filter(unit => unitProgress(unit) === 100).length;
  const totalProgress = Math.round((totalCompleted / Math.max(allUnits.length, 1)) * 100);

  const resetPractice = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setCorrectAnswers(0);
    setFinished(false);
    setSaveError(false);
    setRoundKey(key => key + 1);
  };

  const openUnit = (unit: GrammarUnit) => {
    if (unit.foundationArea) {
      router.push(foundationRoute(activeLanguage, unit.foundationArea));
      return;
    }
    setActiveDifficulty(null);
    setTotalEntries([]);
    setActiveUnitId(unit.id as GrammarUnitId);
    resetPractice();
  };

  const startTotalPractice = (difficulty: TotalDifficulty) => {
    const pool = shuffleEntries(
      allUnits.flatMap(unit => unit.questions.map(question => ({ question, unit }))),
    );
    const mixed = pool.slice(0, Math.min(12, pool.length));
    if (mixed.length === 0) return;
    setActiveUnitId(null);
    setSelectedTotalDifficulty(difficulty);
    setActiveDifficulty(difficulty);
    setTotalEntries(mixed);
    resetPractice();
  };

  const returnToCourse = () => {
    setActiveUnitId(null);
    setActiveDifficulty(null);
    setTotalEntries([]);
    resetPractice();
  };

  const selectAnswer = (answer: string) => {
    if (!question || feedback === 'correct') return;
    setSelectedAnswer(answer);
    const correct = answer === question.answer;
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setFeedback(correct ? 'correct' : 'try-again');
    if (correct) {
      setCorrectAnswers(count => count + 1);
      speakCorrectAnswer(question.answer, activeLanguage);
    }
  };

  const savePractice = async () => {
    const practiceIndex = activeDifficulty
      ? TOTAL_DIFFICULTY_INDEX[activeDifficulty]
      : activeUnitIndex;
    if (practiceIndex < 0) return false;
    setSaving(true);
    setSaveError(false);
    try {
      await completeLevel(
        activeDifficulty ? 'grammar-total-practice' : 'grammar-course',
        practiceIndex,
        getPracticeStars(correctAnswers, questions.length),
        activeLanguage,
      );
      return true;
    } catch {
      setSaveError(true);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const continuePractice = async () => {
    if (feedback !== 'correct') return;
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex(index => index + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      return;
    }
    await savePractice();
    setFinished(true);
  };

  const startAnotherRound = () => {
    setFinished(false);
    if (activeDifficulty) startTotalPractice(activeDifficulty);
    else resetPractice();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isInPractice ? 'Back to grammar topics' : 'Go back'}
          onPress={isInPractice ? returnToCourse : () => goBackOr('/categories')}
          activeOpacity={0.75}
          style={[styles.backButton, { backgroundColor: colors.muted }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          {activeUnit
            ? activeSection.title
            : activeDifficulty
              ? `${activeLanguage === 'armenian' ? 'WESTERN ARMENIAN' : LANGUAGE_META[activeLanguage].label.toUpperCase()} · ${activeDifficulty.toUpperCase()} MIXED REVIEW`
              : `${activeLanguage === 'armenian' ? 'WESTERN ARMENIAN' : LANGUAGE_META[activeLanguage].label.toUpperCase()} · PRACTICAL COURSE`}
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {activeUnit ? activeUnit.title : activeDifficulty ? 'Total grammar practice' : 'Grammar practice'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {activeUnit
            ? activeUnit.description
            : activeDifficulty
              ? `Mixed questions from every grammar topic. ${TOTAL_DIFFICULTIES.find(item => item.id === activeDifficulty)?.help ?? ''}.`
              : 'A sentence-first path from beginner to upper-intermediate. Every lesson is open.'}
        </Text>
      </View>

      {isInPractice && question && !finished ? (
        <ScrollView
          key={`practice-${roundKey}`}
          contentContainerStyle={[styles.practiceContent, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questionProgressTop}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              QUESTION {questionIndex + 1} OF {questions.length}
            </Text>
            <Text style={[styles.progressLabel, { color: colors.primary }]}>
              {Math.round((questionIndex / questions.length) * 100)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(8, (questionIndex / questions.length) * 100)}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>

          {showRuleHelp && questionUnit && (
            <View style={[styles.lessonRule, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="sparkles-outline" size={19} color={colors.primary} />
              <View style={styles.ruleCopy}>
                <Text style={[styles.ruleLabel, { color: colors.mutedForeground }]}>
                  {activeDifficulty ? `EASY · ${grammarUnitCue(questionUnit).toUpperCase()}` : 'GRAMMAR RULE'}
                </Text>
                <Text style={[styles.ruleText, { color: colors.foreground }]}>{questionUnit.rule}</Text>
              </View>
            </View>
          )}
          {activeDifficulty === 'medium' && questionUnit && (
            <View style={[styles.focusHint, { backgroundColor: colors.accent }]}>
              <Ionicons name="compass-outline" size={17} color={colors.primary} />
              <Text style={[styles.focusHintText, { color: colors.primary }]}>
                {grammarUnitCue(questionUnit)}
              </Text>
            </View>
          )}

          <Text style={[styles.prompt, { color: colors.foreground }]}>{question.prompt}</Text>
          <View style={[styles.sentenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.targetSentence, { color: colors.foreground }]}>{question.sentence}</Text>
            {activeLanguage === 'armenian' && questionUnit && (questionUnit.band === 'A1' || questionUnit.band === 'A2') && (
              <Text style={[styles.transliteration, { color: colors.primary }]}>
                Latin reading: {transliterateWesternArmenian(question.sentence)}
              </Text>
            )}
            {showTranslation && (
              <>
                <View style={[styles.translationDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.translationLabel, { color: colors.mutedForeground }]}>FULL ENGLISH TRANSLATION</Text>
                <Text style={[styles.translationText, { color: colors.foreground }]}>{question.sentenceTranslation}</Text>
              </>
            )}
          </View>

          <View style={styles.answerList}>
            {question.choices.map((choice, index) => {
              const isSelected = selectedAnswer === choice;
              const isCorrect = feedback === 'correct' && isSelected;
              return (
                <TouchableOpacity
                  key={`${choice}-${index}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  testID={`grammar-answer-${index}`}
                  onPress={() => selectAnswer(choice)}
                  activeOpacity={0.8}
                  style={[
                    styles.answerButton,
                    {
                      backgroundColor: isCorrect ? colors.success + '18' : colors.card,
                      borderColor: isCorrect ? colors.success : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.answerText, { color: colors.foreground }]}>{choice}</Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {feedback === 'try-again' && (
            <View style={[styles.feedbackBox, { backgroundColor: colors.destructive + '18' }]}>
              <Ionicons name="refresh-outline" size={18} color={colors.destructive} />
              <Text style={[styles.feedbackText, { color: colors.destructive }]}>
                Correct answer: {question.answer}. {question.explanation}
              </Text>
            </View>
          )}
          {feedback === 'correct' && (
            <View style={[styles.feedbackBox, { backgroundColor: colors.success + '14' }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.feedbackText, { color: colors.foreground }]}>
                Why it works: {question.answer}. {question.explanation}
              </Text>
            </View>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: feedback !== 'correct' || saving }}
            testID="grammar-continue"
            disabled={feedback !== 'correct' || saving}
            onPress={continuePractice}
            activeOpacity={0.85}
            style={[
              styles.primaryButton,
              { backgroundColor: feedback === 'correct' ? colors.primary : colors.muted },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: feedback === 'correct' ? colors.primaryForeground : colors.mutedForeground }]}>
              {saving ? 'Saving…' : questionIndex + 1 === questions.length ? 'Finish lesson' : 'Continue'}
            </Text>
            <Ionicons
              name={questionIndex + 1 === questions.length ? 'checkmark' : 'arrow-forward'}
              size={18}
              color={feedback === 'correct' ? colors.primaryForeground : colors.mutedForeground}
            />
          </TouchableOpacity>
        </ScrollView>
      ) : isInPractice && finished ? (
        <ScrollView contentContainerStyle={[styles.finishContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.finishIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={30} color={colors.primary} />
          </View>
          <Text style={[styles.finishTitle, { color: colors.foreground }]}>
            {activeDifficulty ? 'Mixed review complete' : 'Lesson complete'}
          </Text>
          <Text style={[styles.finishSubtitle, { color: colors.mutedForeground }]}>
            {activeDifficulty
              ? `You reviewed ${questions.length} questions across the grammar course. Your ${activeDifficulty} score has been saved.`
              : `You worked through all ${questions.length} sentences. This topic is now marked complete.`}
          </Text>
          {saveError && (
            <View style={[styles.feedbackBox, { backgroundColor: colors.destructive + '18' }]}>
              <Text style={[styles.feedbackText, { color: colors.destructive }]}>Progress could not be saved. Please try again.</Text>
            </View>
          )}
          {saveError && (
            <TouchableOpacity
              accessibilityRole="button"
              testID="grammar-retry-save"
              onPress={async () => {
                const saved = await savePractice();
                if (saved) setSaveError(false);
              }}
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Save progress</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            testID="grammar-return-to-course"
            onPress={returnToCourse}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Back to grammar</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            testID="grammar-repeat-lesson"
            onPress={startAnotherRound}
            style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
              {activeDifficulty ? 'Try another mixed round' : 'Practice this lesson again'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.courseContent, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.overallProgress, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.overallProgressText}>
              <Text style={[styles.overallProgressTitle, { color: colors.foreground }]}>Your course</Text>
              <Text style={[styles.overallProgressHint, { color: colors.mutedForeground }]}>
                {totalCompleted} of {allUnits.length} topics complete
              </Text>
            </View>
            <Text style={[styles.overallPercent, { color: colors.primary }]}>{totalProgress}%</Text>
            <View style={[styles.progressTrack, styles.overallTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { width: `${totalProgress}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>

          <View style={[styles.totalPracticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.totalPracticeHeader}>
              <View style={[styles.totalPracticeIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="shuffle-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.totalPracticeCopy}>
                <Text style={[styles.overallProgressTitle, { color: colors.foreground }]}>Total grammar practice</Text>
                <Text style={[styles.overallProgressHint, { color: colors.mutedForeground }]}>
                  Mixed questions from every grammar topic
                </Text>
              </View>
            </View>
            <View style={styles.difficultyRow}>
              {TOTAL_DIFFICULTIES.map((difficulty, index) => {
                const selected = selectedTotalDifficulty === difficulty.id;
                const stars = getLevelStars('grammar-total-practice', index);
                return (
                  <TouchableOpacity
                    key={difficulty.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${difficulty.label} difficulty, ${stars} stars earned`}
                    testID={`grammar-total-difficulty-${difficulty.id}`}
                    onPress={() => setSelectedTotalDifficulty(difficulty.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.difficultyOption,
                      {
                        backgroundColor: selected ? colors.primary : colors.muted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.difficultyTitle, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                      {difficulty.label}
                    </Text>
                    <View style={styles.difficultyStars}>
                      <Ionicons name={stars > 0 ? 'star' : 'star-outline'} size={11} color={selected ? colors.primaryForeground : colors.primary} />
                      <Text style={[styles.difficultyStarText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                        {stars}/3
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.totalPracticeHint, { color: colors.mutedForeground }]}>
              {TOTAL_DIFFICULTIES.find(item => item.id === selectedTotalDifficulty)?.help}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Start ${selectedTotalDifficulty} total grammar practice`}
              testID="grammar-total-practice-start"
              onPress={() => startTotalPractice(selectedTotalDifficulty)}
              activeOpacity={0.82}
              style={[styles.totalPracticeButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.totalPracticeButtonText, { color: colors.primaryForeground }]}>
                Start {selectedTotalDifficulty} practice
              </Text>
              <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bandTabs}>
            {bandProgress.map(section => {
              const selected = activeBand === section.band;
              return (
                <TouchableOpacity
                  key={section.band}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  testID={`grammar-band-${section.band.toLowerCase()}`}
                  onPress={() => setActiveBand(section.band)}
                  activeOpacity={0.8}
                  style={[
                    styles.bandTab,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.bandTabText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                    {section.band}
                  </Text>
                  <Text style={[styles.bandProgressText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                    {section.percentage}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.bandIntro}>
            <View style={styles.bandTitleRow}>
              <Text style={[styles.bandTitle, { color: colors.foreground }]}>{activeSection.title}</Text>
              <Text style={[styles.bandPercent, { color: colors.primary }]}>
                {bandProgress.find(section => section.band === activeBand)?.percentage ?? 0}% complete
              </Text>
            </View>
            <Text style={[styles.bandDescription, { color: colors.mutedForeground }]}>{activeSection.description}</Text>
          </View>

          <View style={styles.unitList}>
            {activeSection.units.map((unit, index) => {
              const percent = unitProgress(unit);
              return (
                <TouchableOpacity
                  key={unit.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${unit.title}, ${percent}% complete, open practice`}
                  testID={`grammar-unit-${unit.id}`}
                  onPress={() => openUnit(unit)}
                  activeOpacity={0.82}
                  style={[styles.unitCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.unitIcon, { backgroundColor: percent === 100 ? colors.success + '18' : colors.accent }]}>
                    <Ionicons
                      name={percent === 100 ? 'checkmark' : unit.foundationArea ? 'book-outline' : 'text-outline'}
                      size={19}
                      color={percent === 100 ? colors.success : colors.primary}
                    />
                  </View>
                  <View style={styles.unitCopy}>
                    <View style={styles.unitHeading}>
                      <Text style={[styles.unitTitle, { color: colors.foreground }]}>{unit.title}</Text>
                      <Text style={[styles.unitPercent, { color: percent === 100 ? colors.success : colors.primary }]}>{percent}%</Text>
                    </View>
                    <Text style={[styles.unitDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {unit.description}
                    </Text>
                    <View style={[styles.unitTrack, { backgroundColor: colors.muted }]}>
                      <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: percent === 100 ? colors.success : colors.primary }]} />
                    </View>
                    <Text style={[styles.unitAction, { color: colors.primary }]}>
                      {unit.foundationArea ? 'Open foundations' : 'Start sentence practice'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.extraFoundations, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <View style={[styles.unitIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="library-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.foundationCopy}>
              <Text style={[styles.unitTitle, { color: colors.foreground }]}>Numbers & alphabet practice</Text>
              <Text style={[styles.unitDescription, { color: colors.mutedForeground }]}>
                Cardinal and ordinal numbers, alphabet study, and extra foundation drills.
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open number, alphabet, and language foundation practice"
              testID="grammar-extra-foundations"
              onPress={() => router.push(foundationRoute(activeLanguage, 'numbers'))}
              style={[styles.openFoundationsButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 13 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.65, marginBottom: 5 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  courseContent: { paddingHorizontal: 20, paddingTop: 7, gap: 17 },
  overallProgress: { borderWidth: 1, borderRadius: 20, padding: 15 },
  overallProgressText: { flex: 1 },
  overallProgressTitle: { fontSize: 15, fontWeight: '800' },
  overallProgressHint: { fontSize: 11, marginTop: 3 },
  overallPercent: { position: 'absolute', right: 15, top: 16, fontSize: 20, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 9, overflow: 'hidden', marginTop: 11 },
  overallTrack: { marginTop: 14 },
  progressFill: { height: '100%', borderRadius: 9 },
  totalPracticeCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 11 },
  totalPracticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  totalPracticeIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  totalPracticeCopy: { flex: 1, gap: 2 },
  difficultyRow: { flexDirection: 'row', gap: 7 },
  difficultyOption: { flex: 1, minHeight: 50, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 5 },
  difficultyTitle: { fontSize: 12, fontWeight: '800' },
  difficultyStars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  difficultyStarText: { fontSize: 9, fontWeight: '700' },
  totalPracticeHint: { fontSize: 11, lineHeight: 15 },
  totalPracticeButton: { minHeight: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  totalPracticeButtonText: { fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  bandTabs: { gap: 8, paddingRight: 6 },
  bandTab: { minWidth: 72, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center', gap: 2 },
  bandTabText: { fontSize: 13, fontWeight: '800' },
  bandProgressText: { fontSize: 10, fontWeight: '700' },
  bandIntro: { gap: 5 },
  bandTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  bandTitle: { fontSize: 17, fontWeight: '800' },
  bandPercent: { fontSize: 11, fontWeight: '700' },
  bandDescription: { fontSize: 12, lineHeight: 17 },
  unitList: { gap: 10 },
  unitCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 19, padding: 13 },
  unitIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  unitCopy: { flex: 1, gap: 4 },
  unitHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  unitTitle: { fontSize: 13, fontWeight: '800', flex: 1 },
  unitPercent: { fontSize: 11, fontWeight: '800' },
  unitDescription: { fontSize: 11, lineHeight: 15 },
  unitTrack: { height: 4, borderRadius: 5, overflow: 'hidden', marginTop: 2 },
  unitAction: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  extraFoundations: { borderWidth: 1, borderRadius: 19, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  foundationCopy: { flex: 1, gap: 3 },
  openFoundationsButton: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  practiceContent: { paddingHorizontal: 20, paddingTop: 5, gap: 15 },
  questionProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  lessonRule: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderWidth: 1, borderRadius: 17, padding: 13 },
  focusHint: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, alignSelf: 'flex-start' },
  focusHintText: { fontSize: 12, fontWeight: '800' },
  ruleCopy: { flex: 1, gap: 3 },
  ruleLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  ruleText: { fontSize: 12, lineHeight: 17 },
  prompt: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  sentenceCard: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 10 },
  targetSentence: { fontSize: 24, fontWeight: '700', lineHeight: 34, textAlign: 'center' },
  transliteration: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
  translationDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  translationLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, textAlign: 'center' },
  translationText: { fontSize: 14, lineHeight: 20, textAlign: 'center', fontWeight: '600' },
  answerList: { gap: 9 },
  answerButton: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerText: { fontSize: 15, fontWeight: '700' },
  feedbackBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 15, padding: 12 },
  feedbackText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  primaryButton: { minHeight: 52, borderRadius: 17, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 3 },
  primaryButtonText: { fontSize: 14, fontWeight: '800' },
  finishContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 34, alignItems: 'center', gap: 14 },
  finishIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  finishTitle: { fontSize: 24, fontWeight: '800' },
  finishSubtitle: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 320, marginBottom: 5 },
  secondaryButton: { minHeight: 48, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', width: '100%' },
  secondaryButtonText: { fontSize: 13, fontWeight: '700' },
});
