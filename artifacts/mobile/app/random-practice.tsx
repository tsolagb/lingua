import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from '@/components/native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUniqueVocabularyPairs, LANGUAGE_META } from '@/data/vocabulary';
import { useGame } from '@/context/GameContext';
import { useColors } from '@/hooks/useColors';
import { useSound } from '@/hooks/useSound';
import { goBackOr } from '@/lib/navigation';
import { buildGeneralVocabularyGameHref, createRandomGeneralVocabularyBatch } from '@/lib/general-vocabulary-session';
import { SpeakerButton } from '@/components/SpeakerButton';

export default function RandomPracticeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { activeLanguage, dueReviewPairs } = useGame();
  const { speak } = useSound();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [search, setSearch] = useState('');

  const allPairs = useMemo(
    () => getUniqueVocabularyPairs(activeLanguage),
    [activeLanguage],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visiblePairs = useMemo(
    () => normalizedSearch
      ? allPairs.filter(pair =>
          pair.english.toLocaleLowerCase().includes(normalizedSearch) ||
          pair.translations[activeLanguage].toLocaleLowerCase().includes(normalizedSearch),
        )
      : allPairs,
    [allPairs, activeLanguage, normalizedSearch],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={() => goBackOr('/categories')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Back to categories"
          testID="random-practice-back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.primaryForeground }]}>General vocabulary</Text>
          <Text style={[styles.subtitle, { color: colors.primaryForeground }]}>
            {LANGUAGE_META[activeLanguage].label} · {allPairs.length} words across every category
          </Text>
        </View>
        <Ionicons name="shuffle" size={25} color={colors.primaryForeground} />
      </View>

      <View style={styles.listIntro}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={19} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search all words"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Search all vocabulary words"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              testID="random-practice-clear-search"
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={19} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
          Showing {visiblePairs.length} of {allPairs.length} words. Tap any word to hear it.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/mistake-review' as any)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Fix your mistakes. ${dueReviewPairs.length} words are in the review queue`}
        testID="general-practice-missed-words"
        style={[styles.missedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.missedIcon, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="refresh-outline" size={19} color={colors.primary} />
        </View>
        <View style={styles.missedCopy}>
          <Text style={[styles.missedTitle, { color: colors.foreground }]}>Fix your mistakes</Text>
          <Text style={[styles.missedSubtitle, { color: colors.mutedForeground }]}>
            {dueReviewPairs.length > 0
              ? `${dueReviewPairs.length} words need another recall`
              : 'Words you miss are saved here for review'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.primary} />
      </TouchableOpacity>

      <FlatList
        data={visiblePairs}
        keyExtractor={(pair, index) =>
          `${pair.english}:${pair.translations[activeLanguage]}:${index}`
        }
        keyboardShouldPersistTaps="handled"
        scrollEnabled={visiblePairs.length > 0}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.wordList,
          { paddingBottom: bottomPad + 190 },
          visiblePairs.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={30} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No words match that search.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const translation = item.translations[activeLanguage];
          return (
            <View style={[styles.wordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.wordCopy}>
                <Text style={[styles.englishWord, { color: colors.foreground }]}>
                  {item.english}
                </Text>
                <Text style={[styles.translation, { color: colors.primary }]}>
                  {translation}
                </Text>
              </View>
              <SpeakerButton text={translation} language={activeLanguage} accessibilityLabel={`Hear ${translation}, meaning ${item.english}`} testID={`random-word-${item.english}`} compact />
            </View>
          );
        }}
      />

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
        <Text style={[styles.studyHeading, { color: colors.foreground }]}>Choose a study method</Text>
        <View style={styles.studyMethods}>
          <TouchableOpacity
            onPress={() => router.push('/flashcards?allWords=1' as any)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Study all ${allPairs.length} words with flash cards`}
            testID="random-practice-flashcards"
            style={[styles.studyMethodCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.studyMethodIcon, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="albums-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.studyMethodCopy}>
              <Text style={[styles.studyMethodTitle, { color: colors.foreground }]}>Flash cards</Text>
              <Text style={[styles.studyMethodSubtitle, { color: colors.mutedForeground }]}>
                All {allPairs.length} words
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const batch = createRandomGeneralVocabularyBatch(activeLanguage);
              router.push(buildGeneralVocabularyGameHref('quiz', {
                kind: 'random',
                batchIndices: batch.indices,
                returnTo: 'random-practice',
              }) as any);
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Take a multiple-choice quiz with 25 random words from every category"
            testID="random-practice-quick-quiz"
            style={[styles.studyMethodCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <View style={[styles.studyMethodIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name="help-circle-outline" size={19} color={colors.primaryForeground} />
            </View>
            <View style={styles.studyMethodCopy}>
              <Text style={[styles.studyMethodTitle, { color: colors.primaryForeground }]}>Quick quiz</Text>
              <Text style={[styles.studyMethodSubtitle, { color: colors.primaryForeground }]}>25 random words</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/general-vocabulary-levels?randomLevel=1&returnTo=random-practice' as any)}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel="Choose another game for 25 random words from every category"
          testID="random-practice-more-games"
          style={[styles.moreGamesButton, { backgroundColor: colors.accent, borderColor: colors.border }]}
        >
          <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
          <Text style={[styles.moreGamesText, { color: colors.primary }]}>More games · 25 random words</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 18,
    paddingBottom: 17,
  },
  backButton: { width: 34, height: 38, justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, fontWeight: '600', opacity: 0.88, marginTop: 4 },
  listIntro: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  searchBox: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: { flex: 1, minHeight: 46, fontSize: 15 },
  clearButton: { padding: 3 },
  resultCount: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  missedCard: {
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 18,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  missedIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  missedCopy: { flex: 1, gap: 2 },
  missedTitle: { fontSize: 13, fontWeight: '800' },
  missedSubtitle: { fontSize: 11, lineHeight: 15 },
  wordList: { paddingHorizontal: 18, paddingTop: 2 },
  wordRow: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordCopy: { flex: 1, gap: 3 },
  englishWord: { fontSize: 15, fontWeight: '700' },
  translation: { fontSize: 14, fontWeight: '700' },
  emptyList: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 18,
    gap: 8,
  },
  studyHeading: { fontSize: 12, fontWeight: '800' },
  studyMethods: {
    flexDirection: 'row',
    gap: 10,
  },
  moreGamesButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 13,
  },
  moreGamesText: { fontSize: 12, fontWeight: '800' },
  studyMethodCard: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studyMethodIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studyMethodCopy: { flex: 1, gap: 3 },
  studyMethodTitle: { fontSize: 12, fontWeight: '800' },
  studyMethodSubtitle: { fontSize: 10, fontWeight: '600' },
});
