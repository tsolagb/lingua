import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import type { Language } from '@/data/vocabulary';
import { GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES, getGuidedLevel } from '@/data/guided-curriculum';
import { levelFocus, themeFor } from '@/lib/guided-path-presentation';

function FlatButton({ label, color, onPress, testID, textColor = '#FFFFFF', icon }: { label: string; color: string; onPress: () => void; testID?: string; textColor?: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }}
      testID={testID}
      style={({ pressed }) => [styles.btn, { backgroundColor: color, opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
      {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
    </Pressable>
  );
}

/** Perforated edge between ticket halves. */
function Perforation({ color, bg }: { color: string; bg: string }) {
  return (
    <View style={styles.perfRow}>
      <View style={[styles.notch, { left: -9, backgroundColor: bg }]} />
      <View style={[styles.perfLine, { borderColor: color }]} />
      <View style={[styles.notch, { right: -9, backgroundColor: bg }]} />
    </View>
  );
}

export function LevelSheet({
  target, language, stars, onStart, onClose, reduceMotion,
}: {
  target: { milestoneIndex: number; levelIndex: number } | null; language: Language; stars: number;
  onStart: () => void; onClose: () => void; reduceMotion: boolean;
}) {
  const colors = useColors();
  const dark = colors.colorScheme === 'dark';
  const level = useMemo(() => {
    if (!target) return null;
    try { return getGuidedLevel(language, target.milestoneIndex, target.levelIndex); } catch { return null; }
  }, [target, language]);
  if (!target) return null;
  const theme = themeFor(target.milestoneIndex);
  const milestone = GUIDED_MILESTONES[target.milestoneIndex];
  const focus = levelFocus(target.levelIndex);
  const remainingXp = Math.max(3 - stars, 0);
  const checkpoint = target.levelIndex === GUIDED_LEVELS_PER_MILESTONE - 1;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close level preview" accessibilityRole="button" />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(260)} accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.cardHead, { backgroundColor: theme.main }]}>
              <View style={styles.headIcon}><Ionicons name={checkpoint ? 'flag' : focus.icon} size={22} color={theme.ink} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headEyebrow}>MILESTONE {target.milestoneIndex + 1} · {checkpoint ? 'CHECKPOINT' : `LEVEL ${target.levelIndex + 1}`}</Text>
              <Text style={styles.headTitle} numberOfLines={2}>
                {level?.isCheckpoint ? 'Milestone checkpoint' : (level?.title ?? focus.label).replace(/ · Level \d+$/, ` · Level ${target.levelIndex + 1}`)}
              </Text>
            </View>
          </View>
          <Perforation color={colors.border} bg="rgba(8,14,32,0.5)" />
          <View style={styles.body}>
            <View style={styles.factRow}>
              <Ionicons name="bulb" size={16} color={dark ? colors.primary : theme.ink} />
              <Text style={[styles.fact, { color: colors.foreground }]}>{milestone.grammarFocus}</Text>
            </View>
            <View style={styles.chips}>
              <View style={[styles.chip, { backgroundColor: colors.muted }]}>
                <Ionicons name={focus.icon} size={13} color={colors.mutedForeground} />
                <Text style={[styles.chipText, { color: colors.foreground }]}>{level ? `${level.exercises.length} exercises` : 'Exercises'}</Text>
              </View>
              {level && level.newWordCount > 0 ? (
                <View style={[styles.chip, { backgroundColor: colors.muted }]}>
                  <Ionicons name="sparkles" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{level.newWordCount} new words</Text>
                </View>
              ) : null}
              <View style={[styles.chip, { backgroundColor: colors.muted }]} accessibilityLabel="5 hearts per lesson">
                <Ionicons name="heart" size={13} color="#E8478E" />
                <Text style={[styles.chipText, { color: colors.foreground }]}>5 hearts</Text>
              </View>
              {stars > 0 ? (
                <View style={[styles.chip, { backgroundColor: colors.muted }]} accessibilityLabel={`${stars} stars earned`}>
                  <Ionicons name="star" size={13} color="#F2B01E" />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{stars}/3</Text>
                </View>
              ) : null}
            </View>
            <FlatButton
              label={remainingXp > 0 ? `Start · up to ${remainingXp} XP` : 'Practice again'}
              color={theme.main}
              onPress={onStart}
              testID="guided-path-start-level"
              icon="arrow-forward"
            />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Not now" onPress={onClose} style={styles.ghost}>
              <Text style={[styles.ghostText, { color: colors.mutedForeground }]}>Not now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function LockedModal({ message, onClose }: { message: string | null; onClose: () => void }) {
  const colors = useColors();
  return (
    <Modal visible={message !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lockScrim}>
        <View accessibilityViewIsModal style={[styles.lockCard, { backgroundColor: colors.card }]}>
          <View style={[styles.lockBadge, { borderColor: colors.mutedForeground }]}>
            <Ionicons name="lock-closed" size={24} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.foreground }]}>This level isn’t open yet</Text>
          <Text style={[styles.lockBody, { color: colors.mutedForeground }]}>{message}</Text>
          <FlatButton label="Got it" color={colors.homePrimary} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const SPLASH = [
  { x: -96, y: -40, s: 18 }, { x: 92, y: -58, s: 12 }, { x: 104, y: 36, s: 20 }, { x: -84, y: 70, s: 14 },
  { x: 10, y: -112, s: 10 }, { x: -20, y: 112, s: 16 }, { x: 128, y: -6, s: 8 }, { x: -128, y: 12, s: 9 },
];

/** Stamp-press + ink-splash celebration for a completed Milestone. */
export function MilestoneCompleteModal({
  milestoneIndex, xp, isFinal, onNext, reduceMotion,
}: { milestoneIndex: number | null; xp: number; isFinal: boolean; onNext: () => void; reduceMotion: boolean }) {
  const colors = useColors();
  const press = useSharedValue(0);
  const ink = useSharedValue(0);
  const visible = milestoneIndex !== null;
  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      press.value = 1; ink.value = 1;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return;
    }
    press.value = 0; ink.value = 0;
    press.value = withDelay(180, withTiming(1, { duration: 360, easing: Easing.in(Easing.cubic) }));
    ink.value = withDelay(540, withSequence(withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })));
    const t = setTimeout(() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); }, 180);
    return () => clearTimeout(t);
  }, [visible, reduceMotion, press, ink]);
  const stampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, press.value * 2),
    transform: [{ scale: 1.9 - press.value * 0.9 }, { rotate: `${-8 + press.value * -4}deg` }],
  }));
  const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.9, transform: [{ scale: 0.4 + ink.value * 0.6 }] }));
  if (milestoneIndex === null) return null;
  const theme = themeFor(milestoneIndex);
  const milestone = GUIDED_MILESTONES[milestoneIndex];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onNext}>
      <View style={[styles.full, { backgroundColor: colors.colorScheme === 'dark' ? '#0B1428' : '#F3EEE2' }]}>
        <View style={styles.stampStage}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, inkStyle]}>
            {SPLASH.map((d, i) => (
              <View key={i} style={{ position: 'absolute', width: d.s, height: d.s, borderRadius: d.s / 2, backgroundColor: theme.main, transform: [{ translateX: d.x }, { translateY: d.y }] }} />
            ))}
          </Animated.View>
          <Animated.View style={[styles.stamp, { borderColor: theme.main }, stampStyle]} accessibilityLabel={`Milestone ${milestoneIndex + 1} stamp`}>
            <View style={[styles.stampInner, { borderColor: theme.main }]}>
              <Text style={[styles.stampTop, { color: theme.main }]}>MILESTONE {milestoneIndex + 1}</Text>
              <Text style={styles.stampEmoji}>{theme.emoji}</Text>
              <Text style={[styles.stampBottom, { color: theme.main }]} numberOfLines={1}>CLEARED</Text>
            </View>
          </Animated.View>
        </View>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(180)} style={styles.fullCopy}>
          <Text style={[styles.fullTitle, { color: colors.foreground }]} accessibilityRole="header">{isFinal ? 'Climb complete!' : 'MILESTONE COMPLETE!'}</Text>
          <Text style={[styles.fullSub, { color: colors.mutedForeground }]}>
            {isFinal ? 'You reached the final of all 30 milestones.' : `Milestone ${milestoneIndex + 1} · ${milestone.title}`}
          </Text>
          <Text style={[styles.fullCompat, { color: colors.mutedForeground }]}>{isFinal ? 'The climb is recorded in your Passport' : `Milestone ${milestoneIndex + 2} is now open · stamped in your Passport`}</Text>
          <View style={[styles.xpPill, { backgroundColor: colors.card }]}>
            <Ionicons name="flash" size={16} color="#E8A50E" />
            <Text style={[styles.xpText, { color: colors.foreground }]}>+{xp} XP</Text>
          </View>
          <View style={{ width: '100%', maxWidth: 340 }}>
            <FlatButton
              label={isFinal ? 'Celebrate the climb' : 'Keep climbing'}
              color={theme.main}
              onPress={onNext}
              testID="guided-path-next-milestone"
              icon="arrow-forward"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  btn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  btnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, letterSpacing: 0.3 },
  perfRow: { height: 0, justifyContent: 'center' },
  perfLine: { marginHorizontal: 14, borderTopWidth: 2, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: 18, height: 18, borderRadius: 9, top: -9 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,14,32,0.5)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 18 },
  headIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  headEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 0.9, color: '#FFFFFF' },
  headTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, lineHeight: 23, color: '#FFFFFF' },
  body: { padding: 16, paddingTop: 18, gap: 12 },
  factRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  fact: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  chipText: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  ghost: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  ghostText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  lockScrim: { flex: 1, backgroundColor: 'rgba(8,14,32,0.45)', padding: 24, alignItems: 'center', justifyContent: 'center' },
  lockCard: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 22, alignItems: 'stretch', gap: 10 },
  lockBadge: { alignSelf: 'center', width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  lockTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, textAlign: 'center' },
  lockBody: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  stampStage: { width: 260, height: 240, alignItems: 'center', justifyContent: 'center' },
  stamp: { width: 170, height: 170, borderRadius: 85, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  stampInner: { width: 142, height: 142, borderRadius: 71, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  stampTop: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, letterSpacing: 2 },
  stampEmoji: { fontSize: 34 },
  stampBottom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, letterSpacing: 3 },
  fullCopy: { alignItems: 'center', gap: 6, width: '100%' },
  fullTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, textAlign: 'center' },
  fullSub: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  fullCompat: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, textAlign: 'center' },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, marginVertical: 8 },
  xpText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18 },
});
