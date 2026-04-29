const NUMBER_FORMATTER = new Intl.NumberFormat('en-IN');
const MONEY_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatNumber(value) {
  const parsed = Number(value || 0);
  return NUMBER_FORMATTER.format(Number.isFinite(parsed) ? parsed : 0);
}

export function formatMoney(value) {
  const parsed = Number(value || 0);
  return `₹${MONEY_FORMATTER.format(Number.isFinite(parsed) ? parsed : 0)}`;
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return DATE_TIME_FORMATTER.format(date);
}

export function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return `${totalSeconds}s`;
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return 'No live location';
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function getDriverStatusInfo(driver = {}) {
  const status = String(driver.status || '').toLowerCase();
  const isAvailable = Boolean(driver.isAvailable);

  if (status === 'approved' && isAvailable) {
    return { label: 'Active', tone: 'success' };
  }

  if (status === 'approved') {
    return { label: 'Idle', tone: 'info' };
  }

  if (status === 'pending') {
    return { label: 'Pending', tone: 'warning' };
  }

  if (status === 'suspended' || status === 'rejected') {
    return { label: 'Offline', tone: 'danger' };
  }

  return { label: status || 'Unknown', tone: 'neutral' };
}

export function getRideStatusInfo(status = '') {
  const normalized = String(status || '').toUpperCase().trim();

  // Active / in-progress statuses
  if (['ACCEPTED', 'ASSIGNED'].includes(normalized)) {
    return { label: 'Accepted', tone: 'info' };
  }
  if (['ONGOING', 'ARRIVING', 'DRIVER_ARRIVED'].includes(normalized)) {
    return { label: 'Ongoing', tone: 'info' };
  }
  if (['OTP_VERIFIED'].includes(normalized)) {
    return { label: 'OTP Verified', tone: 'info' };
  }
  if (['ON_TRIP', 'STARTED'].includes(normalized)) {
    return { label: 'On Trip', tone: 'info' };
  }

  // Terminal statuses
  if (normalized === 'COMPLETED') {
    return { label: 'Completed', tone: 'success' };
  }
  if (normalized === 'CANCELLED') {
    return { label: 'Cancelled', tone: 'danger' };
  }
  if (normalized === 'EXPIRED') {
    return { label: 'Expired', tone: 'danger' };
  }

  // Shared / scheduled specific
  if (normalized === 'OPEN') {
    return { label: 'Open', tone: 'success' };
  }
  if (normalized === 'SCHEDULED') {
    return { label: 'Scheduled', tone: 'warning' };
  }
  if (normalized === 'FULL') {
    return { label: 'Full', tone: 'info' };
  }

  // Pre-assignment
  if (['SEARCHING', 'PENDING'].includes(normalized)) {
    return { label: 'Searching', tone: 'warning' };
  }
  if (normalized === 'MATCHED') {
    return { label: 'Matched', tone: 'info' };
  }

  return { label: normalized || 'Unknown', tone: 'neutral' };
}


export function buildOperationalAlerts({ stats = {}, health = {} } = {}) {
  const alerts = [];
  const availableDrivers = Number(stats.availableDrivers || 0);
  const activeRides = Number(stats.activeRides || 0);
  const pendingRequests = Number(stats.searchingRideRequests || 0);

  if (health.status && health.status !== 'healthy') {
    alerts.push({
      tone: 'danger',
      title: 'Backend health warning',
      message: `Database is ${health.database?.status || 'unknown'} and environment is ${health.environment || 'unknown'}.`,
    });
  }

  if (availableDrivers === 0) {
    alerts.push({
      tone: 'danger',
      title: 'No active drivers',
      message: 'All approved drivers are currently offline or unavailable.',
    });
  } else if (availableDrivers <= 2) {
    alerts.push({
      tone: 'warning',
      title: 'Low driver coverage',
      message: `Only ${availableDrivers} driver${availableDrivers === 1 ? '' : 's'} are available right now.`,
    });
  }

  if (pendingRequests > 0) {
    alerts.push({
      tone: 'warning',
      title: 'Ride queue waiting',
      message: `${pendingRequests} ride request${pendingRequests === 1 ? '' : 's'} are still waiting for assignment.`,
    });
  }

  if (activeRides > availableDrivers && availableDrivers > 0) {
    alerts.push({
      tone: 'info',
      title: 'High load cycle',
      message: 'Active rides are now higher than the current live driver pool.',
    });
  }

  return alerts;
}
