import React, { useMemo } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { GUIDED_MILESTONES } from '@/data/guided-curriculum';
import { getJourneyPassport, type PassportStamp } from '@/lib/journey-passport';
import { goBackOr } from '@/lib/navigation';
import { PassportEmptySlot, PassportStampCard } from '@/components/guided-path/PassportStamps';

type Cell = { kind: 'stamp'; stamp: PassportStamp } | { kind: 'empty'; milestoneIndex: number };

export default function JourneyPassportScreen() {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { progress, activeLanguage } = useGame();
  const stamps = useMemo(() => getJourneyPassport(progress, activeLanguage), [progress, activeLanguage]);
  const cells = useMemo<Cell[]>(() => {
    const byIndex = new Map(stamps.map(s => [s.milestoneIndex, s]));
    return GUIDED_MILESTONES.map((_, i) => {
      const s = byIndex.get(i);
      return s ? { kind: 'stamp', stamp: s } : { kind: 'empty', milestoneIndex: i };
    });
  }, [stamps]);
  const paper = dark ? '#0B1428' : '#F5F2E9';
  const page = dark ? '#111D36' : '#FFFDF6';
  const edge = dark ? '#24345A' : '#E2DCCB';

  return (
    <View style={[styles.root, { backgroundColor: paper, paddingTop: Platform.OS === 'web' ? 67 : insets.top, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom }]}>
      <View style={styles.top}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to Journey"
          testID="journey-passport-back"
          onPress={() => goBackOr('/guided-path' as never)}
          style={[styles.iconBtn, { backgroundColor: page, borderColor: edge }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: dark ? '#FFC94A' : colors.homePrimary }]}>JOURNEY PASSPORT</Text>
          <Text style={[styles.title, { color: colors.foreground }]} accessibilityRole="header">
            {stamps.length} of {GUIDED_MILESTONES.length} Milestones stamped
          </Text>
        </View>
      </View>

      <FlatList
        data={cells}
        numColumns={2}
        keyExtractor={c => (c.kind === 'stamp' ? `s-${c.stamp.milestoneIndex}` : `e-${c.milestoneIndex}`)}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.book, { backgroundColor: page, borderColor: edge }]}
        ListHeaderComponent={
          stamps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="id-card-outline" size={30} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your passport is fresh</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Pass the Level 9 checkpoint in Milestone 1 to earn your first stamp.
              </Text>
            </View>
          ) : (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Each completed Milestone earns a stamp. Older completions without a saved date show “Date not recorded”.
            </Text>
          )
        }
        renderItem={({ item }) => item.kind === 'stamp'
          ? <PassportStampCard stamp={item.stamp} dark={dark} />
          : <PassportEmptySlot milestoneIndex={item.milestoneIndex} dark={dark} />}
        initialNumToRender={8}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  iconBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 1.4 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, lineHeight: 25 },
  book: { marginHorizontal: 12, marginBottom: 16, borderRadius: 18, borderWidth: 1, padding: 8 },
  hint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 17, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  emptyState: { alignItems: 'center', gap: 6, paddingVertical: 18, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  emptyBody: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
