const { AppError, calculateDistanceKm, toFiniteNumber } = require("../../common/utils/helpers");
const driverRepository = require("../driver/driver.repository");
const { findNearestDriver } = require("../driver/driver.service");
const repository = require("./ride.repository");
const { broadcastToDriverUsers, broadcastToUser, updateDriverSocketInfo } = require("../../common/utils/socket");
const { calculateFare } = require("./rateCard");

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
    vehicleType: payload.vehicleType || payload.rideType || null,
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

  const estimatedFare = calculateFare({
    distanceKm,
    vehicleType: payload.vehicleType,
    isShared: Boolean(payload.isShared),
  });

  return {
    distanceKm: Number(distanceKm.toFixed(3)),
    estimatedFare: Number(estimatedFare.toFixed(2)),
    vehicleType: payload.vehicleType,
    isShared: Boolean(payload.isShared),
  };
}

async function createRideRequest(studentId, payload) {
  return createRide(studentId, payload);
}

async function createRide(studentId, payload) {
  const normalized = normalizeRideRequestPayload(payload);
  const pickupLatitude = Number(normalized.pickupLatitude);
  const pickupLongitude = Number(normalized.pickupLongitude);
  const tripQuote = await getQuote({
    pickupLatitude,
    pickupLongitude,
    dropLatitude: normalized.dropLatitude,
    dropLongitude: normalized.dropLongitude,
    vehicleType: normalized.vehicleType || "auto",
    isShared: Boolean(normalized.isShared),
  });

  const request = await repository.createRideRequest({
    studentId,
    pickupLocation: String(normalized.pickupLocation).trim(),
    dropLocation: String(normalized.dropLocation).trim(),
    pickupLatitude,
    pickupLongitude,
    dropLatitude: Number(normalized.dropLatitude),
    dropLongitude: Number(normalized.dropLongitude),
    isShared: Boolean(normalized.isShared),
    vehicleType: normalized.vehicleType,
    estimatedFare: tripQuote.estimatedFare,
    estimatedDistanceKm: tripQuote.distanceKm,
    expiresAt: normalized.expiresAt,
  });

  const logMsgStart = `[${new Date().toISOString()}] [RideService] Dispatching ride request: requestId=${request.id}, vehicleType=${normalized.vehicleType}\n`;
  require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', logMsgStart);

  // Build candidates from DB-first eligibility so assignment does not depend on socket timing.
  const candidateDriverUserIds = await repository.listEligibleDriverUserIdsForRequest({
    pickupLatitude,
    pickupLongitude,
    vehicleType: normalized.vehicleType || tripQuote.vehicleType,
    limit: 25,
  });

  // Realtime socket delivery is best-effort; candidate records remain the source of truth.
  const deliveredDriverUserIds = broadcastToDriverUsers(candidateDriverUserIds, "new_ride_request", {
    request,
    tripQuote,
  });
  const notifiedCount = candidateDriverUserIds.length;

  const logMsgEnd = `[${new Date().toISOString()}] [RideService] Candidates=${notifiedCount}, delivered=${deliveredDriverUserIds.length}\n`;
  require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', logMsgEnd);

  // Record candidates in DB so they appear in driver dashboard
  await repository.createRideCandidates(request.id, candidateDriverUserIds);

  // Store how many were notified
  await repository.updateRideRequest(request.id, { notified_driver_count: notifiedCount });

  return { ...request, notified_driver_count: notifiedCount };
}

async function getRideRequest(requestId) {
  const request = await repository.getRideRequestById(requestId);
  if (!request) {
    throw new AppError("Ride request not found", 404, "RIDE_REQUEST_NOT_FOUND");
  }
  return request;
}

async function cancelRideRequest(requestId, studentId) {
  const request = await repository.getRideRequestById(requestId);
  
  // If it is just a request (not yet matched to a ride)
  if (request) {
    if (['cancelled', 'matched', 'expired'].includes(request.status)) {
      if (request.status === 'matched') {
        // If matched, we should look for the ride record
      } else {
        return repository.cancelRideRequest(requestId, studentId);
      }
    } else {
      return repository.cancelRideRequest(requestId, studentId);
    }
  }

  const ride = await repository.getRideByRequestId(requestId) || await repository.getRideById(requestId);
  if (!ride) {
    if (request) return repository.cancelRideRequest(requestId, studentId);
    throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  const currentStatus = String(ride.status).toUpperCase();
  const blockedStatuses = ["ON_TRIP", "COMPLETED", "CANCELLED"];
  
  if (blockedStatuses.includes(currentStatus)) {
    throw new AppError(`Cannot cancel ride in ${currentStatus} state`, 403, "FORBIDDEN");
  }

  const updatedRide = await repository.updateRideStatus(ride.id, "CANCELLED");
  
  // Also cancel the request if it exists
  if (ride.request_id) {
    await repository.updateRideRequest(ride.request_id, { status: 'cancelled' });
  }

  return updatedRide;
}

async function assignDriver(requestId, payload) {
  const driver = await driverRepository.findDriverById(payload.driverId);
  if (!driver) {
    throw new AppError("Driver not found", 404, "DRIVER_NOT_FOUND");
  }

  if (driver.availability_status !== 'idle' || driver.status !== "approved") {
    throw new AppError("Driver is not available for new rides", 409, "DRIVER_NOT_AVAILABLE");
  }

  const ride = await repository.createRideFromRequest({
    requestId,
    driverId: payload.driverId,
    fare: payload.fare ? Number(payload.fare) : null,
    distance: payload.distance ? Number(payload.distance) : null,
  });

  broadcastToUser(ride.student_id, "ride_accepted", { ride });

  // Sync socket state - driver is now busy
  const driverUserId = driver.user_id || driver.userId;
  if (driverUserId) {
    updateDriverSocketInfo(driverUserId, { 
      isAvailable: false,
      vehicleType: driver.vehicle_type || driver.vehicleType
    });
  }

  return ride;
}

async function getRide(rideId) {
  const ride = await repository.getRideById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
  }
  return ride;
}

async function updateRideStatus(rideId, status) {
  console.log(`[RideService] updateRideStatus: rideId=${rideId}, status=${status}`);
  const ride = await repository.updateRideStatus(rideId, status);
  if (!ride) {
    throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  broadcastToUser(ride.student_id, "ride_status_updated", { ride });

  // Sync socket state if ride ended
  const normalizedStatus = String(status || "").toUpperCase();
  if (["COMPLETED", "CANCELLED"].includes(normalizedStatus)) {
    const driverUserId = ride.driver_user_id || ride.driverUserId;
    console.log(`[RideService] Ride ended (${normalizedStatus}), resetting driver socket: driverUserId=${driverUserId}`);
    if (driverUserId) {
      updateDriverSocketInfo(driverUserId, { 
        isAvailable: true,
        vehicleType: ride.driver_vehicle_type || ride.vehicle_type
      });
    }
  }

  return ride;
}

async function getRideHistory(userId, role) {
  if (role === 'driver') {
    const driver = await driverRepository.findDriverByUserId(userId);
    if (driver) {
      return repository.listRideHistoryForDriver(driver.id);
    }
  }
  return repository.listRideHistoryForUser(userId);
}

async function verifyRideOtp(rideId, submittedOtp) {
  const ride = await repository.getRideById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (ride.status !== "ACCEPTED" && ride.status !== "DRIVER_ARRIVED") {
    throw new AppError(
      `OTP can only be verified when ride is ACCEPTED or DRIVER_ARRIVED (current: ${ride.status})`,
      409,
      "INVALID_RIDE_STATE"
    );
  }

  const storedOtp = ride.ride_otp || ride.otp;
  if (!storedOtp || storedOtp !== submittedOtp) {
    throw new AppError("Invalid OTP", 400, "INVALID_OTP");
  }

  // Transition: OTP_VERIFIED → then immediately ON_TRIP
  let updated = await repository.updateRideStatus(rideId, "OTP_VERIFIED");
  updated = await repository.updateRideStatus(rideId, "ON_TRIP");

  broadcastToUser(updated.student_id, "ride_status_updated", { ride: updated });
  return updated;
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

async function rejectRideRequest(requestId, driverId) {
  const request = await repository.getRideRequestById(requestId);
  if (!request) throw new AppError("Request not found", 404);

  // Atomic increment of rejected_driver_count
  const updated = await repository.incrementRejections(requestId);

  // If rejections >= notified, and ride is still searching, cancel it
  if (updated.status === 'searching' && updated.rejected_driver_count >= updated.notified_driver_count) {
    await repository.updateRideRequest(requestId, { status: 'cancelled' });
    broadcastToUser(updated.student_id, "ride_status_updated", { rideId: requestId, status: 'cancelled', reason: 'NO_DRIVERS_AVAILABLE' });
  }

  return updated;
}

module.exports = {
  normalizeRideRequestPayload,
  getQuote,
  createRideRequest,
  createRide,
  getRideRequest,
  cancelRideRequest,
  assignDriver,
  getRide,
  updateRideStatus,
  getRideHistory,
  verifyRideOtp,
  rateRide,
  rejectRideRequest,
};
