const { query, withTransaction } = require("../../config/db");
const { isPointInPolygon } = require("../../common/utils/geofence");
const { getCampusBoundaryPoints } = require("../campusBoundary/campusBoundary.repository");

const DRIVER_PROFILE_SELECT = `
  SELECT
    d.id,
    d.user_id,
    d.status,
    d.is_available,
    d.availability_status,
    d.active_ride_id,
    d.rating,
    d.last_seen_at,
    d.created_at,
    d.updated_at,
    u.name,
    u.email,
    u.phone,
    vehicle.vehicle_number,
    vehicle.vehicle_type,
    loc.current_latitude,
    loc.current_longitude,
    loc.is_inside_campus
  FROM drivers d
  INNER JOIN users u ON u.id = d.user_id
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

async function getAvailableDrivers(db = null) {
  const executor = typeof db?.query === "function" ? db.query.bind(db) : query;
  const result = await executor(
    `
    SELECT
      d.id,
      d.user_id,
      d.status,
      d.is_available,
      d.rating,
      u.name,
      u.phone,
      loc.current_latitude AS latitude,
      loc.current_longitude AS longitude,
      loc.is_inside_campus,
      vehicle.vehicle_number,
      vehicle.vehicle_type
    FROM drivers d
    INNER JOIN users u ON u.id = d.user_id
    INNER JOIN driver_locations loc ON loc.driver_id = d.id
    LEFT JOIN LATERAL (
      SELECT v.vehicle_number, v.vehicle_type
      FROM driver_vehicles dv
      INNER JOIN vehicles v ON v.id = dv.vehicle_id
      WHERE dv.driver_id = d.id AND dv.is_active = TRUE
      ORDER BY v.created_at DESC
      LIMIT 1
    ) vehicle ON TRUE
    WHERE
      d.availability_status = 'idle'
      AND d.is_available = TRUE
      AND d.status = 'approved'
      AND loc.current_latitude IS NOT NULL
      AND loc.current_longitude IS NOT NULL
      AND d.last_seen_at IS NOT NULL
      AND d.last_seen_at > NOW() - INTERVAL '2 minute'
    `
  );

  return result.rows;
}

async function findDriverByUserId(userId) {
  const result = await query(
    `
    ${DRIVER_PROFILE_SELECT}
    WHERE d.user_id = $1
    LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] || null;
}

async function findDriverById(driverId) {
  const result = await query(
    `
    SELECT *
    FROM drivers
    WHERE id = $1
    LIMIT 1
    `,
    [driverId]
  );

  return result.rows[0] || null;
}

async function registerDriver({ userId, vehicleNumber, vehicleType }) {
  return withTransaction(async (client) => {
    const driverResult = await client.query(
      `
      INSERT INTO drivers (user_id, status, is_available)
      VALUES ($1, 'pending', false)
      RETURNING *
      `,
      [userId]
    );

    const vehicleResult = await client.query(
      `
      INSERT INTO vehicles (vehicle_number, vehicle_type)
      VALUES ($1, $2)
      ON CONFLICT (vehicle_number)
      DO UPDATE SET vehicle_type = EXCLUDED.vehicle_type
      RETURNING id, vehicle_number, vehicle_type
      `,
      [vehicleNumber, vehicleType]
    );

    await client.query(
      `
      INSERT INTO driver_vehicles (driver_id, vehicle_id, is_active)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (driver_id, vehicle_id)
      DO UPDATE SET is_active = TRUE
      `,
      [driverResult.rows[0].id, vehicleResult.rows[0].id]
    );

    await client.query(
      `
      INSERT INTO driver_locations (driver_id, current_latitude, current_longitude)
      VALUES ($1, NULL, NULL)
      ON CONFLICT (driver_id)
      DO UPDATE SET updated_at = NOW()
      `,
      [driverResult.rows[0].id]
    );

    await client.query(
      `
      UPDATE users
      SET role = CASE WHEN role = 'rider' THEN 'driver' ELSE role END, updated_at = NOW()
      WHERE id = $1
      `,
      [userId]
    );

    const profileResult = await client.query(
      `
      ${DRIVER_PROFILE_SELECT}
      WHERE d.id = $1
      LIMIT 1
      `,
      [driverResult.rows[0].id]
    );

    return profileResult.rows[0] || driverResult.rows[0];
  });
}

async function updateAvailabilityByUserId(userId, { isAvailable, status }) {
  const availabilityStatus = isAvailable ? 'idle' : 'offline';
  const result = await query(
    `
    UPDATE drivers
    SET
      availability_status = $1,
      is_available = $2,
      status = COALESCE($3, status),
      updated_at = NOW(),
      last_seen_at = NOW()
    WHERE user_id = $4
    RETURNING *
    `,
    [availabilityStatus, Boolean(isAvailable), status || null, userId]
  );

  if (!result.rows[0]) {
    console.log(`[DriverRepo] Update failed: No driver found for userId=${userId}`);
    return null;
  }

  console.log(`[DriverRepo] Update success for driver ID:`, result.rows[0].id);
  return findDriverByUserId(userId);
}

async function updateLocationByUserId(userId, { latitude, longitude }) {
  const boundaryPoints = await getCampusBoundaryPoints();
  const campusPolygon = boundaryPoints.map((point) => ({ lat: point.latitude, lng: point.longitude }));
  const isInsideCampus = isPointInPolygon({ lat: latitude, lng: longitude }, campusPolygon);

  return withTransaction(async (client) => {
    const driverResult = await client.query(
      `
      SELECT id
      FROM drivers
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const driver = driverResult.rows[0];
    if (!driver) {
      return null;
    }

    await client.query(
      `
      INSERT INTO driver_locations (driver_id, current_latitude, current_longitude, is_inside_campus, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (driver_id)
      DO UPDATE SET
        current_latitude = EXCLUDED.current_latitude,
        current_longitude = EXCLUDED.current_longitude,
        is_inside_campus = EXCLUDED.is_inside_campus,
        updated_at = NOW()
      `,
      [driver.id, latitude, longitude, isInsideCampus]
    );

    await client.query(
      `
      UPDATE drivers
      SET last_seen_at = NOW(), updated_at = NOW()
      WHERE id = $1
      `,
      [driver.id]
    );

    const profileResult = await client.query(
      `
      ${DRIVER_PROFILE_SELECT}
      WHERE d.id = $1
      LIMIT 1
      `,
      [driver.id]
    );

    return profileResult.rows[0] || null;
  });
}

async function listNearbyDrivers({ latitude, longitude, limit = 20 }) {
  const result = await query(
    `
    SELECT
      d.id,
      d.user_id,
      d.status,
      d.is_available,
      d.rating,
      u.name,
      u.phone,
      vehicle.vehicle_number,
      vehicle.vehicle_type,
      loc.current_latitude,
      loc.current_longitude,
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
    INNER JOIN users u ON u.id = d.user_id
    INNER JOIN driver_locations loc ON loc.driver_id = d.id
    LEFT JOIN LATERAL (
      SELECT v.vehicle_number, v.vehicle_type
      FROM driver_vehicles dv
      INNER JOIN vehicles v ON v.id = dv.vehicle_id
      WHERE dv.driver_id = d.id AND dv.is_active = TRUE
      ORDER BY v.created_at DESC
      LIMIT 1
    ) vehicle ON TRUE
    WHERE
      d.is_available = TRUE
      AND d.status = 'approved'
      AND loc.current_latitude IS NOT NULL
      AND loc.current_longitude IS NOT NULL
    ORDER BY distance_km ASC
    LIMIT $3
    `,
    [latitude, longitude, limit]
  );

  return result.rows;
}

async function listCandidateRequestsByUserId(userId) {
  const result = await query(
    `
    SELECT
      rrc.id,
      rrc.request_id,
      rrc.driver_id,
      rrc.status,
      rrc.distance_km,
      rrc.retry_count,
      rrc.offered_at,
      rr.student_id,
      rr.pickup_location,
      rr.drop_location,
      rr.pickup_latitude,
      rr.pickup_longitude,
      rr.drop_latitude,
      rr.drop_longitude,
      rr.ride_type,
      rr.is_scheduled,
      rr.estimated_fare,
      rr.estimated_distance_km,
      rr.request_time,
      rr.expires_at,
      rr.status AS request_status
    FROM ride_request_candidates rrc
    INNER JOIN drivers d ON d.id = rrc.driver_id
    INNER JOIN ride_requests rr ON rr.id = rrc.request_id
    WHERE d.user_id = $1
      AND rr.status = 'searching'
      AND rrc.status = 'notified'
      AND (rr.expires_at IS NULL OR rr.expires_at > NOW())
    ORDER BY rrc.offered_at DESC
    `,
    [userId]
  );

  return result.rows;
}

async function findActiveRideByUserId(userId) {
  const result = await query(
    `
    SELECT
      r.id,
      r.request_id,
      r.student_id,
      r.driver_id,
      r.pickup_location,
      r.drop_location,
      r.pickup_latitude,
      r.pickup_longitude,
      r.drop_latitude,
      r.drop_longitude,
      r.fare,
      r.distance,
      r.status,
      r.start_time,
      r.end_time,
      r.ride_type,
      r.is_scheduled,
      r.created_at,
      r.updated_at,
      loc.is_inside_campus AS driver_is_inside_campus
    FROM rides r
    INNER JOIN drivers d ON d.id = r.driver_id
    LEFT JOIN driver_locations loc ON loc.driver_id = d.id
    WHERE
      d.user_id = $1
      AND r.status IN ('ACCEPTED', 'DRIVER_ARRIVED', 'OTP_VERIFIED', 'ON_TRIP', 'assigned', 'arriving', 'started')
    ORDER BY r.updated_at DESC, r.created_at DESC
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function updateCandidateStatus({ userId, requestId, status }) {
  const result = await query(
    `
    UPDATE ride_request_candidates rrc
    SET status = $1, responded_at = NOW()
    FROM drivers d
    WHERE
      rrc.driver_id = d.id
      AND d.user_id = $2
      AND rrc.request_id = $3
    RETURNING rrc.*
    `,
    [status, userId, requestId]
  );

  return result.rows[0] || null;
}

async function markRideRequestMatched(requestId) {
  const result = await query(
    `
    UPDATE ride_requests
    SET status = 'matched', updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [requestId]
  );

  return result.rows[0] || null;
}

async function listScheduledRides() {
  const result = await query(
    `
    SELECT r.*,
      (SELECT SUM(passengers_count) FROM ride_participants WHERE ride_id = r.id AND status != 'cancelled') AS total_passengers
    FROM rides r
    WHERE r.is_scheduled = TRUE AND r.status IN ('SCHEDULED', 'OPEN')
    ORDER BY r.scheduled_at ASC
    `
  );
  return result.rows;
}

module.exports = {
  findDriverByUserId,
  findDriverById,
  getAvailableDrivers,
  registerDriver,
  updateAvailabilityByUserId,
  updateLocationByUserId,
  listNearbyDrivers,
  listCandidateRequestsByUserId,
  findActiveRideByUserId,
  updateCandidateStatus,
  markRideRequestMatched,
  listScheduledRides,
};
