import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES } from '@/data/guided-curriculum';
import type { PathTheme } from '@/lib/guided-path-presentation';

const AMBER = '#FFC94A';

/** Compact milestone summary: theme, grammar focus, level progress and Guidebook. */
export function DepartureBoard({
  milestoneIndex, theme, completed, pathComplete, onTips, reduceMotion,
}: { milestoneIndex: number; theme: PathTheme; completed: number; pathComplete: boolean; onTips: () => void; reduceMotion: boolean }) {
  const milestone = GUIDED_MILESTONES[milestoneIndex];
  return (
    <View style={styles.board} accessibilityRole="header">
      <View style={[styles.lineTag, { backgroundColor: theme.main }]}>
        <Text style={styles.lineSmall}>MILESTONE</Text>
        <Text style={styles.lineNum}>{milestoneIndex + 1}</Text>
      </View>
      <Animated.View key={milestoneIndex} entering={reduceMotion ? undefined : FadeIn.duration(240)} style={styles.copy}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          {pathComplete ? 'CLIMB COMPLETE · ALL MILESTONES' : `${milestone.band} · MILESTONE`}
        </Text>
        <Text style={styles.title} numberOfLines={1}>{milestone.title}</Text>
        <Text style={styles.focus} numberOfLines={1}>{milestone.grammarFocus}</Text>
        <View style={styles.segRow} accessibilityLabel={`${completed} of ${GUIDED_LEVELS_PER_MILESTONE} levels complete`}>
          {Array.from({ length: GUIDED_LEVELS_PER_MILESTONE }, (_, i) => (
            <View key={i} style={[styles.seg, { backgroundColor: i < completed ? AMBER : 'rgba(255,255,255,0.16)' }]} />
          ))}
          <Text style={styles.count}>{completed}/{GUIDED_LEVELS_PER_MILESTONE}</Text>
        </View>
      </Animated.View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Open Guidebook grammar tips for Milestone ${milestoneIndex + 1}, ${milestone.title}`}
        onPress={onTips}
        activeOpacity={0.8}
        testID="guided-path-tips"
        style={styles.guide}
      >
        <Ionicons name="book" size={17} color={AMBER} />
        <Text style={styles.guideText}>Guide</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Back-compat alias for older imports. */
export const MilestoneBanner = DepartureBoard;

const styles = StyleSheet.create({
  board: { marginHorizontal: 12, marginBottom: 6, borderRadius: 16, backgroundColor: '#101B33', borderWidth: 1, borderColor: '#24345A', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineTag: { minWidth: 48, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  lineSmall: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.85)' },
  lineNum: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, lineHeight: 26, color: '#FFFFFF' },
  copy: { flex: 1, minWidth: 0, gap: 1 },
  eyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 1.3, color: AMBER },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, lineHeight: 20, color: '#F4F7FF' },
  focus: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, lineHeight: 14, color: '#9AA9C9' },
  segRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  seg: { flex: 1, height: 5, borderRadius: 2, maxWidth: 22 },
  count: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: '#C9D4EC', marginLeft: 4 },
  guide: { alignItems: 'center', justifyContent: 'center', gap: 1, width: 48, minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: '#33456E' },
  guideText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: '#DDE5F7' },
});
