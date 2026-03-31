
export const COLORS = {
  primary: '#1D4ED8',
  primaryDark: '#1E3A8A',
  primaryLight: '#DBEAFE',
  secondary: '#F97360',
  accent: '#14B8A6',
  accentOrange: '#F59E0B',
  background: '#F4F7FB',
  surface: '#EDF4FF',
  white: '#FFFFFF',
  black: '#0F172A',
  gray: '#94A3B8',
  grayLight: '#F8FAFC',
  grayDark: '#64748B',
  text: '#0F172A',
  textSecondary: '#475569',
  success: '#0F9D76',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#0EA5E9',
  shadow: 'rgba(15, 23, 42, 0.08)',
  cardBg: '#FFFFFF',
  inputBg: '#F8FAFC',
  border: '#D9E2EC',
  borderStrong: '#BFCCDA',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const RIDE_TYPES = {
  BIKE: 'bike',
  AUTO: 'auto',
  CAB: 'cab',
  BUS: 'bus',
};

export const FARES = {
  bike: { base: 20, perKm: 8, label: 'Bike', icon: 'bicycle', color: '#FF6B35' },
  auto: { base: 30, perKm: 12, label: 'Auto', icon: 'car-sport', color: '#F59E0B' },
  cab: { base: 50, perKm: 18, label: 'Cab', icon: 'car', color: '#6C63FF' },
  cabShare: { base: 35, perKm: 11, label: 'Cab Share', icon: 'car', color: '#8B84FF' },
  autoShare: { base: 22, perKm: 9, label: 'Auto Share', icon: 'car-sport', color: '#43E97B' },
};


export const USER_ROLES = {
  USER: 'user',
  DRIVER: 'driver',
  ADMIN: 'admin',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};
