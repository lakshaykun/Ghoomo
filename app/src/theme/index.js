export const COLORS = {
  primary: '#2563eb', // Deep Blue
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  background: '#f8fafc', // Soft Gray
  surface: '#ffffff', // White
  text: '#0f172a',
  textSecondary: '#475569',
  success: '#16a34a', // Green
  warning: '#f59e0b', // Yellow
  error: '#dc2626', // Red
  info: '#0ea5e9',
  white: '#ffffff',
  black: '#000000',
  gray: '#94a3b8',
  grayLight: '#f1f5f9',
  grayDark: '#64748b',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  shadow: 'rgba(15, 23, 42, 0.08)',
  cardBg: '#ffffff',
  inputBg: '#ffffff',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const TYPOGRAPHY = {
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
};
