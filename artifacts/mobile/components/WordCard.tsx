import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from '@/components/native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';
import { MOTION, MOTION_SPRING } from '@/constants/motion';

export type CardState = 'default' | 'selected' | 'matched' | 'error';

interface WordCardProps {
  word: string;
  readingHint?: string;
  state: CardState;
  onPress: () => void;
  side: 'left' | 'right';
  compact?: boolean;
  rows?: number;
}

export function WordCard({ word, readingHint, state, onPress, compact = false, rows = 5 }: WordCardProps) {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const [matchedFlash, setMatchedFlash] = useState(false);

  useEffect(() => {
    if (state !== 'matched') {
      setMatchedFlash(false);
      return;
    }
    setMatchedFlash(true);
    const timeout = setTimeout(() => setMatchedFlash(false), 480);
    return () => clearTimeout(timeout);
  }, [state]);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      translateX.value = 0;
    } else if (state === 'selected') {
      scale.value = withSpring(1.03, MOTION_SPRING);
    } else if (state === 'matched') {
      scale.value = withSpring(0.98, MOTION_SPRING);
    } else if (state === 'error') {
      scale.value = withSpring(1, { damping: 12 });
      translateX.value = withSequence(
        withTiming(-12, { duration: 50, easing: Easing.out(Easing.quad) }),
        withTiming(12,  { duration: 50 }),
        withTiming(-9,  { duration: 50 }),
        withTiming(9,   { duration: 50 }),
        withTiming(-4,  { duration: 50 }),
        withTiming(0,   { duration: 50 }),
      );
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    }
  }, [reduceMotion, state, scale, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const palette = {
    default: { bg: colors.card, border: colors.border, text: colors.foreground },
    selected: { bg: colors.cardSelectedBg, border: colors.primary, text: colors.foreground },
    matched: matchedFlash
      ? { bg: colors.cardMatchedBg, border: colors.cardMatchedBorder, text: colors.success }
      : { bg: colors.muted, border: colors.border, text: colors.mutedForeground },
    error: { bg: colors.cardErrorBg, border: colors.cardErrorBorder, text: colors.destructive },
  };
  const { bg, border, text } = palette[state];
  const compactFont = rows >= 8 ? 14 : rows >= 6 ? 15 : 17;
  const wordContent = (
    <View style={styles.wordContent}>
      <Text style={[styles.word, compact && styles.compactWord, { color: text, fontSize: compact ? compactFont : undefined, lineHeight: compact ? compactFont + 3 : undefined }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65}>
        {word}
      </Text>
      {!!readingHint && (
          <Text style={[styles.readingHint, compact && styles.compactReadingHint, { color: colors.mutedForeground, fontSize: rows >= 8 ? 9 : undefined }]} numberOfLines={1}>
          {readingHint}
        </Text>
      )}
    </View>
  );

  return (
    <Animated.View style={[
      styles.wrapper,
      compact && styles.compactWrapper,
      animatedStyle,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={state === 'matched'}
        activeOpacity={0.8}
        onPressIn={() => {
          if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
          if (!reduceMotion) scale.value = withTiming(0.96, { duration: MOTION.pressInMs });
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(state === 'selected' ? 1.03 : 1, MOTION_SPRING);
        }}
        style={[
          styles.card,
          compact && styles.compactCard,
          compact && {
            minHeight: rows >= 8 ? 40 : rows <= 5 ? 56 : 48,
            paddingVertical: rows >= 8 ? 3 : rows <= 5 ? 7 : 5,
          },
          {
            backgroundColor: bg,
            borderColor: border,
            opacity: state === 'matched' && !matchedFlash ? 0.62 : 1,
            shadowColor: state === 'selected' ? border : '#000',
            shadowOpacity: state === 'selected' ? 0.12 : 0.035,
            shadowRadius: state === 'selected' ? 6 : 3,
            elevation: state === 'selected' ? 3 : 1,
          },
        ]}
      >
        {state === 'matched' ? (
          <View style={styles.matchedRow}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={matchedFlash ? colors.success : colors.mutedForeground}
              style={styles.checkIcon}
            />
            {wordContent}
          </View>
        ) : (
          wordContent
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowOffset: { width: 0, height: 3 },
  },
  compactWrapper: {
    flex: 1,
    minHeight: 0,
  },
  card: {
    paddingHorizontal: 9,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 66,
  },
  compactCard: {
    flex: 1,
    minHeight: 40,
    paddingVertical: 4,
    borderRadius: 15,
  },
  word: {
    ...typography.wordTile,
    textAlign: 'center',
  },
  compactWord: {
    ...typography.wordTile,
    lineHeight: 20,
  },
  wordContent: { alignItems: 'center', justifyContent: 'center', gap: 1, flexShrink: 1 },
  readingHint: { fontSize: 13, fontWeight: '700', textAlign: 'center', opacity: 0.76 },
  compactReadingHint: { fontSize: 11, lineHeight: 13 },
  matchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  checkIcon: {
    flexShrink: 0,
  },
});
