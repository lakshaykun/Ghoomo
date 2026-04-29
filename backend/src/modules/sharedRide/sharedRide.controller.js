const { AppError, asyncHandler } = require("../../common/utils/helpers");
const service = require("./sharedRide.service");
const { validateSharedRideStatusPayload, validateJoinSharedRidePayload } = require("./sharedRide.schema");

/**
 * GET /api/shared-rides?status=open
 * List shared rides (defaults to OPEN + SCHEDULED).
 */
const listSharedRides = asyncHandler(async (req, res) => {
  const rows = await service.listSharedRides(req.query.status);
  res.status(200).json({
    success: true,
    data: rows,
  });
});

/**
 * GET /api/shared-rides/:sharedRideId
 * Get a single shared ride including participant list.
 */
const getSharedRide = asyncHandler(async (req, res) => {
  const row = await service.getSharedRide(req.params.sharedRideId);
  res.status(200).json({
    success: true,
    data: row,
  });
});

/**
 * POST /api/shared-rides/:sharedRideId/join
 * Join a shared ride.
 */
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

/**
 * PATCH /api/shared-rides/:sharedRideId/status
 * Update shared ride status (driver/admin only).
 */
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
  listSharedRides,
  getSharedRide,
  joinSharedRide,
  updateStatus,
};
