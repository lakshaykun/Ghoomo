const activeRideByDriverId = new Map();
const completedRidesByDriverId = new Map();
const rideIdByRequestId = new Map();

export function setDriverActiveRide(driverId, ride) {
  if (!driverId || !ride?.id) return;
  activeRideByDriverId.set(driverId, ride);

  if (ride.requestId) {
    rideIdByRequestId.set(ride.requestId, ride.id);
  }
}

export function clearDriverActiveRide(driverId) {
  if (!driverId) return;
  activeRideByDriverId.delete(driverId);
}

export function addDriverCompletedRide(driverId, ride) {
  if (!driverId || !ride?.id) return;

  const existing = completedRidesByDriverId.get(driverId) || [];
  const next = [ride, ...existing.filter((item) => item.id !== ride.id)].slice(0, 50);
  completedRidesByDriverId.set(driverId, next);

  if (ride.requestId) {
    rideIdByRequestId.set(ride.requestId, ride.id);
  }
}

export function getRideIdForRequestId(requestId) {
  if (!requestId) return null;
  return rideIdByRequestId.get(requestId) || null;
}

export function getDriverRuntimeSnapshot(driverId) {
  return {
    activeRide: activeRideByDriverId.get(driverId) || null,
    completedRides: completedRidesByDriverId.get(driverId) || [],
  };
}
