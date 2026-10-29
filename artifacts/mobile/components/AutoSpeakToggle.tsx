import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useGame } from '@/context/GameContext';
import { useColors } from '@/hooks/useColors';

export function AutoSpeakToggle({ grouped = false }: { grouped?: boolean }) {
  const { activeLanguage, autoSpeakCorrect, toggleAutoSpeakCorrect } = useGame();
  const colors = useColors();
  const handleToggle = () => {
    if (autoSpeakCorrect) void Speech.stop();
    toggleAutoSpeakCorrect();
  };

  if (activeLanguage === 'armenian') return null;

  return (
    <TouchableOpacity
      onPress={handleToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: autoSpeakCorrect }}
      accessibilityLabel={`Speak correct words ${autoSpeakCorrect ? 'on' : 'off'}`}
      accessibilityHint="Toggles automatic pronunciation after a correct answer."
      style={[
        styles.button,
        grouped && styles.groupedButton,
        grouped && { backgroundColor: 'transparent', borderColor: 'transparent' },
      ]}
    >
      <Ionicons
        name={autoSpeakCorrect ? 'volume-high' : 'volume-mute'}
        size={19}
        color={grouped
          ? autoSpeakCorrect ? colors.primary : colors.mutedForeground
          : autoSpeakCorrect ? colors.primary : colors.mutedForeground}
      />
      <View
        style={[
          styles.statusDot,
          { backgroundColor: grouped
            ? autoSpeakCorrect ? colors.success : colors.mutedForeground
            : autoSpeakCorrect ? '#22C55E' : '#94A3B8' },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  groupedButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 0,
  },
  statusDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
