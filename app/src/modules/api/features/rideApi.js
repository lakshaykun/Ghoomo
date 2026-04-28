import { httpClient } from "../core/httpClient";
import {
  estimateDurationMinutes,
  haversineDistanceKm,
  mapAppRideStatusToBackend,
  normalizeRide,
  normalizeRideRequest,
  toNumber,
} from "./mappers";
import {
  addDriverCompletedRide,
  clearDriverActiveRide,
  getRideIdForRequestId,
  setDriverActiveRide,
} from "./driverRuntime";
import { getDriverProfile, getNearbyDrivers, respondToCandidateRequest } from "./driverApi";

const FARE_RULES = {
  auto: { base: 30, perKm: 12 },
  cab: { base: 50, perKm: 18 },
};

function toBackendVehicleType(rideType) {
  const normalized = String(rideType || "").trim().toLowerCase();
  return normalized === "cab" ? "cab" : "auto";
}

function toPickupDrop(payload = {}) {
  return {
    pickup: payload.pickup || {
      latitude: payload.pickupLatitude,
      longitude: payload.pickupLongitude,
      name: payload.pickupLocation,
      address: payload.pickupLocation,
    },
    drop: payload.drop || {
      latitude: payload.dropLatitude,
      longitude: payload.dropLongitude,
      name: payload.dropLocation,
      address: payload.dropLocation,
    },
  };
}

function calculateEstimatedFare(distanceKm, vehicleType, isShared) {
  const fareRule = FARE_RULES[vehicleType] || FARE_RULES.auto;
  const baseFare = fareRule.base + distanceKm * fareRule.perKm;
  const discounted = isShared ? baseFare * 0.7 : baseFare;
  return Number(discounted.toFixed(2));
}

function updateDriverRuntime(driverId, ride) {
  if (!driverId || !ride?.id) return;

  if (["completed", "cancelled"].includes(ride.status)) {
    addDriverCompletedRide(driverId, ride);
    clearDriverActiveRide(driverId);
    return;
  }

  setDriverActiveRide(driverId, ride);
}

export async function requestRide(payload = {}) {
  return createRideRequest(payload);
}

export async function rateRideRemote(rideId, payload = {}) {
  const row = await httpClient.post(`/api/rides/${rideId}/rate`, {
    body: {
      rating: payload.rating,
      reviewText: payload.reviewText,
    },
  });

  return row;
}

export async function fetchRideQuote(payload = {}) {
  const { pickup, drop } = toPickupDrop(payload);
  const vehicleType = toBackendVehicleType(payload.rideType || payload.vehicleType);

  const quoteData = await httpClient.post("/api/rides/quote", {
    auth: false,
    body: {
      pickupLatitude: pickup?.latitude,
      pickupLongitude: pickup?.longitude,
      dropLatitude: drop?.latitude,
      dropLongitude: drop?.longitude,
      vehicleType,
      isShared: Boolean(payload.isShare || payload.isShared),
    },
  });

  const nearby = await getNearbyDrivers({
    latitude: pickup?.latitude,
    longitude: pickup?.longitude,
    limit: 20,
  }).catch(() => ({ drivers: [] }));

  const nearbyDrivers = Array.isArray(nearby.drivers) ? nearby.drivers : [];
  const distanceKm = toNumber(quoteData?.distanceKm, haversineDistanceKm(pickup, drop));
  const fare = toNumber(
    quoteData?.estimatedFare,
    calculateEstimatedFare(distanceKm, vehicleType, Boolean(payload.isShare || payload.isShared))
  );

  return {
    pickup: {
      id: pickup?.id || `${pickup?.latitude}:${pickup?.longitude}`,
      name: pickup?.name || pickup?.address || "Pickup",
      address: pickup?.address || pickup?.name || "",
      latitude: toNumber(pickup?.latitude, null),
      longitude: toNumber(pickup?.longitude, null),
    },
    drop: {
      id: drop?.id || `${drop?.latitude}:${drop?.longitude}`,
      name: drop?.name || drop?.address || "Drop",
      address: drop?.address || drop?.name || "",
      latitude: toNumber(drop?.latitude, null),
      longitude: toNumber(drop?.longitude, null),
    },
    route: {
      geometry: [],
    },
    estimate: {
      fare,
      distanceKm,
      durationMinutes: estimateDurationMinutes(distanceKm),
      surgeAmount: 0,
      surgeMultiplier: 1,
    },
    driver: nearbyDrivers[0] || null,
    availability: {
      available: nearbyDrivers.length > 0,
      message:
        nearbyDrivers.length > 0
          ? `${nearbyDrivers.length} nearby drivers found.`
          : "No nearby online driver is currently available.",
    },
  };
}

export async function createRideRequest(payload = {}) {
  const { pickup, drop } = toPickupDrop(payload);
  const vehicleType = toBackendVehicleType(payload.rideType || payload.vehicleType);
  const distanceKm = haversineDistanceKm(pickup, drop);
  const fare = calculateEstimatedFare(distanceKm, vehicleType, Boolean(payload.isShare));

  const row = await httpClient.post("/api/rides/requests", {
    body: {
      pickupLocation: pickup?.name || pickup?.address,
      dropLocation: drop?.name || drop?.address,
      pickupLatitude: pickup?.latitude,
      pickupLongitude: pickup?.longitude,
      dropLatitude: drop?.latitude,
      dropLongitude: drop?.longitude,
      vehicleType,
      isShared: Boolean(payload.isShare),
      expiresAt: payload.scheduledAt || null,
    },
  });

  const isRideResponse = Boolean(
    row?.driver_id || row?.driver_user_id || row?.driver_name || row?.driver_vehicle_number || row?.driver
  );

  const ride = isRideResponse
    ? normalizeRide(row, {
        isShare: Boolean(payload.isShare),
        paymentMethod: payload.paymentMethod,
        scheduledAt: payload.scheduledAt,
        distance: distanceKm,
        fare,
        userId: payload.userId,
      })
    : normalizeRideRequest(row, {
        isShare: Boolean(payload.isShare),
        paymentMethod: payload.paymentMethod,
        scheduledAt: payload.scheduledAt,
        distance: distanceKm,
        fare,
        userId: payload.userId,
      });

  return {
    ride,
    sharedRequest: null,
  };
}

async function getRideDirect(rideId) {
  const row = await httpClient.get(`/api/rides/${rideId}`);
  return normalizeRide(row);
}

async function getRideRequestDirect(rideId) {
  const row = await httpClient.get(`/api/rides/requests/${rideId}`);
  return normalizeRideRequest(row);
}

export async function getRideByIdOrRequest(rideId) {
  try {
    const ride = await getRideDirect(rideId);
    return { ride };
  } catch (error) {
    if (error?.status !== 404) {
      throw error;
    }

    const ride = await getRideRequestDirect(rideId);
    return { ride };
  }
}

export async function updateRideStatusRemote(rideId, status, extra = {}) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedStatus === "accepted" && extra?.actor === "driver") {
    const driverProfile = await getDriverProfile();
    const runtimeDriverId = extra.driverId || extra.driverUserId || driverProfile.userId || driverProfile.id;

    const assignedRide = await httpClient.post(`/api/rides/requests/${rideId}/assign`, {
      body: {
        driverId: driverProfile.id,
      },
    });

    await respondToCandidateRequest(rideId, "accepted").catch(() => {});

    const ride = normalizeRide(assignedRide, { status: "assigned" });
    updateDriverRuntime(runtimeDriverId, ride);
    return { ride };
  }

  if (normalizedStatus === "cancelled") {
    const runtimeDriverId = extra.driverId || extra.driverUserId;
    const sourceType = String(extra.sourceType || "").trim().toLowerCase();

    if (extra?.actor !== "driver" && extra?.actor !== "admin") {
      if (sourceType === "ride") {
        const row = await httpClient.patch(`/api/rides/${rideId}/status`, {
          body: { status: "cancelled" },
        });

        const ride = normalizeRide(row);
        return { ride };
      }

      const requestRow = await httpClient.patch(`/api/rides/requests/${rideId}/cancel`);
      return {
        ride: normalizeRideRequest(requestRow, {
          status: "cancelled",
          userId: extra.userId,
        }),
      };
    }

    const resolvedRideId = getRideIdForRequestId(rideId) || rideId;

    try {
      const row = await httpClient.patch(`/api/rides/${resolvedRideId}/status`, {
        body: { status: "cancelled" },
      });

      const ride = normalizeRide(row);
      updateDriverRuntime(runtimeDriverId, ride);
      return { ride };
    } catch (error) {
      if (![403, 404].includes(error?.status)) {
        throw error;
      }

      if (extra?.sourceType === "ride") {
        throw new Error("Ride assignment is still syncing. Refresh the dashboard and try again.");
      }

      try {
        await respondToCandidateRequest(rideId, "rejected");
        return {
          ride: {
            id: rideId,
            status: "cancelled",
          },
        };
      } catch (requestError) {
        throw requestError;
      }
    }
  }

  const backendStatus = mapAppRideStatusToBackend(normalizedStatus);
  if (!backendStatus) {
    throw new Error(`Unsupported ride status update: ${status}`);
  }

  const resolvedRideId = getRideIdForRequestId(rideId) || rideId;

  let row;
  try {
    row = await httpClient.patch(`/api/rides/${resolvedRideId}/status`, {
      body: { status: backendStatus },
    });
  } catch (error) {
    if (error?.status === 404 && resolvedRideId === rideId && extra?.actor === "driver") {
      throw new Error("Ride assignment is still syncing. Refresh the dashboard and try again.");
    }
    throw error;
  }

  const ride = normalizeRide(row);
  updateDriverRuntime(extra.driverId, ride);
  return { ride };
}

export async function getRideHistoryForCurrentUser(userId) {
  const path = userId ? `/api/rides/history/${userId}` : "/api/rides/history";
  const rows = await httpClient.get(path);
  const rides = Array.isArray(rows) ? rows.map((row) => normalizeRide(row)) : [];
  return { rides };
}
