const { query, withTransaction } = require("../../config/db");
const { AppError } = require("../../common/utils/helpers");

const RIDE_DETAIL_SELECT = `
  SELECT
    r.*,
    student.name AS student_name,
    driver_user.id AS driver_user_id,
    driver_user.name AS driver_name,
    driver_user.phone AS driver_phone,
    d.rating AS driver_rating,
    d.status AS driver_status,
    d.is_available AS driver_is_available,
    r.otp AS ride_otp,
    loc.current_latitude AS driver_latitude,
    loc.current_longitude AS driver_longitude,
    vehicle.vehicle_number AS driver_vehicle_number,
    vehicle.vehicle_type AS driver_vehicle_type,
    r.vehicle_type
  `;

const RIDE_DETAIL_FROM = `
  FROM rides r
  INNER JOIN users student ON student.id = r.student_id
  INNER JOIN drivers d ON d.id = r.driver_id
  INNER JOIN users driver_user ON driver_user.id = d.user_id
  LEFT JOIN driver_locations loc ON loc.driver_id = d.id
  LEFT JOIN LATERAL (
    SELECT v.vehicle_number, v.vehicle_type
    FROM driver_vehicles dv
    INNER JOIN vehicles v ON v.id = dv.vehicle_id
    WHERE dv.driver_id = d.id AND dv.is_active = TRUE
    ORDER BY v.created_at DESC
    LIMIT 1
  ) vehicle ON TRUE
`;

async function createRideRequest({
  studentId,
  pickupLocation,
  dropLocation,
  pickupLatitude,
  pickupLongitude,
  dropLatitude,
  dropLongitude,
  isShared,
  vehicleType,
  estimatedFare,
  estimatedDistanceKm,
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
      vehicle_type,
      estimated_fare,
      estimated_distance_km,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      vehicleType || 'auto',
      estimatedFare ?? null,
      estimatedDistanceKm ?? null,
      expiresAt || null,
    ]
  );

  return result.rows[0];
}

async function createRideCandidates(requestId, driverUserIds) {
  if (!driverUserIds || driverUserIds.length === 0) return [];

  // 1. Get driver_ids for these user_ids
  const driverResult = await query(
    `SELECT id FROM drivers WHERE user_id = ANY($1)`,
    [driverUserIds]
  );
  const driverIds = driverResult.rows.map(r => r.id);

  if (driverIds.length === 0) return [];

  // 2. Insert into ride_request_candidates
  const values = [];
  const params = [requestId];
  
  driverIds.forEach((dId, i) => {
    values.push(`($1, $${i + 2}, 'notified', NOW())`);
    params.push(dId);
  });

  const result = await query(
    `
    INSERT INTO ride_request_candidates (request_id, driver_id, status, offered_at)
    VALUES ${values.join(", ")}
    ON CONFLICT (request_id, driver_id) DO UPDATE SET
      status = EXCLUDED.status,
      offered_at = NOW(),
      retry_count = ride_request_candidates.retry_count + 1
    RETURNING *
    `,
    params
  );

  return result.rows;
}

async function listEligibleDriverUserIdsForRequest({
  pickupLatitude,
  pickupLongitude,
  vehicleType,
  limit = 25,
}) {
  const hasVehicleType = Boolean(String(vehicleType || "").trim());
  const params = [pickupLatitude, pickupLongitude, limit];
  const vehicleFilterClause = hasVehicleType
    ? `AND LOWER(COALESCE(vehicle.vehicle_type, '')) = LOWER($4)`
    : "";

  if (hasVehicleType) {
    params.push(String(vehicleType).trim());
  }

  const result = await query(
    `
    SELECT
      d.user_id,
      (
        6371 * acos(
          least(
            greatest(
              cos(radians($1)) * cos(radians(loc.current_latitude)) * cos(radians(loc.current_longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(loc.current_latitude)),
              -1
            ),
            1
          )
        )
      ) AS distance_km
    FROM drivers d
    INNER JOIN driver_locations loc ON loc.driver_id = d.id
    LEFT JOIN LATERAL (
      SELECT v.vehicle_type
      FROM driver_vehicles dv
      INNER JOIN vehicles v ON v.id = dv.vehicle_id
      WHERE dv.driver_id = d.id AND dv.is_active = TRUE
      ORDER BY v.created_at DESC
      LIMIT 1
    ) vehicle ON TRUE
    WHERE
      d.status = 'approved'
      AND d.is_available = TRUE
      AND d.availability_status = 'idle'
      AND d.active_ride_id IS NULL
      AND loc.current_latitude IS NOT NULL
      AND loc.current_longitude IS NOT NULL
      ${vehicleFilterClause}
    ORDER BY distance_km ASC
    LIMIT $3
    `,
    params
  );

  return result.rows.map((row) => row.user_id).filter(Boolean);
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

async function updateRideRequest(requestId, updates = {}) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;

  const setClause = keys
    .map((key, i) => `${key} = $${i + 2}`)
    .join(", ");
  const values = keys.map(key => updates[key]);

  const result = await query(
    `
    UPDATE ride_requests
    SET ${setClause}, updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [requestId, ...values]
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

    const driverUpdateResult = await client.query(
      `
      UPDATE drivers
      SET 
        availability_status = 'on_ride',
        active_ride_id = NULL, -- will be updated below once we have the ID
        updated_at = NOW()
      WHERE id = $1 AND availability_status = 'idle' AND status = 'approved'
      RETURNING id
      `,
      [driverId]
    );

    if (!driverUpdateResult.rows[0]) {
      throw new AppError("Driver is no longer available", 409, "DRIVER_NOT_AVAILABLE");
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

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
        status,
        otp,
        vehicle_type
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACCEPTED', $13, $14
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
        fare ?? request.estimated_fare ?? null,
        distance ?? request.estimated_distance_km ?? null,
        request.is_shared,
        otp,
        request.vehicle_type || 'auto'
      ]
    );

    const ride = rideInsertResult.rows[0];

    if (request.is_shared) {
      await client.query(
        `
        INSERT INTO shared_rides (base_ride_id, status, max_participants)
        VALUES ($1, 'open', $2)
        ON CONFLICT DO NOTHING
        `,
        [ride.id, 2] // Default 2 participants
      );
    }

    await client.query(
      `
      UPDATE ride_requests
      SET status = 'matched', locked = TRUE, updated_at = NOW()
      WHERE id = $1
      `,
      [request.id]
    );

    // Now link the active ride ID to the driver
    await client.query(
      `
      UPDATE drivers
      SET active_ride_id = $1
      WHERE id = $2
      `,
      [rideInsertResult.rows[0].id, driverId]
    );

    return fetchRideById(rideInsertResult.rows[0].id, client.query.bind(client));
  });
}

async function fetchRideById(rideId, executor = query) {
  const result = await executor(
    `
    ${RIDE_DETAIL_SELECT}
    ${RIDE_DETAIL_FROM}
    WHERE r.id = $1
    LIMIT 1
    `,
    [rideId]
  );

  return result.rows[0] || null;
}

async function getRideById(rideId) {
  return fetchRideById(rideId);
}

async function getRideByRequestId(requestId) {
  const result = await query(
    `
    ${RIDE_DETAIL_SELECT}
    ${RIDE_DETAIL_FROM}
    WHERE r.request_id = $1
    LIMIT 1
    `,
    [requestId]
  );

  return result.rows[0] || null;
}

async function updateRideStatus(rideId, status) {
  const upperStatus = String(status).toUpperCase();
  return withTransaction(async (client) => {
    const result = await client.query(
      `
      UPDATE rides
      SET
        status = $1::varchar,
        start_time = CASE
          WHEN $1::text IN ('STARTED', 'ON_TRIP') AND start_time IS NULL THEN NOW()
          ELSE start_time
        END,
        end_time = CASE
          WHEN $1::text IN ('COMPLETED', 'CANCELLED') THEN NOW()
          ELSE end_time
        END,
        updated_at = NOW()
      WHERE id = $2::uuid
      RETURNING *
      `,
      [upperStatus, rideId]
    );

    const ride = result.rows[0];
    if (ride && ['COMPLETED', 'CANCELLED'].includes(upperStatus)) {
      await client.query(
        `
        UPDATE drivers
        SET 
          availability_status = 'idle', 
          active_ride_id = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [ride.driver_id]
      );

      // Also update shared ride status if it exists
      if (ride.is_shared) {
        await client.query(
          `
          UPDATE shared_rides
          SET status = $1, updated_at = NOW()
          WHERE base_ride_id = $2
          `,
          [upperStatus === 'COMPLETED' ? 'completed' : 'cancelled', ride.id]
        );
      }
    }

    return ride ? fetchRideById(rideId, client.query.bind(client)) : null;
  });
}

async function listRideHistoryForDriver(driverId) {
  const result = await query(
    `
    ${RIDE_DETAIL_SELECT}
    ${RIDE_DETAIL_FROM}
    WHERE r.driver_id = $1
    ORDER BY r.created_at DESC
    `,
    [driverId]
  );

  return result.rows;
}

async function listRideHistoryForUser(userId) {
  const result = await query(
    `
    ${RIDE_DETAIL_SELECT}
    ${RIDE_DETAIL_FROM}
    WHERE r.student_id = $1
    ORDER BY r.created_at DESC
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

async function incrementRejections(requestId) {
  const result = await query(
    `
    UPDATE ride_requests
    SET rejected_driver_count = rejected_driver_count + 1, updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [requestId]
  );
  return result.rows[0];
}

module.exports = {
  createRideRequest,
  getRideRequestById,
  updateRideRequest,
  cancelRideRequest,
  createRideFromRequest,
  createRideCandidates,
  listEligibleDriverUserIdsForRequest,
  getRideById,
  getRideByRequestId,
  updateRideStatus,
  listRideHistoryForUser,
  listRideHistoryForDriver,
  createOrUpdateDriverRating,
  refreshDriverRating,
  incrementRejections,
};
