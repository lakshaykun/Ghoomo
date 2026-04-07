const { AppError, asyncHandler } = require("../../common/utils/helpers");
const service = require("./sharedRide.service");
const {
  validateCreateSharedRidePayload,
  validateJoinSharedRidePayload,
  validateSharedRideStatusPayload,
} = require("./sharedRide.schema");

const createSharedRide = asyncHandler(async (req, res) => {
  const validation = validateCreateSharedRidePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.createSharedRide(req.body);
  res.status(201).json({
    success: true,
    message: "Shared ride created",
    data: row,
  });
});

const listSharedRides = asyncHandler(async (req, res) => {
  const rows = await service.listSharedRides(req.query.status);
  res.status(200).json({
    success: true,
    data: rows,
  });
});

const getSharedRide = asyncHandler(async (req, res) => {
  const row = await service.getSharedRide(req.params.sharedRideId);
  res.status(200).json({
    success: true,
    data: row,
  });
});

const joinSharedRide = asyncHandler(async (req, res) => {
  const validation = validateJoinSharedRidePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.joinSharedRide(req.params.sharedRideId, req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: "Joined shared ride",
    data: row,
  });
});

const updateStatus = asyncHandler(async (req, res) => {
  const validation = validateSharedRideStatusPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.updateStatus(req.params.sharedRideId, req.body.status);
  res.status(200).json({
    success: true,
    message: "Shared ride status updated",
    data: row,
  });
});

module.exports = {
  createSharedRide,
  listSharedRides,
  getSharedRide,
  joinSharedRide,
  updateStatus,
};
