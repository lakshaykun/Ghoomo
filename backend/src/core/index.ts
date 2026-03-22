/**
 * Type Definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver extends User {
  licenseNumber: string;
  licenseExpiry: Date;
  vehicleType: VehicleType;
  vehicleNumber: string;
  rating: number;
  totalRides: number;
}

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: Location;
  dropLocation: Location;
  rideType: RideType;
  status: RideStatus;
  fare: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export enum UserRole {
  USER = 'user',
  DRIVER = 'driver',
  ADMIN = 'admin'
}

export enum VehicleType {
  BIKE = 'bike',
  AUTO = 'auto',
  CAB = 'cab'
}

export enum RideType {
  PERSONAL = 'personal',
  SHARED = 'shared'
}

export enum RideStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface AuthRequest {
  userId?: string;
  user?: User;
}
