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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { LANGUAGE_META } from '@/data/vocabulary';
import { SENTENCE_PRACTICE_LEVELS } from '@/data/sentence-practice';
import type { DueGuidedSentence } from '@/data/guided-sentence-reviews';
import { isSpeechAvailable } from '@/lib/speech-voice';
import { SpeakerButton } from '@/components/SpeakerButton';

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
}

export default function GuidedSentenceReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    activeLanguage,
    dueGuidedSentences,
    recordGuidedSentenceAnswer,
  } = useGame();
  const { playCorrect, playWrong, speak } = useSound();
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [answeredSentence, setAnsweredSentence] = useState<DueGuidedSentence | null>(null);
  const sentence = answeredSentence ?? dueGuidedSentences[0];
  const examples = useMemo(
    () => SENTENCE_PRACTICE_LEVELS.flatMap(level => level.items.map(item => item.english)),
    [],
  );
  const choices = useMemo(() => {
    if (!sentence) return [];
    const distractors = shuffle([...new Set(examples.filter(english => english !== sentence.english))]).slice(0, 3);
    return shuffle([sentence.english, ...distractors]);
  }, [sentence?.sentenceId, examples]);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 18 : Math.max(insets.bottom, 10);

  const check = () => {
    if (!sentence || !selected || feedback) return;
    const correct = selected === sentence.english;
    setAnsweredSentence(sentence);
    recordGuidedSentenceAnswer({
      sentenceId: sentence.sentenceId,
      english: sentence.english,
      target: sentence.target,
    }, correct, activeLanguage);
    setFeedback(correct ? 'correct' : 'wrong');
    (correct ? playCorrect : playWrong)();
    void Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
  };

  const continueReview = () => {
    setSelected(null);
    setFeedback(null);
    setAnsweredSentence(null);
  };

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/mistake-review' as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back to Fix your mistakes"
          onPress={close}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>SENTENCE REVIEW</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Fix your mistakes</Text>
        </View>
      </View>

      {sentence ? (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.reviewProgress, { backgroundColor: colors.card }]}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={[styles.reviewProgressText, { color: colors.foreground }]}>
                {sentence.correctReviews}/{sentence.requiredReviews} correct recalls
              </Text>
              <Text style={[styles.queueCount, { color: colors.mutedForeground }]}>{dueGuidedSentences.length} left</Text>
            </View>
            <View style={[styles.promptCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.promptLabel, { color: colors.mutedForeground }]}>WHAT DOES THIS MEAN?</Text>
              <Text style={[styles.targetSentence, { color: colors.foreground }]}>{sentence.target}</Text>
              {isSpeechAvailable(activeLanguage) ? <SpeakerButton
                                                     text={sentence.target}
                                                     language={activeLanguage}
                                                     label="Listen"
                                                     accessibilityLabel={`Hear the sentence in ${LANGUAGE_META[activeLanguage].label}`}
                                                     compact
                                                     showSlow
                                                   /> : null}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CHOOSE THE ENGLISH MEANING</Text>
            <View style={styles.options}>
              {choices.map((choice, index) => {
                const isSelected = selected === choice;
                const correctChoice = feedback === 'correct' && choice === sentence.english;
                return (
                  <TouchableOpacity
                    key={`${sentence.sentenceId}-${index}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => !feedback && setSelected(choice)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: correctChoice ? colors.cardMatchedBg : isSelected ? colors.cardSelectedBg : colors.card,
                        borderColor: correctChoice ? colors.cardMatchedBorder : isSelected ? colors.cardSelectedBorder : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: colors.foreground }]}>{choice}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {feedback ? (
              <View style={[styles.feedback, { backgroundColor: feedback === 'correct' ? colors.success + '16' : colors.destructive + '12' }]}>
                <Ionicons
                  name={feedback === 'correct' ? 'checkmark-circle' : 'information-circle'}
                  size={22}
                  color={feedback === 'correct' ? colors.success : colors.destructive}
                />
                <View style={styles.feedbackCopy}>
                  <Text style={[styles.feedbackTitle, { color: feedback === 'correct' ? colors.success : colors.destructive }]}>
                    {feedback === 'correct' ? 'Good recall' : 'Read it once, then try again'}
                  </Text>
                  <Text style={[styles.feedbackBody, { color: colors.foreground }]}>{sentence.english}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: bottomPad }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={feedback ? 'Continue sentence review' : 'Check sentence meaning'}
              disabled={feedback ? false : selected === null}
              onPress={feedback ? continueReview : check}
              style={[styles.primaryButton, { backgroundColor: feedback || selected ? colors.primary : colors.muted }]}
            >
              <Text style={[styles.buttonText, { color: feedback || selected ? colors.primaryForeground : colors.mutedForeground }]}>
                {feedback ? 'Continue' : 'Check'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={feedback || selected ? colors.primaryForeground : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '14' }]}>
              <Ionicons name="checkmark" size={27} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sentences are sticking</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Every missed sentence has three correct recalls. Keep learning and new ones will come back here if needed.
            </Text>
            <TouchableOpacity onPress={close} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Back to mistakes</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.9 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 23 },
  content: { paddingHorizontal: 18, paddingBottom: 20, gap: 13 },
  reviewProgress: { minHeight: 45, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewProgressText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, flex: 1 },
  queueCount: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  promptCard: { minHeight: 218, borderRadius: 23, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 12 },
  promptLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.8, textAlign: 'center' },
  targetSentence: { fontFamily: 'Nunito_800ExtraBold', fontSize: 23, lineHeight: 31, textAlign: 'center' },
  audioButton: { minHeight: 38, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13 },
  audioText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.9 },
  options: { gap: 9 },
  option: { minHeight: 57, borderRadius: 16, borderWidth: 1.5, padding: 14, justifyContent: 'center' },
  optionText: { fontFamily: 'Nunito_700Bold', fontSize: 15, lineHeight: 21 },
  feedback: { borderRadius: 17, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  feedbackCopy: { flex: 1, gap: 3 },
  feedbackTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  feedbackBody: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19 },
  footer: { paddingHorizontal: 18, paddingTop: 10 },
  primaryButton: { minHeight: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  buttonText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  emptyCard: { borderRadius: 24, padding: 22, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, textAlign: 'center' },
  emptyBody: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 5 },
});
