import dashboardAPI from './dashboardAPI';

const DEFAULT_CENTER = {
  latitude: 30.900965,
  longitude: 75.857277,
  nearbyLimit: 8,
};

function buildDriverKey(row = {}) {
  return String(row.userId || row.driverId || row.id || '');
}

export async function listDrivers({ page = 1, limit = 500, days = 14, latitude = DEFAULT_CENTER.latitude, longitude = DEFAULT_CENTER.longitude, nearbyLimit = DEFAULT_CENTER.nearbyLimit } = {}) {
  const [usersResponse, monitoringResponse, nearbyResponse] = await Promise.all([
    dashboardAPI.getUsers({ page, limit, role: 'driver' }),
    dashboardAPI.getMonitoringData({ days, limit }),
    dashboardAPI.getNearbyDrivers({ latitude, longitude, limit: nearbyLimit }),
  ]);

  const analyticsMap = new Map((monitoringResponse.topDrivers || []).map((row) => [buildDriverKey(row), row]));
  const nearbyMap = new Map((nearbyResponse.data || []).map((row) => [buildDriverKey(row), row]));

  const drivers = (usersResponse.data || [])
    .map((user) => {
      const analyticsRow = analyticsMap.get(String(user.id)) || {};
      const nearbyRow = nearbyMap.get(String(user.id)) || {};

      return {
        id: analyticsRow.driverId || user.id,
        userId: user.id,
        name: user.name || analyticsRow.name || '',
        email: user.email || analyticsRow.email || '',
        phone: user.phone || '',
        status: analyticsRow.status || 'pending',
        isAvailable: analyticsRow.isAvailable ?? false,
        rating: analyticsRow.rating ?? null,
        completedRides: analyticsRow.completedRides ?? 0,
        revenue: analyticsRow.revenue ?? 0,
        avgFare: analyticsRow.avgFare ?? null,
        currentLatitude: nearbyRow.currentLatitude ?? null,
        currentLongitude: nearbyRow.currentLongitude ?? null,
        distanceKm: nearbyRow.distanceKm ?? null,
      };
    })
    .sort((left, right) => {
      const leftPriority = left.status === 'approved' ? (left.isAvailable ? 0 : 1) : 2;
      const rightPriority = right.status === 'approved' ? (right.isAvailable ? 0 : 1) : 2;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return String(left.name).localeCompare(String(right.name));
    });

  return {
    drivers,
    summary: monitoringResponse.stats || {},
    health: monitoringResponse.health || {},
    nearbyDrivers: nearbyResponse.data || [],
    pagination: usersResponse.pagination || { page, limit },
  };
}

export async function updateDriverStatus(driverId, status) {
  return dashboardAPI.updateDriverStatus(driverId, status);
}

export async function getNearbyDriverSnapshot({ latitude = DEFAULT_CENTER.latitude, longitude = DEFAULT_CENTER.longitude, limit = DEFAULT_CENTER.nearbyLimit } = {}) {
  const response = await dashboardAPI.getNearbyDrivers({ latitude, longitude, limit });
  return response.data || [];
}
