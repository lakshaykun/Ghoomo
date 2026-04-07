import api from './api';

const DEFAULT_LIMIT = 20;

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
    driverId: row.driver_id ?? row.driverId ?? null,
    status: row.status ?? 'pending',
    fare: toNullableNumber(row.fare),
    distance: toNullableNumber(row.distance),
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
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
    totalDrivers: toNumber(row.total_drivers),
    totalBusDrivers: toNumber(row.total_bus_drivers),
    totalRideRequests: toNumber(row.total_ride_requests),
    totalRides: toNumber(row.total_rides),
    completedRides: toNumber(row.completed_rides),
    activeRides: toNumber(row.active_rides),
    totalBusRoutes: toNumber(row.total_bus_routes),
    totalBusBookings: toNumber(row.total_bus_bookings),
    totalRevenue: toNumber(row.total_revenue),
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

async function getOverviewData() {
  const [statsResponse, usersResponse, ridesResponse, routesResponse] = await Promise.all([
    api.get('/admin/dashboard'),
    api.get('/admin/users', { params: { page: 1, limit: 5 } }),
    api.get('/admin/rides', { params: { page: 1, limit: 5 } }),
    api.get('/bus/routes'),
  ]);

  return {
    stats: normalizeStats(unwrapData(statsResponse) || {}),
    recentUsers: toArray(unwrapData(usersResponse)).map(normalizeUser),
    recentRides: toArray(unwrapData(ridesResponse)).map(normalizeRide),
    routes: toArray(unwrapData(routesResponse)).map(normalizeRoute),
  };
}

async function getUsers({ page = 1, limit = DEFAULT_LIMIT, role = '' } = {}) {
  const response = await api.get('/admin/users', {
    params: {
      page,
      limit,
      ...(role ? { role } : {}),
    },
  });

  return {
    data: toArray(unwrapData(response)).map(normalizeUser),
    pagination: response.data?.pagination ?? { page, limit },
  };
}

async function getRides({ page = 1, limit = DEFAULT_LIMIT, status = '' } = {}) {
  const response = await api.get('/admin/rides', {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  });

  return {
    data: toArray(unwrapData(response)).map(normalizeRide),
    pagination: response.data?.pagination ?? { page, limit },
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
  const response = await api.get('/drivers/nearby', {
    params: {
      latitude,
      longitude,
      limit,
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
  getOverviewData,
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
