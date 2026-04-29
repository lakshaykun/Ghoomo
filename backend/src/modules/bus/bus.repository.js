const { query } = require("../../config/db");

async function findRouteById(routeId) {
  const result = await query(
    `
    SELECT *
    FROM bus_routes
    WHERE id = $1
    LIMIT 1
    `,
    [routeId]
  );

  return result.rows[0] || null;
}

async function listRoutes() {
  const result = await query(
    `
    SELECT
      br.id,
      br.name,
      br.departure_time,
      br.arrival_time,
      br.total_seats,
      br.fare_per_seat,
      br.created_at,
      br.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', brs.id,
            'stopId', bs.id,
            'stopName', bs.name,
            'latitude', bs.latitude,
            'longitude', bs.longitude,
            'stopOrder', brs.stop_order,
            'stopType', brs.stop_type,
            'arrivalTime', brs.arrival_time
          )
          ORDER BY brs.stop_order
        ) FILTER (WHERE brs.id IS NOT NULL),
        '[]'::json
      ) AS stops
    FROM bus_routes br
    LEFT JOIN bus_route_stops brs ON br.id = brs.route_id
    LEFT JOIN bus_stops bs ON bs.id = brs.stop_id
    GROUP BY br.id
    ORDER BY br.created_at DESC
    `
  );

  return result.rows;
}

async function createRoute({ name, departureTime, arrivalTime, totalSeats, farePerSeat }) {
  const result = await query(
    `
    INSERT INTO bus_routes (name, departure_time, arrival_time, total_seats, fare_per_seat)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [name, departureTime, arrivalTime, totalSeats ?? 40, farePerSeat ?? 0]
  );

  return result.rows[0];
}

async function listBookings({ routeId, userId }) {
  const result = await query(
    `
    SELECT b.*, u.name AS user_name
    FROM bus_bookings
    LEFT JOIN users u ON u.id = b.user_id
    WHERE
      ($1::uuid IS NULL OR b.route_id = $1)
      AND ($2::uuid IS NULL OR b.user_id = $2)
    ORDER BY b.created_at DESC
    `,
    [routeId || null, userId || null]
  );

  return result.rows;
}

async function createBooking({ routeId, userId, seatNumber, status, fareAmount }) {
  const result = await query(
    `
    INSERT INTO bus_bookings (route_id, user_id, seat_number, status, fare_amount)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [routeId, userId, seatNumber || null, status || "pending", fareAmount ?? 0]
  );

  return result.rows[0];
}

async function updateBookingStatus({ bookingId, status, verifiedBy }) {
  const result = await query(
    `
    UPDATE bus_bookings
    SET status = $1, verified_by = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING *
    `,
    [status, verifiedBy || null, bookingId]
  );

  return result.rows[0] || null;
}

async function findBookingById(bookingId) {
  const result = await query(
    `
    SELECT *
    FROM bus_bookings
    WHERE id = $1
    LIMIT 1
    `,
    [bookingId]
  );
  return result.rows[0] || null;
}

async function findStopByName(stopName) {
  const result = await query(
    `
    SELECT *
    FROM bus_stops
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [stopName]
  );

  return result.rows[0] || null;
}

async function createStop({ stopName, latitude, longitude }) {
  const result = await query(
    `
    INSERT INTO bus_stops (name, latitude, longitude)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [stopName, latitude || null, longitude || null]
  );

  return result.rows[0];
}

async function createRouteStop({ routeId, stopId, stopOrder, stopType, arrivalTime }) {
  const result = await query(
    `
    INSERT INTO bus_route_stops (route_id, stop_id, stop_order, stop_type, arrival_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [routeId, stopId, stopOrder, stopType, arrivalTime]
  );

  return result.rows[0];
}

async function upsertLiveLocation({
  routeId,
  driverUserId,
  latitude,
  longitude,
  speedKmph,
  headingDeg,
  delayMinutes = 0,
}) {
  const result = await query(
    `
    INSERT INTO bus_route_live_locations
      (route_id, driver_user_id, latitude, longitude, speed_kmph, heading_deg, delay_minutes, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (route_id)
    DO UPDATE SET
      driver_user_id = EXCLUDED.driver_user_id,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      speed_kmph = EXCLUDED.speed_kmph,
      heading_deg = EXCLUDED.heading_deg,
      delay_minutes = EXCLUDED.delay_minutes,
      updated_at = NOW()
    RETURNING *
    `,
    [routeId, driverUserId || null, latitude, longitude, speedKmph ?? null, headingDeg ?? null, delayMinutes]
  );
  return result.rows[0] || null;
}

async function getRouteTracking(routeId) {
  const routeResult = await query(
    `
    SELECT
      br.id,
      br.name,
      br.departure_time,
      br.arrival_time,
      br.total_seats,
      br.fare_per_seat,
      COALESCE(
        json_agg(
          json_build_object(
            'id', bs.id,
            'name', bs.name,
            'latitude', bs.latitude,
            'longitude', bs.longitude,
            'stopOrder', brs.stop_order,
            'arrivalTime', brs.arrival_time
          )
          ORDER BY brs.stop_order
        ) FILTER (WHERE brs.id IS NOT NULL),
        '[]'::json
      ) AS stops
    FROM bus_routes br
    LEFT JOIN bus_route_stops brs ON brs.route_id = br.id
    LEFT JOIN bus_stops bs ON bs.id = brs.stop_id
    WHERE br.id = $1
    GROUP BY br.id
    LIMIT 1
    `,
    [routeId]
  );

  const liveResult = await query(
    `
    SELECT route_id, driver_user_id, latitude, longitude, speed_kmph, heading_deg, delay_minutes, updated_at
    FROM bus_route_live_locations
    WHERE route_id = $1
    LIMIT 1
    `,
    [routeId]
  );

  return {
    route: routeResult.rows[0] || null,
    live: liveResult.rows[0] || null,
  };
}

module.exports = {
  findRouteById,
  listRoutes,
  createRoute,
  listBookings,
  createBooking,
  updateBookingStatus,
  findBookingById,
  findStopByName,
  createStop,
  createRouteStop,
  upsertLiveLocation,
  getRouteTracking,
};
