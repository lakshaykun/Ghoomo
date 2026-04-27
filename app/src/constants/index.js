
export { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../theme';

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
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};
