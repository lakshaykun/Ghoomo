const RIDE_STATUS = ["assigned", "arriving", "started", "completed", "cancelled"];

function validateQuotePayload(payload = {}) {
  const errors = [];

  const required = ["pickupLatitude", "pickupLongitude", "dropLatitude", "dropLongitude", "vehicleType"];
  required.forEach((field) => {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      errors.push({ field, message: `${field} is required` });
    }
  });

  if (!["auto", "cab"].includes(payload.vehicleType)) {
    errors.push({ field: "vehicleType", message: "vehicleType must be auto or cab" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateCreateRideRequestPayload(payload = {}) {
  const errors = [];

  if (!payload.pickupLocation || String(payload.pickupLocation).trim().length < 3) {
    errors.push({ field: "pickupLocation", message: "pickupLocation is required" });
  }

  if (!payload.dropLocation || String(payload.dropLocation).trim().length < 3) {
    errors.push({ field: "dropLocation", message: "dropLocation is required" });
  }

  const numericFields = [
    ["pickupLatitude", -90, 90],
    ["pickupLongitude", -180, 180],
    ["dropLatitude", -90, 90],
    ["dropLongitude", -180, 180],
  ];

  numericFields.forEach(([field, min, max]) => {
    const value = Number(payload[field]);
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push({ field, message: `${field} must be between ${min} and ${max}` });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateAssignDriverPayload(payload = {}) {
  const errors = [];

  if (!payload.driverId) {
    errors.push({ field: "driverId", message: "driverId is required" });
  }

  if (payload.fare !== undefined && (!Number.isFinite(Number(payload.fare)) || Number(payload.fare) < 0)) {
    errors.push({ field: "fare", message: "fare must be a positive number" });
  }

  if (payload.distance !== undefined && (!Number.isFinite(Number(payload.distance)) || Number(payload.distance) < 0)) {
    errors.push({ field: "distance", message: "distance must be a positive number" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateRideStatusPayload(payload = {}) {
  const errors = [];

  if (!payload.status || !RIDE_STATUS.includes(payload.status)) {
    errors.push({ field: "status", message: `status must be one of: ${RIDE_STATUS.join(", ")}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateRateRidePayload(payload = {}) {
  const errors = [];
  const rating = Number(payload.rating);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    errors.push({ field: "rating", message: "rating must be between 1 and 5" });
  }

  if (payload.reviewText !== undefined && String(payload.reviewText).length > 1000) {
    errors.push({ field: "reviewText", message: "reviewText cannot exceed 1000 characters" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateQuotePayload,
  validateCreateRideRequestPayload,
  validateAssignDriverPayload,
  validateUpdateRideStatusPayload,
  validateRateRidePayload,
};
