function validateUpdateProfilePayload(payload = {}) {
  const errors = [];

  const allowedKeys = ["name", "email", "phone"];
  const keys = Object.keys(payload).filter((key) => allowedKeys.includes(key));

  if (!keys.length) {
    errors.push({ field: "body", message: "At least one field must be provided (name, email, phone)" });
  }

  if (payload.name !== undefined && String(payload.name).trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters long" });
  }

  if (payload.email !== undefined) {
    const email = String(payload.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: "email", message: "Email must be valid" });
    }
  }

  if (payload.phone !== undefined && String(payload.phone).trim().length < 8) {
    errors.push({ field: "phone", message: "Phone must be at least 8 characters" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateSavedLocationPayload(payload = {}) {
  const errors = [];

  if (!payload.name || String(payload.name).trim().length < 2) {
    errors.push({ field: "name", message: "Location name is required" });
  }

  if (!payload.address || String(payload.address).trim().length < 4) {
    errors.push({ field: "address", message: "Address is required" });
  }

  const latitude = Number(payload.latitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push({ field: "latitude", message: "Latitude must be between -90 and 90" });
  }

  const longitude = Number(payload.longitude);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push({ field: "longitude", message: "Longitude must be between -180 and 180" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateUpdateProfilePayload,
  validateSavedLocationPayload,
};
