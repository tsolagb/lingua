import React, { useEffect, useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from '@/components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { fontFamilies } from '@/constants/typography';
import { ARCADE_CATALOG, type ArcadeCatalogId } from '@/lib/arcade/catalog';
import { goBackOr } from '@/lib/navigation';
import { MOTION } from '@/constants/motion';

export function tapHaptic(kind: 'light' | 'success' | 'error' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else void Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + amount))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('')}`;
}

export function ChunkyButton({
  onPress,
  children,
  color,
  style,
  disabled,
  testID,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const colors = useColors();
  const base = disabled ? colors.border : color ?? colors.primary;
  const lip = shade(base, -0.28);
  const press = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 4 }] }));
  const nodes = React.Children.toArray(children);
  const labelOnly = nodes.every(node => typeof node === 'string' || typeof node === 'number');
  const labelStyle = [styles.chunkyText, { color: disabled ? colors.mutedForeground : '#FFFFFF' }];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      disabled={disabled}
      onPressIn={() => { press.value = withSpring(1, { damping: 18, stiffness: 500 }); tapHaptic(); }}
      onPressOut={() => { press.value = withSpring(0, { damping: 9, stiffness: 320 }); }}
      onPress={onPress}
      style={[{ borderRadius: 18, backgroundColor: lip, paddingBottom: 5 }, style]}
    >
      <Animated.View style={[styles.chunkyFace, { backgroundColor: base }, faceStyle]}>
        {labelOnly ? <Text style={labelStyle}>{nodes.join('')}</Text> : React.Children.map(children, child =>
          typeof child === 'string' || typeof child === 'number' ? <Text style={labelStyle}>{child}</Text> : child,
        )}
      </Animated.View>
    </Pressable>
  );
}

const CONFETTI_COLORS = ['#2F8CFF', '#FF6B4A', '#20B486', '#F59E0B', '#E5484D', '#8B5CF6'];

function ConfettiPiece({ index, width, height }: { index: number; width: number; height: number }) {
  const y = useSharedValue(-40);
  const r = useSharedValue(0);
  const seed = useMemo(() => ({
    x: Math.random() * width,
    drift: (Math.random() - 0.5) * 80,
    delay: Math.random() * 80,
    dur: MOTION.celebrationMs - 120 + Math.random() * 120,
    size: 7 + Math.random() * 7,
    round: Math.random() > 0.6,
  }), [width]);
  useEffect(() => {
    y.value = withDelay(seed.delay, withTiming(height + 40, { duration: seed.dur, easing: Easing.in(Easing.quad) }));
    r.value = withDelay(seed.delay, withTiming(720 * (index % 2 ? 1 : -1), { duration: seed.dur }));
  }, [height, index, r, seed, y]);
  const st = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { translateX: (y.value / Math.max(1, height)) * seed.drift },
      { rotate: `${r.value}deg` },
    ],
    opacity: y.value > height - 60 ? 0 : 1,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{
        position: 'absolute', left: seed.x, top: 0,
        width: seed.size, height: seed.round ? seed.size : seed.size * 1.8,
        borderRadius: seed.round ? seed.size : 2,
        backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      }, st]}
    />
  );
}

export function Confetti({ count = 36 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => <ConfettiPiece key={i} index={i} width={width} height={height} />)}
    </View>
  );
}

function Star({ filled, index }: { filled: boolean; index: number }) {
  const colors = useColors();
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(300 + index * 220, withSpring(1, { damping: 7, stiffness: 180 }));
  }, [index, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${(1 - s.value) * -40}deg` }] }));
  return (
    <Animated.View style={[st, index === 1 && { marginTop: -14 }]}>
      <Ionicons name={filled ? 'star' : 'star-outline'} size={index === 1 ? 58 : 46} color={filled ? '#FFC53D' : colors.border} />
    </Animated.View>
  );
}

function Bouncy({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const v = useSharedValue(0);
  useEffect(() => { v.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 160 })); }, [delay, v]);
  const st = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * 24 }, { scale: 0.9 + v.value * 0.1 }] }));
  return <Animated.View style={st}>{children}</Animated.View>;
}

export function GameShell({
  gameId,
  phase,
  score,
  bestScore,
  stars,
  xp,
  onPlay,
  onReplay,
  onDone,
  children,
  hearts,
  secondsLeft,
  progress,
  saving,
  error,
  footer,
}: {
  gameId: ArcadeCatalogId;
  phase: 'intro' | 'playing' | 'results';
  score: number;
  bestScore: number;
  stars: number;
  xp: number;
  onPlay: () => void;
  onReplay: () => void;
  onDone: () => void;
  children?: React.ReactNode;
  hearts?: number;
  secondsLeft?: number;
  progress?: number;
  saving?: boolean;
  error?: string | null;
  footer?: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const meta = ARCADE_CATALOG[gameId];
  const dark = colors.colorScheme === 'dark';
  const accent = meta.color;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const close = () => goBackOr('/categories?tab=games');
  const isBest = phase === 'results' && score > 0 && score >= bestScore && !saving && !error;

  const reduceMotion = useReduceMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    bob.value = withRepeat(withSequence(withTiming(-8, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true);
  }, [bob, reduceMotion]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  const timerLow = typeof secondsLeft === 'number' && secondsLeft <= 10;
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (timerLow && phase === 'playing') pulse.value = withSequence(withTiming(1.18, { duration: 120 }), withSpring(1));
  }, [secondsLeft, timerLow, phase, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.wash, { backgroundColor: accent, opacity: dark ? 0.14 : 0.1 }]} pointerEvents="none" />
      <View style={[styles.header, { paddingTop: topPad + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close game"
          testID="arcade-close"
          onPress={close}
          hitSlop={10}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="close" size={22} color={colors.foreground} />
        </Pressable>
        {phase === 'playing' ? (
          <>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { backgroundColor: accent, width: `${Math.round(Math.max(0, Math.min(1, progress ?? 0)) * 100)}%` as any }]} />
            </View>
            {typeof hearts === 'number' ? (
              <View style={styles.hud} accessibilityLabel={`${hearts} lives left`}>
                <Ionicons name="heart" size={18} color="#E5484D" />
                <Text style={[styles.hudText, { color: colors.foreground }]}>{hearts}</Text>
              </View>
            ) : null}
            {typeof secondsLeft === 'number' ? (
              <Animated.View style={[styles.hud, pulseStyle]} accessibilityLabel={`${secondsLeft} seconds left`}>
                <Ionicons name="time" size={17} color={timerLow ? '#E5484D' : accent} />
                <Text style={[styles.hudText, { color: timerLow ? '#E5484D' : colors.foreground }]}>{secondsLeft}</Text>
              </Animated.View>
            ) : null}
          </>
        ) : (
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{meta.name}</Text>
        )}
      </View>

      {phase === 'playing' ? (
        <View style={[styles.play, { paddingBottom: bottomPad + 10 }]}>{children}</View>
      ) : (
        <ScrollView contentContainerStyle={[styles.center, { paddingBottom: bottomPad + 20 }]} showsVerticalScrollIndicator={false}>
          {phase === 'intro' ? (
            <>
              <Bouncy>
                <Animated.View style={[styles.bigIconLip, { backgroundColor: meta.darkColor }, bobStyle]}>
                  <View style={[styles.bigIcon, { backgroundColor: accent }]}>
                    <Ionicons name={meta.icon as any} size={58} color="#FFFFFF" />
                  </View>
                </Animated.View>
              </Bouncy>
              <Bouncy delay={80}>
                <Text style={[styles.title, { color: colors.foreground }]}>{meta.name}</Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>{meta.description}</Text>
              </Bouncy>
              <Bouncy delay={160}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {meta.howTo.map((line, i) => (
                    <View key={line} style={styles.howRow}>
                      <View style={[styles.howNum, { backgroundColor: accent + '22' }]}>
                        <Text style={[styles.howNumText, { color: dark ? accent : meta.darkColor }]}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.howText, { color: colors.foreground }]}>{line}</Text>
                    </View>
                  ))}
                  {bestScore > 0 ? (
                    <View style={[styles.bestPill, { backgroundColor: colors.muted }]}>
                      <Ionicons name="trophy" size={14} color="#F59E0B" />
                      <Text style={[styles.bestText, { color: colors.mutedForeground }]}>Best {bestScore}</Text>
                    </View>
                  ) : null}
                </View>
              </Bouncy>
              <View style={styles.actions}>
                <ChunkyButton onPress={onPlay} color={accent} testID="arcade-play" accessibilityLabel={`Play ${meta.name}`}>
                  Play
                </ChunkyButton>
              </View>
            </>
          ) : (
            <>
              {stars > 0 && !reduceMotion ? <Confetti /> : null}
              <Bouncy>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {stars >= 3 ? 'Brilliant!' : stars === 2 ? 'Great round!' : stars === 1 ? 'Nice work!' : 'Good try!'}
                </Text>
              </Bouncy>
              <View style={styles.starsRow} accessibilityLabel={`${stars} of 3 stars`}>
                {[0, 1, 2].map(i => <Star key={i} index={i} filled={i < stars} />)}
              </View>
              <Bouncy delay={200}>
                <View style={[styles.card, styles.resultsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: accent }]}>{score}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Score</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.foreground }]} testID="arcade-xp">
                      {saving ? '…' : error ? '—' : `+${xp}`}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>XP</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{Math.max(bestScore, saving || error ? 0 : score)}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Best</Text>
                  </View>
                </View>
              </Bouncy>
              {isBest ? (
                <View style={[styles.bestPill, { backgroundColor: '#FFC53D33', alignSelf: 'center' }]}>
                  <Ionicons name="trophy" size={14} color="#F59E0B" />
                  <Text style={[styles.bestText, { color: colors.foreground }]}>New personal best</Text>
                </View>
              ) : null}
              {saving ? (
                <Text style={[styles.status, { color: colors.mutedForeground }]}>Saving your progress…</Text>
              ) : error ? (
                <Text style={[styles.status, { color: '#E5484D' }]} accessibilityRole="alert">Not saved yet. {error}</Text>
              ) : null}
              {footer}
              <View style={styles.actions}>
                <ChunkyButton onPress={onReplay} color={accent} testID="arcade-replay">Play again</ChunkyButton>
                <ChunkyButton onPress={onDone} color={colors.mutedForeground} testID="arcade-done">Done</ChunkyButton>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', minWidth: 0, overflow: 'hidden' },
  wash: { position: 'absolute', top: -120, left: -60, right: -60, height: 320, borderBottomLeftRadius: 300, borderBottomRightRadius: 300 },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: fontFamilies.extraBold, fontSize: 17 },
  progressTrack: { flex: 1, height: 14, borderRadius: 7, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 7 },
  hud: { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 40 },
  hudText: { fontFamily: fontFamilies.extraBold, fontSize: 16 },
  play: { flex: 1, minHeight: 0, minWidth: 0, width: '100%', overflow: 'hidden' },
  center: { flexGrow: 1, alignItems: 'stretch', justifyContent: 'center', paddingHorizontal: 20, gap: 16 },
  bigIconLip: { alignSelf: 'center', borderRadius: 40, paddingBottom: 8 },
  bigIcon: { width: 120, height: 120, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamilies.extraBold, fontSize: 30, textAlign: 'center', letterSpacing: -0.5 },
  sub: { fontFamily: fontFamilies.semiBold, fontSize: 15, textAlign: 'center', marginTop: 4 },
  card: { borderRadius: 22, borderWidth: 1, borderBottomWidth: 4, padding: 16, gap: 12 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  howNumText: { fontFamily: fontFamilies.extraBold, fontSize: 15 },
  howText: { flex: 1, fontFamily: fontFamilies.semiBold, fontSize: 15, lineHeight: 21 },
  bestPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  bestText: { fontFamily: fontFamilies.bold, fontSize: 13 },
  actions: { gap: 12, marginTop: 4 },
  chunkyFace: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, flexDirection: 'row', gap: 8 },
  chunkyText: { fontFamily: fontFamilies.extraBold, fontSize: 17, letterSpacing: 0.3 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, height: 70 },
  resultsCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fontFamilies.extraBold, fontSize: 28 },
  statLabel: { fontFamily: fontFamilies.bold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  statDivider: { width: 1, height: 36 },
  status: { fontFamily: fontFamilies.semiBold, fontSize: 14, textAlign: 'center' },
});

export default GameShell;
