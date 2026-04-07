const VEHICLE_TYPES = ["auto", "cab"];
const DRIVER_STATUSES = ["approved", "pending", "suspended"];
const CANDIDATE_RESPONSE_STATUSES = ["accepted", "rejected", "timeout"];

function validateDriverRegistrationPayload(payload = {}) {
  const errors = [];

  if (!payload.userId && !payload.useAuthenticatedUser) {
    errors.push({ field: "userId", message: "userId is required" });
  }

  if (!payload.vehicleNumber || String(payload.vehicleNumber).trim().length < 3) {
    errors.push({ field: "vehicleNumber", message: "vehicleNumber is required" });
  }

  if (!payload.vehicleType || !VEHICLE_TYPES.includes(payload.vehicleType)) {
    errors.push({ field: "vehicleType", message: `vehicleType must be one of: ${VEHICLE_TYPES.join(", ")}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateAvailabilityPayload(payload = {}) {
  const errors = [];

  if (typeof payload.isAvailable !== "boolean") {
    errors.push({ field: "isAvailable", message: "isAvailable must be boolean" });
  }

  if (payload.status !== undefined && !DRIVER_STATUSES.includes(payload.status)) {
    errors.push({ field: "status", message: `status must be one of: ${DRIVER_STATUSES.join(", ")}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateLocationPayload(payload = {}) {
  const errors = [];

  const latitude = Number(payload.latitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push({ field: "latitude", message: "latitude must be between -90 and 90" });
  }

  const longitude = Number(payload.longitude);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push({ field: "longitude", message: "longitude must be between -180 and 180" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateCandidateResponsePayload(payload = {}) {
  const errors = [];

  if (!payload.status || !CANDIDATE_RESPONSE_STATUSES.includes(payload.status)) {
    errors.push({
      field: "status",
      message: `status must be one of: ${CANDIDATE_RESPONSE_STATUSES.join(", ")}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateDriverRegistrationPayload,
  validateAvailabilityPayload,
  validateLocationPayload,
  validateCandidateResponsePayload,
};
