const BOOKING_STATUS = ["pending", "verified", "cancelled", "missing"];
const STOP_TYPE = ["pickup", "dropoff", "both"];

function validateRoutePayload(payload = {}) {
  const errors = [];

  if (!payload.name || String(payload.name).trim().length < 2) {
    errors.push({ field: "name", message: "Route name is required" });
  }

  if (!payload.departureTime) {
    errors.push({ field: "departureTime", message: "departureTime is required (HH:MM[:SS])" });
  }

  if (!payload.arrivalTime) {
    errors.push({ field: "arrivalTime", message: "arrivalTime is required (HH:MM[:SS])" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateBookingPayload(payload = {}) {
  const errors = [];

  if (!payload.routeId) {
    errors.push({ field: "routeId", message: "routeId is required" });
  }

  if (payload.seatNumber !== undefined) {
    const seatNumber = Number(payload.seatNumber);
    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      errors.push({ field: "seatNumber", message: "seatNumber must be a positive integer" });
    }
  }

  if (payload.status !== undefined && !BOOKING_STATUS.includes(payload.status)) {
    errors.push({ field: "status", message: `status must be one of: ${BOOKING_STATUS.join(", ")}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateBookingStatusPayload(payload = {}) {
  const errors = [];

  if (!payload.status || !BOOKING_STATUS.includes(payload.status)) {
    errors.push({ field: "status", message: `status must be one of: ${BOOKING_STATUS.join(", ")}` });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateRouteStopPayload(payload = {}) {
  const errors = [];

  if (!payload.stopId && (!payload.stopName || String(payload.stopName).trim().length < 2)) {
    errors.push({ field: "stopName", message: "stopId or stopName is required" });
  }

  if (!payload.stopOrder || !Number.isInteger(Number(payload.stopOrder)) || Number(payload.stopOrder) < 1) {
    errors.push({ field: "stopOrder", message: "stopOrder must be a positive integer" });
  }

  if (!payload.stopType || !STOP_TYPE.includes(payload.stopType)) {
    errors.push({ field: "stopType", message: `stopType must be one of: ${STOP_TYPE.join(", ")}` });
  }

  if (!payload.arrivalTime) {
    errors.push({ field: "arrivalTime", message: "arrivalTime is required (HH:MM[:SS])" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateRoutePayload,
  validateBookingPayload,
  validateBookingStatusPayload,
  validateRouteStopPayload,
};
