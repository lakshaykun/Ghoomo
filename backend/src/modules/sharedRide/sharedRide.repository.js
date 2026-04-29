/**
 * sharedRide.repository.js
 *
 * The old `shared_rides` / `shared_ride_participants` tables are GONE.
 * Shared rides are now represented as rides with ride_type = 'shared' and
 * their participants live in ride_participants.
 *
 * This module is a thin adapter that keeps the existing sharedRide.service.js
 * interface intact while reading/writing from the new schema.
 */
const { query, withTransaction } = require("../../config/db");

/**
 * List rides with ride_type='shared' filtered by an optional status.
 * Status values are the new uppercase enum: OPEN, FULL, SCHEDULED, COMPLETED, CANCELLED …
 * The legacy callers pass lowercase strings like "open" / "full" — we normalise.
 */
async function listSharedRides(status) {
  const upper = status ? String(status).toUpperCase() : null;
  const allowedStatuses = ["OPEN", "FULL", "SCHEDULED", "ACCEPTED", "COMPLETED", "CANCELLED", "EXPIRED"];

  let whereClause = "r.ride_type = 'shared'";
  const params = [];

  if (upper && allowedStatuses.includes(upper)) {
    whereClause += " AND r.status = $1";
    params.push(upper);
  } else {
    // Default: only show open/scheduled rides
    whereClause += " AND r.status IN ('OPEN', 'SCHEDULED')";
  }

  const result = await query(
    `
    SELECT
      r.*,
      u.name  AS creator_name,
      (
        SELECT SUM(passengers_count)
        FROM ride_participants rp
        WHERE rp.ride_id = r.id AND rp.status != 'cancelled'
      ) AS total_passengers
    FROM rides r
    JOIN users u ON u.id = r.student_id
    WHERE ${whereClause}
    ORDER BY r.created_at DESC
    `,
    params
  );

  return result.rows;
}

/**
 * Get a single shared ride by its ride id, including participants.
 */
async function getSharedRideById(rideId) {
  const result = await query(
    `
    SELECT
      r.*,
      u.name AS creator_name,
      (
        SELECT SUM(passengers_count)
        FROM ride_participants rp
        WHERE rp.ride_id = r.id AND rp.status != 'cancelled'
      ) AS total_passengers
    FROM rides r
    JOIN users u ON u.id = r.student_id
    WHERE r.id = $1
    LIMIT 1
    `,
    [rideId]
  );

  return result.rows[0] || null;
}

/**
 * Get participants of a shared ride.
 */
async function listParticipants(rideId) {
  const result = await query(
    `
    SELECT
      rp.*,
      u.name  AS user_name,
      u.phone AS user_phone
    FROM ride_participants rp
    JOIN users u ON u.id = rp.user_id
    WHERE rp.ride_id = $1 AND rp.status != 'cancelled'
    ORDER BY rp.created_at ASC
    `,
    [rideId]
  );

  return result.rows;
}

/**
 * Count non-cancelled participants of a shared ride.
 */
async function countParticipants(rideId) {
  const result = await query(
    `
    SELECT COUNT(*)::int AS count
    FROM ride_participants
    WHERE ride_id = $1 AND status != 'cancelled'
    `,
    [rideId]
  );

  return result.rows[0].count;
}

/**
 * Update the status of a shared ride (operates on the rides table).
 */
async function updateSharedRideStatus(rideId, status) {
  const upper = String(status || "").toUpperCase();
  const result = await query(
    `
    UPDATE rides
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [upper, rideId]
  );

  return result.rows[0] || null;
}

module.exports = {
  listSharedRides,
  getSharedRideById,
  listParticipants,
  countParticipants,
  updateSharedRideStatus,
};
