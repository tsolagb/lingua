import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle, PressableProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useReduceTransparency } from '@/hooks/useReduceTransparency';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { MOTION, MOTION_SPRING } from '@/constants/motion';
import * as Haptics from 'expo-haptics';

/** Frosted panel with an opaque iOS accessibility fallback. */
export function GlassPanel({
  children,
  style,
  radius = 22,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}) {
  const colors = useColors();
  const reduceTransparency = useReduceTransparency();
  const useBlur = Platform.OS === 'ios' && !reduceTransparency;
  return (
    <View
      style={[
        styles.shadow,
        {
          borderRadius: radius,
          boxShadow: colors.colorScheme === 'dark'
            ? '0px 8px 18px rgba(0,8,20,0.35)'
            : '0px 8px 18px rgba(30,58,138,0.08)',
        },
      ]}
    >
      <View
        style={[
          styles.clip,
          {
            borderRadius: radius,
            borderColor: colors.glassBorder,
            backgroundColor: reduceTransparency
              ? colors.glassOpaque
              : useBlur ? colors.glassFill : colors.glassFallback,
          },
        ]}
      >
        {useBlur && (
          <BlurView
            intensity={40}
            tint={colors.colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={style}>{children}</View>
      </View>
    </View>
  );
}

/** Pressable with a gentle spring-scale press response. */
export function PressScale({
  children,
  style,
  scaleTo = 0.975,
  ...rest
}: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useSharedValue(1);
  const reduced = useReduceMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animated, style]}>
      <Pressable
        {...rest}
        onPressIn={e => {
          if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
          scale.value = reduced ? 1 : withTiming(Math.min(scaleTo, 0.96), { duration: MOTION.pressInMs });
          rest.onPressIn?.(e);
        }}
        onPressOut={e => {
          scale.value = reduced ? 1 : withSpring(1, MOTION_SPRING);
          rest.onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    elevation: 2,
  },
  clip: { overflow: 'hidden', borderWidth: 1 },
});
