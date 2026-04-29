import { httpClient } from "../core/httpClient";
import { toPlace } from "./mappers";

/**
 * Fetch all shared rides for a user.
 * Splits into myRequests (created by this user) and availableRequests (joinable).
 */
export async function fetchSharedRidesForUser(userId) {
  // Fetch open + scheduled rides from the backend
  const [openRows, scheduledRows] = await Promise.all([
    httpClient.get("/api/shared-rides?status=open").catch(() => []),
    httpClient.get("/api/shared-rides?status=scheduled").catch(() => []),
  ]);

  const allRows = dedupeById([
    ...(Array.isArray(openRows) ? openRows : []),
    ...(Array.isArray(scheduledRows) ? scheduledRows : []),
  ]);

  const requests = allRows.map((row) => toSharedRideModel(row, userId));

  const myRequests = requests.filter((r) => r.ownerId === userId);
  const availableRequests = requests.filter(
    (r) =>
      r.ownerId !== userId &&
      ["open", "scheduled"].includes(String(r.status || "").toLowerCase()) &&
      r.remainingSeats > 0
  );

  return { requests, myRequests, availableRequests };
}

/**
 * Get a single shared ride detail (with participants) by its id.
 */
export async function findSharedRideByRideId(rideId, userId = null) {
  try {
    const data = await httpClient.get(`/api/shared-rides/${rideId}`);
    if (!data) return { request: null };
    const request = toSharedRideModelFromDetail(data, userId);
    return { request };
  } catch {
    return { request: null };
  }
}

/**
 * Join a shared ride.
 * The rideId IS the shared ride id in the new schema (rides.id).
 */
export async function joinSharedRideById(rideId, userId) {
  // Fetch ride detail to get pickup/drop for the join payload
  let pickupLocation = "";
  let dropLocation = "";
  let pickupLatitude = null;
  let pickupLongitude = null;
  let dropLatitude = null;
  let dropLongitude = null;

  try {
    const detail = await httpClient.get(`/api/shared-rides/${rideId}`);
    pickupLocation = detail.pickup_location || "";
    dropLocation = detail.drop_location || "";
    pickupLatitude = detail.pickup_latitude ? Number(detail.pickup_latitude) : null;
    pickupLongitude = detail.pickup_longitude ? Number(detail.pickup_longitude) : null;
    dropLatitude = detail.drop_latitude ? Number(detail.drop_latitude) : null;
    dropLongitude = detail.drop_longitude ? Number(detail.drop_longitude) : null;
  } catch {
    // Use defaults – backend will validate
  }

  const result = await httpClient.post(`/api/shared-rides/${rideId}/join`, {
    body: {
      pickupLocation,
      dropLocation,
      pickupLatitude,
      pickupLongitude,
      dropLatitude,
      dropLongitude,
      passengersCount: 1,
    },
  });

  return result;
}

/**
 * Close / cancel a shared ride (driver or admin).
 */
export async function closeSharedRideById(rideId) {
  try {
    await httpClient.patch(`/api/shared-rides/${rideId}/status`, {
      body: { status: "CANCELLED" },
    });
  } catch (error) {
    if (error?.status === 403) {
      throw new Error("Only driver/admin accounts can close shared rides.");
    }
    throw error;
  }

  return { success: true };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dedupeById(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (row?.id) map.set(row.id, row);
  });
  return [...map.values()];
}

/**
 * Map a list-level row (from GET /api/shared-rides) to the shared ride model the UI expects.
 */
function toSharedRideModel(row = {}, currentUserId) {
  const rideId = row.id;
  const ownerId = row.student_id || null;
  const maxParticipants = Number(row.max_participants || row.min_vehicle_capacity_allowed || 4);
  const totalPassengers = Number(row.total_passengers || 0);
  const remainingSeats = Math.max(0, maxParticipants - totalPassengers);

  const pickup = toPlace({
    name: row.pickup_location,
    address: row.pickup_location,
    latitude: row.pickup_latitude,
    longitude: row.pickup_longitude,
  });

  const drop = toPlace({
    name: row.drop_location,
    address: row.drop_location,
    latitude: row.drop_latitude,
    longitude: row.drop_longitude,
  });

  return {
    id: rideId,
    rideId,
    ownerId,
    ownerName: ownerId && ownerId === currentUserId ? "You" : row.creator_name || "Rider",
    rideType: row.vehicle_type || row.ride_type || "auto",
    pickup,
    drop,
    requestedSeats: maxParticipants,
    acceptedCount: totalPassengers,
    remainingSeats,
    status: String(row.status || "open").toLowerCase(),
    scheduledAt: row.scheduled_at || null,
    isScheduled: Boolean(row.is_scheduled),
    fare: row.fare,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

/**
 * Map a detail-level row (from GET /api/shared-rides/:id) to the shared ride model.
 */
function toSharedRideModelFromDetail(detail = {}, currentUserId) {
  const participants = Array.isArray(detail.participants) ? detail.participants : [];
  const maxParticipants = Number(detail.max_participants || 4);
  const totalPassengers = Number(detail.total_passengers || participants.length);
  const remainingSeats = Math.max(0, maxParticipants - totalPassengers);

  const pickup = toPlace({
    name: detail.pickup_location,
    address: detail.pickup_location,
    latitude: detail.pickup_latitude,
    longitude: detail.pickup_longitude,
  });

  const drop = toPlace({
    name: detail.drop_location,
    address: detail.drop_location,
    latitude: detail.drop_latitude,
    longitude: detail.drop_longitude,
  });

  return {
    id: detail.id,
    rideId: detail.id,
    ownerId: detail.student_id || null,
    ownerName:
      detail.student_id && detail.student_id === currentUserId
        ? "You"
        : detail.creator_name || "Rider",
    rideType: detail.vehicle_type || detail.ride_type || "auto",
    pickup,
    drop,
    requestedSeats: maxParticipants,
    acceptedCount: totalPassengers,
    remainingSeats,
    acceptedUsers: participants.map((p, i) => ({
      userId: p.user_id,
      name: p.name || `Rider ${i + 1}`,
      status: p.status,
    })),
    status: String(detail.status || "open").toLowerCase(),
    scheduledAt: detail.scheduled_at || null,
    isScheduled: Boolean(detail.is_scheduled),
    fare: detail.fare,
    createdAt: detail.created_at || null,
    updatedAt: detail.updated_at || null,
  };
}
