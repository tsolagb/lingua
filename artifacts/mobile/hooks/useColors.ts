import colors from '@/constants/colors';
import { useThemeSettings } from '@/context/ThemeContext';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Uses the learner's saved appearance choice, or the device setting when selected.
 */
export function useColors() {
  const { colorScheme } = useThemeSettings();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius, colorScheme };
}
