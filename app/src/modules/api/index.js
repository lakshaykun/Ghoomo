import { getApiBaseUrl } from "./core/config";
import { clearAuthToken, setAuthToken } from "./core/authSession";
import {
  getCurrentUserProfile,
  loginWithPassword,
  registerDriverProfile,
  registerRider,
  socialLoginNotSupported,
} from "./features/authApi";
import {
  cancelBusBookingRemote,
  createBusBookingRemote,
  createBusRouteRemote,
  fetchBusBookingsRemote,
  fetchBusRoutesRemote,
  verifyBusBookingRemote,
} from "./features/busApi";
import {
  buildDriverDashboard,
  getNearbyDrivers,
  patchDriverLocation,
  setDriverAvailability,
} from "./features/driverApi";
import { reverseGeocodeCoordinates, searchPlacesByText } from "./features/locationApi";
import {
  createRideRequest,
  fetchRideQuote,
  getRideByIdOrRequest,
  getRideHistoryForCurrentUser,
  updateRideStatusRemote,
} from "./features/rideApi";
import {
  closeSharedRideById,
  fetchSharedRidesForUser,
  findSharedRideByRideId,
  joinSharedRideById,
} from "./features/sharedRideApi";

export function setApiAuthToken(token) {
  setAuthToken(token);
}

export function clearApiAuthToken() {
  clearAuthToken();
}

export const api = {
  login: (email, password, options = {}) => loginWithPassword(email, password, options),
  register: (payload) => registerRider(payload),
  registerDriverProfile: (payload) => registerDriverProfile(payload),
  me: () => getCurrentUserProfile(),

  googleLogin: () => socialLoginNotSupported(),
  firebaseLogin: () => socialLoginNotSupported(),

  registerPushToken: async () => ({
    success: true,
    message: "Push token endpoint is not available in the current backend.",
  }),
  removePushToken: async () => ({
    success: true,
    message: "Push token endpoint is not available in the current backend.",
  }),

  getBusRoutes: () => fetchBusRoutesRemote(),
  createBusRoute: (payload) => createBusRouteRemote(payload),
  getBusBookings: (params = {}) => fetchBusBookingsRemote(params),
  createBusBooking: (payload) => createBusBookingRemote(payload),
  cancelBusBooking: (bookingId) => cancelBusBookingRemote(bookingId),
  verifyBusBooking: (bookingId, verifiedBy) => verifyBusBookingRemote(bookingId, verifiedBy),

  searchPlaces: (params) => searchPlacesByText(params),
  reverseGeocode: (params) => reverseGeocodeCoordinates(params),

  getNearbyDrivers: (params) => getNearbyDrivers(params),
  fetchQuote: (payload) => fetchRideQuote(payload),
  createRide: (payload) => createRideRequest(payload),
  getRide: (rideId) => getRideByIdOrRequest(rideId),
  updateRideStatus: (rideId, status, extra = {}) => updateRideStatusRemote(rideId, status, extra),
  getRideHistory: (userId) => getRideHistoryForCurrentUser(userId),

  getSharedRides: (userId) => fetchSharedRidesForUser(userId),
  getSharedRideByRide: (rideId, userId) => findSharedRideByRideId(rideId, userId),
  joinSharedRide: (sharedRideId, userId) => joinSharedRideById(sharedRideId, userId),
  closeSharedRide: (sharedRideId) => closeSharedRideById(sharedRideId),

  getDriverDashboard: (driverId) => buildDriverDashboard(driverId),
  setDriverOnline: (driverId, online) =>
    setDriverAvailability({
      isAvailable: online,
    }),
  updateDriverLocation: async (driverId, location) => {
    await patchDriverLocation(location);
    return buildDriverDashboard(driverId);
  },
};

export { getApiBaseUrl };
