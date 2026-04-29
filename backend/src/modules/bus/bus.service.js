const repository = require("./bus.repository");
const { AppError } = require("../../common/utils/helpers");

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

async function listBookings(query) {
  return repository.listBookings(query);
}

async function createBooking(payload) {
  // Check if route exists
  const route = await repository.findRouteById(payload.routeId);
  if (!route) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }

  // Prevent duplicate booking: a user cannot book the same bus more than once
  const existingBooking = await repository.findActiveBookingByUserAndRoute(
    payload.userId,
    payload.routeId
  );
  if (existingBooking) {
    throw new AppError(
      "You already have an active booking for this bus route.",
      409,
      "DUPLICATE_BUS_BOOKING"
    );
  }

  return repository.createBooking({
    routeId: payload.routeId,
    userId: payload.userId,
    seatNumber: payload.seatNumber,
    status: payload.status || "pending",
    fareAmount: route.fare_per_seat || 0,
  });
}

async function cancelBooking(bookingId, userId) {
  const booking = await repository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  // Only the booking owner can cancel (unless admin – handled by role in controller)
  if (userId && booking.user_id !== userId) {
    throw new AppError("Not authorised to cancel this booking", 403, "FORBIDDEN");
  }

  if (booking.status === "cancelled") {
    throw new AppError("Booking is already cancelled", 400, "ALREADY_CANCELLED");
  }

  if (booking.status === "verified") {
    throw new AppError(
      "Verified tickets cannot be cancelled.",
      400,
      "TICKET_ALREADY_VERIFIED"
    );
  }

  return repository.updateBookingStatus({
    bookingId,
    status: "cancelled",
    verifiedBy: null,
  });
}

async function updateBookingStatus(bookingId, status, user) {
  const booking = await repository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  return repository.updateBookingStatus({
    bookingId,
    status,
    verifiedBy: user.id,
  });
}

async function addRouteStop(routeId, payload) {
  const route = await repository.findRouteById(routeId);
  if (!route) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }

  let resolvedStopId = payload.stopId || null;
  if (!resolvedStopId) {
    const stopName = String(payload.stopName || "").trim();
    if (!stopName) {
      throw new AppError("stopName is required when stopId is not provided", 400, "INVALID_STOP_NAME");
    }

    const existing = await repository.findStopByName(stopName);
    if (existing?.id) {
      resolvedStopId = existing.id;
    } else {
      const created = await repository.createStop({
        stopName,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
      resolvedStopId = created.id;
    }
  }

  return repository.createRouteStop({
    routeId,
    stopId: resolvedStopId,
    stopOrder: Number(payload.stopOrder),
    stopType: payload.stopType,
    arrivalTime: payload.arrivalTime,
  });
}

async function updateRouteLocation(routeId, payload, userId) {
  return repository.upsertLiveLocation({
    routeId,
    driverUserId: userId,
    ...payload
  });
}

async function getRouteTracking(routeId) {
  const data = await repository.getRouteTracking(routeId);
  if (!data.route) {
    throw new AppError("Bus route not found", 404, "BUS_ROUTE_NOT_FOUND");
  }

  // Logic to calculate upcoming stops based on live location can go here
  // For now, return raw data
  return {
    ...data,
    stops: data.route.stops || [],
  };
}

module.exports = {
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  listApprovedBusDrivers,
  listBookings,
  createBooking,
  cancelBooking,
  updateBookingStatus,
  addRouteStop,
  updateRouteLocation,
  getRouteTracking,
};
