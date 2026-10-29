import React, { useCallback, useEffect, useId } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSpeech } from '@/hooks/useSpeech';
import { normalizeSpokenText } from '@/lib/speech-cache';
import { fontFamilies } from '@/constants/typography';
import type { Language } from '@/data/vocabulary';

type Speed = 'normal' | 'slow';

interface SpeakerButtonProps {
  text: string;
  language: Language;
  label?: string;
  accessibilityLabel?: string;
  testID?: string;
  showSlow?: boolean;
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

function WaveBar({ active, delay, color, reduced }: { active: boolean; delay: number; color: string; reduced: boolean }) {
  const s = useSharedValue(0.4);
  useEffect(() => {
    if (active && !reduced) {
      s.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 260 }), withTiming(0.35, { duration: 260 })), -1, true));
    } else {
      cancelAnimation(s);
      s.value = withTiming(active ? 0.8 : 0.4, { duration: 120 });
    }
  }, [active, delay, reduced, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scaleY: s.value }] }));
  return <Animated.View style={[styles.bar, { backgroundColor: color }, st]} />;
}

function Pill({ text, language, speed, label, a11y, testID, compact, disabled }: {
  text: string; language: Language; speed: Speed; label?: string; a11y: string; testID?: string; compact: boolean; disabled?: boolean;
}) {
  const hintId = useId();
  const colors = useColors();
  const reduced = useReduceMotion();
  const { speak, stopSpeaking, speechState } = useSpeech();
  const mine = speechState.text === normalizeSpokenText(text) && speechState.language === language && speechState.speed === speed;
  const playing = mine && speechState.status === 'playing';
  const loading = mine && speechState.status === 'loading';
  const unavailable = mine && speechState.status === 'unavailable';
  const slow = speed === 'slow';
  const fg = playing ? colors.primaryForeground : colors.primary;
  const bg = playing ? colors.primary : colors.accent;
  const iconSize = compact ? 17 : 19;

  return (
    <View style={{ alignItems: 'flex-start', flexShrink: 1 }}>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !!disabled, busy: loading }}
      accessibilityHint={unavailable ? 'Audio is unavailable. Connect to the internet and try again.' : playing ? 'Tap to stop' : loading ? 'Tap to cancel' : undefined}
      aria-describedby={unavailable ? hintId : undefined}
      testID={testID}
      disabled={disabled}
      activeOpacity={0.8}
      hitSlop={6}
      onPress={() => (playing || loading ? stopSpeaking() : speak(text, language, false, speed))}
      style={[
        styles.pill,
        compact ? styles.pillCompact : null,
        !label && (compact ? styles.iconOnlyCompact : styles.iconOnly),
        { backgroundColor: bg, borderColor: colors.primary + (playing ? 'FF' : '33'), opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : slow ? (
        <MaterialCommunityIcons name="turtle" size={iconSize + 1} color={fg} />
      ) : playing ? (
        <View style={styles.wave}>
          {[0, 120, 240, 60].map((d, i) => <WaveBar key={i} active delay={d} color={fg} reduced={reduced} />)}
        </View>
      ) : (
        unavailable ? (
          <Ionicons name="cloud-offline-outline" size={iconSize} color={fg} />
        ) : (
          <MaterialCommunityIcons name="account-voice" size={iconSize + 1} color={fg} />
        )
      )}
      {label ? <Text style={[styles.label, compact && styles.labelCompact, { color: fg }]} numberOfLines={1}>{unavailable ? 'Unavailable' : label}</Text> : null}
    </TouchableOpacity>
    {unavailable ? (
      <Text
        nativeID={hintId}
        accessibilityLiveRegion="polite"
        style={{ maxWidth: compact ? 110 : 160, marginTop: 4, fontSize: 11, lineHeight: 15, color: colors.primary, fontFamily: fontFamilies.semiBold }}
      >
        Audio unavailable. Connect and try again.
      </Text>
    ) : null}
    </View>
  );
}

const PRELOAD_SEP = '\u0001';

/**
 * Background-prefetch speech for the texts of the currently open level/exercise.
 * Uses a stable string key so changing array identities do not re-trigger prefetch.
 * Cleanup cancels queued generation when the level changes or the screen unmounts.
 */
export function usePreloadSpeech(
  texts: readonly (string | null | undefined)[],
  language: Language | null | undefined,
  speeds?: readonly Speed[],
) {
  const { preloadSpeech } = useSpeech();
  const seen = new Set<string>();
  for (const t of texts) {
    const v = (t ?? '').trim();
    if (v && !v.includes(PRELOAD_SEP)) seen.add(v);
  }
  const key = [...seen].join(PRELOAD_SEP);
  const speedKey = speeds?.join(',') ?? '';
  useFocusEffect(useCallback(() => {
    if (!key || !language) return;
    const list = key.split(PRELOAD_SEP);
    const sp = speedKey ? (speedKey.split(',') as Speed[]) : undefined;
    return preloadSpeech(list, language, sp);
  }, [key, language, speedKey, preloadSpeech]));
}

export function SpeakerButton({ text, language, label, accessibilityLabel, testID, showSlow, compact = false, disabled, style }: SpeakerButtonProps) {
  const a11y = accessibilityLabel ?? `Hear ${text}`;
  return (
    <View style={[styles.row, style]}>
      <Pill text={text} language={language} speed="normal" label={label} a11y={a11y} testID={testID} compact={compact} disabled={disabled} />
      {showSlow ? (
        <Pill
          text={text}
          language={language}
          speed="slow"
          label={label ? 'Slow' : undefined}
          a11y={`${a11y}, slowly`}
          testID={testID ? `${testID}-slow` : undefined}
          compact={compact}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { minHeight: 40, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pillCompact: { minHeight: 34, paddingHorizontal: 11 },
  iconOnly: { width: 44, paddingHorizontal: 0 },
  iconOnlyCompact: { width: 36, paddingHorizontal: 0 },
  label: { fontFamily: fontFamilies.extraBold, fontSize: 13 },
  labelCompact: { fontSize: 12 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 18, width: 19, justifyContent: 'center' },
  bar: { width: 3, height: 16, borderRadius: 2 },
});
