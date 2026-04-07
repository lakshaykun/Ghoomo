const { AppError } = require("../../common/utils/helpers");
const rideRepository = require("../ride/ride.repository");
const repository = require("./sharedRide.repository");

async function createSharedRide(payload) {
  const baseRide = await rideRepository.getRideById(payload.baseRideId);
  if (!baseRide) {
    throw new AppError("Base ride not found", 404, "RIDE_NOT_FOUND");
  }

  return repository.createSharedRide({
    baseRideId: payload.baseRideId,
    maxParticipants: payload.maxParticipants ? Number(payload.maxParticipants) : 2,
  });
}

async function listSharedRides(status) {
  return repository.listSharedRides(status || "open");
}

async function getSharedRide(sharedRideId) {
  const sharedRide = await repository.getSharedRideById(sharedRideId);
  if (!sharedRide) {
    throw new AppError("Shared ride not found", 404, "SHARED_RIDE_NOT_FOUND");
  }

  const participants = await repository.listParticipants(sharedRideId);

  return {
    ...sharedRide,
    participants,
  };
}

async function joinSharedRide(sharedRideId, userId, payload) {
  const sharedRide = await repository.getSharedRideById(sharedRideId);
  if (!sharedRide) {
    throw new AppError("Shared ride not found", 404, "SHARED_RIDE_NOT_FOUND");
  }

  if (sharedRide.status !== "open") {
    throw new AppError("Shared ride is not open for joining", 400, "SHARED_RIDE_NOT_OPEN");
  }

  const count = await repository.countParticipants(sharedRideId);
  if (count >= Number(sharedRide.max_participants || 2)) {
    await repository.updateSharedRideStatus(sharedRideId, "full");
    throw new AppError("Shared ride is already full", 400, "SHARED_RIDE_FULL");
  }

  const participant = await repository.addParticipant({
    sharedRideId,
    userId,
    pickupLocation: String(payload.pickupLocation).trim(),
    dropLocation: String(payload.dropLocation).trim(),
    pickupLatitude: payload.pickupLatitude !== undefined ? Number(payload.pickupLatitude) : null,
    pickupLongitude: payload.pickupLongitude !== undefined ? Number(payload.pickupLongitude) : null,
    dropLatitude: payload.dropLatitude !== undefined ? Number(payload.dropLatitude) : null,
    dropLongitude: payload.dropLongitude !== undefined ? Number(payload.dropLongitude) : null,
    status: payload.status,
  });

  const nextCount = await repository.countParticipants(sharedRideId);
  if (nextCount >= Number(sharedRide.max_participants || 2)) {
    await repository.updateSharedRideStatus(sharedRideId, "full");
  }

  return participant;
}

async function updateStatus(sharedRideId, status) {
  const updated = await repository.updateSharedRideStatus(sharedRideId, status);
  if (!updated) {
    throw new AppError("Shared ride not found", 404, "SHARED_RIDE_NOT_FOUND");
  }
  return updated;
}

module.exports = {
  createSharedRide,
  listSharedRides,
  getSharedRide,
  joinSharedRide,
  updateStatus,
};
