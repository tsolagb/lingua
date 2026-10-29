import React from 'react';
import { router } from 'expo-router';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useSound } from '@/hooks/useSound';
import { goBackOr } from '@/lib/navigation';
import { getTheologyGuidePairs, LANGUAGE_META } from '@/data/vocabulary';
import { SpeakerButton } from '@/components/SpeakerButton';

const theologyPairs = getTheologyGuidePairs();

export default function TheologyGuideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeLanguage } = useGame();
  const { speak } = useSound();
  const languageName = LANGUAGE_META[activeLanguage].label;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
        <TouchableOpacity
          onPress={() => goBackOr('/levels?categoryId=church')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CHURCH · LEVEL 6</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Theology word guide</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Meanings and examples · {languageName}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.introCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.card }]}>
            <Ionicons name="book-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.introCopy}>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>Big words, made clearer</Text>
            <Text style={[styles.introText, { color: colors.mutedForeground }]}>
              Read a simple meaning and see how each word can be used.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/theology-practice' as any)}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel="Practice using advanced theology words"
          testID="theology-practice-button"
          style={[styles.practiceButton, { backgroundColor: colors.primary }]}
        >
          <View style={[styles.practiceIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name="help-circle-outline" size={21} color={colors.primaryForeground} />
          </View>
          <View style={styles.practiceCopy}>
            <Text style={[styles.practiceTitle, { color: colors.primaryForeground }]}>Practice these words</Text>
            <Text style={[styles.practiceSubtitle, { color: colors.primaryForeground, opacity: 0.86 }]}>
              Choose the word that fits each situation
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.primaryForeground} />
        </TouchableOpacity>

        {theologyPairs.map(pair => (
          <View
            key={pair.english}
            style={[styles.termCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.termHeader}>
              <View style={styles.termTitleGroup}>
                <Text style={[styles.termTitle, { color: colors.foreground }]}>{pair.english}</Text>
                <Text style={[styles.translation, { color: colors.mutedForeground }]}>
                  {pair.translations[activeLanguage]}
                </Text>
              </View>
              <SpeakerButton
                text={pair.translations[activeLanguage]}
                language={activeLanguage}
                accessibilityLabel={`Hear ${pair.translations[activeLanguage]}`}
                testID={`theology-pronunciation-${pair.english}`}
                compact
                showSlow
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.label, { color: colors.primary }]}>IN SIMPLE WORDS</Text>
            <Text style={[styles.explanation, { color: colors.foreground }]}>{pair.context.explanation}</Text>

            <View style={[styles.exampleBox, { backgroundColor: colors.accent }]}>
              <Text style={[styles.label, { color: colors.primary }]}>EXAMPLE</Text>
              <Text style={[styles.example, { color: colors.foreground }]}>{pair.context.example}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  headerText: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  title: { fontSize: 21, fontWeight: '800' },
  subtitle: { fontSize: 12, fontWeight: '500' },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 4,
  },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: { flex: 1, gap: 3 },
  introTitle: { fontSize: 15, fontWeight: '800' },
  introText: { fontSize: 12, lineHeight: 18 },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 17,
    marginBottom: 4,
  },
  practiceIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  practiceCopy: { flex: 1, gap: 3 },
  practiceTitle: { fontSize: 14, fontWeight: '800' },
  practiceSubtitle: { fontSize: 12, fontWeight: '500' },
  termCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
    gap: 10,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termTitleGroup: { flex: 1, gap: 2 },
  termTitle: { fontSize: 19, fontWeight: '800' },
  translation: { fontSize: 14, fontWeight: '600' },
  soundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  explanation: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  exampleBox: { padding: 12, borderRadius: 13, gap: 5, marginTop: 2 },
  example: { fontSize: 14, lineHeight: 21 },
});
