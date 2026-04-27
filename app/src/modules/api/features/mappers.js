const BACKEND_TO_APP_RIDE_STATUS = {
  searching: "pending",
  matched: "accepted",
  assigned: "accepted",
  arriving: "arrived",
  started: "in_progress",
  completed: "completed",
  cancelled: "cancelled",
  expired: "cancelled",
};

const APP_TO_BACKEND_RIDE_STATUS = {
  accepted: "assigned",
  arrived: "arriving",
  in_progress: "started",
  completed: "completed",
  cancelled: "cancelled",
};

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function estimateDurationMinutes(distanceKm, avgSpeedKmh = 28) {
  const safeDistance = Math.max(0, toNumber(distanceKm, 0));
  if (safeDistance === 0) return 0;
  return Math.max(1, Math.round((safeDistance / avgSpeedKmh) * 60));
}

export function haversineDistanceKm(a, b) {
  if (!a || !b) return 0;

  const lat1 = toNumber(a.latitude, null);
  const lon1 = toNumber(a.longitude, null);
  const lat2 = toNumber(b.latitude, null);
  const lon2 = toNumber(b.longitude, null);

  if ([lat1, lon1, lat2, lon2].some((value) => value === null)) {
    return 0;
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const p =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(p), Math.sqrt(1 - p));
  return Number((earthRadiusKm * c).toFixed(3));
}

export function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) return "user";
  if (normalized === "rider" || normalized === "user") return "user";
  if (normalized === "bus_driver") return "bus_driver";
  if (normalized === "driver") return "driver";
  if (normalized === "admin") return "admin";
  return normalized;
}

export function formatTimeLabel(rawTime) {
  const text = String(rawTime || "").trim();
  if (!text) return "12:00 PM";
  if (/am|pm/i.test(text)) return text;

  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return text;

  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

export function toPlace({ name, address, latitude, longitude } = {}) {
  const lat = toNumber(latitude, null);
  const lon = toNumber(longitude, null);
  const label = (name || address || "Pinned location").trim();

  return {
    id: `${lat ?? "na"}:${lon ?? "na"}:${label}`,
    name: label,
    address: (address || name || "").trim(),
    latitude: lat,
    longitude: lon,
  };
}

export function mapBackendRideStatus(status) {
  return BACKEND_TO_APP_RIDE_STATUS[String(status || "").toLowerCase()] || "pending";
}

export function mapAppRideStatusToBackend(status) {
  return APP_TO_BACKEND_RIDE_STATUS[String(status || "").toLowerCase()] || null;
}

export function normalizeUser(user = {}, extras = {}) {
  const role = normalizeRole(user.role || extras.role);

  return {
    id: user.id || extras.id || null,
    uid: extras.uid || user.id || null,
    email: user.email || extras.email || "",
    displayName: extras.displayName || user.name || "",
    role,
    name: user.name || extras.name || "",
    phone: user.phone || extras.phone || "",
    city: extras.city || null,
    photoURL: extras.photoURL || null,
    vehicleType: user.vehicle_type || user.vehicleType || extras.vehicleType || null,
    vehicleNo: user.vehicle_number || user.vehicleNo || extras.vehicleNo || null,
    licenseNumber: extras.licenseNumber || null,
    busRoute: extras.busRoute || null,
    createdAt: user.created_at || user.createdAt || null,
    updatedAt: user.updated_at || user.updatedAt || null,
  };
}

export function normalizeNearbyDriver(row = {}) {
  return {
    id: row.id || null,
    userId: row.user_id || row.userId || null,
    name: row.name || "Driver",
    phone: row.phone || null,
    vehicleType: row.vehicle_type || row.vehicleType || "cab",
    vehicleNo: row.vehicle_number || row.vehicleNo || null,
    rating: toNumber(row.rating, 0),
    distanceKm: toNumber(row.distance_km, 0),
    latitude: toNumber(row.current_latitude, null),
    longitude: toNumber(row.current_longitude, null),
  };
}

export function normalizeDriverProfile(row = {}) {
  return {
    id: row.id || null,
    userId: row.user_id || row.userId || null,
    status: row.status || "pending",
    isAvailable: Boolean(row.is_available ?? row.isAvailable),
    rating: toNumber(row.rating, 0),
    name: row.name || "Driver",
    email: row.email || "",
    phone: row.phone || "",
    vehicleNo: row.vehicle_number || row.vehicleNo || null,
    vehicleType: row.vehicle_type || row.vehicleType || "cab",
    latitude: toNumber(row.current_latitude, null),
    longitude: toNumber(row.current_longitude, null),
    updatedAt: row.updated_at || row.updatedAt || null,
  };
}

export function normalizeDriverCandidateRequest(row = {}) {
  const candidateStatus = String(row.status || "pending").toLowerCase();
  const appStatus =
    candidateStatus === "accepted"
      ? "accepted"
      : candidateStatus === "rejected" || candidateStatus === "timeout"
        ? "cancelled"
        : "pending";

  const pickup = toPlace({
    name: row.pickup_location,
    address: row.pickup_location,
    latitude: row.pickup_latitude,
    longitude: row.pickup_longitude,
  });

  const drop = toPlace({
    name: row.drop_location,
    address: row.drop_location,
    latitude: row.drop_latitude,
    longitude: row.drop_longitude,
  });

  const distanceKm = toNumber(row.distance_km, haversineDistanceKm(pickup, drop));

  return {
    id: row.request_id || row.id,
    requestId: row.request_id || row.id,
    sourceType: "ride_request_candidate",
    status: appStatus,
    pickup,
    drop,
    route: { geometry: [] },
    fare: 0,
    distance: distanceKm,
    durationMinutes: estimateDurationMinutes(distanceKm),
    isShare: Boolean(row.is_shared),
    requestedDrivers: [],
    driver: null,
    otp: null,
    userId: row.student_id || null,
    createdAt: row.request_time || row.offered_at || null,
    updatedAt: row.offered_at || null,
  };
}

export function normalizeRideRequest(row = {}, overrides = {}) {
  const pickup = toPlace({
    name: row.pickup_location || row.pickupLocation,
    address: row.pickup_location || row.pickupLocation,
    latitude: row.pickup_latitude || row.pickupLatitude,
    longitude: row.pickup_longitude || row.pickupLongitude,
  });

  const drop = toPlace({
    name: row.drop_location || row.dropLocation,
    address: row.drop_location || row.dropLocation,
    latitude: row.drop_latitude || row.dropLatitude,
    longitude: row.drop_longitude || row.dropLongitude,
  });

  const distanceKm = toNumber(
    row.distance,
    overrides.distance ?? haversineDistanceKm(pickup, drop)
  );

  const fare = toNumber(row.fare, overrides.fare ?? 0);

  return {
    id: row.id,
    requestId: row.id,
    sourceType: "ride_request",
    status: mapBackendRideStatus(row.status || overrides.status || "searching"),
    pickup,
    drop,
    route: { geometry: [] },
    fare,
    distance: distanceKm,
    durationMinutes: estimateDurationMinutes(distanceKm),
    isShare: Boolean(row.is_shared ?? overrides.isShare),
    requestedDrivers: [],
    driver: null,
    otp: null,
    paymentMethod: overrides.paymentMethod || "cash",
    scheduledAt: row.expires_at || overrides.scheduledAt || null,
    userId: row.student_id || overrides.userId || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function normalizeRide(row = {}, overrides = {}) {
  if (row?.pickup && row?.drop) {
    return {
      ...row,
      status: mapBackendRideStatus(row.status),
    };
  }

  const pickup = toPlace({
    name: row.pickup_location || row.pickupLocation,
    address: row.pickup_location || row.pickupLocation,
    latitude: row.pickup_latitude || row.pickupLatitude,
    longitude: row.pickup_longitude || row.pickupLongitude,
  });

  const drop = toPlace({
    name: row.drop_location || row.dropLocation,
    address: row.drop_location || row.dropLocation,
    latitude: row.drop_latitude || row.dropLatitude,
    longitude: row.drop_longitude || row.dropLongitude,
  });

  const distanceKm = toNumber(
    row.distance,
    overrides.distance ?? haversineDistanceKm(pickup, drop)
  );

  const driverOverride = overrides.driver || null;
  const driverLatitude = toNumber(
    row.driver?.latitude ?? row.driver_latitude ?? row.driverLatitude,
    toNumber(driverOverride?.latitude, null)
  );
  const driverLongitude = toNumber(
    row.driver?.longitude ?? row.driver_longitude ?? row.driverLongitude,
    toNumber(driverOverride?.longitude, null)
  );
  const driverDistanceFallback =
    driverLatitude !== null && driverLongitude !== null
      ? haversineDistanceKm(pickup, {
          latitude: driverLatitude,
          longitude: driverLongitude,
        })
      : 0;
  const driverDistanceKm = toNumber(
    row.driver?.distanceKm ?? row.driver_distance_km ?? row.driverDistanceKm,
    toNumber(driverOverride?.distanceKm, driverDistanceFallback)
  );
  const driverEtaMinutes = toNumber(
    row.driver?.etaMinutes ?? row.driver_eta_minutes ?? row.driverEtaMinutes,
    toNumber(driverOverride?.etaMinutes, estimateDurationMinutes(driverDistanceKm))
  );
  const hasDriver = Boolean(
    row.driver_id ||
      row.driver_user_id ||
      row.driver_name ||
      row.driver_vehicle_number ||
      row.driver
  );

  const driver = hasDriver
    ? {
        id: row.driver_id || row.driver?.id || driverOverride?.id || null,
        name: row.driver?.name || row.driver_name || driverOverride?.name || "Driver",
        phone: row.driver?.phone || row.driver_phone || driverOverride?.phone || row.driver?.phoneNumber || null,
        vehicleType:
          row.driver?.vehicleType || row.driver_vehicle_type || driverOverride?.vehicleType || "cab",
        vehicleNo: row.driver?.vehicleNo || row.driver_vehicle_number || driverOverride?.vehicleNo || null,
        rating: toNumber(row.driver?.rating, toNumber(row.driver_rating, toNumber(driverOverride?.rating, 0))),
        distanceKm: driverDistanceKm,
        etaMinutes: driverEtaMinutes,
        latitude: driverLatitude,
        longitude: driverLongitude,
      }
    : null;

  return {
    id: row.id,
    requestId: row.request_id || null,
    sourceType: "ride",
    status: mapBackendRideStatus(row.status || overrides.status),
    pickup,
    drop,
    route: { geometry: [] },
    fare: toNumber(row.fare, overrides.fare ?? 0),
    distance: distanceKm,
    durationMinutes: estimateDurationMinutes(distanceKm),
    isShare: Boolean(row.is_shared ?? overrides.isShare),
    requestedDrivers: row.requested_drivers || [],
    driver,
    otp: row.otp || overrides.otp || null,
    paymentMethod: row.payment_method || overrides.paymentMethod || "cash",
    scheduledAt: row.scheduled_at || overrides.scheduledAt || null,
    userId: row.student_id || row.user_id || overrides.userId || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function normalizeBusRoute(row = {}) {
  const stopsDetailed = Array.isArray(row.stops) ? row.stops : [];
  const stopNames = stopsDetailed
    .map((stop) => stop?.stopName || stop?.name || "")
    .filter(Boolean);

  return {
    id: row.id,
    name: row.name || "Unnamed Route",
    from: row.from || stopNames[0] || "",
    to: row.to || stopNames[stopNames.length - 1] || "",
    departureTime: formatTimeLabel(row.departure_time || row.departureTime),
    arrivalTime: formatTimeLabel(row.arrival_time || row.arrivalTime),
    stops: stopNames,
    stopsDetailed,
    totalSeats: toNumber(row.total_seats || row.totalSeats, 40),
    bookedSeats: Array.isArray(row.bookedSeats) ? row.bookedSeats : [],
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
  };
}

export function normalizeBusBooking(row = {}, options = {}) {
  const status = String(row.status || "pending").toLowerCase();
  const seatNumberRaw = row.seat_number ?? row.seatNumber;
  const seatNumber =
    seatNumberRaw === null || seatNumberRaw === undefined
      ? null
      : Number(seatNumberRaw);

  const isWaiting =
    Boolean(row.isWaiting ?? row.is_waiting) ||
    (seatNumber === null && status === "pending");

  const verified =
    Boolean(row.verified) ||
    status === "verified" ||
    Boolean(row.verified_by || row.verifiedBy || row.verified_at || row.verifiedAt);

  const fallbackUserName = options.fallbackUserName || "Passenger";

  return {
    id: row.id,
    type: "bus",
    routeId: row.route_id || row.routeId,
    seatNumber,
    waitlistPosition: row.waitlist_position || row.waitlistPosition || null,
    userId: row.user_id || row.userId || null,
    userName: row.user_name || row.userName || fallbackUserName,
    isWaiting,
    status,
    verified,
    verifiedAt: row.verified_at || row.verifiedAt || null,
    verifiedBy: row.verified_by || row.verifiedBy || null,
    qrCode: row.qr_code || row.qrCode || null,
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
  };
}
