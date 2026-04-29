const { AppError, asyncHandler } = require("../../common/utils/helpers");
const driverService = require("./driver.service");
const {
  validateDriverRegistrationPayload,
  validateAvailabilityPayload,
  validateLocationPayload,
  validateCandidateResponsePayload,
} = require("./driver.schema");

const registerDriver = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    userId: req.body.userId || req.user.id,
    useAuthenticatedUser: true,
  };

  const validation = validateDriverRegistrationPayload(payload);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const driver = await driverService.registerDriver(payload);
  res.status(201).json({
    success: true,
    message: "Driver registered successfully",
    data: driver,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const driver = await driverService.getDriverProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: driver,
  });
});

const updateAvailability = asyncHandler(async (req, res) => {
  console.log(`[DriverController] updateAvailability: userId=${req.user.id}, body=`, req.body);
  const validation = validateAvailabilityPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const driver = await driverService.updateAvailability(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: "Driver availability updated",
    data: driver,
  });
});

const updateLocation = asyncHandler(async (req, res) => {
  console.log(`[DriverController] updateLocation: userId=${req.user.id}, body=`, req.body);
  const validation = validateLocationPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const driver = await driverService.updateLocation(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: "Driver location updated",
    data: driver,
  });
});

const getNearbyDrivers = asyncHandler(async (req, res) => {
  const rows = await driverService.getNearbyDrivers(req.query);
  res.status(200).json({
    success: true,
    data: rows,
  });
});

const listCandidateRequests = asyncHandler(async (req, res) => {
  const rows = await driverService.listCandidateRequests(req.user.id);
  res.status(200).json({
    success: true,
    data: rows,
  });
});

const getActiveRide = asyncHandler(async (req, res) => {
  const ride = await driverService.getActiveRide(req.user.id);
  res.status(200).json({
    success: true,
    data: ride,
  });
});

const respondToCandidate = asyncHandler(async (req, res) => {
  const validation = validateCandidateResponsePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await driverService.respondToCandidate(req.user.id, req.params.requestId, req.body.status);
  res.status(200).json({
    success: true,
    message: "Candidate status updated",
    data: row,
  });
});

module.exports = {
  registerDriver,
  getProfile,
  updateAvailability,
  updateLocation,
  getNearbyDrivers,
  listCandidateRequests,
  getActiveRide,
  respondToCandidate,
};
