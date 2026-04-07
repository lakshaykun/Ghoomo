const { AppError, normalizeRole, toFiniteNumber } = require("../../common/utils/helpers");
const userRepository = require("../user/user.repository");
const repository = require("./driver.repository");

async function registerDriver({ userId, vehicleNumber, vehicleType }) {
  const existingUser = await userRepository.findById(userId);
  if (!existingUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const normalizedRole = normalizeRole(existingUser.role);
  if (!["rider", "admin"].includes(normalizedRole)) {
    throw new AppError("Only riders can register a driver profile", 403, "ROLE_NOT_ALLOWED");
  }

  const existingDriver = await repository.findDriverByUserId(userId);
  if (existingDriver) {
    throw new AppError("Driver profile already exists for this user", 409, "DRIVER_ALREADY_EXISTS");
  }

  return repository.registerDriver({
    userId,
    vehicleNumber: String(vehicleNumber).trim(),
    vehicleType,
  });
}

async function getDriverProfile(userId) {
  const driver = await repository.findDriverByUserId(userId);
  if (!driver) {
    throw new AppError("Driver profile not found", 404, "DRIVER_NOT_FOUND");
  }
  return driver;
}

async function updateAvailability(userId, payload) {
  const driver = await repository.updateAvailabilityByUserId(userId, {
    isAvailable: payload.isAvailable,
    status: payload.status,
  });

  if (!driver) {
    throw new AppError("Driver profile not found", 404, "DRIVER_NOT_FOUND");
  }

  return driver;
}

async function updateLocation(userId, payload) {
  const driver = await repository.updateLocationByUserId(userId, {
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
  });

  if (!driver) {
    throw new AppError("Driver profile not found", 404, "DRIVER_NOT_FOUND");
  }

  return driver;
}

async function getNearbyDrivers(payload = {}) {
  const latitude = toFiniteNumber(payload.latitude);
  const longitude = toFiniteNumber(payload.longitude);
  const limit = toFiniteNumber(payload.limit, 20);

  if (latitude === null || longitude === null) {
    throw new AppError("latitude and longitude are required query params", 400, "VALIDATION_ERROR");
  }

  return repository.listNearbyDrivers({
    latitude,
    longitude,
    limit,
  });
}

async function listCandidateRequests(userId) {
  return repository.listCandidateRequestsByUserId(userId);
}

async function respondToCandidate(userId, requestId, status) {
  const candidate = await repository.updateCandidateStatus({ userId, requestId, status });
  if (!candidate) {
    throw new AppError("Ride request candidate not found", 404, "CANDIDATE_NOT_FOUND");
  }

  if (status === "accepted") {
    await repository.markRideRequestMatched(requestId);
  }

  return candidate;
}

module.exports = {
  registerDriver,
  getDriverProfile,
  updateAvailability,
  updateLocation,
  getNearbyDrivers,
  listCandidateRequests,
  respondToCandidate,
};
