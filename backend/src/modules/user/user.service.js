const repository = require("./user.repository");
const { AppError, pick } = require("../../common/utils/helpers");

async function getProfile(userId) {
  const user = await repository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return user;
}

async function updateProfile(userId, payload) {
  const existing = await repository.findById(userId);
  if (!existing) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const updates = pick(payload, ["name", "email", "phone"]);
  if (updates.email !== undefined) {
    updates.email = String(updates.email).trim().toLowerCase();
  }
  if (updates.name !== undefined) {
    updates.name = String(updates.name).trim();
  }
  if (updates.phone !== undefined) {
    updates.phone = String(updates.phone).trim();
  }

  if (updates.email && updates.email !== existing.email) {
    const owner = await repository.findByEmail(updates.email);
    if (owner && owner.id !== userId) {
      throw new AppError("Email is already in use", 409, "EMAIL_ALREADY_EXISTS");
    }
  }

  if (updates.phone && updates.phone !== existing.phone) {
    const owner = await repository.findByPhone(updates.phone);
    if (owner && owner.id !== userId) {
      throw new AppError("Phone is already in use", 409, "PHONE_ALREADY_EXISTS");
    }
  }

  return repository.updateById(userId, updates);
}

async function listSavedLocations(userId) {
  return repository.listSavedLocations(userId);
}

async function addSavedLocation(userId, payload) {
  return repository.createSavedLocation({
    userId,
    name: String(payload.name).trim(),
    address: String(payload.address).trim(),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
  });
}

async function removeSavedLocation(userId, locationId) {
  const removed = await repository.deleteSavedLocation(userId, locationId);
  if (!removed) {
    throw new AppError("Saved location not found", 404, "SAVED_LOCATION_NOT_FOUND");
  }
}

module.exports = {
  getProfile,
  updateProfile,
  listSavedLocations,
  addSavedLocation,
  removeSavedLocation,
};
