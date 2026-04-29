const { AppError, asyncHandler } = require("../../common/utils/helpers");
const service = require("./bus.service");
const {
  validateRoutePayload,
  validateBookingPayload,
  validateBookingStatusPayload,
  validateRouteStopPayload,
  validateBusLocationPayload,
} = require("./bus.schema");

const listRoutes = asyncHandler(async (req, res) => {
  const rows = await service.listRoutes();
  res.status(200).json({
    success: true,
    data: rows,
  });
});

const createRoute = asyncHandler(async (req, res) => {
  const validation = validateRoutePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.createRoute(req.body);
  res.status(201).json({
    success: true,
    message: "Bus route created",
    data: row,
  });
});

const updateRoute = asyncHandler(async (req, res) => {
  const validation = validateRoutePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.updateRoute(req.params.routeId, req.body);
  res.status(200).json({
    success: true,
    message: "Bus route updated",
    data: row,
  });
});

const deleteRoute = asyncHandler(async (req, res) => {
  await service.deleteRoute(req.params.routeId);
  res.status(200).json({
    success: true,
    message: "Bus route deleted",
  });
});

const listBookings = asyncHandler(async (req, res) => {
  const query = {
    routeId: req.query.routeId,
    userId: req.query.userId,
  };

  if (req.user && req.user.role === "rider") {
    query.userId = req.user.id;
  }

  const rows = await service.listBookings(query);
  res.status(200).json({
    success: true,
    data: rows,
  });
});

const createBooking = asyncHandler(async (req, res) => {
  const validation = validateBookingPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.createBooking({
    ...req.body,
    userId: req.body.userId || (req.user && req.user.id),
  });

  res.status(201).json({
    success: true,
    message: "Bus booking created",
    data: row,
  });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const validation = validateBookingStatusPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.updateBookingStatus(req.params.bookingId, req.body.status, req.user);
  res.status(200).json({
    success: true,
    message: "Bus booking status updated",
    data: row,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  // Riders can only cancel their own bookings; admins can cancel any
  const userId = req.user?.role === "rider" || req.user?.role === "user"
    ? req.user.id
    : null; // null means admin bypass

  const row = await service.cancelBooking(req.params.bookingId, userId);
  res.status(200).json({
    success: true,
    message: "Bus booking cancelled",
    data: row,
  });
});

const addRouteStop = asyncHandler(async (req, res) => {
  const validation = validateRouteStopPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.addRouteStop(req.params.routeId, req.body);
  res.status(201).json({
    success: true,
    message: "Bus route stop added",
    data: row,
  });
});

const updateRouteLocation = asyncHandler(async (req, res) => {
  const validation = validateBusLocationPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.updateRouteLocation(req.params.routeId, req.body, req.user.id);
  res.status(200).json({
    success: true,
    message: "Bus live location updated",
    data: row,
  });
});

const getRouteTracking = asyncHandler(async (req, res) => {
  const payload = await service.getRouteTracking(req.params.routeId);
  res.status(200).json({
    success: true,
    data: payload,
  });
});

const listApprovedBusDrivers = asyncHandler(async (req, res) => {
  const rows = await service.listApprovedBusDrivers();
  res.status(200).json({
    success: true,
    data: rows,
  });
});

module.exports = {
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  listBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  addRouteStop,
  updateRouteLocation,
  getRouteTracking,
  listApprovedBusDrivers,
};
