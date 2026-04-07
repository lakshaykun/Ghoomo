const { AppError } = require("../../common/utils/helpers");
const repository = require("./bus.repository");

async function listRoutes() {
  return repository.listRoutes();
}

async function createRoute(payload) {
  return repository.createRoute({
    name: String(payload.name).trim(),
    departureTime: payload.departureTime,
    arrivalTime: payload.arrivalTime,
  });
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
  });
}

async function updateBookingStatus(bookingId, status, verifiedBy) {
  const booking = await repository.updateBookingStatus({ bookingId, status, verifiedBy });
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

module.exports = {
  listRoutes,
  createRoute,
  listBookings,
  createBooking,
  updateBookingStatus,
  addRouteStop,
};
