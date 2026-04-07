const { AppError, calculateDistanceKm, toFiniteNumber } = require("../../common/utils/helpers");
const driverRepository = require("../driver/driver.repository");
const repository = require("./ride.repository");

const FARE_TABLE = {
  auto: { base: 30, perKm: 12 },
  cab: { base: 50, perKm: 18 },
};

function normalizeRideRequestPayload(payload = {}) {
  const pickup = payload.pickup || {};
  const drop = payload.drop || {};

  return {
    pickupLocation: payload.pickupLocation || pickup.address,
    dropLocation: payload.dropLocation || drop.address,
    pickupLatitude: payload.pickupLatitude ?? pickup.latitude,
    pickupLongitude: payload.pickupLongitude ?? pickup.longitude,
    dropLatitude: payload.dropLatitude ?? drop.latitude,
    dropLongitude: payload.dropLongitude ?? drop.longitude,
    isShared: Boolean(payload.isShared),
    expiresAt: payload.expiresAt || null,
  };
}

async function getQuote(payload) {
  const pickupLatitude = Number(payload.pickupLatitude);
  const pickupLongitude = Number(payload.pickupLongitude);
  const dropLatitude = Number(payload.dropLatitude);
  const dropLongitude = Number(payload.dropLongitude);

  const distanceKm = calculateDistanceKm(
    pickupLatitude,
    pickupLongitude,
    dropLatitude,
    dropLongitude
  );

  const fareRule = FARE_TABLE[payload.vehicleType] || FARE_TABLE.auto;
  let estimatedFare = fareRule.base + distanceKm * fareRule.perKm;

  if (payload.isShared) {
    estimatedFare = estimatedFare * 0.7;
  }

  return {
    distanceKm: Number(distanceKm.toFixed(3)),
    estimatedFare: Number(estimatedFare.toFixed(2)),
    vehicleType: payload.vehicleType,
    isShared: Boolean(payload.isShared),
  };
}

async function createRideRequest(studentId, payload) {
  const normalized = normalizeRideRequestPayload(payload);

  return repository.createRideRequest({
    studentId,
    pickupLocation: String(normalized.pickupLocation).trim(),
    dropLocation: String(normalized.dropLocation).trim(),
    pickupLatitude: Number(normalized.pickupLatitude),
    pickupLongitude: Number(normalized.pickupLongitude),
    dropLatitude: Number(normalized.dropLatitude),
    dropLongitude: Number(normalized.dropLongitude),
    isShared: Boolean(normalized.isShared),
    expiresAt: normalized.expiresAt,
  });
}

async function getRideRequest(requestId) {
  const request = await repository.getRideRequestById(requestId);
  if (!request) {
    throw new AppError("Ride request not found", 404, "RIDE_REQUEST_NOT_FOUND");
  }
  return request;
}

async function cancelRideRequest(requestId, studentId) {
  const row = await repository.cancelRideRequest(requestId, studentId);
  if (!row) {
    throw new AppError("Ride request not found", 404, "RIDE_REQUEST_NOT_FOUND");
  }
  return row;
}

async function assignDriver(requestId, payload) {
  const driver = await driverRepository.findDriverById(payload.driverId);
  if (!driver) {
    throw new AppError("Driver not found", 404, "DRIVER_NOT_FOUND");
  }

  return repository.createRideFromRequest({
    requestId,
    driverId: payload.driverId,
    fare: payload.fare ? Number(payload.fare) : null,
    distance: payload.distance ? Number(payload.distance) : null,
  });
}

async function getRide(rideId) {
  const ride = await repository.getRideById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
  }
  return ride;
}

async function updateRideStatus(rideId, status) {
  const ride = await repository.updateRideStatus(rideId, status);
  if (!ride) {
    throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
  }
  return ride;
}

async function getRideHistory(userId) {
  return repository.listRideHistoryForUser(userId);
}

async function rateRide(rideId, studentId, payload) {
  const ride = await repository.getRideById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (ride.student_id !== studentId) {
    throw new AppError("You can only rate your own rides", 403, "FORBIDDEN");
  }

  const rating = await repository.createOrUpdateDriverRating({
    rideId,
    studentId,
    driverId: ride.driver_id,
    rating: Number(payload.rating),
    reviewText: payload.reviewText,
  });

  await repository.refreshDriverRating(ride.driver_id);
  return rating;
}

module.exports = {
  normalizeRideRequestPayload,
  getQuote,
  createRideRequest,
  getRideRequest,
  cancelRideRequest,
  assignDriver,
  getRide,
  updateRideStatus,
  getRideHistory,
  rateRide,
};
