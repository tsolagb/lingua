import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Line } from 'react-native-svg';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES } from '@/data/guided-curriculum';
import { ROW_H, laneX, levelFocus, type PathTheme } from '@/lib/guided-path-presentation';
import { MOTION, MOTION_SPRING } from '@/constants/motion';

const GOLD = '#E9AA25';

export function PressScale({ onPress, children, label, testID, reduceMotion, haptic = true, style, hint, state }: {
  onPress: () => void; children: React.ReactNode; label: string; testID?: string; reduceMotion: boolean;
  haptic?: boolean; style?: object; hint?: string; state?: { disabled?: boolean; busy?: boolean };
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={state}
    testID={testID} hitSlop={8} disabled={state?.disabled}
    onPressIn={() => { scale.value = reduceMotion ? 1 : withTiming(0.96, { duration: MOTION.pressInMs }); if (haptic) void Haptics.selectionAsync().catch(() => {}); }}
    onPressOut={() => { scale.value = reduceMotion ? 1 : withSpring(1, MOTION_SPRING); }} onPress={onPress} style={style}>
    <Animated.View style={animatedStyle}>{children}</Animated.View>
  </Pressable>;
}

export interface LevelRowProps {
  milestoneIndex: number; levelIndex: number; globalIndex: number; lane: 0 | 1; width: number; theme: PathTheme;
  completed: boolean; stars: number; unlocked: boolean; isCurrent: boolean; celebrate: boolean; bounce: boolean;
  reduceMotion: boolean; showBorderControl: boolean; title: string; exerciseCount: number | null;
  onBoard: () => void; onPress: (milestoneIndex: number, levelIndex: number) => void; onBorderControl: (milestoneIndex: number) => void;
}

const BADGES = [
  { borderRadius: 13, transform: [{ rotate: '-5deg' }] },
  { borderRadius: 9, transform: [{ rotate: '4deg' }] },
  { borderRadius: 18, transform: [{ rotate: '0deg' }] },
  { borderRadius: 8, transform: [{ rotate: '-3deg' }] },
  { borderRadius: 13, transform: [{ rotate: '6deg' }] },
  { borderRadius: 10, transform: [{ rotate: '0deg' }] },
  { borderRadius: 17, transform: [{ rotate: '-6deg' }] },
  { borderRadius: 8, transform: [{ rotate: '3deg' }] },
  { borderRadius: 12, transform: [{ rotate: '0deg' }] },
];

export const LevelRow = React.memo(function LevelRow(p: LevelRowProps) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const h = ROW_H.level;
  const cy = h / 2;
  const x = laneX(p.milestoneIndex, p.lane, p.width);
  const checkpoint = p.levelIndex === GUIDED_LEVELS_PER_MILESTONE - 1;
  const focus = levelFocus(p.levelIndex);
  const grey = dark ? '#42516D' : '#B7C5D7';
  const line = p.theme.main;
  const labelRight = p.isCurrent ? x <= p.width / 2 : p.levelIndex % 2 === 0;
  const name = checkpoint ? 'Checkpoint' : `Level ${p.levelIndex + 1}`;
  const label = p.unlocked
    ? `Milestone ${p.milestoneIndex + 1}, ${name}, ${p.title}, ${focus.label}. ${p.completed ? `${p.stars} stars, completed` : p.isCurrent ? 'Current level, start now' : 'Unlocked'}`
    : `Locked ${name} in Milestone ${p.milestoneIndex + 1}. ${p.levelIndex > 0 ? 'Complete the earlier levels in this milestone' : `Finish Milestone ${p.milestoneIndex} to unlock this`}.`;
  const labelStyle = labelRight ? { left: x + 30, right: 10 } : { left: 10, right: p.width - x + 30, alignItems: 'flex-end' as const };
  const sideStyle = labelRight ? { left: 8, right: p.width - x + 26, alignItems: 'flex-end' as const } : { left: x + 26, right: 8, alignItems: 'flex-start' as const };
  const iconName = p.completed ? 'checkmark' : p.unlocked ? focus.icon : 'lock-closed';
  return <View style={{ height: h, width: p.width }}>
    <Svg width={p.width} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      {p.levelIndex > 0 ? <Line x1={x} y1={0} x2={x} y2={cy} stroke={p.unlocked ? line : grey} strokeWidth={p.unlocked ? 5 : 3} strokeDasharray={p.unlocked ? undefined : '6 7'} strokeLinecap="round" /> : null}
      {!checkpoint ? <Line x1={x} y1={cy} x2={x} y2={h} stroke={p.completed ? line : grey} strokeWidth={p.completed ? 5 : 3} strokeDasharray={p.completed ? undefined : '6 7'} strokeLinecap="round" /> : null}
    </Svg>
    {p.isCurrent ? <View pointerEvents="none" style={[styles.side, sideStyle, { top: cy - 28 }]}>
      <Text style={[styles.currentNote, { color: p.theme.ink }]}>{checkpoint ? 'Milestone flag ahead' : p.levelIndex % 3 === 0 ? 'Onward!' : `${GUIDED_LEVELS_PER_MILESTONE - p.levelIndex - 1} levels to checkpoint`}</Text>
    </View> : null}
    {p.showBorderControl ? <View style={[styles.side, sideStyle, { top: cy - 20 }]}>
      <PressScale label={`Optional Boss Battle for Milestone ${p.milestoneIndex + 1}`} testID={`guided-boss-${p.milestoneIndex}`} reduceMotion={p.reduceMotion} onPress={() => p.onBorderControl(p.milestoneIndex)}>
        <View style={[styles.bossChip, { backgroundColor: dark ? '#321D27' : '#FFF0EA', borderColor: dark ? '#B16B72' : '#E5A092' }]}>
          <Ionicons name="shield-checkmark" size={15} color={dark ? '#F2B4B6' : '#AA403C'} /><Text style={[styles.bossText, { color: dark ? '#F4D0CE' : '#873833' }]}>Boss Battle</Text>
        </View>
      </PressScale>
    </View> : null}
    <View style={{ position: 'absolute', left: x - 29, top: cy - 29, width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}>
      <PressScale label={label} testID={`guided-path-level-${p.globalIndex}`} reduceMotion={p.reduceMotion} onPress={() => p.onPress(p.milestoneIndex, p.levelIndex)}
        style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View key={p.celebrate ? 'celebrate' : 'still'} entering={p.celebrate && !p.reduceMotion ? ZoomIn.springify().damping(9).delay(160) : undefined}
          style={[styles.levelBadge, BADGES[(p.globalIndex + p.levelIndex) % BADGES.length], {
            backgroundColor: p.completed ? line : p.unlocked ? (dark ? '#172946' : '#FFFDF7') : (dark ? '#111C30' : '#E7EDF5'),
            borderColor: p.unlocked ? line : grey, opacity: p.unlocked ? 1 : 0.68,
          }]}>
          {checkpoint ? (
            <View style={styles.plantedFlag}>
              <View style={[styles.flagPole, { backgroundColor: p.completed ? '#FFFFFF' : p.unlocked ? p.theme.ink : colors.mutedForeground }]} />
              <View style={[styles.flagCloth, { backgroundColor: p.completed ? '#FFFFFF' : p.unlocked ? p.theme.main : colors.mutedForeground }]} />
              <View style={[styles.flagGround, { backgroundColor: p.completed ? 'rgba(255,255,255,0.62)' : p.theme.main + '88' }]} />
            </View>
          ) : <Ionicons name={iconName} size={19} color={p.completed ? '#FFFFFF' : p.unlocked ? p.theme.ink : colors.mutedForeground} />}
          {p.completed && !checkpoint ? <Text style={styles.badgeNumber}>{p.levelIndex + 1}</Text> : null}
        </Animated.View>
      </PressScale>
    </View>
    {p.isCurrent ? <View style={[styles.currentCard, labelStyle, { top: cy - 53, backgroundColor: colors.card, borderColor: p.theme.main + '77' }]}>
      <View style={[styles.currentStripe, { backgroundColor: line }]} />
      <Text style={[styles.eyebrow, { color: p.theme.ink }]} numberOfLines={1}>CURRENT · {checkpoint ? 'CHECKPOINT' : `LEVEL ${p.levelIndex + 1}`}</Text>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{p.title}</Text>
      <Text style={[styles.note, { color: colors.mutedForeground }]} numberOfLines={1}>{p.exerciseCount !== null ? `${p.exerciseCount} exercises` : focus.label} · {Math.max(3 - p.stars, 0) > 0 ? `${Math.max(3 - p.stars, 0)} XP` : 'Practice'}</Text>
      <PressScale label={`Start ${name} in Milestone ${p.milestoneIndex + 1}`} testID="guided-path-board" reduceMotion={p.reduceMotion} onPress={p.onBoard}>
        <View style={[styles.goButton, { backgroundColor: colors.homePrimary }]}><Text style={styles.goText}>Go</Text><Ionicons name="arrow-forward" size={14} color="#FFFFFF" /></View>
      </PressScale>
    </View> : <View pointerEvents="none" style={[styles.label, labelStyle, { top: cy - 28 }]}>
      <View style={[styles.labelLine, !labelRight && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.iconChip, { backgroundColor: p.unlocked ? (dark ? p.theme.softDark : p.theme.soft) : colors.muted }]}>
          <Ionicons name={p.unlocked ? focus.icon : 'lock-closed'} size={11} color={p.unlocked ? p.theme.ink : colors.mutedForeground} />
        </View>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]} numberOfLines={1}>{checkpoint ? 'MILESTONE CHECKPOINT' : `LEVEL ${p.levelIndex + 1} · ${focus.label.toUpperCase()}`}</Text>
      </View>
      <Text style={[styles.title, { color: p.unlocked ? colors.foreground : colors.mutedForeground, textAlign: labelRight ? 'left' : 'right' }]} numberOfLines={2}>{p.title}</Text>
      {p.completed ? <View style={styles.stars} accessibilityLabel={`${p.stars} stars`}>
        {[0, 1, 2].map(i => <Ionicons key={i} name={i < p.stars ? 'star' : 'star-outline'} size={12} color={i < p.stars ? GOLD : colors.mutedForeground} />)}
      </View> : null}
    </View>}
  </View>;
});

export function DividerRow({ milestoneIndex, theme, locked, complete, onTips, width }: {
  milestoneIndex: number; theme: PathTheme; locked: boolean; complete: boolean; onTips: (m: number) => void; width: number;
}) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const milestone = GUIDED_MILESTONES[milestoneIndex];
  return <View style={[styles.divider, { width }]}>
    <View style={[styles.landscape, { backgroundColor: locked ? (dark ? '#172238' : '#E8EEF7') : (dark ? theme.softDark : theme.soft), borderColor: theme.main + '55' }]}>
      <View style={styles.scenery} pointerEvents="none">
        <View style={[styles.hill, { backgroundColor: theme.main + (dark ? '28' : '20') }]} />
        <View style={[styles.hill, styles.hillFar, { backgroundColor: theme.main + (dark ? '1C' : '16') }]} />
        <Text style={styles.sceneAccent} accessibilityElementsHidden importantForAccessibility="no">{theme.emoji}</Text>
      </View>
      <View style={styles.bandTop}>
        <View style={[styles.milestoneBadge, { backgroundColor: locked ? colors.muted : theme.main }]}>
          <Text style={styles.lineBadgeText}>{milestoneIndex + 1}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.signEyebrow, { color: locked ? colors.mutedForeground : theme.ink }]} numberOfLines={1}>MILESTONE {milestoneIndex + 1} · {milestone.band}</Text>
          <Text style={[styles.signTitle, { color: locked ? colors.mutedForeground : colors.foreground }]} numberOfLines={1}>{milestone.title}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open grammar tips for Milestone ${milestoneIndex + 1}, ${milestone.title}`}
          testID={`guided-milestone-tips-${milestoneIndex}`} onPress={() => onTips(milestoneIndex)} hitSlop={8} style={[styles.guideBtn, { borderColor: theme.main }]}>
          <Ionicons name="book-outline" size={14} color={theme.ink} />
        </TouchableOpacity>
      </View>
      <View style={styles.bandBottom}>
        <View style={[styles.statusChip, { backgroundColor: complete ? theme.main : colors.card }]}>
          <Ionicons name={complete ? 'checkmark-circle' : locked ? 'lock-closed' : 'navigate'} size={12} color={complete ? '#FFFFFF' : theme.ink} />
          <Text style={[styles.statusText, { color: complete ? '#FFFFFF' : colors.foreground }]} numberOfLines={1}>
            {complete ? 'Milestone complete' : locked ? `Finish Milestone ${milestoneIndex} to open` : 'Climb in progress'}
          </Text>
        </View>
        <Text style={[styles.focusText, { color: colors.mutedForeground }]} numberOfLines={1}>{milestone.grammarFocus}</Text>
      </View>
    </View>
  </View>;
}

export type ChestState = 'locked' | 'ready' | 'claimed';
export function ChestRow({ milestoneIndex, width, theme, state, pending, error, available, reduceMotion, onClaim }: {
  milestoneIndex: number; width: number; theme: PathTheme; state: ChestState; pending: boolean; error: string | null;
  available: boolean; reduceMotion: boolean; onClaim: (m: number) => void;
}) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const ready = state === 'ready';
  const claimed = state === 'claimed';
  const x0 = laneX(milestoneIndex, 0, width);
  const x1 = laneX(milestoneIndex, 1, width);
  const mx = (x0 + x1) / 2;
  const availableToClaim = ready && available && !pending;
  const label = claimed ? `Milestone ${milestoneIndex + 1} power-up claimed` : ready ? `Claim Milestone ${milestoneIndex + 1} power-up, 5 XP` : `Locked power-up. Complete the first four levels of Milestone ${milestoneIndex + 1}.`;
  return <View style={{ height: ROW_H.chest, width }}>
    <Svg width={width} height={ROW_H.chest} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Line x1={x0} y1={0} x2={mx} y2={ROW_H.chest / 2} stroke={ready || claimed ? theme.main : (dark ? '#42516D' : '#B7C5D7')} strokeWidth={4} strokeDasharray={ready || claimed ? undefined : '6 7'} />
      <Line x1={mx} y1={ROW_H.chest / 2} x2={x1} y2={ROW_H.chest} stroke={ready || claimed ? theme.main : (dark ? '#42516D' : '#B7C5D7')} strokeWidth={4} strokeDasharray={ready || claimed ? undefined : '6 7'} />
    </Svg>
    <View style={{ position: 'absolute', left: mx - 25, top: ROW_H.chest / 2 - 25 }}>
      <PressScale label={label} testID={`guided-path-chest-${milestoneIndex}`} reduceMotion={reduceMotion} haptic={ready}
        state={{ disabled: !availableToClaim, busy: pending }} onPress={() => onClaim(milestoneIndex)}>
        <View style={[styles.gemBadge, { backgroundColor: ready ? '#FFE9A8' : claimed ? (dark ? theme.softDark : theme.soft) : colors.muted, borderColor: ready ? '#D69B22' : theme.main }]}>
          <Ionicons name={claimed ? 'diamond' : 'diamond-outline'} size={23} color={ready ? '#956100' : theme.ink} />
        </View>
      </PressScale>
    </View>
    <View pointerEvents="none" style={[styles.powerLabel, x1 < x0 ? { left: mx + 34, right: 8 } : { left: 8, right: width - mx + 34, alignItems: 'flex-end' }]}>
      <Text style={[styles.eyebrow, { color: theme.ink }]}>POWER-UP GEM</Text>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{pending ? 'Saving…' : claimed ? 'Power-up claimed' : ready ? (available ? 'Tap for +5 XP' : 'Coming soon') : 'Locked for now'}</Text>
      <Text style={[styles.note, { color: error ? colors.destructive : colors.mutedForeground }]} numberOfLines={1}>{error ?? (claimed ? '+5 XP added' : ready ? 'A boost for the climb' : 'Opens after Level 4')}</Text>
    </View>
  </View>;
}

export function FooterRow({ complete }: { complete: boolean }) {
  const colors = useColors();
  return <View style={styles.footer}>
    <View style={[styles.footerFlag, { borderColor: colors.homePrimary, backgroundColor: colors.card }]}><Ionicons name={complete ? 'flag' : 'trail-sign-outline'} size={22} color={colors.homePrimary} /></View>
    <Text style={[styles.footerTitle, { color: colors.foreground }]}>{complete ? 'All milestones reached' : 'There’s more trail ahead'}</Text>
    <Text style={[styles.note, { color: colors.mutedForeground, textAlign: 'center' }]}>Each milestone brings grammar and vocabulary together.</Text>
  </View>;
}

const styles = StyleSheet.create({
  side: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  currentNote: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, textAlign: 'center' },
  levelBadge: { width: 46, height: 46, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  plantedFlag: { width: 25, height: 29, alignItems: 'flex-start', justifyContent: 'flex-end' },
  flagPole: { position: 'absolute', left: 6, top: 2, width: 2.5, height: 23, borderRadius: 2 },
  flagCloth: { position: 'absolute', top: 3, left: 8, width: 14, height: 9, borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  flagGround: { width: 23, height: 4, borderRadius: 5, marginBottom: 1 },
  badgeNumber: { position: 'absolute', right: -4, bottom: -4, minWidth: 17, height: 17, borderRadius: 8.5, textAlign: 'center', overflow: 'hidden', backgroundColor: '#E9AA25', color: '#382A0A', fontSize: 10, fontFamily: 'Nunito_800ExtraBold' },
  label: { position: 'absolute', minHeight: 50, justifyContent: 'center', gap: 2 },
  labelLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconChip: { width: 19, height: 19, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 0.65 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, lineHeight: 15 },
  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 10, lineHeight: 14 },
  stars: { flexDirection: 'row', gap: 2 },
  currentCard: { position: 'absolute', minHeight: 106, borderWidth: 1, borderRadius: 12, padding: 7, paddingLeft: 10, gap: 2, overflow: 'hidden' },
  currentStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  goButton: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  goText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: '#FFFFFF' },
  bossChip: { borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6 },
  bossText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10 },
  divider: { height: ROW_H.divider, paddingHorizontal: 9, paddingVertical: 9, justifyContent: 'center' },
  landscape: { height: '100%', borderWidth: 1, borderRadius: 20, padding: 11, justifyContent: 'space-between', overflow: 'hidden' },
  scenery: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  hill: { position: 'absolute', width: 210, height: 90, borderRadius: 100, bottom: -62, left: -16 },
  hillFar: { width: 190, height: 75, left: undefined, right: -34, bottom: -48 },
  sceneAccent: { position: 'absolute', right: 44, top: 12, fontSize: 20, opacity: 0.72 },
  bandTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  milestoneBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lineBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 19, color: '#FFFFFF' },
  signEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, letterSpacing: 0.8 },
  signTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, lineHeight: 19 },
  bandBottom: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusChip: { maxWidth: 142, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, flexShrink: 1 },
  focusText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 10 },
  guideBtn: { width: 31, height: 30, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  gemBadge: { width: 48, height: 48, borderWidth: 2, borderRadius: 16, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  powerLabel: { position: 'absolute', top: 16, bottom: 12, justifyContent: 'center', gap: 2 },
  footer: { height: ROW_H.footer, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 25 },
  footerFlag: { width: 46, height: 46, borderWidth: 2, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  footerTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18 },
});
