import React from 'react';
import {
  Platform,
  StyleSheet,
  Text as NativeText,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { getNunitoFamily, systemRoundedFont } from '@/constants/typography';

const fallbackFont = Platform.select(systemRoundedFont);
const AppFontContext = React.createContext(false);

export function AppTypographyProvider({
  loaded,
  children,
}: React.PropsWithChildren<{ loaded: boolean }>) {
  return <AppFontContext.Provider value={loaded}>{children}</AppFontContext.Provider>;
}

/**
 * Shared app text. Use the matching bundled Nunito weight when available and
 * a platform rounded system font if the Google font could not be loaded.
 */
export const AppText = React.forwardRef<React.ElementRef<typeof NativeText>, TextProps>(
  function AppText({ style, ...props }, ref) {
    const currentStyle = StyleSheet.flatten(style);
    const fontLoaded = React.useContext(AppFontContext);
    const customFont = currentStyle?.fontFamily;
    const usesSpecialFont = typeof customFont === 'string' &&
      (customFont.toLowerCase().includes('mono') || customFont.toLowerCase().includes('serif'));
    const fontFamily = usesSpecialFont
      ? customFont
      : fontLoaded
        ? getNunitoFamily(currentStyle?.fontWeight)
        : fallbackFont;

    return (
      <NativeText
        {...props}
        ref={ref}
        style={[
          style,
          {
            fontFamily,
            ...(fontLoaded && !usesSpecialFont ? { fontWeight: 'normal' as TextStyle['fontWeight'] } : {}),
          },
        ]}
      />
    );
  },
);

AppText.displayName = 'AppText';
