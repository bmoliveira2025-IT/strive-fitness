import { Platform, TextStyle } from 'react-native';

// Strive Premium Athletic Minimalism — Neutral Athletic Fallbacks
const primaryLight = '#4D7C0F';
const primaryDark = '#B7F52A';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',
    backgroundTertiary: '#E2E8F0',
    card: '#FFFFFF',
    cardBorder: 'rgba(15, 23, 42, 0.08)',
    tint: primaryLight,
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: primaryLight,
    border: 'rgba(15, 23, 42, 0.08)',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0D0F12',
    backgroundSecondary: '#13161B',
    backgroundTertiary: '#1A1E24',
    card: '#161A20',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    tint: primaryDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: primaryDark,
    border: 'rgba(255, 255, 255, 0.07)',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  },
};

// Spacing System (4, 8, 12, 16, 20, 24, 32, 40, 48)
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

// Radius System (12px to 16px modern subtle curves)
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Typography Font Family mapping with fallback
export const FontFamily = {
  // Sora for Display, Headings, Numbers, Metrics, Timers, PRs
  display: 'Sora_700Bold',
  displaySemiBold: 'Sora_600SemiBold',
  displayRegular: 'Sora_400Regular',
  displayExtraBold: 'Sora_800ExtraBold',

  // Inter for Body, Labels, Descriptions, Menus, Buttons, Secondary Info
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  caption: 'Inter_600SemiBold',
};

// Standard Typography Scale
export const Typography: Record<string, TextStyle> = {
  display: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  caption: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricLarge: {
    fontFamily: FontFamily.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  metricMedium: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  metricSmall: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  button: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: FontFamily.sans,
    display: FontFamily.display,
    mono: 'ui-monospace',
  },
  default: {
    sans: FontFamily.sans,
    display: FontFamily.display,
    mono: 'monospace',
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    display: "'Sora', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
