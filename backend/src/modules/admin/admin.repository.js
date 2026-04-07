const { query } = require("../../config/db");

async function getDashboardStats() {
  const result = await query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM drivers) AS total_drivers,
      (SELECT COUNT(*)::int FROM bus_drivers) AS total_bus_drivers,
      (SELECT COUNT(*)::int FROM ride_requests) AS total_ride_requests,
      (SELECT COUNT(*)::int FROM rides) AS total_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status = 'completed') AS completed_rides,
      (SELECT COUNT(*)::int FROM rides WHERE status IN ('assigned', 'arriving', 'started')) AS active_rides,
      (SELECT COUNT(*)::int FROM bus_routes) AS total_bus_routes,
      (SELECT COUNT(*)::int FROM bus_bookings) AS total_bus_bookings,
      (SELECT COALESCE(SUM(fare), 0)::numeric(12,2) FROM rides WHERE status = 'completed') AS total_revenue
    `
  );

  return result.rows[0];
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
    SELECT id, request_id, student_id, driver_id, status, fare, distance, created_at, updated_at
    FROM rides
    WHERE ($1::text IS NULL OR status = $1)
    ORDER BY created_at DESC
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

module.exports = {
  getDashboardStats,
  listUsers,
  listRides,
  updateDriverStatusByDriverId,
  updateDriverStatusByUserId,
};
