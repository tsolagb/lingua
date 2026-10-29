import { StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { useColors } from '@/hooks/useColors';
import type { VerbTenseLabel } from '@/data/verb-exercises';

export type VerbTenseFilterValue = VerbTenseLabel | 'All';

const FILTERS: VerbTenseFilterValue[] = ['All', 'Present', 'Past', 'Future'];

export function VerbTenseFilter({
  value,
  onChange,
}: {
  value: VerbTenseFilterValue;
  onChange: (next: VerbTenseFilterValue) => void;
}) {
  const colors = useColors();

  return (
    <View style={[styles.track, { backgroundColor: colors.muted }]} testID="verb-tense-filter">
      {FILTERS.map(filter => {
        const selected = value === filter;
        return (
          <TouchableOpacity
            key={filter}
            accessibilityRole="tab"
            accessibilityLabel={filter === 'All' ? 'Show all verb tenses' : `Practice the ${filter.toLowerCase()} tense`}
            accessibilityState={{ selected }}
            testID={`tense-filter-${filter.toLowerCase()}`}
            onPress={() => onChange(filter)}
            activeOpacity={0.8}
            style={[
              styles.tab,
              selected && { backgroundColor: colors.card, shadowColor: colors.foreground },
            ]}
          >
            <Text style={[styles.label, { color: selected ? colors.foreground : colors.mutedForeground }]}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    gap: 3,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  label: { fontSize: 12, fontWeight: '700' },
});
