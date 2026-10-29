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
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { LANGUAGE_META } from '@/data/vocabulary';
import { VERB_PERSONS, type VerbPattern } from '@/data/verb-guide';
import {
  getPracticeVerbForm,
  getVerbLessons,
  VERB_TENSES,
  type VerbTenseId,
} from '@/data/verb-curriculum';
import { goBackOr } from '@/lib/navigation';

export default function VerbGuideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage } = useGame();
  const [pattern, setPattern] = useState<VerbPattern>('regular');
  const [selectedTenseId, setSelectedTenseId] = useState<VerbTenseId>('present');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'try-again' | null>(null);

  const languageName = LANGUAGE_META[activeLanguage].label;
  const tenseOptions = VERB_TENSES[activeLanguage];
  const selectedTense = tenseOptions.find(item => item.id === selectedTenseId) ?? tenseOptions[0];
  const lessonsByPattern = getVerbLessons(activeLanguage, selectedTense.id);
  const lessonList = lessonsByPattern[pattern];
  const personList = VERB_PERSONS[activeLanguage];
  const questionNumber = questionIndex % (lessonList.length * personList.length);
  const questionVerb = lessonList[Math.floor(questionNumber / personList.length)];
  const questionPerson = questionNumber % personList.length;
  const choices = useMemo(() => {
    const correct = getPracticeVerbForm(questionVerb, questionPerson);
    const firstDistractor = getPracticeVerbForm(questionVerb, (questionPerson + 1) % personList.length);
    const secondDistractor = getPracticeVerbForm(questionVerb, (questionPerson + 3) % personList.length);
    const options = [correct, firstDistractor, secondDistractor];
    const offset = questionNumber % options.length;
    return [...options.slice(offset), ...options.slice(0, offset)];
  }, [questionVerb, questionPerson, personList.length, questionNumber]);

  const handleBack = () => {
    goBackOr('/levels?categoryId=verbs');
  };

  const selectPattern = (nextPattern: VerbPattern) => {
    setPattern(nextPattern);
    setQuestionIndex(0);
    setFeedback(null);
  };

  const selectTense = (nextTense: VerbTenseId) => {
    setSelectedTenseId(nextTense);
    setQuestionIndex(0);
    setFeedback(null);
  };

  const selectAnswer = (answer: string) => {
    if (feedback === 'correct') return;
    const isCorrect = answer === getPracticeVerbForm(questionVerb, questionPerson);
    Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setFeedback(isCorrect ? 'correct' : 'try-again');
  };

  const nextQuestion = () => {
    setQuestionIndex(index => index + 1);
    setFeedback(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>VERB GUIDE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Verbs that matter</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {languageName} · {selectedTense.label}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.introCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.card }]}>
            <Ionicons name="book-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.introCopy}>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>Learn the pattern, then use it</Text>
            <Text style={[styles.introText, { color: colors.mutedForeground }]}>
              Practice 130+ everyday and professional verbs across the major tenses and every subject form.
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tenseSelector}
          accessibilityLabel="Choose a verb tense"
        >
          {tenseOptions.map(tense => {
            const selected = tense.id === selectedTense.id;
            return (
              <TouchableOpacity
                key={tense.id}
                onPress={() => selectTense(tense.id)}
                accessibilityRole="tab"
                accessibilityLabel={`Practice ${tense.label}`}
                accessibilityState={{ selected }}
                style={[
                  styles.tenseButton,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.tenseButtonText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                  {tense.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.tenseHelp, { backgroundColor: colors.accent }]}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={[styles.tenseHelpText, { color: colors.foreground }]}>{selectedTense.help}</Text>
        </View>

        <View style={[styles.segment, { backgroundColor: colors.muted }]}>
          {(['regular', 'irregular'] as const).map(item => {
            const selected = item === pattern;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => selectPattern(item)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[
                  styles.segmentButton,
                  selected && { backgroundColor: colors.card, shadowColor: '#0F172A' },
                ]}
              >
                <Text style={[styles.segmentText, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                  {item === 'regular' ? 'Regular' : 'Irregular'}
                </Text>
                <Text style={[styles.segmentCount, { color: selected ? colors.primary : colors.mutedForeground }]}>
                  {lessonsByPattern[item].length}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(activeLanguage === 'spanish' || activeLanguage === 'armenian') && (
          <View style={[styles.dialectNote, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.dialectText, { color: colors.mutedForeground }]}>
              {activeLanguage === 'spanish'
                ? <>This guide uses <Text style={{ color: colors.foreground, fontWeight: '700' }}>ustedes</Text> for “you all.” It shares its verb form with “ellos / ellas”; Spain commonly uses “vosotros / vosotras.”</>
                : <>This guide uses Western Armenian forms. The present particle <Text style={{ color: colors.foreground, fontWeight: '700' }}>կը</Text> comes before most conjugated verbs; future practice uses <Text style={{ color: colors.foreground, fontWeight: '700' }}>պիտի</Text>.</>}
            </Text>
          </View>
        )}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {pattern === 'regular' ? 'Follow the ending' : 'Learn each form'}
            </Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              {lessonList.length} {pattern} verbs · {personList.length} subject forms
            </Text>
          </View>
          <View style={[styles.presentPill, { backgroundColor: colors.accent }]}>
            <Text style={[styles.presentPillText, { color: colors.primary }]}>{selectedTense.label.toUpperCase()}</Text>
          </View>
        </View>

        {lessonList.map(verb => (
          <View
            key={verb.infinitive}
            style={[styles.verbCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.verbHeading}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infinitive, { color: colors.foreground }]}>{verb.infinitive}</Text>
                <Text style={[styles.translation, { color: colors.mutedForeground }]}>{verb.english}</Text>
              </View>
              <View style={[styles.patternBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.patternBadgeText, { color: colors.primary }]}>
                  {pattern === 'regular' ? 'Pattern' : 'Core verb'}
                </Text>
              </View>
            </View>

            <View style={[styles.rule, { backgroundColor: colors.border }]} />

            {verb.forms.map((form, index) => (
              <View
                key={`${verb.infinitive}-${index}`}
                style={[styles.formRow, index < verb.forms.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
              >
                <Text style={[styles.person, { color: colors.mutedForeground }]}>{personList[index].split(' · ')[0]}</Text>
                <Text style={[styles.personMeaning, { color: colors.mutedForeground }]}>
                  {personList[index].split(' · ')[1]}
                </Text>
                <Text style={[styles.conjugation, { color: colors.foreground }]}>{form}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick practice</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              Choose the right form for the subject
            </Text>
          </View>
          <Ionicons name="checkmark-circle-outline" size={22} color={colors.primary} />
        </View>

        <View style={[styles.practiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.practiceCount, { color: colors.mutedForeground }]}>
            QUESTION {(questionNumber % (lessonList.length * personList.length)) + 1}
          </Text>
          <Text style={[styles.prompt, { color: colors.foreground }]}>
            Choose the {selectedTense.label.toLowerCase()} form of <Text style={{ color: colors.primary }}>{questionVerb.infinitive}</Text> for {personList[questionPerson].split(' · ')[0]}.
          </Text>
          <Text style={[styles.promptHint, { color: colors.mutedForeground }]}>
            {questionVerb.english} · {personList[questionPerson]}
          </Text>

          <View style={styles.answerList}>
            {choices.map((choice, index) => {
              const isCorrectChoice = choice === getPracticeVerbForm(questionVerb, questionPerson);
              const showCorrect = feedback === 'correct' && isCorrectChoice;
              const showWrong = feedback === 'try-again' && !isCorrectChoice;
              return (
                <TouchableOpacity
                  key={`${questionVerb.infinitive}-${questionPerson}-${index}`}
                  onPress={() => selectAnswer(choice)}
                  disabled={feedback === 'correct'}
                  accessibilityRole="button"
                  style={[
                    styles.answerButton,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.success + '18' },
                    showWrong && { opacity: 0.65 },
                  ]}
                >
                  <Text style={[styles.answerText, { color: colors.foreground }]}>{choice}</Text>
                  {showCorrect && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {feedback && (
            <View style={styles.feedbackRow}>
              <Text style={[styles.feedbackText, { color: feedback === 'correct' ? colors.success : colors.mutedForeground }]}>
                {feedback === 'correct' ? 'That’s right. Nice work.' : 'Not quite. Take another look and try again.'}
              </Text>
              {feedback === 'correct' && (
                <TouchableOpacity
                  onPress={nextQuestion}
                  accessibilityRole="button"
                  style={[styles.nextButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>Next</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 3 },
  content: { paddingHorizontal: 18, gap: 14 },
  tenseSelector: { gap: 8, paddingVertical: 2, paddingRight: 18 },
  tenseButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenseButtonText: { fontSize: 12, fontWeight: '800' },
  tenseHelp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
  },
  tenseHelpText: { flex: 1, fontSize: 12, lineHeight: 18 },
  introCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: { flex: 1 },
  introTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  introText: { fontSize: 13, lineHeight: 19 },
  segment: {
    padding: 4,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  segmentText: { fontSize: 14, fontWeight: '700' },
  segmentCount: { fontSize: 12, fontWeight: '800' },
  dialectNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dialectText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  sectionHint: { fontSize: 13, marginTop: 3 },
  presentPill: { borderRadius: 9, paddingVertical: 6, paddingHorizontal: 9 },
  presentPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  verbCard: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
  },
  verbHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 },
  infinitive: { fontSize: 18, fontWeight: '800' },
  translation: { fontSize: 13, marginTop: 2 },
  patternBadge: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8 },
  patternBadgeText: { fontSize: 11, fontWeight: '700' },
  rule: { height: StyleSheet.hairlineWidth, marginBottom: 2 },
  formRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 7,
  },
  person: { width: 88, fontSize: 12, fontWeight: '700' },
  personMeaning: { flex: 1, fontSize: 11 },
  conjugation: { fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1.2 },
  practiceCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  practiceCount: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  prompt: { fontSize: 18, fontWeight: '700', lineHeight: 25 },
  promptHint: { fontSize: 12, marginTop: -5 },
  answerList: { gap: 8, marginTop: 4 },
  answerButton: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answerText: { fontSize: 14, fontWeight: '600', flex: 1 },
  feedbackRow: { gap: 10, marginTop: 2 },
  feedbackText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  nextButton: {
    minHeight: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nextButtonText: { fontSize: 15, fontWeight: '800' },
});
