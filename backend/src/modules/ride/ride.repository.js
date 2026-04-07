const { query, withTransaction } = require("../../config/db");
const { AppError } = require("../../common/utils/helpers");

async function createRideRequest({
  studentId,
  pickupLocation,
  dropLocation,
  pickupLatitude,
  pickupLongitude,
  dropLatitude,
  dropLongitude,
  isShared,
  expiresAt,
}) {
  const result = await query(
    `
    INSERT INTO ride_requests (
      student_id,
      pickup_location,
      drop_location,
      pickup_latitude,
      pickup_longitude,
      drop_latitude,
      drop_longitude,
      is_shared,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      studentId,
      pickupLocation,
      dropLocation,
      pickupLatitude,
      pickupLongitude,
      dropLatitude,
      dropLongitude,
      isShared,
      expiresAt || null,
    ]
  );

  return result.rows[0];
}

async function getRideRequestById(requestId) {
  const result = await query(
    `
    SELECT *
    FROM ride_requests
    WHERE id = $1
    LIMIT 1
    `,
    [requestId]
  );

  return result.rows[0] || null;
}

async function cancelRideRequest(requestId, studentId) {
  const result = await query(
    `
    UPDATE ride_requests
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1 AND student_id = $2
    RETURNING *
    `,
    [requestId, studentId]
  );

  return result.rows[0] || null;
}

async function createRideFromRequest({ requestId, driverId, fare, distance }) {
  return withTransaction(async (client) => {
    const requestResult = await client.query(
      `
      SELECT *
      FROM ride_requests
      WHERE id = $1
      FOR UPDATE
      `,
      [requestId]
    );

    const request = requestResult.rows[0];
    if (!request) {
      throw new AppError("Ride request not found", 404, "RIDE_REQUEST_NOT_FOUND");
    }

    if (["cancelled", "expired"].includes(request.status)) {
      throw new AppError("Ride request is no longer active", 400, "RIDE_REQUEST_NOT_ACTIVE");
    }

    const rideInsertResult = await client.query(
      `
      INSERT INTO rides (
        request_id,
        student_id,
        driver_id,
        pickup_location,
        drop_location,
        pickup_latitude,
        pickup_longitude,
        drop_latitude,
        drop_longitude,
        fare,
        distance,
        is_shared,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        'assigned'
      )
      RETURNING *
      `,
      [
        request.id,
        request.student_id,
        driverId,
        request.pickup_location,
        request.drop_location,
        request.pickup_latitude,
        request.pickup_longitude,
        request.drop_latitude,
        request.drop_longitude,
        fare || null,
        distance || null,
        request.is_shared,
      ]
    );

    await client.query(
      `
      UPDATE ride_requests
      SET status = 'matched', locked = TRUE, updated_at = NOW()
      WHERE id = $1
      `,
      [request.id]
    );

    await client.query(
      `
      UPDATE drivers
      SET is_available = FALSE, updated_at = NOW()
      WHERE id = $1
      `,
      [driverId]
    );

    return rideInsertResult.rows[0];
  });
}

async function getRideById(rideId) {
  const result = await query(
    `
    SELECT r.*, u.name AS student_name, d.user_id AS driver_user_id
    FROM rides r
    INNER JOIN users u ON u.id = r.student_id
    INNER JOIN drivers d ON d.id = r.driver_id
    WHERE r.id = $1
    LIMIT 1
    `,
    [rideId]
  );

  return result.rows[0] || null;
}

async function updateRideStatus(rideId, status) {
  const result = await query(
    `
    UPDATE rides
    SET
      status = $1,
      start_time = CASE
        WHEN $1 = 'started' AND start_time IS NULL THEN NOW()
        ELSE start_time
      END,
      end_time = CASE
        WHEN $1 IN ('completed', 'cancelled') THEN NOW()
        ELSE end_time
      END,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, rideId]
  );

  return result.rows[0] || null;
}

async function listRideHistoryForUser(userId) {
  const result = await query(
    `
    SELECT *
    FROM rides
    WHERE student_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

async function createOrUpdateDriverRating({ rideId, studentId, driverId, rating, reviewText }) {
  const result = await query(
    `
    INSERT INTO driver_ratings (ride_id, student_id, driver_id, rating, review_text)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (ride_id)
    DO UPDATE SET
      rating = EXCLUDED.rating,
      review_text = EXCLUDED.review_text
    RETURNING *
    `,
    [rideId, studentId, driverId, rating, reviewText || null]
  );

  return result.rows[0];
}

async function refreshDriverRating(driverId) {
  const result = await query(
    `
    UPDATE drivers d
    SET rating = aggregate.avg_rating, updated_at = NOW()
    FROM (
      SELECT driver_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating
      FROM driver_ratings
      WHERE driver_id = $1
      GROUP BY driver_id
    ) aggregate
    WHERE d.id = aggregate.driver_id
    RETURNING d.*
    `,
    [driverId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createRideRequest,
  getRideRequestById,
  cancelRideRequest,
  createRideFromRequest,
  getRideById,
  updateRideStatus,
  listRideHistoryForUser,
  createOrUpdateDriverRating,
  refreshDriverRating,
};
