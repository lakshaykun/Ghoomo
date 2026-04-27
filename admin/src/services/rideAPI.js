import dashboardAPI from './dashboardAPI';

const ACTIVE_STATUSES = ['assigned', 'arriving', 'started'];

export async function listRides({ page = 1, limit = 300, status = '' } = {}) {
  return dashboardAPI.getRides({ page, limit, status });
}

export async function listActiveRides({ limit = 300 } = {}) {
  const responses = await Promise.all(
    ACTIVE_STATUSES.map((rideStatus) => dashboardAPI.getRides({ page: 1, limit, status: rideStatus }))
  );

  const seen = new Set();
  const rides = responses
    .flatMap((response) => response.data || [])
    .filter((ride) => {
      if (seen.has(ride.id)) {
        return false;
      }

      seen.add(ride.id);
      return true;
    })
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

  return { data: rides };
}
