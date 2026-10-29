import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { fontFamilies } from '@/constants/typography';

/** Original, friendly geometric avatar: ring, face, hair cap, dot eyes and a smile. */
export function ChatAvatar({ color, skin, hair, size = 40, initial }: { color: string; skin: string; hair: string; size?: number; initial?: string }) {
  const face = size * 0.82;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ width: face, height: face, borderRadius: face / 2, backgroundColor: skin, overflow: 'hidden', alignItems: 'center' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: face * 0.34, backgroundColor: hair, borderBottomLeftRadius: face * 0.3, borderBottomRightRadius: face * 0.5 }} />
        <View style={{ flexDirection: 'row', gap: face * 0.2, marginTop: face * 0.44 }}>
          <View style={{ width: face * 0.1, height: face * 0.12, borderRadius: face, backgroundColor: '#2A1E1A' }} />
          <View style={{ width: face * 0.1, height: face * 0.12, borderRadius: face, backgroundColor: '#2A1E1A' }} />
        </View>
        <View style={{ width: face * 0.3, height: face * 0.14, borderBottomWidth: Math.max(2, face * 0.06), borderColor: '#2A1E1A', borderBottomLeftRadius: face, borderBottomRightRadius: face, marginTop: face * 0.04 }} />
        <View style={{ position: 'absolute', top: face * 0.6, left: face * 0.16, width: face * 0.12, height: face * 0.07, borderRadius: face, backgroundColor: '#FF8A7A', opacity: 0.6 }} />
        <View style={{ position: 'absolute', top: face * 0.6, right: face * 0.16, width: face * 0.12, height: face * 0.07, borderRadius: face, backgroundColor: '#FF8A7A', opacity: 0.6 }} />
      </View>
      {initial ? (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{initial}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const v = useSharedValue(0);
  const reduced = useReduceMotion();
  useEffect(() => {
    if (reduced) { v.value = 0.5; return; }
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })), -1));
  }, [delay, reduced, v]);
  const st = useAnimatedStyle(() => ({ opacity: 0.35 + v.value * 0.65, transform: [{ translateY: -v.value * 4 }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, st]} />;
}

export function TypingDots({ color }: { color: string }) {
  return (
    <View style={styles.dots} accessibilityLabel="Typing">
      <Dot delay={0} color={color} />
      <Dot delay={150} color={color} />
      <Dot delay={300} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 5, paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badge: { position: 'absolute', bottom: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontFamily: fontFamilies.extraBold, fontSize: 8 },
});
