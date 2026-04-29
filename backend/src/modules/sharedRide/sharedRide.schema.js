const SHARED_RIDE_STATUS = [
  "open", "full", "scheduled", "accepted",
  "completed", "cancelled", "expired",
  // accept uppercase too
  "OPEN", "FULL", "SCHEDULED", "ACCEPTED",
  "COMPLETED", "CANCELLED", "EXPIRED",
];

const PARTICIPANT_STATUS = ["joined", "picked", "dropped", "cancelled"];

function validateJoinSharedRidePayload(payload = {}) {
  const errors = [];

  // pickupLocation may be empty string when the joiner uses the ride's default location
  if (payload.pickupLocation !== undefined && String(payload.pickupLocation).trim().length > 0) {
    if (String(payload.pickupLocation).trim().length < 2) {
      errors.push({ field: "pickupLocation", message: "pickupLocation is too short" });
    }
  }

  if (payload.dropLocation !== undefined && String(payload.dropLocation).trim().length > 0) {
    if (String(payload.dropLocation).trim().length < 2) {
      errors.push({ field: "dropLocation", message: "dropLocation is too short" });
    }
  }

  if (payload.status && !PARTICIPANT_STATUS.includes(payload.status)) {
    errors.push({ field: "status", message: `status must be one of: ${PARTICIPANT_STATUS.join(", ")}` });
  }

  return { isValid: errors.length === 0, errors };
}

function validateSharedRideStatusPayload(payload = {}) {
  const errors = [];

  if (!payload.status || !SHARED_RIDE_STATUS.map(s => s.toUpperCase()).includes(String(payload.status).toUpperCase())) {
    errors.push({ field: "status", message: `status must be one of: OPEN, FULL, SCHEDULED, ACCEPTED, COMPLETED, CANCELLED, EXPIRED` });
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = {
  validateJoinSharedRidePayload,
  validateSharedRideStatusPayload,
};
