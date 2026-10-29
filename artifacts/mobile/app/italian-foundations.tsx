import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { AutoSpeakToggle } from '@/components/AutoSpeakToggle';
import {
  type ItalianArticleGroup,
  type ItalianNumberGroup,
  type ItalianPracticeQuestion,
} from '@/data/italian-foundations';
import type { VerbTenseLabel } from '@/data/verb-exercises';
import { LANGUAGE_FOUNDATIONS, type LanguageFoundationContent } from '@/data/language-foundations';
import { canAdvanceAfterAnswer, getPracticeStars } from '@/data/lesson-practice';
import { transliterateWesternArmenian } from '@/data/armenian-transliteration';
import { goBackOr } from '@/lib/navigation';
import { SpeakerButton, usePreloadSpeech } from '@/components/SpeakerButton';

type PracticeArea = 'articles' | 'numbers' | 'alphabet' | 'verbs' | 'prepositions' | 'prepositionArticles';
type AlphabetMode = 'learn' | 'quiz';
type Feedback = 'correct' | 'try-again' | null;

const EMPTY_QUESTIONS: ItalianPracticeQuestion[] = [];
const SESSION_SIZE = 10;

function makeAlphabetQuestions(content: LanguageFoundationContent): ItalianPracticeQuestion[] {
  return content.alphabet.map((entry, index) => {
    const next = content.alphabet[(index + 1) % content.alphabet.length];
    const later = content.alphabet[(index + 7) % content.alphabet.length];
    const latinName = content.languageName === 'Western Armenian'
      ? ` (${transliterateWesternArmenian(entry.name)})`
      : '';
    return {
      prompt: `Which letter is called “${entry.name}”${latinName} in ${content.languageName}?`,
      hint: entry.foreignLetter ? 'This letter is mostly used in borrowed words.' : content.alphabetHint,
      answer: entry.letter,
      choices: [entry.letter, next.letter, later.letter],
      example: entry.example,
      explanation: `${entry.letter} is called “${entry.name}”${latinName} in ${content.languageName}. For example: ${entry.example}.`,
    };
  });
}

const AREA_OPTIONS: { id: PracticeArea; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'articles', label: 'Articles', icon: 'text-outline' },
  { id: 'numbers', label: 'Numbers', icon: 'calculator-outline' },
  { id: 'alphabet', label: 'Alphabet', icon: 'school-outline' },
  { id: 'verbs', label: 'Verbs', icon: 'swap-vertical-outline' },
  { id: 'prepositions', label: 'Prepositions', icon: 'git-merge-outline' },
  { id: 'prepositionArticles', label: 'Prep + article', icon: 'link-outline' },
];

const TENSES: { tense: VerbTenseLabel; icon: keyof typeof Ionicons.glyphMap }[] = [
  { tense: 'Present', icon: 'sunny-outline' },
  { tense: 'Past', icon: 'time-outline' },
  { tense: 'Future', icon: 'arrow-forward-circle-outline' },
];

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[otherIndex]] = [copy[otherIndex], copy[index]];
  }
  return copy;
}

function makeSession(items: readonly ItalianPracticeQuestion[]) {
  return shuffled(items).slice(0, SESSION_SIZE);
}

function completeSentence(sentence: string, answer: string): string {
  const [before, ...after] = sentence.split('___');
  const following = after.join('___');
  const needsTightJoin = answer.endsWith('’') || answer.endsWith("'");
  return `${before}${answer}${needsTightJoin ? following.trimStart() : following}`;
}

function getProgressIndex(
  area: PracticeArea,
  articleGroup: ItalianArticleGroup,
  numberGroup: ItalianNumberGroup,
): number {
  if (area === 'articles') {
    return articleGroup === 'definite' ? 0 : articleGroup === 'indefinite' ? 1 : 2;
  }
  if (area === 'numbers') return numberGroup === 'cardinal' ? 3 : 4;
  if (area === 'prepositions') return 6;
  if (area === 'prepositionArticles') return 7;
  return 5;
}

export default function LanguageFoundationsScreen() {
  const { area: requestedArea } = useLocalSearchParams<{ area?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage, completeLevel, getLevelStars } = useGame();
  const { speak, speakCorrectAnswer } = useSound();
  const [area, setArea] = useState<PracticeArea>(
    () => AREA_OPTIONS.some(option => option.id === requestedArea)
      ? requestedArea as PracticeArea
      : 'articles',
  );
  const [articleGroup, setArticleGroup] = useState<ItalianArticleGroup>('definite');
  const [numberGroup, setNumberGroup] = useState<ItalianNumberGroup>('cardinal');
  const [alphabetMode, setAlphabetMode] = useState<AlphabetMode>('learn');
  const [letterIndex, setLetterIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  useEffect(() => {
    const requestedPracticeArea = AREA_OPTIONS.find(option => option.id === requestedArea);
    if (!requestedPracticeArea) return;
    setArea(requestedPracticeArea.id);
    if (requestedArea === 'alphabet') {
      setAlphabetMode('learn');
      setLetterIndex(0);
    }
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setFeedback(null);
    setFinished(false);
    setSaveError(false);
    setRoundKey(key => key + 1);
  }, [requestedArea]);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const content = LANGUAGE_FOUNDATIONS[activeLanguage];
  const progressCategory = `${activeLanguage}-foundations`;
  const alphabetQuestions = useMemo(() => makeAlphabetQuestions(content), [content]);
  const activeArticleGroup = content.articleGroups[articleGroup];
  const currentLetter = content.alphabet[Math.min(letterIndex, content.alphabet.length - 1)];

  const questionPool = useMemo(() => {
    if (area === 'articles') return content.articleGroups[articleGroup].questions;
    if (area === 'numbers') return numberGroup === 'cardinal' ? content.cardinalQuestions : content.ordinalQuestions;
    if (area === 'prepositions') return content.prepositionQuestions;
    if (area === 'prepositionArticles') return content.prepositionArticleQuestions;
    if (area === 'alphabet' && alphabetMode === 'quiz') return alphabetQuestions;
    return EMPTY_QUESTIONS;
  }, [area, articleGroup, numberGroup, alphabetMode, content, alphabetQuestions]);
  const sessionQuestions = useMemo(() => makeSession(questionPool), [questionPool, roundKey]);
  const question = sessionQuestions[questionIndex];
  usePreloadSpeech([currentLetter.name, ...sessionQuestions.flatMap(item => [item.answer, item.sentence ? completeSentence(item.sentence, item.answer) : null])], activeLanguage);
  const answerChoices = useMemo(() => question ? shuffled(question.choices) : [], [question]);
  const completedSentence = question?.sentence && feedback === 'correct'
    ? completeSentence(question.sentence, question.answer)
    : null;
  const progressIndex = getProgressIndex(area, articleGroup, numberGroup);
  const practiceStars = getPracticeStars(correctAnswers, sessionQuestions.length);
  const modeTitle =
    area === 'articles' ? activeArticleGroup.title :
    area === 'numbers' ? (numberGroup === 'cardinal' ? 'Cardinal numbers' : 'Ordinal numbers') :
    area === 'alphabet' ? `${content.languageName} alphabet` :
    area === 'prepositions' ? 'Prepositions' :
    area === 'prepositionArticles' ? 'Prepositions + articles' : 'Verb tenses';

  const resetQuiz = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setFeedback(null);
    setFinished(false);
    setSaveError(false);
    setRoundKey(key => key + 1);
  };

  const selectArea = (nextArea: PracticeArea) => {
    setArea(nextArea);
    resetQuiz();
    if (nextArea === 'alphabet') setAlphabetMode('learn');
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

  const savePracticeResult = async () => {
    const stars = getPracticeStars(correctAnswers, sessionQuestions.length);
    setSaving(true);
    setSaveError(false);
    try {
      await completeLevel(progressCategory, progressIndex, stars, activeLanguage);
      return true;
    } catch {
      setSaveError(true);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const nextQuestion = async () => {
    if (!canAdvanceAfterAnswer(feedback)) return;
    if (questionIndex + 1 >= sessionQuestions.length) {
      const saved = await savePracticeResult();
      setFinished(true);
      if (!saved) setSaveError(true);
      return;
    }
    setQuestionIndex(index => index + 1);
    setFeedback(null);
  };

  const selectArticleGroup = (group: ItalianArticleGroup) => {
    setArticleGroup(group);
    resetQuiz();
  };

  const selectNumberGroup = (group: ItalianNumberGroup) => {
    setNumberGroup(group);
    resetQuiz();
  };

  const startAlphabetQuiz = () => {
    setAlphabetMode('quiz');
    resetQuiz();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => goBackOr('/categories')}
          accessibilityRole="button"
          accessibilityLabel="Go back to topics"
          testID="italian-foundations-back"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{content.languageName.toUpperCase()} PRACTICE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{content.languageName} foundations</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Small steps. Strong basics.</Text>
        </View>
        <AutoSpeakToggle />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.areaTabsViewport, { backgroundColor: colors.muted }]}
          contentContainerStyle={styles.areaTabs}
        >
          {AREA_OPTIONS.map(option => {
            const selected = area === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.label} practice`}
                testID={`foundation-area-${option.id}`}
                onPress={() => selectArea(option.id)}
                activeOpacity={0.8}
                style={[styles.areaTab, selected && { backgroundColor: colors.card }]}
              >
                <Ionicons name={option.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.areaTabLabel, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {area === 'articles' && (
          <>
            <View style={[styles.lessonNote, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <View style={styles.lessonCopy}>
                <Text style={[styles.lessonTitle, { color: colors.foreground }]}>
                  {activeArticleGroup.title} · {activeArticleGroup.label}
                </Text>
                <Text style={[styles.lessonHint, { color: colors.mutedForeground }]}>{activeArticleGroup.hint}</Text>
              </View>
            </View>
            <View style={[styles.subtopicTabs, { backgroundColor: colors.muted }]}>
              {(['definite', 'indefinite', 'partitive'] as const).map(group => {
                const selected = articleGroup === group;
                const label = group === 'definite' ? 'The' : group === 'indefinite' ? 'A / an' : 'Some';
                const complete = getLevelStars(progressCategory, getProgressIndex('articles', group, 'cardinal')) > 0;
                return (
                  <TouchableOpacity
                    key={group}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${label} article practice`}
                    testID={`article-group-${group}`}
                    onPress={() => selectArticleGroup(group)}
                    activeOpacity={0.8}
                    style={[styles.subtopicTab, selected && { backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.subtopicLabel, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                      {label}
                    </Text>
                    {complete && <Ionicons name="checkmark-circle" size={14} color={colors.success} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {area === 'numbers' && (
          <>
            <View style={[styles.lessonNote, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="calculator-outline" size={20} color={colors.primary} />
              <View style={styles.lessonCopy}>
                <Text style={[styles.lessonTitle, { color: colors.foreground }]}>
                  {numberGroup === 'cardinal' ? 'Counting · cardinal numbers' : 'Order · ordinal numbers'}
                </Text>
                <Text style={[styles.lessonHint, { color: colors.mutedForeground }]}>
                  {numberGroup === 'cardinal'
                    ? content.cardinalHint
                    : content.ordinalHint}
                </Text>
              </View>
            </View>
            <View style={[styles.subtopicTabs, { backgroundColor: colors.muted }]}>
              {(['cardinal', 'ordinal'] as const).map(group => {
                const selected = numberGroup === group;
                const complete = getLevelStars(progressCategory, getProgressIndex('numbers', 'definite', group)) > 0;
                return (
                  <TouchableOpacity
                    key={group}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${group} number practice`}
                    testID={`number-group-${group}`}
                    onPress={() => selectNumberGroup(group)}
                    activeOpacity={0.8}
                    style={[styles.subtopicTab, selected && { backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.subtopicLabel, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                      {group === 'cardinal' ? 'Count' : 'Order'}
                    </Text>
                    {complete && <Ionicons name="checkmark-circle" size={14} color={colors.success} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {area === 'alphabet' && (
          <>
            <View style={[styles.lessonNote, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <View style={styles.lessonCopy}>
                <Text style={[styles.lessonTitle, { color: colors.foreground }]}>{content.alphabetTitle}</Text>
                <Text style={[styles.lessonHint, { color: colors.mutedForeground }]}>
                  {content.alphabetHint}
                </Text>
              </View>
            </View>
            <View style={[styles.subtopicTabs, { backgroundColor: colors.muted }]}>
              <TouchableOpacity
                accessibilityRole="tab"
                accessibilityState={{ selected: alphabetMode === 'learn' }}
                testID="alphabet-mode-learn"
                onPress={() => { setAlphabetMode('learn'); resetQuiz(); }}
                style={[styles.subtopicTab, alphabetMode === 'learn' && { backgroundColor: colors.card }]}
              >
                <Text style={[styles.subtopicLabel, { color: alphabetMode === 'learn' ? colors.foreground : colors.mutedForeground }]}>
                  Learn letters
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="tab"
                accessibilityState={{ selected: alphabetMode === 'quiz' }}
                testID="alphabet-mode-quiz"
                onPress={startAlphabetQuiz}
                style={[styles.subtopicTab, alphabetMode === 'quiz' && { backgroundColor: colors.card }]}
              >
                <Text style={[styles.subtopicLabel, { color: alphabetMode === 'quiz' ? colors.foreground : colors.mutedForeground }]}>
                  Quick quiz
                </Text>
                {getLevelStars(progressCategory, 5) > 0 && (
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {area === 'verbs' && (
          <>
            <View style={[styles.lessonNote, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="swap-vertical-outline" size={20} color={colors.primary} />
              <View style={styles.lessonCopy}>
                <Text style={[styles.lessonTitle, { color: colors.foreground }]}>Practice all three tenses</Text>
                <Text style={[styles.lessonHint, { color: colors.mutedForeground }]}>
                  Pick a tense, then build sentences or fill in the missing verb.
                </Text>
              </View>
            </View>
            {TENSES.map(({ tense, icon }) => (
              <View key={tense} style={[styles.tenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.tenseHeading}>
                  <View style={[styles.tenseIcon, { backgroundColor: colors.accent }]}>
                    <Ionicons name={icon} size={19} color={colors.primary} />
                  </View>
                  <View style={styles.tenseCopy}>
                    <Text style={[styles.tenseTitle, { color: colors.foreground }]}>{tense}</Text>
                    <Text style={[styles.tenseTime, { color: colors.mutedForeground }]}>{content.tenseTimes[tense]}</Text>
                  </View>
                </View>
                <View style={styles.tenseActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Build ${tense.toLowerCase()} ${content.languageName} sentences`}
                    testID={`build-${tense.toLowerCase()}-sentences`}
                    onPress={() => router.push({ pathname: '/verb-sentence-builder', params: { tense } } as any)}
                    style={[styles.tenseAction, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="reorder-four-outline" size={17} color={colors.primaryForeground} />
                    <Text style={[styles.tenseActionText, { color: colors.primaryForeground }]}>Build sentences</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Fill in ${tense.toLowerCase()} ${content.languageName} verbs`}
                    testID={`fill-${tense.toLowerCase()}-verbs`}
                    onPress={() => router.push({ pathname: '/verb-fill-in', params: { tense } } as any)}
                    style={[styles.tenseAction, styles.secondaryAction, { borderColor: colors.border, backgroundColor: colors.background }]}
                  >
                    <Ionicons name="create-outline" size={17} color={colors.primary} />
                    <Text style={[styles.tenseActionText, { color: colors.foreground }]}>Fill the gap</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={[styles.pastNote, { backgroundColor: colors.accent }]}>
              <Text style={[styles.lessonHint, { color: colors.mutedForeground }]}>
                {content.pastNote}
              </Text>
            </View>
          </>
        )}

        {(area === 'prepositions' || area === 'prepositionArticles') && (
          <View style={[styles.lessonNote, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Ionicons
              name={area === 'prepositions' ? 'git-merge-outline' : 'link-outline'}
              size={20}
              color={colors.primary}
            />
            <View style={styles.lessonCopy}>
              <Text style={[styles.lessonTitle, { color: colors.foreground }]}>
                {area === 'prepositions' ? 'Use prepositions in a sentence' : 'Practice preposition + article forms'}
              </Text>
              <Text style={[styles.lessonHint, { color: colors.mutedForeground }]}>
                {area === 'prepositions' ? content.prepositionHint : content.prepositionArticleHint}
              </Text>
            </View>
          </View>
        )}

        {area === 'alphabet' && alphabetMode === 'learn' ? (
          <View style={[styles.letterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.letterTopline}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                LETTER {letterIndex + 1} OF {content.alphabet.length}
              </Text>
              {currentLetter.foreignLetter && (
                <View style={[styles.extraBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.extraBadgeText, { color: colors.primary }]}>EXTRA LETTER</Text>
                </View>
              )}
            </View>
            <Text style={[styles.letterBig, { color: colors.primary }]}>
              {currentLetter.letter}{activeLanguage === 'armenian' ? ` ${currentLetter.letter.toLowerCase()}` : ''}
            </Text>
            <Text style={[styles.letterName, { color: colors.foreground }]}>
              Called “{currentLetter.name}”
              {activeLanguage === 'armenian'
                ? ` (${transliterateWesternArmenian(currentLetter.name)})`
                : ''}
            </Text>
            <Text style={[styles.lessonHint, { color: colors.mutedForeground }]}>
              Example word: {currentLetter.example}
            </Text>
            {activeLanguage === 'armenian' && (
              <Text style={[styles.letterReading, { color: colors.primary }]}>
                Latin reading: {transliterateWesternArmenian(currentLetter.example)}
              </Text>
            )}
            {currentLetter.note && (
              <Text style={[styles.lessonHint, { color: colors.mutedForeground, textAlign: 'center' }]}>
                {currentLetter.note}
              </Text>
            )}
            <SpeakerButton
              text={currentLetter.name}
              language={activeLanguage}
              label="Listen"
              accessibilityLabel={`Hear the ${content.languageName} letter name ${currentLetter.name}`}
              testID="alphabet-listen"
              compact
              showSlow
            />
            <View style={styles.letterNavigation}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Previous letter"
                testID="alphabet-previous"
                disabled={letterIndex === 0}
                onPress={() => setLetterIndex(index => Math.max(0, index - 1))}
                style={[styles.letterNavButton, { borderColor: colors.border, opacity: letterIndex === 0 ? 0.45 : 1 }]}
              >
                <Ionicons name="arrow-back" size={17} color={colors.foreground} />
                <Text style={[styles.letterNavText, { color: colors.foreground }]}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Next letter"
                testID="alphabet-next"
                disabled={letterIndex >= content.alphabet.length - 1}
                onPress={() => setLetterIndex(index => Math.min(content.alphabet.length - 1, index + 1))}
                style={[styles.letterNavButton, { borderColor: colors.border, opacity: letterIndex >= content.alphabet.length - 1 ? 0.45 : 1 }]}
              >
                <Text style={[styles.letterNavText, { color: colors.foreground }]}>Next</Text>
                <Ionicons name="arrow-forward" size={17} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
        ) : area === 'verbs' ? null : finished ? (
          <View style={[styles.finishedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.finishedIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.finishedTitle, { color: colors.foreground }]}>Practice complete</Text>
            <Text style={[styles.finishedText, { color: colors.mutedForeground }]}>
              You got {correctAnswers} of {sessionQuestions.length} right in {modeTitle.toLowerCase()}.
            </Text>
            <View style={styles.finishedStars}>
              {[0, 1, 2].map(star => (
                <Ionicons
                  key={star}
                  name={star < practiceStars ? 'star' : 'star-outline'}
                  size={22}
                  color={colors.primary}
                />
              ))}
            </View>
            {saveError && (
              <TouchableOpacity
                onPress={savePracticeResult}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Retry saving practice progress"
                testID="retry-save-foundation-progress"
                style={[styles.retrySave, { borderColor: colors.destructive }]}
              >
                <Text style={[styles.retrySaveText, { color: colors.destructive }]}>
                  {saving ? 'Saving…' : 'Could not save progress · Retry'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={resetQuiz} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Practice again</Text>
              <Ionicons name="refresh" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        ) : question ? (
          <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.questionMeta}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                QUESTION {questionIndex + 1} OF {sessionQuestions.length}
              </Text>
              <Text style={[styles.questionNumber, { color: colors.foreground }]}>
                {questionIndex + 1}/{sessionQuestions.length}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${((questionIndex + 1) / sessionQuestions.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={[styles.questionPrompt, { color: colors.foreground }]}>{question.prompt}</Text>
            <Text style={[styles.questionHint, { color: colors.mutedForeground }]}>{question.hint}</Text>
            {question.sentence && (
              <View style={[styles.sentenceBox, { backgroundColor: colors.accent }]}>
                <Text style={[styles.sentence, { color: colors.foreground }]}>
                  {question.sentence.split('___')[0]}
                  {feedback === 'correct'
                    ? <Text style={[styles.sentenceBlank, { color: colors.primary }]}>{question.answer}</Text>
                    : <Text style={[styles.sentenceBlank, { color: colors.primary }]}>______</Text>}
                  {question.answer.endsWith('’') || question.answer.endsWith("'")
                    ? question.sentence.split('___').slice(1).join('___').trimStart()
                    : question.sentence.split('___').slice(1).join('___')}
                </Text>
                {activeLanguage === 'armenian' && (
                  <Text style={[styles.sentenceTransliteration, { color: colors.primary }]}>
                    {transliterateWesternArmenian(
                      question.sentence.split('___')[0] +
                      (feedback === 'correct' ? question.answer : '…') +
                      question.sentence.split('___').slice(1).join('___'),
                    )}
                  </Text>
                )}
                <Text style={[styles.sentenceTranslation, { color: colors.mutedForeground }]}>
                  {question.sentenceTranslation ?? question.prompt}
                </Text>
                {(area === 'prepositions' || area === 'prepositionArticles') && completedSentence && (
                  <SpeakerButton
                    text={completedSentence}
                    language={activeLanguage}
                    label="Listen to sentence"
                    accessibilityLabel={`Hear the complete ${content.languageName} sentence`}
                    testID="preposition-sentence-listen"
                    compact
                    showSlow
                  />
                )}
              </View>
            )}
            <Text style={[styles.pickLabel, { color: colors.mutedForeground }]}>CHOOSE YOUR ANSWER</Text>
            <View style={styles.answerList}>
              {answerChoices.map((choice, index) => {
                const isCorrectChoice = feedback === 'correct' && choice === question.answer;
                const isWrongChoice = selectedAnswer === choice && feedback === 'try-again';
                return (
                  <TouchableOpacity
                    key={`${questionIndex}-${choice}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedAnswer === choice, disabled: feedback === 'correct' }}
                    testID={`foundation-answer-${index}`}
                    disabled={feedback === 'correct'}
                    onPress={() => selectAnswer(choice)}
                    style={[
                      styles.answerButton,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      isCorrectChoice && { borderColor: colors.success },
                      isWrongChoice && { borderColor: colors.destructive },
                    ]}
                  >
                    <Text style={[styles.answerText, { color: colors.foreground }]}>{choice}</Text>
                    {isCorrectChoice && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                    {isWrongChoice && <Ionicons name="close-circle" size={20} color={colors.destructive} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {feedback && (
              <View style={styles.feedbackBlock}>
                <Text style={[styles.feedbackText, { color: feedback === 'correct' ? colors.success : colors.destructive }]}>
                  {feedback === 'correct' ? 'Why this answer fits' : `Correct answer: ${question.answer}`}
                </Text>
                <Text style={[styles.feedbackExplanation, { color: colors.foreground }]}>
                  {question.explanation}
                </Text>
                {feedback === 'correct' && question.example && (
                  <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>Example: {question.example}</Text>
                )}
                {canAdvanceAfterAnswer(feedback) && (
                  <>
                    {area === 'numbers' && (
                      <SpeakerButton
                        text={question.answer}
                        language={activeLanguage}
                        label="Listen to answer"
                        accessibilityLabel={`Hear the ${content.languageName} ${numberGroup} number ${question.answer}`}
                        testID="number-answer-listen"
                        compact
                        showSlow
                      />
                    )}
                    <TouchableOpacity
                      onPress={nextQuestion}
                      disabled={saving}
                      accessibilityRole="button"
                      accessibilityLabel={questionIndex + 1 === sessionQuestions.length ? 'Finish practice' : 'Go to next question'}
                      testID="foundation-next-question"
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                        {saving ? 'Saving…' : questionIndex + 1 === sessionQuestions.length ? 'Finish' : 'Next'}
                      </Text>
                      <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        ) : null}

        {area === 'alphabet' && alphabetMode === 'learn' && (
          <TouchableOpacity
            accessibilityRole="button"
            testID="alphabet-start-quiz"
            onPress={startAlphabetQuiz}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Practice the {content.languageName} alphabet</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, gap: 13 },
  backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.25, marginBottom: 3 },
  title: { fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, marginTop: 3 },
  content: { paddingHorizontal: 18, paddingTop: 2, gap: 13 },
  areaTabsViewport: { borderRadius: 15 },
  areaTabs: { flexDirection: 'row', padding: 4, gap: 3 },
  areaTab: { minHeight: 42, minWidth: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 11, paddingHorizontal: 7 },
  areaTabLabel: { fontSize: 11, fontWeight: '700' },
  lessonNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, borderWidth: 1, borderRadius: 16 },
  lessonCopy: { flex: 1, gap: 4 },
  lessonTitle: { fontSize: 14, fontWeight: '800' },
  lessonHint: { fontSize: 12, lineHeight: 18 },
  subtopicTabs: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 4 },
  subtopicTab: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 4 },
  subtopicLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  questionCard: { borderWidth: 1, borderRadius: 20, padding: 15, gap: 11 },
  questionMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  questionNumber: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  questionPrompt: { fontSize: 19, lineHeight: 26, fontWeight: '800' },
  questionHint: { fontSize: 13, lineHeight: 18, marginTop: -8 },
  sentenceBox: { padding: 13, borderRadius: 14, gap: 7 },
  sentence: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  sentenceBlank: { fontWeight: '900', letterSpacing: 0.5 },
  sentenceTranslation: { fontSize: 12, lineHeight: 18 },
  sentenceTransliteration: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
  pickLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  answerList: { gap: 8 },
  answerButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerText: { fontSize: 15, fontWeight: '700' },
  feedbackBlock: { gap: 9, marginTop: 3 },
  feedbackText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  feedbackExplanation: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  exampleText: { fontSize: 12, lineHeight: 18 },
  primaryButton: { minHeight: 47, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  primaryButtonText: { fontSize: 14, fontWeight: '800' },
  letterCard: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: 'center', gap: 9 },
  letterTopline: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  extraBadge: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 9 },
  extraBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.65 },
  letterBig: { fontSize: 78, lineHeight: 86, fontWeight: '900', marginTop: 3 },
  letterName: { fontSize: 18, fontWeight: '800' },
  letterReading: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  listenButton: { minHeight: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, marginTop: 3 },
  listenText: { fontSize: 13, fontWeight: '800' },
  letterNavigation: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 10, marginTop: 7 },
  letterNavButton: { minHeight: 43, flex: 1, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  letterNavText: { fontSize: 12, fontWeight: '700' },
  finishedCard: { alignItems: 'center', gap: 11, padding: 20, borderWidth: 1, borderRadius: 20 },
  finishedIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  finishedTitle: { fontSize: 22, fontWeight: '800' },
  finishedText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  finishedStars: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  retrySave: { width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  retrySaveText: { fontSize: 12, fontWeight: '700' },
  verbInfo: { gap: 5, padding: 13, borderRadius: 15 },
  tenseCard: { padding: 13, borderWidth: 1, borderRadius: 17, gap: 12 },
  tenseHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tenseIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tenseCopy: { flex: 1, gap: 2 },
  tenseTitle: { fontSize: 15, fontWeight: '800' },
  tenseTime: { fontSize: 12 },
  tenseActions: { flexDirection: 'row', gap: 8 },
  tenseAction: { minHeight: 42, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 5, borderRadius: 12 },
  secondaryAction: { borderWidth: 1 },
  tenseActionText: { fontSize: 11, fontWeight: '800' },
  pastNote: { padding: 12, borderRadius: 14 },
  languagePrompt: { marginHorizontal: 18, marginTop: 24, padding: 20, alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 20 },
});
