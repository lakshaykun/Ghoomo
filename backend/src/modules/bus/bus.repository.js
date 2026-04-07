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

async function createRoute({ name, departureTime, arrivalTime }) {
  const result = await query(
    `
    INSERT INTO bus_routes (name, departure_time, arrival_time)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [name, departureTime, arrivalTime]
  );

  return result.rows[0];
}

async function listBookings({ routeId, userId }) {
  const result = await query(
    `
    SELECT *
    FROM bus_bookings
    WHERE
      ($1::uuid IS NULL OR route_id = $1)
      AND ($2::uuid IS NULL OR user_id = $2)
    ORDER BY created_at DESC
    `,
    [routeId || null, userId || null]
  );

  return result.rows;
}

async function createBooking({ routeId, userId, seatNumber, status }) {
  const result = await query(
    `
    INSERT INTO bus_bookings (route_id, user_id, seat_number, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [routeId, userId, seatNumber || null, status || "pending"]
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

module.exports = {
  findRouteById,
  listRoutes,
  createRoute,
  listBookings,
  createBooking,
  updateBookingStatus,
  findStopByName,
  createStop,
  createRouteStop,
};
