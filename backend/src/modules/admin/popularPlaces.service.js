const { AppError } = require("../../common/utils/helpers");
const repo = require("./popularPlaces.repository");

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateCoords(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new AppError("latitude must be a number between -90 and 90", 400, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new AppError("longitude must be a number between -180 and 180", 400, "VALIDATION_ERROR");
  }
  return { lat, lon };
}

// ── Public read ───────────────────────────────────────────────────────────────

async function getPopularPlaces() {
  return repo.getAllPopularPlaces();
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

async function createPlace({ name, address, latitude, longitude, sort_order }) {
  if (!name || !name.trim()) {
    throw new AppError("name is required", 400, "VALIDATION_ERROR");
  }
  if (!address || !address.trim()) {
    throw new AppError("address is required", 400, "VALIDATION_ERROR");
  }
  const { lat, lon } = validateCoords(latitude, longitude);

  const dupName = await repo.findByName(name);
  if (dupName) {
    throw new AppError(`A place named "${name.trim()}" already exists`, 409, "DUPLICATE_NAME");
  }

  const dupCoords = await repo.findByCoords(lat, lon);
  if (dupCoords) {
    throw new AppError("A place with these coordinates already exists", 409, "DUPLICATE_COORDS");
  }

  return repo.createPopularPlace({
    name: name.trim(),
    address: address.trim(),
    latitude: lat,
    longitude: lon,
    sort_order: Number(sort_order) || 0,
  });
}

async function updatePlace(id, { name, address, latitude, longitude, sort_order }) {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    throw new AppError("Invalid place id", 400, "VALIDATION_ERROR");
  }

  let lat, lon;
  if (latitude !== undefined || longitude !== undefined) {
    ({ lat, lon } = validateCoords(latitude, longitude));
  }

  if (name) {
    const dupName = await repo.findByName(name, numId);
    if (dupName) {
      throw new AppError(`A place named "${name.trim()}" already exists`, 409, "DUPLICATE_NAME");
    }
  }

  if (lat !== undefined && lon !== undefined) {
    const dupCoords = await repo.findByCoords(lat, lon, numId);
    if (dupCoords) {
      throw new AppError("A place with these coordinates already exists", 409, "DUPLICATE_COORDS");
    }
  }

  const updated = await repo.updatePopularPlace(numId, {
    name: name?.trim(),
    address: address?.trim(),
    latitude: lat,
    longitude: lon,
    sort_order: sort_order !== undefined ? Number(sort_order) : undefined,
  });

  if (!updated) {
    throw new AppError("Place not found", 404, "NOT_FOUND");
  }

  return updated;
}

async function deletePlace(id) {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    throw new AppError("Invalid place id", 400, "VALIDATION_ERROR");
  }

  const deleted = await repo.deletePopularPlace(numId);
  if (!deleted) {
    throw new AppError("Place not found", 404, "NOT_FOUND");
  }

  return deleted;
}

module.exports = {
  getPopularPlaces,
  createPlace,
  updatePlace,
  deletePlace,
};
