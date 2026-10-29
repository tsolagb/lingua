import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import {
  GENERAL_VOCABULARY_GAME_MODES,
  type GeneralVocabularyGameMode,
} from '@/lib/general-vocabulary-session';

export function GeneralVocabularyGameChooser({
  wordCount,
  onChoose,
}: {
  wordCount: number;
  onChoose: (mode: GeneralVocabularyGameMode) => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.foreground }]}>Choose a game</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Every game stays within these {wordCount} words.
      </Text>
      <View style={styles.grid}>
        {GENERAL_VOCABULARY_GAME_MODES.map(mode => (
          <TouchableOpacity
            key={mode.id}
            accessibilityRole="button"
            accessibilityLabel={`${mode.label}, practice ${wordCount} selected words`}
            testID={`general-vocabulary-game-${mode.id}`}
            onPress={() => onChoose(mode.id)}
            activeOpacity={0.82}
            style={[
              styles.option,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: colors.accent }]}>
              <Ionicons name={mode.icon as any} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>{mode.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingTop: 4 },
  heading: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  option: {
    width: '48%',
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 12, fontWeight: '800' },
});
