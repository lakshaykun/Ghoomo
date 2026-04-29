import { httpClient } from "../core/httpClient";
import {
  normalizeDriverCandidateRequest,
  normalizeDriverProfile,
  normalizeNearbyDriver,
  normalizeRide,
} from "./mappers";
import { getDriverRuntimeSnapshot } from "./driverRuntime";

function buildDriverStats(completedRides = []) {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  const ridesToday = completedRides.filter((ride) => {
    const updatedAt = ride.updatedAt || ride.createdAt;
    if (!updatedAt) return false;
    return String(updatedAt).slice(0, 10) === todayKey;
  }).length;

  const todayEarnings = completedRides.reduce(
    (sum, ride) => sum + Number(ride.fare || 0),
    0
  );

  return {
    ridesToday,
    todayEarnings: Number(todayEarnings.toFixed(2)),
    rating:
      completedRides.length > 0
        ? Number(
            (
              completedRides.reduce((sum, ride) => sum + Number(ride.driver?.rating || 0), 0) /
              completedRides.length
            ).toFixed(1)
          )
        : 0,
  };
}

export async function getNearbyDrivers(payload = {}) {
  const query = new URLSearchParams();
  query.set("latitude", String(payload.latitude));
  query.set("longitude", String(payload.longitude));
  query.set("limit", String(payload.limit || 20));

  const rows = await httpClient.get(`/api/drivers/nearby?${query.toString()}`, {
    auth: false,
  });

  return {
    drivers: Array.isArray(rows) ? rows.map((row) => normalizeNearbyDriver(row)) : [],
  };
}

export async function getDriverProfile() {
  const row = await httpClient.get("/api/drivers/me");
  return normalizeDriverProfile(row);
}

export async function getDriverCandidateRequests() {
  const rows = await httpClient.get("/api/drivers/requests");
  return Array.isArray(rows)
    ? rows.map((row) => normalizeDriverCandidateRequest(row))
    : [];
}

export async function getDriverScheduledRides() {
  const rows = await httpClient.get("/api/drivers/scheduled-rides");
  return Array.isArray(rows) ? rows.map(row => normalizeRide(row)) : [];
}

export async function acceptScheduledRide(rideId, payload = {}) {
  const row = await httpClient.post(`/api/rides/${rideId}/accept`, {
    body: payload
  });
  return normalizeRide(row);
}

export async function getDriverActiveRide() {
  const row = await httpClient.get("/api/drivers/me/active-ride");
  if (!row) {
    return null;
  }

  return normalizeRide(row);
}

export async function setDriverAvailability(payload = {}) {
  const row = await httpClient.patch("/api/drivers/me/availability", {
    body: {
      isAvailable: Boolean(payload.isAvailable),
      status: payload.status,
    },
  });

  return normalizeDriverProfile(row);
}

export async function patchDriverLocation(payload = {}) {
  const row = await httpClient.patch("/api/drivers/me/location", {
    body: {
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
    },
  });

  return normalizeDriverProfile(row);
}

export async function respondToCandidateRequest(requestId, status) {
  return httpClient.post(`/api/drivers/requests/${requestId}/respond`, {
    body: { status },
  });
}

export async function buildDriverDashboard(driverUserId) {
  const [driverProfile, candidateRequests, backendActiveRide, historyRes, scheduledRes] = await Promise.all([
    getDriverProfile(),
    getDriverCandidateRequests(),
    getDriverActiveRide(),
    httpClient.get("/api/rides/history"),
    getDriverScheduledRides().catch(() => []),
  ]);

  console.log("[DriverApi] Raw Profile:", driverProfile);

  const completedRides = Array.isArray(historyRes) ? historyRes.map(row => normalizeRide(row)) : [];

  const runtimeDriverId = driverUserId || driverProfile.userId;
  const runtime = getDriverRuntimeSnapshot(runtimeDriverId);
  const hydratedActiveRide = runtime.activeRide || backendActiveRide || null;

  const assignedRides = [];
  if (hydratedActiveRide) {
    assignedRides.push(hydratedActiveRide);
  }

  candidateRequests.forEach((ride) => {
    if (ride.status === "cancelled") {
      return;
    }

    if (ride.sourceType === "ride_request_candidate" && ride.status !== "pending") {
      return;
    }

    if (hydratedActiveRide?.requestId && ride.requestId === hydratedActiveRide.requestId) {
      return;
    }

    if (!assignedRides.some((item) => item.id === ride.id)) {
      assignedRides.push(ride);
    }
  });

  const activeRide =
    hydratedActiveRide ||
    assignedRides.find((ride) =>
      ride.sourceType === "ride" && ["accepted", "arrived", "in_progress", "ACCEPTED", "ARRIVED", "ON_TRIP"].includes(ride.status)
    ) ||
    null;

  return {
    driver: {
      id: driverProfile.id,
      userId: driverProfile.userId,
      name: driverProfile.name,
      email: driverProfile.email,
      phone: driverProfile.phone,
      rating: driverProfile.rating,
      vehicleType: driverProfile.vehicleType,
      vehicleNo: driverProfile.vehicleNo,
      status: driverProfile.status,
    },
    online: driverProfile.availabilityStatus !== "offline",
    location:
      driverProfile.latitude !== null && driverProfile.longitude !== null
        ? {
            latitude: driverProfile.latitude,
            longitude: driverProfile.longitude,
          }
        : null,
    activeRide,
    assignedRides,
    completedRides,
    scheduledRides: scheduledRes || [],
    stats: buildDriverStats(completedRides),
  };
}
