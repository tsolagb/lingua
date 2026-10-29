import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

/** Stay opaque until iOS confirms blur is allowed, including on query failure. */
export function useReduceTransparency() {
  const [reduceTransparency, setReduceTransparency] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let mounted = true;
    let revision = 0;
    const refresh = () => {
      const request = ++revision;
      void AccessibilityInfo.isReduceTransparencyEnabled().then(
        enabled => {
          if (mounted && request === revision) setReduceTransparency(enabled);
        },
        () => {
          if (mounted && request === revision) setReduceTransparency(true);
        },
      );
    };
    const preference = AccessibilityInfo.addEventListener('reduceTransparencyChanged', enabled => {
      // An in-flight initial/foreground query must not overwrite a newer event.
      revision++;
      setReduceTransparency(enabled);
    });
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    refresh();

    return () => {
      mounted = false;
      preference.remove();
      appState.remove();
    };
  }, []);

  return reduceTransparency;
}
