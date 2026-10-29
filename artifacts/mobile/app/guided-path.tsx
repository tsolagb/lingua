import React from 'react';
import { Platform, StyleSheet, View } from '@/components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuidedLearnPath } from '@/components/GuidedLearnPath';
import { useColors } from '@/hooks/useColors';

export default function GuidedPathScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, {
      backgroundColor: colors.groupedBackground,
      paddingTop: Platform.OS === 'web' ? 67 : insets.top,
      paddingBottom: Platform.OS === 'web' ? 16 : insets.bottom,
    }]}>
      <GuidedLearnPath />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
