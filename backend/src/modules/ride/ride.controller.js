const { AppError, asyncHandler } = require("../../common/utils/helpers");
const rideService = require("./ride.service");
const {
  validateQuotePayload,
  validateCreateRideRequestPayload,
  validateAssignDriverPayload,
  validateUpdateRideStatusPayload,
  validateRateRidePayload,
} = require("./ride.schema");

const quote = asyncHandler(async (req, res) => {
  const validation = validateQuotePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const result = await rideService.getQuote(req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
});

const createRequest = asyncHandler(async (req, res) => {
  const normalizedPayload = rideService.normalizeRideRequestPayload(req.body);
  const validation = validateCreateRideRequestPayload(normalizedPayload);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await rideService.createRide(req.user.id, normalizedPayload);
  res.status(201).json({
    success: true,
    message: "Ride created and nearest driver assigned",
    data: row,
  });
});

const createLegacyRide = asyncHandler(async (req, res) => {
  const normalizedPayload = rideService.normalizeRideRequestPayload(req.body);
  const validation = validateCreateRideRequestPayload(normalizedPayload);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await rideService.createRide(req.user.id, normalizedPayload);
  res.status(201).json({
    success: true,
    message: "Ride created and nearest driver assigned",
    data: row,
  });
});

const getRequest = asyncHandler(async (req, res) => {
  const row = await rideService.getRideRequest(req.params.requestId);
  res.status(200).json({
    success: true,
    data: row,
  });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const row = await rideService.cancelRideRequest(req.params.requestId, req.user.id);
  res.status(200).json({
    success: true,
    message: "Ride request cancelled",
    data: row,
  });
});

const assignDriver = asyncHandler(async (req, res) => {
  const validation = validateAssignDriverPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await rideService.assignDriver(req.params.requestId, req.body);
  res.status(201).json({
    success: true,
    message: "Driver assigned and ride created",
    data: row,
  });
});

const getRide = asyncHandler(async (req, res) => {
  const ride = await rideService.getRide(req.params.rideId);
  res.status(200).json({
    success: true,
    data: ride,
  });
});

const updateRideStatus = asyncHandler(async (req, res) => {
  const validation = validateUpdateRideStatusPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const ride = await rideService.updateRideStatus(req.params.rideId, req.body.status);
  res.status(200).json({
    success: true,
    message: "Ride status updated",
    data: ride,
  });
});

const getMyHistory = asyncHandler(async (req, res) => {
  const rides = await rideService.getRideHistory(req.user.id);
  res.status(200).json({
    success: true,
    data: rides,
  });
});

const getHistoryByUserId = asyncHandler(async (req, res) => {
  const requestedUserId = req.params.userId;

  if (req.user.role !== "admin" && req.user.id !== requestedUserId) {
    throw new AppError("You can only fetch your own ride history", 403, "FORBIDDEN");
  }

  const rides = await rideService.getRideHistory(requestedUserId);
  res.status(200).json({
    success: true,
    data: rides,
  });
});

const rateRide = asyncHandler(async (req, res) => {
  const validation = validateRateRidePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await rideService.rateRide(req.params.rideId, req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: "Ride rated successfully",
    data: row,
  });
});

module.exports = {
  quote,
  createRequest,
  createLegacyRide,
  getRequest,
  cancelRequest,
  assignDriver,
  getRide,
  updateRideStatus,
  getMyHistory,
  getHistoryByUserId,
  rateRide,
};
