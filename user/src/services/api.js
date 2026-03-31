/**
 * API Service – wraps all backend calls
 * Base URL reads from EXPO_PUBLIC_API_URL env var
 * e.g.  EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────
export const sendOTP = (phone_number, name) =>
  api.post('/auth/send-otp', { phone_number, name });

export const verifyOTP = (phone_number, otp) =>
  api.post('/auth/verify-otp', { phone_number, otp });

export const getProfile = () => api.get('/auth/me');

export const updateProfile = (data) => api.put('/auth/profile', data);

// ── Rides ─────────────────────────────────────────────────────────
export const requestRide = (data) => api.post('/rides/request', data);

export const getRideRequest = (id) => api.get(`/rides/request/${id}`);

export const cancelRideRequest = (id) => api.delete(`/rides/request/${id}`);

export const getActiveRide = () => api.get('/rides/active');

export const getRide = (id) => api.get(`/rides/${id}`);

export const getRideHistory = (limit = 20, offset = 0) =>
  api.get('/rides/history', { params: { limit, offset } });

export const rateDriver = (rideId, rating, review_text) =>
  api.post(`/rides/${rideId}/rate`, { rating, review_text });

export const getNearbyDrivers = (lat, lng, radius = 5) =>
  api.get('/rides/nearby-drivers', { params: { lat, lng, radius } });

// ── GPS ───────────────────────────────────────────────────────────
export const getGPSLogs = (rideId) => api.get(`/gps/ride/${rideId}`);

export const getDriverLocation = (driverId) =>
  api.get(`/gps/driver/${driverId}/location`);

// ── Locations ─────────────────────────────────────────────────────
export const getDefaultLocations = () => api.get('/locations/defaults');

export const getSavedLocations = () => api.get('/locations/saved');

export const addSavedLocation = (data) => api.post('/locations/saved', data);

export const deleteSavedLocation = (id) => api.delete(`/locations/saved/${id}`);

// ── Helpers ───────────────────────────────────────────────────────
export { BASE_URL };
export default api;
