/** LinguaMatch design tokens — clear blue controls with playful topic accents. */

const colors = {
  light: {
    text: '#1A1A1A',
    tint: '#1F6FEB',

    background: '#F8FAFC',
    groupedBackground: '#F5F7FB',
    foreground: '#1A1A1A',

    card: '#FFFFFF',
    cardForeground: '#1A1A1A',

    primary: '#1F6FEB',
    primaryForeground: '#FFFFFF',
    primaryDark: '#185AC7',

    secondary: '#7C3AED',
    secondaryForeground: '#FFFFFF',

    muted: '#F1F5F9',
    mutedForeground: '#64748B',

    accent: '#EFF6FF',
    accentForeground: '#185AC7',

    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    border: '#E5E7EB',
    input: '#E5E7EB',

    success: '#16A34A',
    successForeground: '#FFFFFF',

    // Game-specific tokens
    leftCardBg:           '#E5F0FF',
    leftCardBorder:       '#5B8FF5',
    rightCardBg:          '#EDE9FE',
    rightCardBorder:      '#A78BFA',
    cardSelectedBg:       '#D8E7FF',
    cardSelectedBorder:   '#1F6FEB',
    cardMatchedBg:        '#DCFCE7',
    cardMatchedBorder:    '#22C55E',
    cardErrorBg:          '#FEE2E2',
    cardErrorBorder:      '#F87171',
    // Shared vivid blue with the existing lavender companion.
    homePrimary: '#2F6BEA',
    homePrimaryDark: '#1F57D6',
    homeAccent: '#7753AF',
    homeAccentSoft: '#ECE4F8',
    homeGlowBlue: '#D5E4FF',
    homeGlowAccent: '#E8DFF9',
    homeLogoSurface: 'transparent',
    glassFill: 'rgba(255,255,255,0.62)',
    glassFallback: 'rgba(255,255,255,0.86)',
    // Fully opaque so underlying home glows cannot reduce text contrast.
    glassOpaque: '#FFFFFF',
    glassBorder: 'rgba(255,255,255,0.9)',
    glassHairline: 'rgba(15,23,42,0.07)',
    glassShadow: '#1E3A8A',
    onAccent: '#FFFFFF',
    onAccentMuted: 'rgba(255,255,255,0.82)',
    onAccentSurface: 'rgba(255,255,255,0.2)',
    streakFrom: '#2F6BEA',
    streakTo: '#7753AF',
    lessonAccents: [
      { background: '#E8F1FF', foreground: '#1F6FEB' },
      { background: '#F1EAFE', foreground: '#7C3AED' },
      { background: '#E5F7EF', foreground: '#16834A' },
      { background: '#FFF3E3', foreground: '#AE5B00' },
      { background: '#FFE9EC', foreground: '#C63856' },
      { background: '#E3F5F6', foreground: '#0F7880' },
    ],
  },

  dark: {
    text: '#F1F5F9',
    tint: '#4C8DFF',

    background: '#0B1220',
    groupedBackground: '#0B0B0D',
    foreground: '#F1F5F9',

    card: '#111B2E',
    cardForeground: '#F1F5F9',

    primary: '#4C8DFF',
    primaryForeground: '#0B1220',
    primaryDark: '#1F57D6',

    secondary: '#A78BFA',
    secondaryForeground: '#0B1220',

    muted: '#1E293B',
    mutedForeground: '#A7B4C7',

    accent: '#172B49',
    accentForeground: '#BFDBFE',

    destructive: '#F87171',
    destructiveForeground: '#0B1220',

    border: '#334155',
    input: '#334155',

    success: '#4ADE80',
    successForeground: '#052E16',

    leftCardBg: '#172B49',
    leftCardBorder: '#4C8DFF',
    rightCardBg: '#2C2147',
    rightCardBorder: '#8B5CF6',
    cardSelectedBg: '#1E3A5F',
    cardSelectedBorder: '#4C8DFF',
    cardMatchedBg: '#123522',
    cardMatchedBorder: '#4ADE80',
    cardErrorBg: '#451A1A',
    cardErrorBorder: '#F87171',
    homePrimary: '#4C8DFF',
    homePrimaryDark: '#1F57D6',
    homeAccent: '#C4B5FD',
    homeAccentSoft: 'rgba(196,181,253,0.14)',
    homeGlowBlue: '#24416D',
    homeGlowAccent: '#40345D',
    homeLogoSurface: 'rgba(255,255,255,0.94)',
    glassFill: 'rgba(17,27,46,0.55)',
    glassFallback: 'rgba(20,31,52,0.92)',
    glassOpaque: '#141F34',
    glassBorder: 'rgba(255,255,255,0.1)',
    glassHairline: 'rgba(255,255,255,0.08)',
    glassShadow: '#000814',
    onAccent: '#FFFFFF',
    onAccentMuted: 'rgba(255,255,255,0.82)',
    onAccentSurface: 'rgba(255,255,255,0.18)',
    streakFrom: '#4C8DFF',
    streakTo: '#7558B4',
    lessonAccents: [
      { background: '#1A2E4D', foreground: '#7EB0FF' },
      { background: '#2C2347', foreground: '#C4B5FD' },
      { background: '#15392D', foreground: '#6EE7B7' },
      { background: '#42301A', foreground: '#FBBF65' },
      { background: '#441F2A', foreground: '#FDA4AF' },
      { background: '#17373A', foreground: '#67D5D9' },
    ],
  },

  radius: 16,
};

export default colors;
