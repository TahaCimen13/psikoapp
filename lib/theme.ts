export const colors = {
  background: '#f5f6fa',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  accent: '#7c3aed',
  accentLight: '#6d28d9',
  accentDim: '#ede9fe',
  text: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  divider: '#f1f5f9',
  inputBg: '#f8fafc',
  placeholder: '#94a3b8',
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
