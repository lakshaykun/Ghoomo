const { AppError, normalizeRole, toFiniteNumber, signAuthToken } = require("../../common/utils/helpers");
const { haversineDistance } = require("../../common/utils/distance");
const userRepository = require("../user/user.repository");
const repository = require("./driver.repository");
const { updateDriverSocketInfo, broadcastToUser } = require("../../common/utils/socket");

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

  const driver = await repository.registerDriver({
    userId,
    vehicleNumber: String(vehicleNumber).trim(),
    vehicleType,
  });

  const token = signAuthToken({
    sub: existingUser.id,
    role: 'driver',
    email: existingUser.email,
  });

  return { driver, token };
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

  if (driver) {
    updateDriverSocketInfo(userId, {
      isAvailable: driver.is_available,
      vehicleType: driver.vehicle_type || driver.vehicleType,
    });
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

  // Broadcast location update to the student if the driver is on an active ride
  try {
    const activeRide = await repository.findActiveRideByUserId(userId);
    if (activeRide && activeRide.student_id) {
      broadcastToUser(activeRide.student_id, "driver_location_updated", {
        rideId: activeRide.id,
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error(`[DriverService] Failed to broadcast location update: ${err.message}`);
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

async function findNearestDriver(db, userLat, userLng) {
  const latitude = toFiniteNumber(userLat);
  const longitude = toFiniteNumber(userLng);

  if (latitude === null || longitude === null) {
    return null;
  }

  const drivers = await repository.getAvailableDrivers(db);
  const driversWithDistance = drivers
    .map((driver) => {
      const driverLatitude = toFiniteNumber(driver.latitude);
      const driverLongitude = toFiniteNumber(driver.longitude);

      if (driverLatitude === null || driverLongitude === null) {
        return null;
      }

      const distanceKm = haversineDistance(latitude, longitude, driverLatitude, driverLongitude);
      const etaMinutes = Number.isFinite(distanceKm) ? Math.max(1, Math.round((distanceKm / 28) * 60)) : null;

      return {
        ...driver,
        distanceKm: Number(distanceKm.toFixed(3)),
        etaMinutes,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return driversWithDistance[0] || null;
}

async function listCandidateRequests(userId) {
  return repository.listCandidateRequestsByUserId(userId);
}

async function getActiveRide(userId) {
  const driver = await repository.findDriverByUserId(userId);
  if (!driver) {
    throw new AppError("Driver profile not found", 404, "DRIVER_NOT_FOUND");
  }

  return repository.findActiveRideByUserId(userId);
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

async function getScheduledRides() {
  return repository.listScheduledRides();
}

module.exports = {
  registerDriver,
  getDriverProfile,
  updateAvailability,
  updateLocation,
  getNearbyDrivers,
  findNearestDriver,
  listCandidateRequests,
  getActiveRide,
  respondToCandidate,
  getScheduledRides,
};
