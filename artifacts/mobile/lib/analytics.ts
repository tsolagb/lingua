import { Platform } from 'react-native';

type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

/**
 * Tracks meaningful interactions in the published Expo web build.
 * Native builds and local previews safely do nothing when Umami is absent.
 */
export function trackEvent(name: string, data?: AnalyticsData): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never interrupt learning.
  }
}