export const Colors = {
  background: '#12101E',
  surface: '#1E1C2E',
  surfaceElevated: '#252338',
  border: '#2A2840',
  borderLight: '#3A3858',

  accent: '#9B8EC4',
  accentLight: '#B8ACDC',
  accentDim: '#6B5E94',
  accentGlow: 'rgba(155, 142, 196, 0.15)',

  gold: '#C9A84C',
  goldDim: 'rgba(201, 168, 76, 0.2)',

  textPrimary: '#E8E8F0',
  textSecondary: '#8A8A9A',
  textTertiary: '#5A5A6A',
  textAccent: '#B8ACDC',

  error: '#E07070',
  success: '#70C070',
  warning: '#E0B070',

  springGreen: '#7EC8A0',
  summerCoral: '#E8926A',
  fallAmber: '#C9A84C',
  winterIce: '#7BB8D4',

  noteTop: '#B8ACDC',
  noteMiddle: '#9B8EC4',
  noteBase: '#6B5E94',

  overlay: 'rgba(18, 16, 30, 0.85)',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  modalBg: 'rgba(18, 16, 30, 0.95)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
};

export const Typography = {
  displayLarge: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3 },
  headingLarge: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  headingMedium: { fontSize: 18, fontWeight: '600' as const },
  headingSmall: { fontSize: 16, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  caption: { fontSize: 10, fontWeight: '500' as const, letterSpacing: 0.5 },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
