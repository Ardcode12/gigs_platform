/**
 * WORKMAT Worker App — Design System
 * Clean, accessible, large-touch-target design for skilled Indian workers.
 */

export const COLORS = {
  // Primary palette
  primary: '#1B6EF5',
  primaryLight: '#E8F0FE',
  primaryDark: '#1558C7',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#0EA5E9',
  infoLight: '#E0F2FE',

  // Neutrals
  white: '#FFFFFF',
  background: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textWhite: '#FFFFFF',
  textSuccess: '#15803D',
  textDanger: '#DC2626',

  // Misc
  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: 'rgba(15, 23, 42, 0.08)',
  online: '#22C55E',
  offline: '#94A3B8',

  // Gradient-like accents (used as bg pairs)
  gradientStart: '#1B6EF5',
  gradientEnd: '#6366F1',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  hero: 36,
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

// Font families are per-language and live in src/i18n/fonts.js — Poppins has no
// Tamil, Malayalam, Telugu or Devanagari glyphs, so the family depends on the
// active language. Screens never set fontFamily themselves: they set
// FONT_WEIGHT and src/utils/globalFonts.js resolves the face.

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const ICON_SIZE = {
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
  xxl: 36,
};
