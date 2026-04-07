const { AppError, asyncHandler } = require("../../common/utils/helpers");
const service = require("./bus.service");
const {
  validateRoutePayload,
  validateBookingPayload,
  validateBookingStatusPayload,
  validateRouteStopPayload,
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

  const row = await service.updateBookingStatus(req.params.bookingId, req.body.status, req.user.id);
  res.status(200).json({
    success: true,
    message: "Bus booking status updated",
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

module.exports = {
  listRoutes,
  createRoute,
  listBookings,
  createBooking,
  updateBookingStatus,
  addRouteStop,
};
