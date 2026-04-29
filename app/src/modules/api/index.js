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
  fetchBusRouteTrackingRemote,
  fetchBusRoutesRemote,
  updateBusRouteLocationRemote,
  verifyBusBookingRemote,
} from "./features/busApi";
import {
  buildDriverDashboard,
  getNearbyDrivers,
  patchDriverLocation,
  setDriverAvailability,
  getDriverScheduledRides,
  acceptScheduledRide,
} from "./features/driverApi";
import { reverseGeocodeCoordinates, searchPlacesByText } from "./features/locationApi";
import {
  cancelRideRequestRemote,
  createRideRequest,
  fetchRideQuote,
  getRideByIdOrRequest,
  getRideHistoryForCurrentUser,
  requestRide,
  updateRideStatusRemote,
  verifyRideOtpRemote,
  rejectRideRequestRemote,
  assignDriverRemote,
} from "./features/rideApi";
import {
  closeSharedRideById,
  fetchSharedRidesForUser,
  findSharedRideByRideId,
  joinSharedRideById,
} from "./features/sharedRideApi";
import {
  addSavedLocation,
  getSavedLocations,
  removeSavedLocation,
} from "./features/userApi";
import { rateRideRemote } from "./features/rideApi";

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
  getBusTracking: (routeId) => fetchBusRouteTrackingRemote(routeId),
  updateBusLocation: (routeId, payload) => updateBusRouteLocationRemote(routeId, payload),
  getBusBookings: (params = {}) => fetchBusBookingsRemote(params),
  createBusBooking: (payload) => createBusBookingRemote(payload),
  cancelBusBooking: (bookingId) => cancelBusBookingRemote(bookingId),
  verifyBusBooking: (bookingId, verifiedBy) => verifyBusBookingRemote(bookingId, verifiedBy),

  searchPlaces: (params) => searchPlacesByText(params),
  reverseGeocode: (params) => reverseGeocodeCoordinates(params),
  getSavedLocations: () => getSavedLocations(),
  addSavedLocation: (payload) => addSavedLocation(payload),
  removeSavedLocation: (locationId) => removeSavedLocation(locationId),

  getNearbyDrivers: (params) => getNearbyDrivers(params),
  fetchQuote: (payload) => fetchRideQuote(payload),
  createRide: (payload) => createRideRequest(payload),
  cancelRequest: (requestId) => cancelRideRequestRemote(requestId),
  requestRide: (payload) => requestRide(payload),
  rateRide: (rideId, payload) => rateRideRemote(rideId, payload),
  getRide: (rideId) => getRideByIdOrRequest(rideId),
  updateRideStatus: (rideId, status, extra = {}) => updateRideStatusRemote(rideId, status, extra),
  assignDriver: (requestId, options = {}) => assignDriverRemote(requestId, options),
  verifyRideOtp: (rideId, otp) => verifyRideOtpRemote(rideId, otp),
  rejectRideRequest: (requestId) => rejectRideRequestRemote(requestId),
  getRideHistory: (userId) => getRideHistoryForCurrentUser(userId),

  getSharedRides: (userId) => fetchSharedRidesForUser(userId),
  getSharedRideByRide: (rideId, userId) => findSharedRideByRideId(rideId, userId),
  joinSharedRide: (sharedRideId, userId) => joinSharedRideById(sharedRideId, userId),
  closeSharedRide: (sharedRideId) => closeSharedRideById(sharedRideId),

  getDriverDashboard: (driverId) => buildDriverDashboard(driverId),
  getDriverScheduledRides: () => getDriverScheduledRides(),
  acceptScheduledRide: (rideId, payload) => acceptScheduledRide(rideId, payload),
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
