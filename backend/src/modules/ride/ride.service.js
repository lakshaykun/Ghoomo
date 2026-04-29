const { AppError, calculateDistanceKm, toFiniteNumber } = require("../../common/utils/helpers");
const driverRepository = require("../driver/driver.repository");
const { findNearestDriver } = require("../driver/driver.service");
const repository = require("./ride.repository");
const { withTransaction } = require("../../config/db");
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
    rideType: payload.rideType || (payload.isShared ? 'shared' : 'solo'),
    isScheduled: Boolean(payload.isScheduled) || (payload.rideType === 'shared' || payload.isShared === true),
    scheduledAt: payload.scheduledAt || null,
    acceptanceDeadline: payload.acceptanceDeadline || null,
    minVehicleCapacityAllowed: payload.minVehicleCapacityAllowed ? parseInt(payload.minVehicleCapacityAllowed, 10) : null,
    joinAllowedUntil: payload.joinAllowedUntil || null,
    passengersCount: payload.passengersCount ? parseInt(payload.passengersCount, 10) : 1,
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
    rideType: normalized.rideType,
    isScheduled: normalized.isScheduled,
    scheduledAt: normalized.scheduledAt,
    acceptanceDeadline: normalized.acceptanceDeadline,
    minVehicleCapacityAllowed: normalized.minVehicleCapacityAllowed,
    joinAllowedUntil: normalized.joinAllowedUntil,
    vehicleType: normalized.vehicleType,
    estimatedFare: tripQuote.estimatedFare,
    estimatedDistanceKm: tripQuote.distanceKm,
    expiresAt: normalized.expiresAt,
  });

  const isSharedOrScheduled = normalized.rideType === 'shared' || normalized.isScheduled;

  if (isSharedOrScheduled) {
    const ride = await repository.createRideWithoutDriver({
      requestId: request.id,
      studentId: studentId,
      pickupLocation: String(normalized.pickupLocation).trim(),
      dropLocation: String(normalized.dropLocation).trim(),
      pickupLatitude,
      pickupLongitude,
      dropLatitude: Number(normalized.dropLatitude),
      dropLongitude: Number(normalized.dropLongitude),
      fare: tripQuote.estimatedFare,
      distance: tripQuote.distanceKm,
      rideType: normalized.rideType,
      isScheduled: normalized.isScheduled,
      scheduledAt: normalized.scheduledAt,
      acceptanceDeadline: normalized.acceptanceDeadline,
      minVehicleCapacityAllowed: normalized.minVehicleCapacityAllowed,
      joinAllowedUntil: normalized.joinAllowedUntil,
      vehicleType: normalized.vehicleType,
    });

    // Add the creator as the first participant
    await participantsRepo.addParticipantToRide({
      rideId: ride.id,
      userId: studentId,
      passengersCount: normalized.passengersCount,
      pickupLocation: String(normalized.pickupLocation).trim(),
      dropLocation: String(normalized.dropLocation).trim(),
      pickupLatitude,
      pickupLongitude,
      dropLatitude: Number(normalized.dropLatitude),
      dropLongitude: Number(normalized.dropLongitude),
    });

    // Set participant as creator
    const { query } = require("../../config/db");
    await query(`UPDATE ride_participants SET is_creator = TRUE WHERE ride_id = $1 AND user_id = $2`, [ride.id, studentId]);

    // For scheduled rides, we don't automatically broadcast to all available drivers instantly unless we want to, 
    // but the prompt says: "Scheduled rides are visible to drivers immediately".
    // We can still broadcast them.
    const candidateDriverUserIds = await repository.listEligibleDriverUserIdsForRequest({
      pickupLatitude,
      pickupLongitude,
      vehicleType: normalized.vehicleType || tripQuote.vehicleType,
      limit: 25,
    });

    broadcastToDriverUsers(candidateDriverUserIds, "new_scheduled_ride", {
      ride,
      tripQuote,
    });

    // Record candidates
    await repository.createRideCandidates(request.id, candidateDriverUserIds);
    await repository.updateRideRequest(request.id, { notified_driver_count: candidateDriverUserIds.length });

    return { ...ride, is_ride: true };
  }

  // Standard Solo Instant Ride logic
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

const participantsRepo = require("./ride.participants.repository");

async function joinSharedRide(rideId, userId, payload) {
  const normalized = normalizeRideRequestPayload(payload);
  const participant = await participantsRepo.addParticipantToRide({
    rideId,
    userId,
    passengersCount: normalized.passengersCount || 1,
    pickupLocation: String(normalized.pickupLocation).trim(),
    dropLocation: String(normalized.dropLocation).trim(),
    pickupLatitude: Number(normalized.pickupLatitude),
    pickupLongitude: Number(normalized.pickupLongitude),
    dropLatitude: Number(normalized.dropLatitude),
    dropLongitude: Number(normalized.dropLongitude),
  });

  const ride = await repository.getRideById(rideId);
  const participants = await participantsRepo.getParticipants(rideId);
  broadcastToUser(ride.student_id, "participant_added", { ride, participants });
  // Could broadcast to all participants as requested
  return { participant, ride };
}

async function leaveSharedRide(rideId, userId) {
  await participantsRepo.removeParticipantFromRide({ rideId, userId });
  const ride = await repository.getRideById(rideId);
  const participants = await participantsRepo.getParticipants(rideId);
  // Re-calculate fare and broadcast
  broadcastToUser(ride.student_id, "participant_removed", { ride, participants });
  return { success: true };
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

async function acceptRide(rideId, driverUserId, payload) {
  // 1. Fetch driver profile to get vehicle info
  const driver = await driverRepository.findDriverByUserId(driverUserId);
  if (!driver) throw new AppError("Driver not found", 404, "DRIVER_NOT_FOUND");

  // 2. Lock and fetch ride, then accept atomically
  const updatedRide = await withTransaction(async (client) => {
    const rideResult = await client.query(`SELECT * FROM rides WHERE id = $1 FOR UPDATE`, [rideId]);
    const ride = rideResult.rows[0];

    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (!['OPEN', 'SCHEDULED'].includes(ride.status)) {
      throw new AppError("Ride is no longer available to accept", 400, "RIDE_UNAVAILABLE");
    }

    // 3. Check total passengers vs driver vehicle capacity
    const partsResult = await client.query(
      `SELECT COALESCE(SUM(passengers_count), 0)::int as total_passengers FROM ride_participants WHERE ride_id = $1 AND status != 'cancelled'`,
      [rideId]
    );
    const totalPassengers = partsResult.rows[0].total_passengers || 0;
    const vehicleSeats = payload?.vehicleSeats || driver.vehicle_seats || 4;

    if (totalPassengers > vehicleSeats && !payload?.forceAcceptPartial) {
      throw new AppError(
        `Passenger count (${totalPassengers}) exceeds your vehicle capacity (${vehicleSeats}). Use forceAcceptPartial=true to confirm.`,
        400,
        "PARTIAL_ACCEPTANCE_REQUIRED"
      );
    }

    // 4. Generate OTP for verification
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 5. Update the ride row
    const updatedResult = await client.query(
      `
      UPDATE rides
      SET
        status = 'ACCEPTED',
        driver_id = $1,
        vehicle_seats_snapshot = $2,
        otp = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [driver.id, vehicleSeats, otp, rideId]
    );

    const updatedRideRow = updatedResult.rows[0];

    // 6. Update driver state
    await client.query(
      `UPDATE drivers SET availability_status = 'on_ride', active_ride_id = $1, updated_at = NOW() WHERE id = $2`,
      [rideId, driver.id]
    );

    // 7. Mark the ride_request as matched
    if (updatedRideRow.request_id) {
      await client.query(
        `UPDATE ride_requests SET status = 'matched', locked = TRUE, updated_at = NOW() WHERE id = $1`,
        [updatedRideRow.request_id]
      );
    }

    return updatedRideRow;
  });

  // 8. Fetch full ride details with driver info
  const fullRide = await repository.getRideById(rideId);

  // 9. Broadcast to the ride creator
  broadcastToUser(updatedRide.student_id, "ride_accepted", { ride: fullRide || updatedRide });

  // 10. Update socket state — driver is now busy
  updateDriverSocketInfo(driverUserId, {
    isAvailable: false,
    vehicleType: driver.vehicle_type || driver.vehicleType,
  });

  return fullRide || updatedRide;
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

async function getAvailableSharedRides(query = {}) {
  return repository.getAvailableSharedRides(query);
}

async function processStaleRides() {
  const expiredRides = await repository.expireStaleRides();
  for (const ride of expiredRides) {
    broadcastToUser(ride.student_id, "ride_expired", { ride });
  }
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
  joinSharedRide,
  leaveSharedRide,
  getAvailableSharedRides,
  acceptRide,
  processStaleRides
};
