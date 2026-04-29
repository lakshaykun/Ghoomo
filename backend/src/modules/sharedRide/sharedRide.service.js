const { AppError } = require("../../common/utils/helpers");
const rideRepository = require("../ride/ride.repository");
const participantsRepository = require("../ride/ride.participants.repository");
const repository = require("./sharedRide.repository");

/**
 * List shared rides (OPEN / SCHEDULED by default, or a specific status).
 * Returns a response shaped to match what the frontend's /api/shared-rides endpoint expects.
 */
async function listSharedRides(status) {
  const rides = await repository.listSharedRides(status);

  return rides.map((ride) => ({
    id: ride.id,
    base_ride_id: ride.id, // kept for legacy frontend compatibility
    student_id: ride.student_id,
    creator_name: ride.creator_name || "Rider",
    pickup_location: ride.pickup_location,
    drop_location: ride.drop_location,
    pickup_latitude: ride.pickup_latitude,
    pickup_longitude: ride.pickup_longitude,
    drop_latitude: ride.drop_latitude,
    drop_longitude: ride.drop_longitude,
    fare: ride.fare,
    vehicle_type: ride.vehicle_type,
    ride_type: ride.ride_type,
    status: (ride.status || "OPEN").toLowerCase(), // lowercase for legacy clients
    max_participants: ride.min_vehicle_capacity_allowed || 4,
    total_passengers: ride.total_passengers || 0,
    scheduled_at: ride.scheduled_at,
    is_scheduled: ride.is_scheduled,
    created_at: ride.created_at,
    updated_at: ride.updated_at,
  }));
}

/**
 * Get a single shared ride by its id, enriched with participants list.
 */
async function getSharedRide(rideId) {
  const ride = await repository.getSharedRideById(rideId);

  if (!ride) {
    throw new AppError("Shared ride not found", 404, "SHARED_RIDE_NOT_FOUND");
  }

  const participants = await repository.listParticipants(rideId);

  return {
    id: ride.id,
    base_ride_id: ride.id,
    student_id: ride.student_id,
    creator_name: ride.creator_name || "Rider",
    pickup_location: ride.pickup_location,
    drop_location: ride.drop_location,
    pickup_latitude: ride.pickup_latitude,
    pickup_longitude: ride.pickup_longitude,
    drop_latitude: ride.drop_latitude,
    drop_longitude: ride.drop_longitude,
    fare: ride.fare,
    vehicle_type: ride.vehicle_type,
    ride_type: ride.ride_type,
    status: (ride.status || "OPEN").toLowerCase(),
    max_participants: ride.min_vehicle_capacity_allowed || 4,
    total_passengers: ride.total_passengers || 0,
    scheduled_at: ride.scheduled_at,
    is_scheduled: ride.is_scheduled,
    participants: participants.map((p) => ({
      user_id: p.user_id,
      name: p.user_name,
      phone: p.user_phone,
      status: p.status,
      pickup_location: p.pickup_location,
      drop_location: p.drop_location,
      pickup_latitude: p.pickup_latitude,
      pickup_longitude: p.pickup_longitude,
      drop_latitude: p.drop_latitude,
      drop_longitude: p.drop_longitude,
      passengers_count: p.passengers_count,
      is_creator: p.is_creator,
    })),
    created_at: ride.created_at,
    updated_at: ride.updated_at,
  };
}

/**
 * Join a shared ride — validates capacity and uses row-level locking to avoid overbooking.
 */
async function joinSharedRide(rideId, userId, payload) {
  return participantsRepository.addParticipantToRide({
    rideId,
    userId,
    passengersCount: payload.passengersCount || 1,
    pickupLocation: String(payload.pickupLocation || "").trim(),
    dropLocation: String(payload.dropLocation || "").trim(),
    pickupLatitude: payload.pickupLatitude != null ? Number(payload.pickupLatitude) : null,
    pickupLongitude: payload.pickupLongitude != null ? Number(payload.pickupLongitude) : null,
    dropLatitude: payload.dropLatitude != null ? Number(payload.dropLatitude) : null,
    dropLongitude: payload.dropLongitude != null ? Number(payload.dropLongitude) : null,
  });
}

/**
 * Update the status of a shared ride (e.g. CANCELLED, FULL, OPEN).
 */
async function updateStatus(rideId, status) {
  const updated = await repository.updateSharedRideStatus(rideId, status);
  if (!updated) {
    throw new AppError("Shared ride not found", 404, "SHARED_RIDE_NOT_FOUND");
  }
  return updated;
}

module.exports = {
  listSharedRides,
  getSharedRide,
  joinSharedRide,
  updateStatus,
};
