
export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B84FF',
  secondary: '#FF6584',
  accent: '#43E97B',
  accentOrange: '#FF6B35',
  background: '#F8F9FE',
  white: '#FFFFFF',
  black: '#1A1A2E',
  gray: '#9CA3AF',
  grayLight: '#F3F4F6',
  grayDark: '#6B7280',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  shadow: 'rgba(108, 99, 255, 0.15)',
  cardBg: '#FFFFFF',
  inputBg: '#F3F4F6',
  border: '#E5E7EB',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
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

export const BUS_ROUTES = [
  {
    id: 'b1',
    name: 'Route A - Campus to City',
    from: 'Main Campus Gate',
    to: 'City Bus Stand',
    departureTime: '08:00 AM',
    returnTime: '05:30 PM',
    totalSeats: 40,
    waitingSeats: 10,
    fare: 15,
    bookedSeats: [1,2,5,8,10,12,15,18,20,21,22,25,28,30],
    stops: ['Campus Gate', 'Library', 'Boys Hostel', 'NH Highway', 'City Bus Stand'],
  },
  {
    id: 'b2',
    name: 'Route B - Campus to Railway',
    from: 'Main Campus Gate',
    to: 'Railway Station',
    departureTime: '07:30 AM',
    returnTime: '06:00 PM',
    totalSeats: 35,
    waitingSeats: 10,
    fare: 20,
    bookedSeats: [1,3,4,7,9,11,14,16,19,23,26],
    stops: ['Campus Gate', 'Admin Block', 'Market Area', 'Railway Station'],
  },
  {
    id: 'b3',
    name: 'Route C - North Campus Shuttle',
    from: 'North Campus',
    to: 'Main Campus',
    departureTime: '09:00 AM',
    returnTime: '04:00 PM',
    totalSeats: 30,
    waitingSeats: 10,
    fare: 10,
    bookedSeats: [2,6,13,17,24,27],
    stops: ['North Campus', 'Science Block', 'Sports Complex', 'Main Campus'],
  },
];

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

export const MOCK_USERS = [
  { id: 'u1', name: 'Rahul Sharma', email: 'rahul@ghoomo.com', phone: '9876543210', role: 'user', password: '123456' },
  { id: 'u2', name: 'Priya Singh', email: 'priya@ghoomo.com', phone: '9876543211', role: 'user', password: '123456' },
  { id: 'd1', name: 'Ramesh Kumar', email: 'driver@ghoomo.com', phone: '9876543212', role: 'driver', password: '123456', vehicleType: 'cab', vehicleNo: 'PB-01-AB-1234', rating: 4.8 },
  { id: 'd2', name: 'Suresh Yadav', email: 'driver2@ghoomo.com', phone: '9876543213', role: 'driver', password: '123456', vehicleType: 'auto', vehicleNo: 'PB-02-CD-5678', rating: 4.6 },
  { id: 'bd1', name: 'Mohan Lal', email: 'busdriver@ghoomo.com', phone: '9876543214', role: 'driver', password: '123456', vehicleType: 'bus', busRoute: 'b1', rating: 4.9 },
  { id: 'a1', name: 'Admin User', email: 'admin@ghoomo.com', phone: '9876543215', role: 'admin', password: 'admin123' },
];
