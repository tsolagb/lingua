import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_PREFERENCE_KEY = '@linguamatch_theme_preference';

export type ThemePreference = 'light' | 'dark' | 'system';
type AppColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  colorScheme: AppColorScheme;
  isLoaded: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((savedPreference) => {
        if (!active) return;
        if (isThemePreference(savedPreference)) {
          setPreferenceState(savedPreference);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
    }
  }, [preference]);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
    setPreferenceState(nextPreference);
  }, []);

  const colorScheme: AppColorScheme =
    preference === 'system'
      ? systemColorScheme === 'dark' ? 'dark' : 'light'
      : preference;

  const value = useMemo(
    () => ({ preference, colorScheme, isLoaded, setPreference }),
    [preference, colorScheme, isLoaded, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeSettings must be used within ThemeProvider.');
  }
  return context;
}
