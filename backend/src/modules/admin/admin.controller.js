const { AppError, asyncHandler } = require("../../common/utils/helpers");
const { validatePaginationQuery, validateAnalyticsQuery, validateDriverStatusPayload } = require("./admin.schema");
const service = require("./admin.service");

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await service.getDashboardStats();
  res.status(200).json({
    success: true,
    data: stats,
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const validation = validateAnalyticsQuery(req.query);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const analytics = await service.getAnalytics({
    days: validation.days,
    limit: validation.limit,
  });

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

const getHealth = asyncHandler(async (req, res) => {
  const health = await service.getHealthSnapshot();
  res.status(200).json({
    success: true,
    data: health,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const pagination = validatePaginationQuery(req.query);
  if (!pagination.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", pagination.errors);
  }

  const rows = await service.getUsers({
    page: pagination.page,
    limit: pagination.limit,
    role: req.query.role,
  });

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
  });
});

const getRides = asyncHandler(async (req, res) => {
  const pagination = validatePaginationQuery(req.query);
  if (!pagination.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", pagination.errors);
  }

  const rows = await service.getRides({
    page: pagination.page,
    limit: pagination.limit,
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
  });
});

const getCampusBoundary = asyncHandler(async (req, res) => {
  const boundary = await service.getCampusBoundary();
  res.status(200).json({
    success: true,
    data: boundary,
  });
});

const createCampusBoundary = asyncHandler(async (req, res) => {
  const boundary = await service.saveCampusBoundary(req.body);
  res.status(201).json({
    success: true,
    message: "Campus boundary saved",
    data: boundary,
  });
});

const updateCampusBoundary = asyncHandler(async (req, res) => {
  const boundary = await service.saveCampusBoundary(req.body);
  res.status(200).json({
    success: true,
    message: "Campus boundary updated",
    data: boundary,
  });
});

const getLiveDrivers = asyncHandler(async (req, res) => {
  const drivers = await service.getLiveDrivers();
  res.status(200).json({
    success: true,
    data: drivers,
  });
});

const updateDriverStatus = asyncHandler(async (req, res) => {
  const validation = validateDriverStatusPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const row = await service.updateDriverStatusByDriverId(req.params.driverId, req.body.status);
  res.status(200).json({
    success: true,
    message: "Driver status updated",
    data: row,
  });
});

const suspendUser = asyncHandler(async (req, res) => {
  const row = await service.suspendUserByUserId(req.params.userId);
  res.status(200).json({
    success: true,
    message: "User suspended",
    data: row,
  });
});

module.exports = {
  getDashboardStats,
  getAnalytics,
  getHealth,
  getUsers,
  getRides,
  getCampusBoundary,
  createCampusBoundary,
  updateCampusBoundary,
  getLiveDrivers,
  updateDriverStatus,
  suspendUser,
};
