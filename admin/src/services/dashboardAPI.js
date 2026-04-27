import api from './api';

const DEFAULT_LIMIT = 20;
const MAX_ADMIN_PAGE_LIMIT = 100;
const MAX_ANALYTICS_LIMIT = 20;
const MAX_NEARBY_DRIVER_LIMIT = 20;

function unwrapData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = Math.trunc(parsed);
  if (normalized < min) {
    return min;
  }

  if (normalized > max) {
    return max;
  }

  return normalized;
}

function normalizeUser(row = {}) {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    role: row.role ?? 'rider',
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

function normalizeRide(row = {}) {
  return {
    id: row.id,
    requestId: row.request_id ?? row.requestId ?? null,
    studentId: row.student_id ?? row.studentId ?? null,
    studentName: row.student_name ?? row.studentName ?? '',
    driverId: row.driver_id ?? row.driverId ?? null,
    driverName: row.driver_name ?? row.driverName ?? '',
    pickupLocation: row.pickup_location ?? row.pickupLocation ?? '',
    dropLocation: row.drop_location ?? row.dropLocation ?? '',
    status: row.status ?? 'pending',
    fare: toNullableNumber(row.fare),
    distance: toNullableNumber(row.distance),
    isShared: Boolean(row.is_shared ?? row.isShared),
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

function normalizeCountBucket(row = {}) {
  return {
    label: row.label ?? row.status ?? row.role ?? row.name ?? '',
    count: toNumber(row.count),
  };
}

function normalizeSeriesPoint(row = {}) {
  return {
    date: row.date ?? row.day ?? '',
    label: row.label ?? row.day ?? row.date ?? '',
    count: toNumber(row.count),
  };
}

function normalizeRecentRequest(row = {}) {
  return {
    id: row.id,
    studentId: row.student_id ?? row.studentId ?? null,
    studentName: row.student_name ?? row.studentName ?? '',
    pickupLocation: row.pickup_location ?? row.pickupLocation ?? '',
    dropLocation: row.drop_location ?? row.dropLocation ?? '',
    status: row.status ?? 'searching',
    isShared: Boolean(row.is_shared ?? row.isShared),
    expiresAt: row.expires_at ?? row.expiresAt ?? null,
    candidateCount: toNumber(row.candidate_count ?? row.candidateCount),
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

function normalizeRecentCandidate(row = {}) {
  return {
    id: row.id,
    requestId: row.request_id ?? row.requestId ?? null,
    requestStatus: row.request_status ?? row.requestStatus ?? '',
    driverId: row.driver_id ?? row.driverId ?? null,
    driverName: row.driver_name ?? row.driverName ?? '',
    status: row.status ?? 'pending',
    distanceKm: toNullableNumber(row.distance_km ?? row.distanceKm),
    offeredAt: row.offered_at ?? row.offeredAt ?? null,
    respondedAt: row.responded_at ?? row.respondedAt ?? null,
  };
}

function normalizeRecentBooking(row = {}) {
  return {
    id: row.id,
    routeId: row.route_id ?? row.routeId ?? null,
    routeName: row.route_name ?? row.routeName ?? '',
    userId: row.user_id ?? row.userId ?? null,
    userName: row.user_name ?? row.userName ?? '',
    status: row.status ?? 'pending',
    seatNumber: row.seat_number ?? row.seatNumber ?? null,
    verifiedBy: row.verified_by ?? row.verifiedBy ?? null,
    verifiedByName: row.verified_by_name ?? row.verifiedByName ?? '',
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

function normalizeTopDriver(row = {}) {
  return {
    driverId: row.driver_id ?? row.driverId ?? row.id ?? null,
    userId: row.user_id ?? row.userId ?? null,
    name: row.name ?? '',
    email: row.email ?? '',
    status: row.status ?? 'pending',
    isAvailable: Boolean(row.is_available ?? row.isAvailable),
    rating: toNullableNumber(row.rating),
    completedRides: toNumber(row.completed_rides ?? row.completedRides),
    revenue: toNullableNumber(row.revenue),
    avgFare: toNullableNumber(row.avg_fare ?? row.avgFare),
  };
}

function normalizeTopRoute(row = {}) {
  return {
    routeId: row.route_id ?? row.routeId ?? row.id ?? null,
    name: row.name ?? '',
    departureTime: row.departure_time ?? row.departureTime ?? null,
    arrivalTime: row.arrival_time ?? row.arrivalTime ?? null,
    stopCount: toNumber(row.stop_count ?? row.stopCount),
    bookings: toNumber(row.bookings),
    verifiedBookings: toNumber(row.verified_bookings ?? row.verifiedBookings),
    pendingBookings: toNumber(row.pending_bookings ?? row.pendingBookings),
    cancelledBookings: toNumber(row.cancelled_bookings ?? row.cancelledBookings),
  };
}

function normalizeRouteStop(row = {}) {
  return {
    id: row.id ?? null,
    stopId: row.stopId ?? row.stop_id ?? null,
    stopName: row.stopName ?? row.stop_name ?? '',
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    stopOrder: row.stopOrder ?? row.stop_order ?? null,
    stopType: row.stopType ?? row.stop_type ?? null,
    arrivalTime: row.arrivalTime ?? row.arrival_time ?? null,
  };
}

function normalizeRoute(row = {}) {
  return {
    id: row.id,
    name: row.name ?? '',
    departureTime: row.departure_time ?? row.departureTime ?? null,
    arrivalTime: row.arrival_time ?? row.arrivalTime ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
    stops: toArray(row.stops).map(normalizeRouteStop),
  };
}

function normalizeBooking(row = {}) {
  return {
    id: row.id,
    routeId: row.route_id ?? row.routeId ?? null,
    userId: row.user_id ?? row.userId ?? null,
    seatNumber: row.seat_number ?? row.seatNumber ?? null,
    status: row.status ?? 'pending',
    verifiedBy: row.verified_by ?? row.verifiedBy ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

function normalizeNearbyDriver(row = {}) {
  return {
    id: row.id,
    userId: row.user_id ?? row.userId ?? null,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    status: row.status ?? 'pending',
    isAvailable: Boolean(row.is_available ?? row.isAvailable),
    rating: toNullableNumber(row.rating),
    vehicleNumber: row.vehicle_number ?? row.vehicleNumber ?? '',
    vehicleType: row.vehicle_type ?? row.vehicleType ?? '',
    currentLatitude: toNullableNumber(row.current_latitude ?? row.currentLatitude),
    currentLongitude: toNullableNumber(row.current_longitude ?? row.currentLongitude),
    distanceKm: toNullableNumber(row.distance_km ?? row.distanceKm),
  };
}

function normalizeStats(row = {}) {
  return {
    totalUsers: toNumber(row.total_users),
    riderUsers: toNumber(row.rider_users),
    driverUsers: toNumber(row.driver_users),
    busDriverUsers: toNumber(row.bus_driver_users),
    adminUsers: toNumber(row.admin_users),
    totalDrivers: toNumber(row.total_drivers),
    approvedDrivers: toNumber(row.approved_drivers),
    pendingDrivers: toNumber(row.pending_drivers),
    suspendedDrivers: toNumber(row.suspended_drivers),
    rejectedDrivers: toNumber(row.rejected_drivers),
    availableDrivers: toNumber(row.available_drivers),
    totalBusDrivers: toNumber(row.total_bus_drivers),
    approvedBusDrivers: toNumber(row.approved_bus_drivers),
    pendingBusDrivers: toNumber(row.pending_bus_drivers),
    suspendedBusDrivers: toNumber(row.suspended_bus_drivers),
    rejectedBusDrivers: toNumber(row.rejected_bus_drivers),
    totalRideRequests: toNumber(row.total_ride_requests),
    searchingRideRequests: toNumber(row.searching_ride_requests),
    matchedRideRequests: toNumber(row.matched_ride_requests),
    cancelledRideRequests: toNumber(row.cancelled_ride_requests),
    expiredRideRequests: toNumber(row.expired_ride_requests),
    totalRides: toNumber(row.total_rides),
    assignedRides: toNumber(row.assigned_rides),
    arrivingRides: toNumber(row.arriving_rides),
    startedRides: toNumber(row.started_rides),
    completedRides: toNumber(row.completed_rides),
    cancelledRides: toNumber(row.cancelled_rides),
    activeRides: toNumber(row.active_rides),
    totalBusRoutes: toNumber(row.total_bus_routes),
    totalBusBookings: toNumber(row.total_bus_bookings),
    pendingBusBookings: toNumber(row.pending_bus_bookings),
    verifiedBusBookings: toNumber(row.verified_bus_bookings),
    cancelledBusBookings: toNumber(row.cancelled_bus_bookings),
    missingBusBookings: toNumber(row.missing_bus_bookings),
    totalSharedRides: toNumber(row.total_shared_rides),
    openSharedRides: toNumber(row.open_shared_rides),
    fullSharedRides: toNumber(row.full_shared_rides),
    completedSharedRides: toNumber(row.completed_shared_rides),
    cancelledSharedRides: toNumber(row.cancelled_shared_rides),
    totalCandidateOffers: toNumber(row.total_candidate_offers),
    pendingCandidateOffers: toNumber(row.pending_candidate_offers),
    acceptedCandidateOffers: toNumber(row.accepted_candidate_offers),
    rejectedCandidateOffers: toNumber(row.rejected_candidate_offers),
    timedOutCandidateOffers: toNumber(row.timed_out_candidate_offers),
    totalRevenue: toNumber(row.total_revenue),
    revenueToday: toNumber(row.revenue_today),
    completedRidesToday: toNumber(row.completed_rides_today),
    rideRequestsToday: toNumber(row.ride_requests_today),
    newUsersToday: toNumber(row.new_users_today),
  };
}

function normalizeAnalytics(payload = {}) {
  const stats = normalizeStats(payload.stats || {});

  return {
    generatedAt: payload.generated_at ?? payload.generatedAt ?? null,
    windowDays: toNumber(payload.window_days ?? payload.windowDays, 7),
    stats,
    live: {
      pendingRideRequests: toNumber(payload.live?.pending_ride_requests),
      matchedRideRequests: toNumber(payload.live?.matched_ride_requests),
      activeRides: toNumber(payload.live?.active_rides),
      availableDrivers: toNumber(payload.live?.available_drivers),
      pendingCandidateOffers: toNumber(payload.live?.pending_candidate_offers),
      openSharedRides: toNumber(payload.live?.open_shared_rides),
      completedRidesToday: toNumber(payload.live?.completed_rides_today),
      rideRequestsToday: toNumber(payload.live?.ride_requests_today),
      newUsersToday: toNumber(payload.live?.new_users_today),
      revenueToday: toNumber(payload.live?.revenue_today),
    },
    trends: {
      users: toArray(payload.trends?.users).map(normalizeSeriesPoint),
      rideRequests: toArray(payload.trends?.ride_requests ?? payload.trends?.rideRequests).map(normalizeSeriesPoint),
      rides: toArray(payload.trends?.rides).map(normalizeSeriesPoint),
      busBookings: toArray(payload.trends?.bus_bookings ?? payload.trends?.busBookings).map(normalizeSeriesPoint),
    },
    distributions: {
      roles: toArray(payload.distributions?.roles).map(normalizeCountBucket),
      drivers: toArray(payload.distributions?.drivers).map(normalizeCountBucket),
      rideRequests: toArray(payload.distributions?.ride_requests ?? payload.distributions?.rideRequests).map(normalizeCountBucket),
      rides: toArray(payload.distributions?.rides).map(normalizeCountBucket),
      busBookings: toArray(payload.distributions?.bus_bookings ?? payload.distributions?.busBookings).map(normalizeCountBucket),
      sharedRides: toArray(payload.distributions?.shared_rides ?? payload.distributions?.sharedRides).map(normalizeCountBucket),
      candidateOffers: toArray(payload.distributions?.candidate_offers ?? payload.distributions?.candidateOffers).map(normalizeCountBucket),
    },
    topDrivers: toArray(payload.top_drivers ?? payload.topDrivers).map(normalizeTopDriver),
    topRoutes: toArray(payload.top_routes ?? payload.topRoutes).map(normalizeTopRoute),
    recent: {
      users: toArray(payload.recent?.users).map(normalizeUser),
      rides: toArray(payload.recent?.rides).map(normalizeRide),
      requests: toArray(payload.recent?.requests ?? payload.recent?.ride_requests).map(normalizeRecentRequest),
      candidates: toArray(payload.recent?.candidates).map(normalizeRecentCandidate),
      bookings: toArray(payload.recent?.bookings).map(normalizeRecentBooking),
    },
  };
}

function normalizeHealth(payload = {}) {
  return {
    status: payload.status ?? 'unknown',
    environment: payload.environment ?? 'unknown',
    nodeVersion: payload.node_version ?? payload.nodeVersion ?? '',
    uptimeSeconds: toNumber(payload.uptime_seconds ?? payload.uptimeSeconds),
    database: {
      status: payload.database?.status ?? 'unknown',
      checkedAt: payload.database?.checked_at ?? payload.database?.checkedAt ?? null,
    },
    timestamp: payload.timestamp ?? payload.generated_at ?? payload.generatedAt ?? null,
  };
}

async function login(credentials = {}) {
  const response = await api.post('/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });

  const payload = unwrapData(response) || {};

  return {
    token: payload.token,
    user: normalizeUser(payload.user),
  };
}

async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return normalizeUser(unwrapData(response) || {});
}

async function getAnalyticsData({ days = 7, limit = 5 } = {}) {
  const safeDays = clampInteger(days, 7, 1, 30);
  const safeLimit = clampInteger(limit, 5, 1, MAX_ANALYTICS_LIMIT);

  const response = await api.get('/admin/analytics', {
    params: {
      days: safeDays,
      limit: safeLimit,
    },
  });

  return normalizeAnalytics(unwrapData(response) || {});
}

async function getHealthData() {
  const response = await api.get('/admin/health');
  return normalizeHealth(unwrapData(response) || {});
}

async function getOverviewData() {
  const [analytics, routesResponse, health] = await Promise.all([
    getAnalyticsData({ days: 7, limit: 5 }),
    getRoutes(),
    getHealthData(),
  ]);

  return {
    stats: analytics.stats,
    live: analytics.live,
    trends: analytics.trends,
    distributions: analytics.distributions,
    topDrivers: analytics.topDrivers,
    topRoutes: analytics.topRoutes,
    recentUsers: analytics.recent.users,
    recentRides: analytics.recent.rides,
    recentRequests: analytics.recent.requests,
    recentCandidates: analytics.recent.candidates,
    recentBookings: analytics.recent.bookings,
    routes: routesResponse.data,
    health,
    generatedAt: analytics.generatedAt,
  };
}

async function getMonitoringData({ days = 14, limit = 8 } = {}) {
  const [analytics, health] = await Promise.all([
    getAnalyticsData({ days, limit }),
    getHealthData(),
  ]);

  return {
    ...analytics,
    health,
  };
}

async function getUsers({ page = 1, limit = DEFAULT_LIMIT, role = '' } = {}) {
  const safePage = clampInteger(page, 1, 1, Number.MAX_SAFE_INTEGER);
  const safeLimit = clampInteger(limit, DEFAULT_LIMIT, 1, MAX_ADMIN_PAGE_LIMIT);

  const response = await api.get('/admin/users', {
    params: {
      page: safePage,
      limit: safeLimit,
      ...(role ? { role } : {}),
    },
  });

  return {
    data: toArray(unwrapData(response)).map(normalizeUser),
    pagination: response.data?.pagination ?? { page: safePage, limit: safeLimit },
  };
}

async function getRides({ page = 1, limit = DEFAULT_LIMIT, status = '' } = {}) {
  const safePage = clampInteger(page, 1, 1, Number.MAX_SAFE_INTEGER);
  const safeLimit = clampInteger(limit, DEFAULT_LIMIT, 1, MAX_ADMIN_PAGE_LIMIT);

  const response = await api.get('/admin/rides', {
    params: {
      page: safePage,
      limit: safeLimit,
      ...(status ? { status } : {}),
    },
  });

  return {
    data: toArray(unwrapData(response)).map(normalizeRide),
    pagination: response.data?.pagination ?? { page: safePage, limit: safeLimit },
  };
}

async function getRoutes() {
  const response = await api.get('/bus/routes');

  return {
    data: toArray(unwrapData(response)).map(normalizeRoute),
  };
}

async function createRoute(payload = {}) {
  const response = await api.post('/bus/routes', {
    name: payload.name,
    departureTime: payload.departureTime,
    arrivalTime: payload.arrivalTime,
  });

  return normalizeRoute(unwrapData(response) || {});
}

async function addRouteStop(routeId, payload = {}) {
  const response = await api.post(`/bus/routes/${routeId}/stops`, {
    stopId: payload.stopId,
    stopName: payload.stopName,
    stopOrder: Number(payload.stopOrder),
    stopType: payload.stopType,
    arrivalTime: payload.arrivalTime,
    latitude: payload.latitude,
    longitude: payload.longitude,
  });

  return normalizeRouteStop(unwrapData(response) || {});
}

async function getBookings({ routeId, userId } = {}) {
  const response = await api.get('/bus/bookings', {
    params: {
      ...(routeId ? { routeId } : {}),
      ...(userId ? { userId } : {}),
    },
  });

  return {
    data: toArray(unwrapData(response)).map(normalizeBooking),
  };
}

async function updateBookingStatus(bookingId, status) {
  const response = await api.patch(`/bus/bookings/${bookingId}/status`, { status });
  return normalizeBooking(unwrapData(response) || {});
}

async function getNearbyDrivers({ latitude, longitude, limit = DEFAULT_LIMIT } = {}) {
  const safeLimit = clampInteger(limit, DEFAULT_LIMIT, 1, MAX_NEARBY_DRIVER_LIMIT);

  const response = await api.get('/drivers/nearby', {
    params: {
      latitude,
      longitude,
      limit: safeLimit,
    },
  });

  return {
    data: toArray(unwrapData(response)).map(normalizeNearbyDriver),
  };
}

async function updateDriverStatus(driverId, status) {
  const response = await api.patch(`/admin/drivers/${driverId}/status`, { status });
  return unwrapData(response);
}

async function suspendDriver(driverId) {
  return updateDriverStatus(driverId, 'suspended');
}

async function approveDriver(driverId) {
  return updateDriverStatus(driverId, 'approved');
}

export default {
  login,
  getCurrentUser,
  getAnalyticsData,
  getHealthData,
  getOverviewData,
  getMonitoringData,
  getUsers,
  getRides,
  getRoutes,
  createRoute,
  addRouteStop,
  getBookings,
  updateBookingStatus,
  getNearbyDrivers,
  updateDriverStatus,
  suspendDriver,
  approveDriver,
};
