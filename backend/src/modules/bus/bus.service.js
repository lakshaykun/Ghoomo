const { AppError } = require("../../common/utils/helpers");
const repository = require("./bus.repository");
const { calculateDistanceKm } = require("../../common/utils/helpers");

async function listRoutes() {
  return repository.listRoutes();
}

async function createRoute(payload) {
  if (!payload.stops || !Array.isArray(payload.stops) || payload.stops.length < 2) {
    throw new AppError("Route must have at least 2 stops", 400, "INVALID_ROUTE_STOPS");
  }

  return repository.createRouteWithStops({
    name: String(payload.name).trim(),
    departureTime: payload.departureTime,
    arrivalTime: payload.arrivalTime,
    totalSeats: payload.totalSeats !== undefined ? Number(payload.totalSeats) : 40,
    farePerSeat: payload.farePerSeat !== undefined ? Number(payload.farePerSeat) : 0,
    stops: payload.stops,
    driverUserId: payload.driverUserId || null,
  });
}

async function updateRoute(routeId, payload) {
  if (!payload.stops || !Array.isArray(payload.stops) || payload.stops.length < 2) {
    throw new AppError("Route must have at least 2 stops", 400, "INVALID_ROUTE_STOPS");
  }

  const updated = await repository.updateRouteWithStops(routeId, {
    name: String(payload.name).trim(),
    departureTime: payload.departureTime,
    arrivalTime: payload.arrivalTime,
    totalSeats: payload.totalSeats !== undefined ? Number(payload.totalSeats) : 40,
    farePerSeat: payload.farePerSeat !== undefined ? Number(payload.farePerSeat) : 0,
    stops: payload.stops,
    driverUserId: payload.driverUserId || null,
  });

  if (!updated) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }

  return updated;
}

async function deleteRoute(routeId) {
  const deleted = await repository.deleteRoute(routeId);
  if (!deleted) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }
  return { success: true };
}

async function listApprovedBusDrivers() {
  return repository.listApprovedBusDrivers();
}

async function listBookings(payload = {}) {
  return repository.listBookings({
    routeId: payload.routeId || null,
    userId: payload.userId || null,
  });
}

async function createBooking(payload) {
  const route = await repository.findRouteById(payload.routeId);
  if (!route) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }

  return repository.createBooking({
    routeId: payload.routeId,
    userId: payload.userId,
    seatNumber: payload.seatNumber !== undefined ? Number(payload.seatNumber) : null,
    status: payload.status,
    fareAmount: Number(route.fare_per_seat || 0),
  });
}

async function updateBookingStatus(bookingId, status, actor) {
  const current = await repository.findBookingById(bookingId);
  if (!current) {
    throw new AppError("Bus booking not found", 404, "BUS_BOOKING_NOT_FOUND");
  }

  const actorRole = String(actor?.role || "").toLowerCase();
  const isPrivileged = ["admin", "driver", "bus_driver"].includes(actorRole);
  const isOwner = actor?.id && current.user_id === actor.id;

  if (!isPrivileged && status !== "cancelled") {
    throw new AppError("Only transport staff can set this booking status", 403, "FORBIDDEN");
  }
  if (!isPrivileged && status === "cancelled" && !isOwner) {
    throw new AppError("You can only cancel your own booking", 403, "FORBIDDEN");
  }
  if (isPrivileged && status === "cancelled") {
    // allowed
  }
  if (status === "verified" && !isPrivileged) {
    throw new AppError("Only transport staff can verify tickets", 403, "FORBIDDEN");
  }

  const booking = await repository.updateBookingStatus({
    bookingId,
    status,
    verifiedBy: status === "verified" ? actor?.id : null,
  });
  if (!booking) {
    throw new AppError("Bus booking not found", 404, "BUS_BOOKING_NOT_FOUND");
  }
  return booking;
}

async function addRouteStop(routeId, payload) {
  const route = await repository.findRouteById(routeId);
  if (!route) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }

  let stopId = payload.stopId || null;
  if (!stopId) {
    const existingStop = await repository.findStopByName(payload.stopName);
    if (existingStop) {
      stopId = existingStop.id;
    } else {
      const createdStop = await repository.createStop({
        stopName: String(payload.stopName).trim(),
        latitude: payload.latitude !== undefined ? Number(payload.latitude) : null,
        longitude: payload.longitude !== undefined ? Number(payload.longitude) : null,
      });
      stopId = createdStop.id;
    }
  }

  return repository.createRouteStop({
    routeId,
    stopId,
    stopOrder: Number(payload.stopOrder),
    stopType: payload.stopType,
    arrivalTime: payload.arrivalTime,
  });
}

function buildTrackingStatus(delayMinutes) {
  const safeDelay = Number(delayMinutes || 0);
  if (safeDelay > 3) return "delayed";
  if (safeDelay < -1) return "ahead";
  return "on_time";
}

function computeStopEtas(stops = [], live = null) {
  if (!live || !Array.isArray(stops) || stops.length === 0) {
    return stops.map((stop, index) => ({
      ...stop,
      sequence: index + 1,
      etaMinutes: null,
      isUpcoming: false,
    }));
  }

  const speedKmph = Math.max(10, Number(live.speed_kmph || 24));
  return stops.map((stop, index) => {
    const distanceKm = calculateDistanceKm(
      Number(live.latitude),
      Number(live.longitude),
      Number(stop.latitude),
      Number(stop.longitude)
    );
    const etaMinutes = Number.isFinite(distanceKm)
      ? Math.max(1, Math.round((distanceKm / speedKmph) * 60) + Number(live.delay_minutes || 0))
      : null;
    return {
      ...stop,
      sequence: index + 1,
      etaMinutes,
      isUpcoming: etaMinutes !== null && etaMinutes >= 0,
    };
  });
}

async function updateRouteLocation(routeId, payload, driverUserId) {
  const route = await repository.findRouteById(routeId);
  if (!route) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }

  return repository.upsertLiveLocation({
    routeId,
    driverUserId,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    speedKmph: payload.speedKmph !== undefined ? Number(payload.speedKmph) : null,
    headingDeg: payload.headingDeg !== undefined ? Number(payload.headingDeg) : null,
    delayMinutes: payload.delayMinutes !== undefined ? Number(payload.delayMinutes) : 0,
  });
}

async function getRouteTracking(routeId) {
  const { route, live } = await repository.getRouteTracking(routeId);
  if (!route) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }
  const stops = Array.isArray(route.stops) ? route.stops : [];
  const stopsWithEta = computeStopEtas(stops, live);
  return {
    route: {
      id: route.id,
      name: route.name,
      departureTime: route.departure_time,
      arrivalTime: route.arrival_time,
      farePerSeat: Number(route.fare_per_seat || 0),
    },
    liveLocation: live
      ? {
          latitude: Number(live.latitude),
          longitude: Number(live.longitude),
          speedKmph: live.speed_kmph !== null ? Number(live.speed_kmph) : null,
          headingDeg: live.heading_deg !== null ? Number(live.heading_deg) : null,
          delayMinutes: Number(live.delay_minutes || 0),
          status: buildTrackingStatus(live.delay_minutes),
          updatedAt: live.updated_at,
        }
      : null,
    upcomingStops: stopsWithEta.filter((stop) => stop.isUpcoming).sort((a, b) => (a.etaMinutes || 0) - (b.etaMinutes || 0)),
    stops: stopsWithEta,
  };
}

module.exports = {
  listRoutes,
  createRoute,
  listBookings,
  createBooking,
  updateBookingStatus,
  addRouteStop,
  updateRouteLocation,
  getRouteTracking,
  listApprovedBusDrivers,
  updateRoute,
  deleteRoute,
};
