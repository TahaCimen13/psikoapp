import { Platform } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

// Status bar / çentik yüksekliği: ekran başlıkları bunun ALTINDAN başlamalı.
// Cihazdan okunur; okunamazsa makul varsayılana düşer.
export const safeTop = initialWindowMetrics?.insets.top ?? (Platform.OS === 'ios' ? 47 : 24);

export const colors = {
  // Sayfa arka planı
  background: '#F8FAFC',

  // Kartlar ve surface'ler
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',

  // Primary — soft indigo (agresif mor yerine muted ton)
  accent: '#5B5BD6',
  accentLight: '#4F46E5',
  accentDim: '#EEF2FF',

  // Text hierarchy
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Semantic
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',

  // Input
  divider: '#F1F5F9',
  inputBg: '#F8FAFC',
  placeholder: '#CBD5E1',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
};
