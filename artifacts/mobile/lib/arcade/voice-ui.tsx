import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { fontFamilies } from '@/constants/typography';
import { MOTION, MOTION_SPRING } from '@/constants/motion';

/** Per-game accent themes (light/dark agnostic vivid hues; surfaces come from useColors). */
export const VOICE_THEMES = {
  'listen-tap': { main: '#1CB0F6', lip: '#1487C2', ink: '#03324D', soft: '#1CB0F622', icon: 'ear' as const },
  'say-it': { main: '#FF6B4A', lip: '#D14A2C', ink: '#3D0E03', soft: '#FF6B4A22', icon: 'mic' as const },
  dictation: { main: '#7C5CFF', lip: '#5A3DDB', ink: '#FFFFFF', soft: '#7C5CFF22', icon: 'create' as const },
  'conjugation-slots': { main: '#FFB020', lip: '#D18800', ink: '#3A2600', soft: '#FFB02022', icon: 'flash' as const },
};
export type VoiceTheme = (typeof VOICE_THEMES)[keyof typeof VOICE_THEMES];

export const GOOD = '#3CC23C';
export const GOOD_LIP = '#2A9A2A';
export const BAD = '#FF4B4B';
export const BAD_LIP = '#D23535';

export function tapHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
export function resultHaptic(ok: boolean) {
  void Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
}

type ChunkyProps = {
  onPress: () => void;
  label: string;
  color: string;
  lip: string;
  textColor?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  big?: boolean;
};

/** 3D lip button that physically presses down. */
export function Chunky({ onPress, label, color, lip, textColor = '#FFFFFF', icon, disabled, testID, accessibilityLabel, style, big }: ChunkyProps) {
  const press = useSharedValue(0);
  const reduced = useReduceMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 4 }, { scale: 1 - press.value * 0.04 }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      disabled={disabled}
      onPressIn={() => { tapHaptic(); press.value = reduced ? 0 : withTiming(1, { duration: MOTION.pressInMs }); }}
      onPressOut={() => { press.value = reduced ? 0 : withSpring(0, MOTION_SPRING); }}
      onPress={onPress}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <View style={[ui.lip, { backgroundColor: lip, borderRadius: 18 }]}>
        <Animated.View style={[ui.chunky, big && ui.chunkyBig, { backgroundColor: color }, anim]}>
          {icon ? <Ionicons name={icon} size={big ? 22 : 19} color={textColor} /> : null}
          <Text style={[ui.chunkyText, big && { fontSize: 18 }, { color: textColor }]} numberOfLines={1}>{label}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

type TileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

export function ChoiceTile({ label, state, onPress, testID, theme, disabled, index }: {
  label: string; state: TileState; onPress: () => void; testID?: string; theme: VoiceTheme; disabled?: boolean; index: number;
}) {
  const colors = useColors();
  const shake = useShake();
  const reduced = useReduceMotion();
  const press = useSharedValue(0);
  useEffect(() => { if (state === 'wrong') shake.run(); }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 3 }] }));
  const bg = state === 'correct' ? GOOD + '22' : state === 'wrong' ? BAD + '1F' : state === 'selected' ? theme.soft : colors.card;
  const border = state === 'correct' ? GOOD : state === 'wrong' ? BAD : state === 'selected' ? theme.main : colors.border;
  const lip = state === 'correct' ? GOOD_LIP : state === 'wrong' ? BAD_LIP : state === 'selected' ? theme.lip : colors.border;
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(Math.min(index * 24, 120)).duration(MOTION.transitionMs)} style={[shake.style, { opacity: state === 'dim' ? 0.5 : 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: state === 'selected', disabled: !!disabled }}
        testID={testID}
        disabled={disabled}
        onPressIn={() => { press.value = reduced ? 0 : withTiming(1, { duration: MOTION.pressInMs }); }}
        onPressOut={() => { press.value = reduced ? 0 : withSpring(0, MOTION_SPRING); }}
        onPress={onPress}
      >
        <View style={[ui.tileLip, { backgroundColor: lip }]}>
          <Animated.View style={[ui.tile, { backgroundColor: colors.card, borderColor: border }, pressStyle]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, borderRadius: 14 }]} />
            <Text style={[ui.tileText, { color: colors.foreground }]} numberOfLines={3}>{label}</Text>
            {state === 'correct' ? <Ionicons name="checkmark-circle" size={22} color={GOOD} /> : null}
            {state === 'wrong' ? <Ionicons name="close-circle" size={22} color={BAD} /> : null}
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function useShake() {
  const x = useSharedValue(0);
  const reduced = useReduceMotion();
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return {
    style,
    run: () => {
      if (reduced) return;
      x.value = withSequence(withTiming(-9, { duration: 50 }), withTiming(9, { duration: 60 }), withTiming(-6, { duration: 60 }), withTiming(5, { duration: 60 }), withTiming(0, { duration: 50 }));
    },
  };
}

const CONFETTI_COLORS = ['#1CB0F6', '#FFB020', '#FF6B4A', '#3CC23C', '#7C5CFF', '#FF86C8'];

function ConfettiBit({ i, burst }: { i: number; burst: number }) {
  const p = useSharedValue(0);
  const seed = useMemo(() => ({
    x: (Math.random() - 0.5) * 300,
    y: -80 - Math.random() * 160,
    r: (Math.random() - 0.5) * 720,
    star: i % 3 === 0,
  }), [i, burst]);
  useEffect(() => {
    p.value = 0;
    p.value = withDelay(i * 12, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [burst]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({
    opacity: p.value < 0.7 ? 1 : 1 - (p.value - 0.7) / 0.3,
    transform: [
      { translateX: seed.x * p.value },
      { translateY: seed.y * p.value + 220 * p.value * p.value },
      { rotate: `${seed.r * p.value}deg` },
    ],
  }));
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  return (
    <Animated.View style={[ui.bit, st]}>
      {seed.star ? <Ionicons name="star" size={14} color={color} /> : <View style={[ui.bitRect, { backgroundColor: color }]} />}
    </Animated.View>
  );
}

/** Burst of confetti/stars from the centre each time `burst` increments (skipped for reduced motion). */
export function Confetti({ burst }: { burst: number }) {
  const reduced = useReduceMotion();
  if (!burst || reduced) return null;
  return (
    <View pointerEvents="none" style={ui.confetti}>
      {Array.from({ length: 18 }, (_, i) => <ConfettiBit key={`${burst}-${i}`} i={i} burst={burst} />)}
    </View>
  );
}

export function FeedbackCard({ ok, title, children, onNext, nextLabel = 'Continue', testID, theme }: {
  ok: boolean; title: string; children?: React.ReactNode; onNext: () => void; nextLabel?: string; testID?: string; theme?: VoiceTheme;
}) {
  const colors = useColors();
  const shake = useShake();
  const reduced = useReduceMotion();
  useEffect(() => { if (!ok) shake.run(); }, [ok]); // eslint-disable-line react-hooks/exhaustive-deps
  const tone = ok ? GOOD : BAD;
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(MOTION.screenMs)} style={[ui.feedback, { backgroundColor: tone + '1A', borderColor: tone + '55' }, shake.style]} accessibilityLiveRegion="polite">
      <View style={ui.feedbackHead}>
        <View style={[ui.feedbackIcon, { backgroundColor: tone }]}>
          <Ionicons name={ok ? 'checkmark' : 'close'} size={18} color="#FFFFFF" />
        </View>
        <Text style={[ui.feedbackTitle, { color: ok ? GOOD_LIP : BAD_LIP }]}>{title}</Text>
      </View>
      {children ? <View style={{ gap: 6 }}>{children}</View> : null}
      <Chunky
        label={nextLabel}
        onPress={onNext}
        color={ok ? GOOD : theme?.main ?? colors.primary}
        textColor={ok ? '#0B330B' : theme?.ink ?? colors.primaryForeground}
        lip={ok ? GOOD_LIP : theme?.lip ?? colors.primaryDark}
        testID={testID}
        icon="arrow-forward"
      />
    </Animated.View>
  );
}

export function SaveRetry({ error, onRetry, testID }: { error?: string; onRetry: () => void; testID?: string }) {
  const colors = useColors();
  if (!error) return null;
  return (
    <View style={{ gap: 8 }}>
      <Text style={[ui.small, { color: colors.destructive, textAlign: 'center' }]}>Not saved yet. {error}</Text>
      <Chunky label="Retry saving" icon="refresh" color={colors.destructive} lip={BAD_LIP} onPress={onRetry} testID={testID} />
    </View>
  );
}

export function StreakPill({ streak, theme }: { streak: number; theme: VoiceTheme }) {
  const pop = useSharedValue(1);
  useEffect(() => { if (streak > 0) pop.value = withSequence(withTiming(1.25, { duration: 110 }), withSpring(1)); }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  if (streak < 2) return null;
  return (
    <Animated.View style={[ui.streak, { backgroundColor: theme.main }, st]}>
      <Ionicons name="flame" size={14} color="#FFFFFF" />
      <Text style={ui.streakText}>{streak} in a row</Text>
    </Animated.View>
  );
}

export const ui = StyleSheet.create({
  lip: { paddingBottom: 4 },
  chunky: { minHeight: 50, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chunkyBig: { minHeight: 58 },
  chunkyText: { fontFamily: fontFamilies.extraBold, fontSize: 16, letterSpacing: 0.3 },
  tileLip: { borderRadius: 16, paddingBottom: 4 },
  tile: { minHeight: 58, borderRadius: 16, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  tileText: { flex: 1, fontFamily: fontFamilies.bold, fontSize: 16, lineHeight: 21 },
  confetti: { position: 'absolute', left: 0, right: 0, top: '35%', alignItems: 'center', zIndex: 50 },
  bit: { position: 'absolute' },
  bitRect: { width: 8, height: 12, borderRadius: 2 },
  feedback: { borderRadius: 20, borderWidth: 2, padding: 14, gap: 10 },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontFamily: fontFamilies.extraBold, fontSize: 18, flex: 1 },
  small: { fontFamily: fontFamilies.semiBold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamilies.extraBold, fontSize: 12, letterSpacing: 1.2 },
  body: { fontFamily: fontFamilies.semiBold, fontSize: 15, lineHeight: 21 },
  big: { fontFamily: fontFamilies.extraBold, fontSize: 22, lineHeight: 29 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'center' },
  streakText: { fontFamily: fontFamilies.extraBold, fontSize: 12, color: '#FFFFFF' },
});

export function WordDiff({ words, label }: { words: { word: string; ok: boolean }[]; label?: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={[ui.label, { color: colors.mutedForeground }]}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {words.map((w, i) => (
          <View key={`${w.word}-${i}`} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: (w.ok ? GOOD : BAD) + '22' }}
            accessibilityLabel={`${w.word}, ${w.ok ? 'matched' : 'missed'}`}>
            <Text style={[ui.body, { color: w.ok ? GOOD_LIP : BAD_LIP, textDecorationLine: w.ok ? 'none' : 'underline' }]}>{w.word}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
