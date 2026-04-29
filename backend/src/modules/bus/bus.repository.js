const { query, withTransaction } = require("../../config/db");

let busSchemaCapabilitiesCache = null;

async function getBusSchemaCapabilities(clientLike = { query }) {
  if (busSchemaCapabilitiesCache) return busSchemaCapabilitiesCache;

  const [columnsRes, liveTableRes] = await Promise.all([
    clientLike.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bus_routes'
      `
    ),
    clientLike.query(`SELECT to_regclass('public.bus_route_live_locations') AS table_name`),
  ]);

  const columnSet = new Set(columnsRes.rows.map((r) => r.column_name));
  busSchemaCapabilitiesCache = {
    hasTotalSeats: columnSet.has("total_seats"),
    hasFarePerSeat: columnSet.has("fare_per_seat"),
    hasLiveLocations: Boolean(liveTableRes.rows[0]?.table_name),
  };
  return busSchemaCapabilitiesCache;
}

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
  const caps = await getBusSchemaCapabilities({ query });
  const totalSeatsSelect = caps.hasTotalSeats ? "br.total_seats" : "40::int AS total_seats";
  const fareSelect = caps.hasFarePerSeat ? "br.fare_per_seat" : "0::numeric AS fare_per_seat";
  const liveJoin = caps.hasLiveLocations ? "LEFT JOIN bus_route_live_locations brll ON brll.route_id = br.id" : "LEFT JOIN LATERAL (SELECT NULL::uuid AS driver_user_id) brll ON TRUE";

  const result = await query(
    `
    SELECT
      br.id,
      br.name,
      br.departure_time,
      br.arrival_time,
      ${totalSeatsSelect},
      ${fareSelect},
      br.created_at,
      br.updated_at,
      brll.driver_user_id,
      u.name AS driver_name,
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
    ${liveJoin}
    LEFT JOIN users u ON u.id = brll.driver_user_id
    GROUP BY br.id, brll.driver_user_id, u.name
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
    FROM bus_bookings b
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

async function findActiveBookingByUserAndRoute(userId, routeId) {
  const result = await query(
    `
    SELECT *
    FROM bus_bookings
    WHERE user_id = $1
      AND route_id = $2
      AND status != 'cancelled'
    LIMIT 1
    `,
    [userId, routeId]
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
  const caps = await getBusSchemaCapabilities({ query });
  const totalSeatsSelect = caps.hasTotalSeats ? "br.total_seats" : "40::int AS total_seats";
  const fareSelect = caps.hasFarePerSeat ? "br.fare_per_seat" : "0::numeric AS fare_per_seat";

  const routeResult = await query(
    `
    SELECT
      br.id,
      br.name,
      br.departure_time,
      br.arrival_time,
      ${totalSeatsSelect},
      ${fareSelect},
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

  const liveResult = caps.hasLiveLocations
    ? await query(
        `
        SELECT route_id, driver_user_id, latitude, longitude, speed_kmph, heading_deg, delay_minutes, updated_at
        FROM bus_route_live_locations
        WHERE route_id = $1
        LIMIT 1
        `,
        [routeId]
      )
    : { rows: [] };

  return {
    route: routeResult.rows[0] || null,
    live: liveResult.rows[0] || null,
  };
}

async function listApprovedBusDrivers() {
  const result = await query(
    `
    SELECT 
      bd.id AS bus_driver_id,
      bd.user_id,
      u.name,
      u.email,
      u.phone,
      bd.license_number
    FROM bus_drivers bd
    JOIN users u ON u.id = bd.user_id
    WHERE bd.status = 'approved'
    ORDER BY u.name ASC
    `
  );
  return result.rows;
}

async function createRouteWithStops({ 
  name, 
  departureTime, 
  arrivalTime, 
  totalSeats, 
  farePerSeat, 
  stops, 
  driverUserId 
}) {
  return withTransaction(async (client) => {
    const caps = await getBusSchemaCapabilities(client);
    // 1. Create Route
    const routeRes = caps.hasTotalSeats && caps.hasFarePerSeat
      ? await client.query(
          `
          INSERT INTO bus_routes (name, departure_time, arrival_time, total_seats, fare_per_seat)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
          `,
          [name, departureTime, arrivalTime, totalSeats, farePerSeat]
        )
      : await client.query(
          `
          INSERT INTO bus_routes (name, departure_time, arrival_time)
          VALUES ($1, $2, $3)
          RETURNING *
          `,
          [name, departureTime, arrivalTime]
        );
    const route = routeRes.rows[0];

    // 2. For each stop
    for (const stop of stops) {
      // Find or create stop
      const stopCheck = await client.query(
        `SELECT id FROM bus_stops WHERE latitude = $1 AND longitude = $2 LIMIT 1`,
        [stop.latitude, stop.longitude]
      );

      let stopId;
      if (stopCheck.rows.length > 0) {
        stopId = stopCheck.rows[0].id;
      } else {
        const newStopRes = await client.query(
          `INSERT INTO bus_stops (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING id`,
          [stop.name, stop.latitude, stop.longitude]
        );
        stopId = newStopRes.rows[0].id;
      }

      // Link to route
      await client.query(
        `
        INSERT INTO bus_route_stops (route_id, stop_id, stop_order, stop_type, arrival_time)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [route.id, stopId, stop.order, stop.type, stop.arrivalTime]
      );
    }

    // 3. Driver assignment (via live locations)
    if (driverUserId && caps.hasLiveLocations) {
      await client.query(
        `
        INSERT INTO bus_route_live_locations (route_id, driver_user_id, latitude, longitude)
        VALUES ($1, $2, $3, $4)
        `,
        [route.id, driverUserId, stops[0].latitude, stops[0].longitude]
      );
    }

    return route;
  });
}

async function updateRouteWithStops(routeId, { 
  name, 
  departureTime, 
  arrivalTime, 
  totalSeats, 
  farePerSeat, 
  stops, 
  driverUserId 
}) {
  return withTransaction(async (client) => {
    const caps = await getBusSchemaCapabilities(client);
    // 1. Update Route metadata
    const routeRes = caps.hasTotalSeats && caps.hasFarePerSeat
      ? await client.query(
          `
          UPDATE bus_routes 
          SET name = $1, departure_time = $2, arrival_time = $3, total_seats = $4, fare_per_seat = $5, updated_at = NOW()
          WHERE id = $6
          RETURNING *
          `,
          [name, departureTime, arrivalTime, totalSeats, farePerSeat, routeId]
        )
      : await client.query(
          `
          UPDATE bus_routes 
          SET name = $1, departure_time = $2, arrival_time = $3, updated_at = NOW()
          WHERE id = $4
          RETURNING *
          `,
          [name, departureTime, arrivalTime, routeId]
        );
    const route = routeRes.rows[0];
    if (!route) return null;

    // 2. Clear old stops
    await client.query(`DELETE FROM bus_route_stops WHERE route_id = $1`, [routeId]);

    // 3. Insert new stops
    for (const stop of stops) {
      const stopCheck = await client.query(
        `SELECT id FROM bus_stops WHERE latitude = $1 AND longitude = $2 LIMIT 1`,
        [stop.latitude, stop.longitude]
      );

      let stopId;
      if (stopCheck.rows.length > 0) {
        stopId = stopCheck.rows[0].id;
      } else {
        const newStopRes = await client.query(
          `INSERT INTO bus_stops (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING id`,
          [stop.name, stop.latitude, stop.longitude]
        );
        stopId = newStopRes.rows[0].id;
      }

      await client.query(
        `
        INSERT INTO bus_route_stops (route_id, stop_id, stop_order, stop_type, arrival_time)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [routeId, stopId, stop.order, stop.type, stop.arrivalTime]
      );
    }

    // 4. Update Driver assignment
    if (driverUserId && caps.hasLiveLocations) {
      await client.query(
        `
        INSERT INTO bus_route_live_locations (route_id, driver_user_id, latitude, longitude)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (route_id) DO UPDATE SET driver_user_id = EXCLUDED.driver_user_id, updated_at = NOW()
        `,
        [routeId, driverUserId, stops[0].latitude, stops[0].longitude]
      );
    } else if (caps.hasLiveLocations) {
      await client.query(`DELETE FROM bus_route_live_locations WHERE route_id = $1`, [routeId]);
    }

    return route;
  });
}

async function deleteRoute(routeId) {
  return withTransaction(async (client) => {
    const caps = await getBusSchemaCapabilities(client);
    if (caps.hasLiveLocations) {
      await client.query(`DELETE FROM bus_route_live_locations WHERE route_id = $1`, [routeId]);
    }
    await client.query(
      `UPDATE bus_bookings SET route_id = NULL, updated_at = NOW() WHERE route_id = $1`,
      [routeId]
    );
    const result = await client.query(`DELETE FROM bus_routes WHERE id = $1 RETURNING id`, [routeId]);
    return result.rowCount > 0;
  });
}

module.exports = {
  findRouteById,
  listRoutes,
  createRoute,
  listBookings,
  createBooking,
  updateBookingStatus,
  findBookingById,
  findActiveBookingByUserAndRoute,
  findStopByName,
  createStop,
  createRouteStop,
  upsertLiveLocation,
  getRouteTracking,
  listApprovedBusDrivers,
  createRouteWithStops,
  updateRouteWithStops,
  deleteRoute,
};
