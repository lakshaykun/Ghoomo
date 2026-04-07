const { query } = require("../../config/db");

async function createSharedRide({ baseRideId, maxParticipants }) {
  const result = await query(
    `
    INSERT INTO shared_rides (base_ride_id, status, max_participants)
    VALUES ($1, 'open', $2)
    RETURNING *
    `,
    [baseRideId, maxParticipants || 2]
  );

  return result.rows[0];
}

async function listSharedRides(status = "open") {
  const result = await query(
    `
    SELECT *
    FROM shared_rides
    WHERE status = COALESCE($1, status)
    ORDER BY created_at DESC
    `,
    [status]
  );

  return result.rows;
}

async function getSharedRideById(sharedRideId) {
  const result = await query(
    `
    SELECT *
    FROM shared_rides
    WHERE id = $1
    LIMIT 1
    `,
    [sharedRideId]
  );

  return result.rows[0] || null;
}

async function listParticipants(sharedRideId) {
  const result = await query(
    `
    SELECT *
    FROM shared_ride_participants
    WHERE shared_ride_id = $1
    ORDER BY id ASC
    `,
    [sharedRideId]
  );

  return result.rows;
}

async function addParticipant({
  sharedRideId,
  userId,
  pickupLocation,
  dropLocation,
  pickupLatitude,
  pickupLongitude,
  dropLatitude,
  dropLongitude,
  status,
}) {
  const result = await query(
    `
    INSERT INTO shared_ride_participants (
      shared_ride_id,
      user_id,
      pickup_location,
      drop_location,
      pickup_latitude,
      pickup_longitude,
      drop_latitude,
      drop_longitude,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      sharedRideId,
      userId,
      pickupLocation,
      dropLocation,
      pickupLatitude || null,
      pickupLongitude || null,
      dropLatitude || null,
      dropLongitude || null,
      status || "joined",
    ]
  );

  return result.rows[0];
}

async function countParticipants(sharedRideId) {
  const result = await query(
    `
    SELECT COUNT(*)::int AS count
    FROM shared_ride_participants
    WHERE shared_ride_id = $1 AND status != 'cancelled'
    `,
    [sharedRideId]
  );

  return result.rows[0].count;
}

async function updateSharedRideStatus(sharedRideId, status) {
  const result = await query(
    `
    UPDATE shared_rides
    SET status = $1
    WHERE id = $2
    RETURNING *
    `,
    [status, sharedRideId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createSharedRide,
  listSharedRides,
  getSharedRideById,
  listParticipants,
  addParticipant,
  countParticipants,
  updateSharedRideStatus,
};
