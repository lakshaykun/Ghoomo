import { httpClient } from "../core/httpClient";
import { toPlace } from "./mappers";
import { getRideByIdOrRequest } from "./rideApi";

function dedupeRows(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (row?.id) {
      map.set(row.id, row);
    }
  });
  return [...map.values()];
}

async function listRowsByStatus(status) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);

  const suffix = query.toString();
  const path = suffix ? `/api/shared-rides?${suffix}` : "/api/shared-rides";
  const rows = await httpClient.get(path, { auth: false });

  return Array.isArray(rows) ? rows : [];
}

function toParticipantModel(participant = {}, index = 0) {
  return {
    userId: participant.user_id || participant.userId || `participant-${index}`,
    name: participant.name || `Rider ${index + 1}`,
    status: participant.status || "joined",
  };
}

function buildJoinPayload(baseRide, fallback = {}) {
  const pickup = baseRide?.pickup ||
    toPlace({
      name: fallback.pickup_location,
      address: fallback.pickup_location,
      latitude: fallback.pickup_latitude,
      longitude: fallback.pickup_longitude,
    });

  const drop = baseRide?.drop ||
    toPlace({
      name: fallback.drop_location,
      address: fallback.drop_location,
      latitude: fallback.drop_latitude,
      longitude: fallback.drop_longitude,
    });

  return {
    pickupLocation: pickup.name || "Pickup",
    dropLocation: drop.name || "Drop",
    pickupLatitude: pickup.latitude,
    pickupLongitude: pickup.longitude,
    dropLatitude: drop.latitude,
    dropLongitude: drop.longitude,
  };
}

async function toSharedRideModel(sharedRideRow = {}, currentUserId) {
  const sharedRideId = sharedRideRow.id || sharedRideRow.sharedRideId;
  if (!sharedRideId) return null;

  const detail = await httpClient.get(`/api/shared-rides/${sharedRideId}`, {
    auth: false,
  });

  const participants = Array.isArray(detail.participants) ? detail.participants : [];
  const acceptedParticipants = participants.filter((participant) => participant.status !== "cancelled");
  const acceptedUsers = acceptedParticipants.map((participant, index) =>
    toParticipantModel(participant, index)
  );

  const baseRideId = detail.base_ride_id || detail.baseRideId || null;
  let baseRide = null;

  if (baseRideId) {
    try {
      const rideResult = await getRideByIdOrRequest(baseRideId);
      baseRide = rideResult?.ride || null;
    } catch {
      baseRide = null;
    }
  }

  const requestedSeats = Number(detail.max_participants || detail.maxParticipants || 2);
  const acceptedCount = acceptedUsers.length;
  const remainingSeats = Math.max(0, requestedSeats - acceptedCount);

  const firstParticipant = acceptedParticipants[0] || participants[0] || {};
  const pickup =
    baseRide?.pickup ||
    toPlace({
      name: firstParticipant.pickup_location,
      address: firstParticipant.pickup_location,
      latitude: firstParticipant.pickup_latitude,
      longitude: firstParticipant.pickup_longitude,
    });
  const drop =
    baseRide?.drop ||
    toPlace({
      name: firstParticipant.drop_location,
      address: firstParticipant.drop_location,
      latitude: firstParticipant.drop_latitude,
      longitude: firstParticipant.drop_longitude,
    });

  const ownerId = baseRide?.userId || baseRide?.student_id || null;

  return {
    id: sharedRideId,
    rideId: baseRideId,
    ownerId,
    ownerName: ownerId && ownerId === currentUserId ? "You" : "Rider",
    rideType: baseRide?.rideType || "cab",
    pickup,
    drop,
    requestedSeats,
    acceptedCount,
    remainingSeats,
    acceptedUsers,
    status: detail.status || "open",
    createdAt: detail.created_at || null,
    updatedAt: detail.updated_at || null,
  };
}

export async function fetchSharedRidesForUser(userId) {
  const [openRows, fullRows] = await Promise.all([
    listRowsByStatus("open"),
    listRowsByStatus("full"),
  ]);

  const rows = dedupeRows([...openRows, ...fullRows]);

  const requests = (
    await Promise.all(
      rows.map((row) =>
        toSharedRideModel(row, userId).catch(() => null)
      )
    )
  ).filter(Boolean);

  const myRequests = requests.filter((request) => request.ownerId && request.ownerId === userId);
  const availableRequests = requests.filter(
    (request) => request.ownerId !== userId && request.status === "open" && request.remainingSeats > 0
  );

  return {
    requests,
    myRequests,
    availableRequests,
  };
}

export async function joinSharedRideById(sharedRideId, userId) {
  const detail = await httpClient.get(`/api/shared-rides/${sharedRideId}`, {
    auth: false,
  });

  let baseRide = null;
  if (detail.base_ride_id) {
    try {
      const rideResult = await getRideByIdOrRequest(detail.base_ride_id);
      baseRide = rideResult?.ride || null;
    } catch {
      baseRide = null;
    }
  }

  await httpClient.post(`/api/shared-rides/${sharedRideId}/join`, {
    body: buildJoinPayload(baseRide),
  });

  const request = await toSharedRideModel({ id: sharedRideId }, userId);
  return { request };
}

export async function closeSharedRideById(sharedRideId) {
  try {
    await httpClient.patch(`/api/shared-rides/${sharedRideId}/status`, {
      body: {
        status: "cancelled",
      },
    });
  } catch (error) {
    if (error?.status === 403) {
      throw new Error("Only driver/admin accounts can close shared rides in the current backend.");
    }
    throw error;
  }

  return { success: true };
}

export async function findSharedRideByRideId(rideId, userId = null) {
  const [openRows, fullRows, completedRows] = await Promise.all([
    listRowsByStatus("open"),
    listRowsByStatus("full"),
    listRowsByStatus("completed"),
  ]);

  const row = [...openRows, ...fullRows, ...completedRows].find(
    (item) => (item.base_ride_id || item.baseRideId) === rideId
  );

  if (!row) {
    return { request: null };
  }

  const request = await toSharedRideModel(row, userId);
  return { request };
}
