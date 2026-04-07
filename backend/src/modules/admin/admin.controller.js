const { AppError, asyncHandler } = require("../../common/utils/helpers");
const { validatePaginationQuery, validateDriverStatusPayload } = require("./admin.schema");
const service = require("./admin.service");

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await service.getDashboardStats();
  res.status(200).json({
    success: true,
    data: stats,
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
  getUsers,
  getRides,
  updateDriverStatus,
  suspendUser,
};
