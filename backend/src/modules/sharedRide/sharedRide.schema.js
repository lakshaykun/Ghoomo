const SHARED_RIDE_STATUS = ["open", "full", "completed", "cancelled"];
const PARTICIPANT_STATUS = ["joined", "picked", "dropped", "cancelled"];

function validateCreateSharedRidePayload(payload = {}) {
  const errors = [];

  if (!payload.baseRideId) {
    errors.push({ field: "baseRideId", message: "baseRideId is required" });
  }

  if (payload.maxParticipants !== undefined) {
    const maxParticipants = Number(payload.maxParticipants);
    if (!Number.isInteger(maxParticipants) || maxParticipants < 2) {
      errors.push({ field: "maxParticipants", message: "maxParticipants must be an integer >= 2" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateJoinSharedRidePayload(payload = {}) {
  const errors = [];

  if (!payload.pickupLocation || String(payload.pickupLocation).trim().length < 3) {
    errors.push({ field: "pickupLocation", message: "pickupLocation is required" });
  }

  if (!payload.dropLocation || String(payload.dropLocation).trim().length < 3) {
    errors.push({ field: "dropLocation", message: "dropLocation is required" });
  }

  if (payload.status && !PARTICIPANT_STATUS.includes(payload.status)) {
    errors.push({ field: "status", message: `status must be one of: ${PARTICIPANT_STATUS.join(", ")}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateSharedRideStatusPayload(payload = {}) {
  const errors = [];

  if (!payload.status || !SHARED_RIDE_STATUS.includes(payload.status)) {
    errors.push({ field: "status", message: `status must be one of: ${SHARED_RIDE_STATUS.join(", ")}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCreateSharedRidePayload,
  validateJoinSharedRidePayload,
  validateSharedRideStatusPayload,
};
