import React from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { LANGUAGE_META } from '@/data/vocabulary';
import { wordReviewKey } from '@/data/word-reviews';
import { useColors } from '@/hooks/useColors';

const PRACTICE_MODES: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  {
    title: 'Match',
    description: 'Pair the word with its meaning',
    icon: 'git-compare-outline',
    route: '/game?review=1',
  },
  {
    title: 'Quiz',
    description: 'Choose the correct translation',
    icon: 'help-circle-outline',
    route: '/quiz?review=1',
  },
  {
    title: 'Spell it',
    description: 'Build the word from letters',
    icon: 'create-outline',
    route: '/spelling?review=1',
  },
  {
    title: 'Flash cards',
    description: 'Recall each meaning at your pace',
    icon: 'albums-outline',
    route: '/flashcards?review=1',
  },
];

export default function MistakeReviewScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { activeLanguage, dueReviewPairs, dueGuidedSentences, wordReviews } = useGame();
  const topPad = Platform.OS === 'web' ? 54 : insets.top;
  const langMeta = LANGUAGE_META[activeLanguage];
  const totalDueItems = dueReviewPairs.length + dueGuidedSentences.length;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 8, paddingBottom: Math.max(insets.bottom, 24) + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{langMeta.label.toUpperCase()} PRACTICE</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Fix your mistakes</Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.primaryForeground }]}>
            <Ionicons name="refresh" size={22} color={colors.primary} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryCount, { color: colors.primaryForeground }]}>
              {totalDueItems === 0
                ? 'You’re all caught up'
                : `${dueReviewPairs.length} ${dueReviewPairs.length === 1 ? 'word' : 'words'} · ${dueGuidedSentences.length} ${dueGuidedSentences.length === 1 ? 'sentence' : 'sentences'}`}
            </Text>
            <Text style={[styles.summaryDescription, { color: colors.primaryForeground }]}>
              The words you’ve missed most come first. A wrong answer resets that word’s correct-recall streak.
            </Text>
          </View>
        </View>

        {dueGuidedSentences.length > 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/guided-sentence-review' as any)}
            accessibilityRole="button"
            accessibilityLabel={`Practice ${dueGuidedSentences.length} missed sentences until each has three correct recalls`}
            testID="fix-missed-sentences"
            activeOpacity={0.84}
            style={[styles.sentenceReviewCta, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.sentenceReviewIcon, { backgroundColor: colors.primary + '14' }]}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.sentenceReviewCopy}>
              <Text style={[styles.sentenceReviewTitle, { color: colors.foreground }]}>Review missed sentences</Text>
              <Text style={[styles.sentenceReviewSubtitle, { color: colors.mutedForeground }]}>
                {dueGuidedSentences.length} sentences · build three correct recalls each
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}

        {dueReviewPairs.length > 0 ? (
          <>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a practice game</Text>
                <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
                  Every game uses your current mistake queue.
                </Text>
              </View>
          <View style={[styles.languageBadge, { backgroundColor: colors.muted }]}>
                <Ionicons name="globe-outline" size={18} color={colors.foreground} />
              </View>
            </View>

            <View style={styles.modeGrid}>
              {PRACTICE_MODES.map(mode => (
                <TouchableOpacity
                  key={mode.title}
                  onPress={() => router.push(mode.route as any)}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={`${mode.title}. ${mode.description}`}
                  style={[styles.modeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.modeIcon, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name={mode.icon} size={21} color={colors.primary} />
                  </View>
                  <Text style={[styles.modeTitle, { color: colors.foreground }]}>{mode.title}</Text>
                  <Text style={[styles.modeDescription, { color: colors.mutedForeground }]}>{mode.description}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} style={styles.modeArrow} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.wordsHeading}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Words to work on</Text>
                <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
                  Ranked by how often you miss them, then by how long they’ve waited.
                </Text>
              </View>
              <Text style={[styles.wordCount, { color: colors.primary }]}>{dueReviewPairs.length}</Text>
            </View>

            <View style={styles.wordList}>
              {dueReviewPairs.map((pair, index) => {
                const record = wordReviews[wordReviewKey(activeLanguage, pair.english)];
                const misses = record?.missCount ?? 0;
                const correct = record?.correctReviews ?? 0;
                const required = record?.requiredReviews ?? 3;
                const progressLabel = !record
                  ? 'Needs a fresh recall check'
                  : misses > 0
                    ? `Missed ${misses} ${misses === 1 ? 'time' : 'times'} · ${correct}/${required} correct recalls`
                    : `${correct}/${required} extra correct recalls`;

                return (
                  <View
                    key={`${pair.english}-${index}`}
                    style={[styles.wordRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.rank, { backgroundColor: colors.primary + '18' }]}>
                      <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.wordCopy}>
                      <Text style={[styles.englishWord, { color: colors.foreground }]}>{pair.english}</Text>
                      <Text style={[styles.translation, { color: colors.mutedForeground }]}>
                        {pair.translations[activeLanguage]}
                      </Text>
                      <Text style={[styles.wordProgress, { color: misses > 0 ? colors.destructive : colors.primary }]}>
                        {progressLabel}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="checkmark" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {dueGuidedSentences.length > 0 ? 'Your missed sentences are ready to review.' : 'No words need extra practice right now.'}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              {dueGuidedSentences.length > 0
                ? 'Practice each sentence until you recall its meaning correctly three times.'
                : 'Keep learning. Any word you miss will be added here and brought back until it sticks.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  backButton: {
    width: 44, height: 44, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 3 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.4 },
  summaryCard: { borderRadius: 22, padding: 18, flexDirection: 'row', gap: 13, alignItems: 'flex-start' },
  summaryIcon: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCopy: { flex: 1, gap: 5 },
  summaryCount: { fontSize: 17, fontWeight: '800' },
  summaryDescription: { fontSize: 13, lineHeight: 19, opacity: 0.9 },
  sentenceReviewCta: { minHeight: 82, borderRadius: 21, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sentenceReviewIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sentenceReviewCopy: { flex: 1, gap: 3 },
  sentenceReviewTitle: { fontSize: 16, fontWeight: '800' },
  sentenceReviewSubtitle: { fontSize: 12, lineHeight: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionDescription: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  languageBadge: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeCard: {
    flexBasis: '48%', flexGrow: 1, minHeight: 142, borderRadius: 18, borderWidth: 1,
    padding: 14, alignItems: 'flex-start',
  },
  modeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  modeTitle: { fontSize: 15, fontWeight: '800' },
  modeDescription: { fontSize: 11, lineHeight: 15, marginTop: 3, maxWidth: '88%' },
  modeArrow: { position: 'absolute', right: 13, bottom: 14 },
  wordsHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 },
  wordCount: { fontSize: 24, fontWeight: '800' },
  wordList: { gap: 9 },
  wordRow: {
    borderRadius: 17, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  rank: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' },
  wordCopy: { flex: 1, gap: 2 },
  englishWord: { fontSize: 14, fontWeight: '800' },
  translation: { fontSize: 12 },
  wordProgress: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  emptyCard: { borderRadius: 22, borderWidth: 1, padding: 22, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
