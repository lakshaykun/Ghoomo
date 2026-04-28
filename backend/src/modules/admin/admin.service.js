const { AppError, normalizeRole } = require("../../common/utils/helpers");
const { isPolygonSelfIntersecting } = require("../../common/utils/geofence");
const campusBoundaryRepository = require("../campusBoundary/campusBoundary.repository");
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

function normalizeCampusBoundaryPayload(payload = {}) {
  const rawPoints = Array.isArray(payload) ? payload : payload.coordinates || payload.points || [];

  return rawPoints
    .map((point, index) => {
      const latitude = Number(point.latitude ?? point.lat);
      const longitude = Number(point.longitude ?? point.lng);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        latitude,
        longitude,
        sortOrder: Number.isFinite(Number(point.sortOrder ?? point.sort_order)) ? Number(point.sortOrder ?? point.sort_order) : index,
      };
    })
    .filter(Boolean);
}

async function getCampusBoundary() {
  const coordinates = await campusBoundaryRepository.getCampusBoundaryPoints();
  return { coordinates };
}

async function saveCampusBoundary(payload = {}) {
  const coordinates = normalizeCampusBoundaryPayload(payload);

  if (coordinates.length < 3) {
    throw new AppError("Campus boundary needs at least 3 points", 400, "VALIDATION_ERROR");
  }

  if (isPolygonSelfIntersecting(coordinates.map((point) => ({ lat: point.latitude, lng: point.longitude })))) {
    throw new AppError("Campus boundary cannot self-intersect", 400, "VALIDATION_ERROR");
  }

  const rows = await campusBoundaryRepository.replaceCampusBoundaryPoints(
    coordinates.map((point, index) => ({ ...point, sortOrder: index }))
  );

  return { coordinates: rows };
}

async function getLiveDrivers() {
  return repository.getLiveDrivers();
}

module.exports = {
  getDashboardStats,
  getAnalytics,
  getHealthSnapshot,
  getUsers,
  getRides,
  updateDriverStatusByDriverId,
  suspendUserByUserId,
  getCampusBoundary,
  saveCampusBoundary,
  getLiveDrivers,
};
