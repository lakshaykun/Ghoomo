const { AppError, normalizeRole } = require("../../common/utils/helpers");
const repository = require("./admin.repository");

async function getDashboardStats() {
  return repository.getDashboardStats();
}

async function getAnalytics({ days, limit }) {
  return repository.getAnalytics({ days, limit });
}

async function getHealthSnapshot() {
  return repository.getHealthSnapshot();
}

async function getUsers({ page, limit, role }) {
  const offset = (page - 1) * limit;
  return repository.listUsers({ limit, offset, role: normalizeRole(role) || null });
}

async function getRides({ page, limit, status }) {
  const offset = (page - 1) * limit;
  return repository.listRides({ limit, offset, status: status || null });
}

async function updateDriverStatusByDriverId(driverId, status) {
  const row = await repository.updateDriverStatusByDriverId(driverId, status);
  if (!row) {
    throw new AppError("Driver not found", 404, "DRIVER_NOT_FOUND");
  }
  return row;
}

async function suspendUserByUserId(userId) {
  const row = await repository.updateDriverStatusByUserId(userId, "suspended");
  if (!row) {
    throw new AppError("Driver profile for this user was not found", 404, "DRIVER_NOT_FOUND");
  }
  return row;
}

module.exports = {
  getDashboardStats,
  getAnalytics,
  getHealthSnapshot,
  getUsers,
  getRides,
  updateDriverStatusByDriverId,
  suspendUserByUserId,
};
