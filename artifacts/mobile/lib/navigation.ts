import { router, type Href } from 'expo-router';

/**
 * Preserve the actual screen history when it exists, and provide a sensible
 * destination when a nested route was opened directly.
 */
export function goBackOr(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
