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
  if (payload.totalSeats !== undefined) {
    const seats = Number(payload.totalSeats);
    if (!Number.isInteger(seats) || seats <= 0) {
      errors.push({ field: "totalSeats", message: "totalSeats must be a positive integer" });
    }
  }
  if (payload.farePerSeat !== undefined) {
    const fare = Number(payload.farePerSeat);
    if (!Number.isFinite(fare) || fare < 0) {
      errors.push({ field: "farePerSeat", message: "farePerSeat must be a non-negative number" });
    }
  }

  if (payload.stops !== undefined) {
    if (!Array.isArray(payload.stops) || payload.stops.length < 2) {
      errors.push({ field: "stops", message: "stops must be an array with at least 2 items" });
    } else {
      payload.stops.forEach((stop, index) => {
        if (!stop || typeof stop !== "object") {
          errors.push({ field: `stops[${index}]`, message: "stop must be an object" });
          return;
        }
        if (!stop.name || String(stop.name).trim().length < 2) {
          errors.push({ field: `stops[${index}].name`, message: "stop name is required" });
        }
        const lat = Number(stop.latitude);
        const lng = Number(stop.longitude);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          errors.push({ field: `stops[${index}].latitude`, message: "latitude must be between -90 and 90" });
        }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          errors.push({ field: `stops[${index}].longitude`, message: "longitude must be between -180 and 180" });
        }
        if (!stop.arrivalTime) {
          errors.push({ field: `stops[${index}].arrivalTime`, message: "arrivalTime is required" });
        }
        if (!stop.type || !STOP_TYPE.includes(stop.type)) {
          errors.push({ field: `stops[${index}].type`, message: `type must be one of: ${STOP_TYPE.join(", ")}` });
        }
        const order = Number(stop.order);
        if (!Number.isInteger(order) || order < 1) {
          errors.push({ field: `stops[${index}].order`, message: "order must be a positive integer" });
        }
      });
    }
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

function validateBusLocationPayload(payload = {}) {
  const errors = [];
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push({ field: "latitude", message: "latitude must be between -90 and 90" });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push({ field: "longitude", message: "longitude must be between -180 and 180" });
  }
  if (payload.speedKmph !== undefined) {
    const speed = Number(payload.speedKmph);
    if (!Number.isFinite(speed) || speed < 0) {
      errors.push({ field: "speedKmph", message: "speedKmph must be non-negative" });
    }
  }
  if (payload.headingDeg !== undefined) {
    const heading = Number(payload.headingDeg);
    if (!Number.isFinite(heading) || heading < 0 || heading > 360) {
      errors.push({ field: "headingDeg", message: "headingDeg must be between 0 and 360" });
    }
  }
  if (payload.delayMinutes !== undefined && !Number.isInteger(Number(payload.delayMinutes))) {
    errors.push({ field: "delayMinutes", message: "delayMinutes must be an integer" });
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
  validateBusLocationPayload,
};
