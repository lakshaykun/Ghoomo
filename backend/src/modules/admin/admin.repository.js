const { query } = require("../../config/db");
const { getCampusBoundaryPoints } = require("../campusBoundary/campusBoundary.repository");
const { isPointInPolygon } = require("../../common/utils/geofence");

const DEFAULT_DAYS = 7;
const MAX_DAYS = 30;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

async function getDailyCountSeries({ table, dateExpression, days, whereClause = "" }) {
  const result = await query(
    `
    WITH series AS (
      SELECT generate_series(
        CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day'),
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS day
    ),
    counts AS (
      SELECT ${dateExpression}::date AS day, COUNT(*)::int AS count
      FROM ${table}
      WHERE ${dateExpression} >= CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day')
      ${whereClause ? `AND ${whereClause}` : ""}
      GROUP BY 1
    )
    SELECT
      to_char(series.day, 'YYYY-MM-DD') AS date,
      to_char(series.day, 'Dy') AS label,
      COALESCE(counts.count, 0)::int AS count
    FROM series
    LEFT JOIN counts ON counts.day = series.day
    ORDER BY series.day
    `,
    [days]
  );

  return result.rows;
}

async function getGroupedCounts({ table, field, whereClause = "" }) {
  const result = await query(
    `
    SELECT ${field} AS label, COUNT(*)::int AS count
    FROM ${table}
    ${whereClause ? `WHERE ${whereClause}` : ""}
    GROUP BY ${field}
    ORDER BY count DESC, label ASC
    `
  );

  return result.rows;
}

async function getDashboardStats() {
  const result = await query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'rider') AS rider_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'driver') AS driver_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'bus_driver') AS bus_driver_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS admin_users,
      (SELECT COUNT(*)::int FROM drivers) AS total_drivers,
      (SELECT COUNT(*)::int FROM drivers WHERE status = 'approved') AS approved_drivers,
      (SELECT COUNT(*)::int FROM drivers WHERE status = 'pending') AS pending_drivers,
      (SELECT COUNT(*)::int FROM drivers WHERE status = 'suspended') AS suspended_drivers,
      (SELECT COUNT(*)::int FROM drivers WHERE status = 'rejected') AS rejected_drivers,
      (SELECT COUNT(*)::int FROM drivers WHERE status = 'approved' AND is_available = TRUE) AS available_drivers,
      (SELECT COUNT(*)::int FROM bus_drivers) AS total_bus_drivers,
      (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'approved') AS approved_bus_drivers,
      (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'pending') AS pending_bus_drivers,
      (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'suspended') AS suspended_bus_drivers,
      (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'rejected') AS rejected_bus_drivers,
      (SELECT COUNT(*)::int FROM ride_requests) AS total_ride_requests,
      (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'searching') AS searching_ride_requests,
      (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'matched') AS matched_ride_requests,
      (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'cancelled') AS cancelled_ride_requests,
      (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'expired') AS expired_ride_requests,
      (SELECT COUNT(*)::int FROM rides) AS total_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status = 'ACCEPTED') AS assigned_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status = 'ONGOING') AS arriving_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status IN ('OTP_VERIFIED','ON_TRIP')) AS started_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status IN ('COMPLETED','completed')) AS completed_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status IN ('CANCELLED','cancelled')) AS cancelled_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status IN ('ACCEPTED','ONGOING','OTP_VERIFIED','ON_TRIP')) AS active_rides,
      (SELECT COUNT(*)::int FROM bus_routes) AS total_bus_routes,
      (SELECT COUNT(*)::int FROM bus_bookings) AS total_bus_bookings,
      (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'pending') AS pending_bus_bookings,
      (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'verified') AS verified_bus_bookings,
      (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'cancelled') AS cancelled_bus_bookings,
      (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'missing') AS missing_bus_bookings,
      -- shared rides: rides with ride_type = 'shared' (new schema)
      (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared') AS total_shared_rides,
      (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status IN ('OPEN','SCHEDULED')) AS open_shared_rides,
      (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status = 'FULL') AS full_shared_rides,
      (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status IN ('COMPLETED','completed')) AS completed_shared_rides,
      (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status IN ('CANCELLED','cancelled')) AS cancelled_shared_rides,
      (SELECT COUNT(*)::int FROM rides WHERE is_scheduled = TRUE AND status IN ('SCHEDULED','OPEN')) AS scheduled_rides,
      (SELECT COUNT(*)::int FROM ride_request_candidates) AS total_candidate_offers,
      (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status IN ('pending', 'notified')) AS pending_candidate_offers,
      (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status = 'accepted') AS accepted_candidate_offers,
      (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status = 'rejected') AS rejected_candidate_offers,
      (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status = 'timeout') AS timed_out_candidate_offers,
      (SELECT COALESCE(SUM(fare), 0)::numeric(12,2) FROM rides WHERE status IN ('COMPLETED','completed')) AS total_revenue,
      (SELECT COALESCE(SUM(fare), 0)::numeric(12,2) FROM rides WHERE status IN ('COMPLETED','completed') AND COALESCE(updated_at, created_at) >= CURRENT_DATE) AS revenue_today,
      (SELECT COUNT(*)::int FROM rides WHERE status IN ('COMPLETED','completed') AND COALESCE(updated_at, created_at) >= CURRENT_DATE) AS completed_rides_today,
      (SELECT COUNT(*)::int FROM ride_requests WHERE created_at >= CURRENT_DATE) AS ride_requests_today,
      (SELECT COUNT(*)::int FROM users WHERE created_at >= CURRENT_DATE) AS new_users_today
    `
  );

  return result.rows[0];
}

async function getAnalytics({ days, limit }) {
  const windowDays = clampInteger(days, DEFAULT_DAYS, 1, MAX_DAYS);
  const recordLimit = clampInteger(limit, DEFAULT_LIMIT, 1, MAX_LIMIT);

  const [
    statsResult,
    userRolesResult,
    driverStatusesResult,
    rideStatusesResult,
    requestStatusesResult,
    bookingStatusesResult,
    sharedRideStatusesResult,
    candidateStatusesResult,
    userTrendResult,
    rideRequestTrendResult,
    rideTrendResult,
    bookingTrendResult,
    topDriversResult,
    topRoutesResult,
    recentUsersResult,
    recentRidesResult,
    recentRequestsResult,
    recentCandidatesResult,
    recentBookingsResult,
  ] = await Promise.all([
    query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'rider') AS rider_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'driver') AS driver_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'bus_driver') AS bus_driver_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS admin_users,
        (SELECT COUNT(*)::int FROM drivers) AS total_drivers,
        (SELECT COUNT(*)::int FROM drivers WHERE status = 'approved') AS approved_drivers,
        (SELECT COUNT(*)::int FROM drivers WHERE status = 'pending') AS pending_drivers,
        (SELECT COUNT(*)::int FROM drivers WHERE status = 'suspended') AS suspended_drivers,
        (SELECT COUNT(*)::int FROM drivers WHERE status = 'rejected') AS rejected_drivers,
        (SELECT COUNT(*)::int FROM drivers WHERE status = 'approved' AND is_available = TRUE) AS available_drivers,
        (SELECT COUNT(*)::int FROM bus_drivers) AS total_bus_drivers,
        (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'approved') AS approved_bus_drivers,
        (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'pending') AS pending_bus_drivers,
        (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'suspended') AS suspended_bus_drivers,
        (SELECT COUNT(*)::int FROM bus_drivers WHERE status = 'rejected') AS rejected_bus_drivers,
        (SELECT COUNT(*)::int FROM ride_requests) AS total_ride_requests,
        (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'searching') AS searching_ride_requests,
        (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'matched') AS matched_ride_requests,
        (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'cancelled') AS cancelled_ride_requests,
        (SELECT COUNT(*)::int FROM ride_requests WHERE status = 'expired') AS expired_ride_requests,
        (SELECT COUNT(*)::int FROM rides) AS total_rides,
        (SELECT COUNT(*)::int FROM rides WHERE status = 'ACCEPTED') AS assigned_rides,
        (SELECT COUNT(*)::int FROM rides WHERE status = 'ONGOING') AS arriving_rides,
        (SELECT COUNT(*)::int FROM rides WHERE status IN ('OTP_VERIFIED','ON_TRIP')) AS started_rides,
        (SELECT COUNT(*)::int FROM rides WHERE status IN ('COMPLETED','completed')) AS completed_rides,
        (SELECT COUNT(*)::int FROM rides WHERE status IN ('CANCELLED','cancelled')) AS cancelled_rides,
        (SELECT COUNT(*)::int FROM rides WHERE status IN ('ACCEPTED','ONGOING','OTP_VERIFIED','ON_TRIP')) AS active_rides,
        (SELECT COUNT(*)::int FROM bus_routes) AS total_bus_routes,
        (SELECT COUNT(*)::int FROM bus_bookings) AS total_bus_bookings,
        (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'pending') AS pending_bus_bookings,
        (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'verified') AS verified_bus_bookings,
        (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'cancelled') AS cancelled_bus_bookings,
        (SELECT COUNT(*)::int FROM bus_bookings WHERE status = 'missing') AS missing_bus_bookings,
        (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared') AS total_shared_rides,
        (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status IN ('OPEN','SCHEDULED')) AS open_shared_rides,
        (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status = 'FULL') AS full_shared_rides,
        (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status IN ('COMPLETED','completed')) AS completed_shared_rides,
        (SELECT COUNT(*)::int FROM rides WHERE ride_type = 'shared' AND status IN ('CANCELLED','cancelled')) AS cancelled_shared_rides,
        (SELECT COUNT(*)::int FROM rides WHERE is_scheduled = TRUE AND status IN ('SCHEDULED','OPEN')) AS scheduled_rides,
        (SELECT COUNT(*)::int FROM ride_request_candidates) AS total_candidate_offers,
        (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status IN ('pending', 'notified')) AS pending_candidate_offers,
        (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status = 'accepted') AS accepted_candidate_offers,
        (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status = 'rejected') AS rejected_candidate_offers,
        (SELECT COUNT(*)::int FROM ride_request_candidates WHERE status = 'timeout') AS timed_out_candidate_offers,
        (SELECT COALESCE(SUM(fare), 0)::numeric(12,2) FROM rides WHERE status IN ('COMPLETED','completed')) AS total_revenue,
        (SELECT COALESCE(SUM(fare), 0)::numeric(12,2) FROM rides WHERE status IN ('COMPLETED','completed') AND COALESCE(updated_at, created_at) >= CURRENT_DATE) AS revenue_today,
        (SELECT COUNT(*)::int FROM rides WHERE status IN ('COMPLETED','completed') AND COALESCE(updated_at, created_at) >= CURRENT_DATE) AS completed_rides_today,
        (SELECT COUNT(*)::int FROM ride_requests WHERE created_at >= CURRENT_DATE) AS ride_requests_today,
        (SELECT COUNT(*)::int FROM users WHERE created_at >= CURRENT_DATE) AS new_users_today
      `
    ),
    getGroupedCounts({ table: "users", field: "role" }),
    getGroupedCounts({ table: "drivers", field: "status" }),
    getGroupedCounts({ table: "rides", field: "status" }),
    getGroupedCounts({ table: "ride_requests", field: "status" }),
    getGroupedCounts({ table: "bus_bookings", field: "status" }),
    // shared rides distribution from the rides table (ride_type='shared')
    query(`SELECT status AS label, COUNT(*)::int AS count FROM rides WHERE ride_type = 'shared' GROUP BY status ORDER BY count DESC`),
    getGroupedCounts({ table: "ride_request_candidates", field: "status" }),
    getDailyCountSeries({ table: "users", dateExpression: "created_at", days: windowDays }),
    getDailyCountSeries({ table: "ride_requests", dateExpression: "created_at", days: windowDays }),
    getDailyCountSeries({ table: "rides", dateExpression: "created_at", days: windowDays }),
    getDailyCountSeries({ table: "bus_bookings", dateExpression: "created_at", days: windowDays }),
    query(
      `
      WITH completed_rides AS (
        SELECT
          driver_id,
          COUNT(*)::int AS completed_rides,
          COALESCE(SUM(fare), 0)::numeric(12,2) AS revenue,
          COALESCE(AVG(fare), 0)::numeric(10,2) AS avg_fare
        FROM rides
        WHERE status = 'completed'
        GROUP BY driver_id
      )
      SELECT
        d.id AS driver_id,
        u.id AS user_id,
        u.name,
        u.email,
        d.status,
        d.is_available,
        d.rating,
        COALESCE(completed_rides.completed_rides, 0)::int AS completed_rides,
        COALESCE(completed_rides.revenue, 0)::numeric(12,2) AS revenue,
        COALESCE(completed_rides.avg_fare, 0)::numeric(10,2) AS avg_fare
      FROM drivers d
      JOIN users u ON u.id = d.user_id
      LEFT JOIN completed_rides ON completed_rides.driver_id = d.id
      ORDER BY completed_rides DESC, revenue DESC, u.name ASC
      LIMIT $1
      `,
      [recordLimit]
    ),
    query(
      `
      WITH stop_counts AS (
        SELECT route_id, COUNT(*)::int AS stop_count
        FROM bus_route_stops
        GROUP BY route_id
      ),
      booking_counts AS (
        SELECT
          route_id,
          COUNT(*)::int AS bookings,
          COUNT(*) FILTER (WHERE status = 'verified')::int AS verified_bookings,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_bookings,
          COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_bookings
        FROM bus_bookings
        GROUP BY route_id
      )
      SELECT
        br.id AS route_id,
        br.name,
        br.departure_time,
        br.arrival_time,
        COALESCE(stop_counts.stop_count, 0)::int AS stop_count,
        COALESCE(booking_counts.bookings, 0)::int AS bookings,
        COALESCE(booking_counts.verified_bookings, 0)::int AS verified_bookings,
        COALESCE(booking_counts.pending_bookings, 0)::int AS pending_bookings,
        COALESCE(booking_counts.cancelled_bookings, 0)::int AS cancelled_bookings
      FROM bus_routes br
      LEFT JOIN stop_counts ON stop_counts.route_id = br.id
      LEFT JOIN booking_counts ON booking_counts.route_id = br.id
      ORDER BY bookings DESC, br.created_at DESC
      LIMIT $1
      `,
      [recordLimit]
    ),
    query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [recordLimit]
    ),
    query(
      `
      SELECT
        r.id,
        r.request_id,
        r.student_id,
        student.name AS student_name,
        r.driver_id,
        driver_user.name AS driver_name,
        r.pickup_location,
        r.drop_location,
        r.status,
        r.fare,
        r.distance,
        r.ride_type,
        r.is_scheduled,
        r.created_at,
        r.updated_at
      FROM rides r
      LEFT JOIN users student ON student.id = r.student_id
      LEFT JOIN drivers driver_profile ON driver_profile.id = r.driver_id
      LEFT JOIN users driver_user ON driver_user.id = driver_profile.user_id
      ORDER BY r.created_at DESC
      LIMIT $1
      `,
      [recordLimit]
    ),
    query(
      `
      SELECT
        rr.id,
        rr.student_id,
        student.name AS student_name,
        rr.pickup_location,
        rr.drop_location,
        rr.status,
        rr.ride_type,
        rr.is_scheduled,
        rr.expires_at,
        rr.created_at,
        rr.updated_at,
        COALESCE(candidate_counts.candidate_count, 0)::int AS candidate_count
      FROM ride_requests rr
      LEFT JOIN users student ON student.id = rr.student_id
      LEFT JOIN (
        SELECT request_id, COUNT(*)::int AS candidate_count
        FROM ride_request_candidates
        GROUP BY request_id
      ) candidate_counts ON candidate_counts.request_id = rr.id
      ORDER BY rr.created_at DESC
      LIMIT $1
      `,
      [recordLimit]
    ),
    query(
      `
      SELECT
        c.id,
        c.request_id,
        rr.status AS request_status,
        c.driver_id,
        driver_user.name AS driver_name,
        c.status,
        c.distance_km,
        c.offered_at,
        c.responded_at
      FROM ride_request_candidates c
      JOIN ride_requests rr ON rr.id = c.request_id
      LEFT JOIN drivers driver_profile ON driver_profile.id = c.driver_id
      LEFT JOIN users driver_user ON driver_user.id = driver_profile.user_id
      ORDER BY c.offered_at DESC
      LIMIT $1
      `,
      [recordLimit]
    ),
    query(
      `
      SELECT
        b.id,
        b.route_id,
        br.name AS route_name,
        b.user_id,
        user_row.name AS user_name,
        b.status,
        b.seat_number,
        b.verified_by,
        verifier.name AS verified_by_name,
        b.created_at,
        b.updated_at
      FROM bus_bookings b
      LEFT JOIN bus_routes br ON br.id = b.route_id
      LEFT JOIN users user_row ON user_row.id = b.user_id
      LEFT JOIN users verifier ON verifier.id = b.verified_by
      ORDER BY b.created_at DESC
      LIMIT $1
      `,
      [recordLimit]
    ),
  ]);

  const stats = statsResult.rows[0] || {};

  return {
    generated_at: new Date().toISOString(),
    window_days: windowDays,
    stats,
    live: {
      pending_ride_requests: stats.searching_ride_requests || 0,
      matched_ride_requests: stats.matched_ride_requests || 0,
      active_rides: stats.active_rides || 0,
      available_drivers: stats.available_drivers || 0,
      pending_candidate_offers: stats.pending_candidate_offers || 0,
      open_shared_rides: stats.open_shared_rides || 0,
      scheduled_rides: stats.scheduled_rides || 0,
      completed_rides_today: stats.completed_rides_today || 0,
      ride_requests_today: stats.ride_requests_today || 0,
      new_users_today: stats.new_users_today || 0,
      revenue_today: stats.revenue_today || 0,
    },
    distributions: {
      roles: userRolesResult.rows,
      drivers: driverStatusesResult.rows,
      rides: rideStatusesResult.rows,
      ride_requests: requestStatusesResult.rows,
      bus_bookings: bookingStatusesResult.rows,
      shared_rides: (sharedRideStatusesResult?.rows || []),
      candidate_offers: candidateStatusesResult.rows,
    },
    trends: {
      users: userTrendResult.rows,
      ride_requests: rideRequestTrendResult.rows,
      rides: rideTrendResult.rows,
      bus_bookings: bookingTrendResult.rows,
    },
    top_drivers: topDriversResult.rows,
    top_routes: topRoutesResult.rows,
    recent: {
      users: recentUsersResult.rows,
      rides: recentRidesResult.rows,
      requests: recentRequestsResult.rows,
      candidates: recentCandidatesResult.rows,
      bookings: recentBookingsResult.rows,
    },
  };
}


async function getHealthSnapshot() {
  await query("SELECT 1 AS ok");

  return {
    status: "healthy",
    database: {
      status: "connected",
      checked_at: new Date().toISOString(),
    },
    environment: process.env.NODE_ENV || "development",
    node_version: process.version,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

async function listUsers({ limit, offset, role }) {
  const result = await query(
    `
    SELECT id, name, email, phone, role, created_at, updated_at
    FROM users
    WHERE ($1::text IS NULL OR role = $1)
    ORDER BY created_at DESC
    LIMIT $2
    OFFSET $3
    `,
    [role || null, limit, offset]
  );

  return result.rows;
}

async function listRides({ limit, offset, status }) {
  const result = await query(
    `
    SELECT
      r.id,
      r.request_id,
      r.student_id,
      student.name AS student_name,
      r.driver_id,
      driver_user.name AS driver_name,
      r.pickup_location,
      r.drop_location,
      r.status,
      r.fare,
      r.distance,
      r.ride_type,
      r.is_scheduled,
      r.scheduled_at,
      COALESCE(
        (SELECT SUM(passengers_count) FROM ride_participants rp WHERE rp.ride_id = r.id AND rp.status != 'cancelled'),
        0
      )::int AS total_passengers,
      r.created_at,
      r.updated_at
    FROM rides r
    LEFT JOIN users student ON student.id = r.student_id
    LEFT JOIN drivers driver_profile ON driver_profile.id = r.driver_id
    LEFT JOIN users driver_user ON driver_user.id = driver_profile.user_id
    WHERE ($1::text IS NULL OR LOWER(r.status) = LOWER($1))
    ORDER BY r.created_at DESC
    LIMIT $2
    OFFSET $3
    `,
    [status || null, limit, offset]
  );

  return result.rows;
}

async function updateDriverStatusByDriverId(driverId, status) {
  const result = await query(
    `
    UPDATE drivers
    SET status = $1, updated_at = NOW(), is_available = CASE WHEN $1 = 'approved' THEN is_available ELSE FALSE END
    WHERE id = $2
    RETURNING *
    `,
    [status, driverId]
  );

  return result.rows[0] || null;
}

async function updateDriverStatusByUserId(userId, status) {
  const result = await query(
    `
    UPDATE drivers
    SET status = $1, updated_at = NOW(), is_available = CASE WHEN $1 = 'approved' THEN is_available ELSE FALSE END
    WHERE user_id = $2
    RETURNING *
    `,
    [status, userId]
  );

  return result.rows[0] || null;
}

async function getLiveDrivers() {
  const boundaryPoints = await getCampusBoundaryPoints();
  const campusPolygon = boundaryPoints.map((point) => ({ lat: point.latitude, lng: point.longitude }));

  const result = await query(
    `
    SELECT
      d.id,
      u.name,
      loc.current_latitude,
      loc.current_longitude,
      loc.is_inside_campus,
      loc.updated_at AS location_updated_at,
      d.is_available,
      d.status
    FROM drivers d
    JOIN users u ON u.id = d.user_id
    LEFT JOIN driver_locations loc ON loc.driver_id = d.id
    ORDER BY u.name ASC
    `
  );

  return result.rows.map((row) => {
    const latitude = row.current_latitude === null || row.current_latitude === undefined ? null : Number(row.current_latitude);
    const longitude = row.current_longitude === null || row.current_longitude === undefined ? null : Number(row.current_longitude);
    const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

    return {
      id: row.id,
      name: row.name || "Driver",
      lat: hasLocation ? latitude : null,
      lng: hasLocation ? longitude : null,
      isInsideCampus: hasLocation ? isPointInPolygon({ lat: latitude, lng: longitude }, campusPolygon) : false,
      hasLocation,
      isAvailable: Boolean(row.is_available),
      status: row.status || "pending",
      locationUpdatedAt: row.location_updated_at || null,
    };
  });
}

module.exports = {
  getDashboardStats,
  getAnalytics,
  getHealthSnapshot,
  listUsers,
  listRides,
  updateDriverStatusByDriverId,
  updateDriverStatusByUserId,
  getLiveDrivers,
};
