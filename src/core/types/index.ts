/**
 * Core Type Definitions
 * Shared types across the application
 */

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'student' | 'driver' | 'admin';
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Ride Types
export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  fare: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  originalError?: Error;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Generic Result Type
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };
