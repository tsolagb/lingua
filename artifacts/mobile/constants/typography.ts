import type { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

export const typography = {
  largeTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.65,
  } satisfies TextStyle,
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.35,
  } satisfies TextStyle,
  headline: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  } satisfies TextStyle,
  bodyRegular: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '400',
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  } satisfies TextStyle,
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  wordTile: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  } satisfies TextStyle,
} as const;

export function getNunitoFamily(weight: TextStyle['fontWeight']): string {
  if (weight === '800' || weight === '900' || weight === 'bold') return fontFamilies.extraBold;
  if (weight === '700') return fontFamilies.bold;
  if (weight === '600' || weight === '500') return fontFamilies.semiBold;
  return fontFamilies.regular;
}

export const systemRoundedFont = {
  ios: 'System',
  android: 'sans-serif-rounded',
  web: 'system-ui',
  default: 'System',
} as const;
