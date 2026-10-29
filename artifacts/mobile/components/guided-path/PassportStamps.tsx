import React from 'react';
import { StyleSheet, Text, View } from '@/components/native';
import { themeFor } from '@/lib/guided-path-presentation';
import type { PassportStamp } from '@/lib/journey-passport';

const SHAPES = ['circle', 'rect', 'oval'] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** A single inked passport stamp. Shape and tilt vary by milestone for a hand-pressed feel. */
export function PassportStampCard({ stamp, dark }: { stamp: PassportStamp; dark: boolean }) {
  const theme = themeFor(stamp.milestoneIndex);
  const shape = SHAPES[stamp.milestoneIndex % SHAPES.length];
  const tilt = ((stamp.milestoneIndex * 37) % 13) - 6;
  const ink = dark ? theme.soft : theme.ink;
  const radius = shape === 'circle' ? 70 : shape === 'oval' ? 46 : 12;
  const date = stamp.completedAt ? formatDate(stamp.completedAt) : null;
  return (
    <View
      style={styles.cell}
      accessible
      accessibilityLabel={`Milestone ${stamp.milestoneIndex + 1} stamp, ${stamp.title}. ${date ? `Stamped ${date}` : 'Date not recorded'}`}
    >
      <View style={[styles.stamp, { borderColor: ink, borderRadius: radius, transform: [{ rotate: `${tilt}deg` }], backgroundColor: dark ? theme.softDark + 'AA' : theme.soft + '99' }]}>
        <View style={[styles.inner, { borderColor: ink, borderRadius: Math.max(radius - 6, 8) }]}>
          <Text style={[styles.line, { color: ink }]}>MILESTONE {stamp.milestoneIndex + 1}</Text>
          <Text style={styles.emoji}>{theme.emoji}</Text>
          <Text style={[styles.title, { color: ink }]} numberOfLines={2}>{stamp.title}</Text>
        </View>
      </View>
      <Text style={[styles.date, { color: date ? (dark ? '#C9D4EC' : '#3B4A66') : (dark ? '#7D8BA8' : '#626E84') }]} numberOfLines={1}>
        {date ?? 'Date not recorded'}
      </Text>
      <Text style={[styles.compat, { color: dark ? '#7D8BA8' : '#626E84' }]}>Milestone {stamp.milestoneIndex + 1}</Text>
    </View>
  );
}

/** Empty, dashed slot for a milestone not yet stamped. */
export function PassportEmptySlot({ milestoneIndex, dark }: { milestoneIndex: number; dark: boolean }) {
  return (
    <View style={styles.cell} accessible accessibilityLabel={`Milestone ${milestoneIndex + 1} not stamped yet`}>
      <View style={[styles.stamp, styles.empty, { borderColor: dark ? '#2A3A5E' : '#D3CCB8' }]}>
        <Text style={[styles.line, { color: dark ? '#7D8BA8' : '#7B7666' }]}>MILESTONE {milestoneIndex + 1}</Text>
      </View>
      <Text style={[styles.date, { color: dark ? '#7D8BA8' : '#7B7666' }]}>Not yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, gap: 4 },
  stamp: { width: 128, height: 128, borderWidth: 3, padding: 4, alignItems: 'center', justifyContent: 'center' },
  inner: { flex: 1, alignSelf: 'stretch', borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 1 },
  empty: { borderStyle: 'dashed', borderWidth: 2, borderRadius: 64 },
  line: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 1.6 },
  emoji: { fontSize: 26 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, lineHeight: 13, textAlign: 'center', textTransform: 'uppercase' },
  date: { fontFamily: 'Nunito_700Bold', fontSize: 12, marginTop: 4 },
  compat: { fontFamily: 'Nunito_600SemiBold', fontSize: 10 },
});
