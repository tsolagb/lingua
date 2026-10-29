import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

function browserPreference() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

export function useReduceMotion() {
  const [reduced, setReduced] = useState(browserPreference);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const query = typeof window !== 'undefined'
        ? window.matchMedia?.('(prefers-reduced-motion: reduce)')
        : undefined;
      if (!query) return;
      const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
      if (query.addEventListener) {
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
      }
      query.addListener(onChange);
      return () => query.removeListener(onChange);
    }

    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (mounted) setReduced(value); })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
