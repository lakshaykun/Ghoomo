const { pool, withTransaction } = require("../src/config/db");
const { hashPassword } = require("../src/common/utils/helpers");

const DEMO_PASSWORD = "DemoPass123!";
const DEMO_EMAIL_PREFIX = "demo.";
const DEMO_EMAIL_DOMAIN = "@ghoomo.test";

const demoUsers = [
  {
    name: "Demo Rider One",
    email: "demo.student@ghoomo.test",
    phone: "9000001001",
    role: "rider",
  },
  {
    name: "Demo Rider Two",
    email: "demo.passenger@ghoomo.test",
    phone: "9000001002",
    role: "rider",
  },
  {
    name: "Demo Driver One",
    email: "demo.driver1@ghoomo.test",
    phone: "9000002001",
    role: "driver",
    driver: {
      vehicleNumber: "GHOOMO-DR-001",
      vehicleType: "cab",
      licenseNumber: "DRV-001",
      status: "approved",
      isAvailable: true,
      currentLatitude: 30.900965,
      currentLongitude: 75.857277,
      rating: 4.8,
    },
  },
  {
    name: "Demo Driver Two",
    email: "demo.driver2@ghoomo.test",
    phone: "9000002002",
    role: "driver",
    driver: {
      vehicleNumber: "GHOOMO-DR-002",
      vehicleType: "auto",
      licenseNumber: "DRV-002",
      status: "approved",
      isAvailable: true,
      currentLatitude: 30.90752,
      currentLongitude: 75.86214,
      rating: 4.6,
    },
  },
  {
    name: "Demo Bus Driver",
    email: "demo.busdriver@ghoomo.test",
    phone: "9000003002",
    role: "bus_driver",
    busDriver: {
      licenseNumber: "BUS-001",
      status: "approved",
    },
  },
  {
    name: "Demo Admin",
    email: "demo.admin@ghoomo.test",
    phone: "9000003001",
    role: "admin",
  },
];

function isoMinutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function isoHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function cleanupDemoData(client) {
  await client.query(
    "DELETE FROM bus_bookings WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) LIKE $1) OR route_id IN (SELECT id FROM bus_routes WHERE name LIKE 'Demo %')",
    [`${DEMO_EMAIL_PREFIX}%${DEMO_EMAIL_DOMAIN}`]
  );
  await client.query("DELETE FROM bus_route_stops WHERE route_id IN (SELECT id FROM bus_routes WHERE name LIKE 'Demo %')");
  await client.query("DELETE FROM bus_routes WHERE name LIKE 'Demo %'");
  await client.query("DELETE FROM shared_ride_participants WHERE shared_ride_id IN (SELECT id FROM shared_rides WHERE base_ride_id IN (SELECT id FROM rides WHERE pickup_location LIKE 'Demo %' OR drop_location LIKE 'Demo %'))");
  await client.query("DELETE FROM shared_rides WHERE base_ride_id IN (SELECT id FROM rides WHERE pickup_location LIKE 'Demo %' OR drop_location LIKE 'Demo %')");
  await client.query("DELETE FROM driver_ratings WHERE ride_id IN (SELECT id FROM rides WHERE pickup_location LIKE 'Demo %' OR drop_location LIKE 'Demo %')");
  await client.query("DELETE FROM rides WHERE pickup_location LIKE 'Demo %' OR drop_location LIKE 'Demo %'");
  await client.query("DELETE FROM ride_request_candidates WHERE request_id IN (SELECT id FROM ride_requests WHERE pickup_location LIKE 'Demo %' OR drop_location LIKE 'Demo %')");
  await client.query("DELETE FROM driver_locations WHERE driver_id IN (SELECT id FROM drivers WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) LIKE $1))", [`${DEMO_EMAIL_PREFIX}%${DEMO_EMAIL_DOMAIN}`]);
  await client.query("DELETE FROM driver_vehicles WHERE driver_id IN (SELECT id FROM drivers WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) LIKE $1))", [`${DEMO_EMAIL_PREFIX}%${DEMO_EMAIL_DOMAIN}`]);
  await client.query("DELETE FROM vehicles WHERE vehicle_number LIKE 'GHOOMO-DR-%'");
  await client.query("DELETE FROM bus_drivers WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) LIKE $1)", [`${DEMO_EMAIL_PREFIX}%${DEMO_EMAIL_DOMAIN}`]);
  await client.query("DELETE FROM drivers WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) LIKE $1)", [`${DEMO_EMAIL_PREFIX}%${DEMO_EMAIL_DOMAIN}`]);
  await client.query("DELETE FROM saved_locations WHERE name LIKE 'Demo %' OR address LIKE 'Demo %'");
  await client.query("DELETE FROM ride_requests WHERE pickup_location LIKE 'Demo %' OR drop_location LIKE 'Demo %'");
  await client.query("DELETE FROM users WHERE LOWER(email) LIKE $1", [`${DEMO_EMAIL_PREFIX}%${DEMO_EMAIL_DOMAIN}`]);
}

async function upsertUser(client, user) {
  const result = await client.query(
    `
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      updated_at = NOW()
    RETURNING id, name, email, phone, role
    `,
    [user.name, user.email, user.phone, hashPassword(DEMO_PASSWORD), user.role]
  );

  return result.rows[0];
}

async function upsertDriver(client, userId, driver) {
  const result = await client.query(
    `
    INSERT INTO drivers (
      user_id,
      status,
      is_available,
      rating,
      last_seen_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      is_available = EXCLUDED.is_available,
      rating = EXCLUDED.rating,
      last_seen_at = NOW(),
      updated_at = NOW()
    RETURNING *
    `,
    [
      userId,
      driver.status,
      driver.isAvailable,
      driver.rating,
    ]
  );

  const vehicleResult = await client.query(
    `
    INSERT INTO vehicles (vehicle_number, vehicle_type)
    VALUES ($1, $2)
    ON CONFLICT (vehicle_number)
    DO UPDATE SET vehicle_type = EXCLUDED.vehicle_type
    RETURNING id
    `,
    [driver.vehicleNumber, driver.vehicleType]
  );

  await client.query(
    `
    INSERT INTO driver_vehicles (driver_id, vehicle_id, is_active)
    VALUES ($1, $2, TRUE)
    ON CONFLICT (driver_id, vehicle_id)
    DO UPDATE SET is_active = TRUE
    `,
    [result.rows[0].id, vehicleResult.rows[0].id]
  );

  await client.query(
    `
    INSERT INTO driver_locations (driver_id, current_latitude, current_longitude)
    VALUES ($1, $2, $3)
    ON CONFLICT (driver_id)
    DO UPDATE SET
      current_latitude = EXCLUDED.current_latitude,
      current_longitude = EXCLUDED.current_longitude,
      updated_at = NOW()
    `,
    [
      result.rows[0].id,
      driver.currentLatitude ?? null,
      driver.currentLongitude ?? null,
    ]
  );

  return result.rows[0];
}

async function upsertBusDriver(client, userId, busDriver) {
  const result = await client.query(
    `
    INSERT INTO bus_drivers (user_id, license_number, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET
      license_number = EXCLUDED.license_number,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *
    `,
    [userId, busDriver.licenseNumber, busDriver.status || "pending"]
  );

  await client.query(
    `
    UPDATE users
    SET role = 'bus_driver', updated_at = NOW()
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0];
}

async function addSavedLocation(client, userId, name, address, latitude, longitude) {
  const result = await client.query(
    `
    INSERT INTO saved_locations (user_id, name, address, latitude, longitude)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [userId, name, address, latitude, longitude]
  );

  return result.rows[0];
}

async function addRideRequest(client, payload) {
  const result = await client.query(
    `
    INSERT INTO ride_requests (
      student_id,
      pickup_location,
      drop_location,
      pickup_latitude,
      pickup_longitude,
      drop_latitude,
      drop_longitude,
      request_time,
      expires_at,
      is_shared,
      locked,
      status,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
    `,
    [
      payload.studentId,
      payload.pickupLocation,
      payload.dropLocation,
      payload.pickupLatitude,
      payload.pickupLongitude,
      payload.dropLatitude,
      payload.dropLongitude,
      payload.requestTime || isoHoursAgo(3),
      payload.expiresAt || isoMinutesFromNow(90),
      Boolean(payload.isShared),
      Boolean(payload.locked),
      payload.status || "searching",
      payload.createdAt || isoHoursAgo(3),
      payload.updatedAt || isoHoursAgo(3),
    ]
  );

  return result.rows[0];
}

async function addRide(client, payload) {
  const result = await client.query(
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
      status,
      start_time,
      end_time,
      is_shared,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
    `,
    [
      payload.requestId,
      payload.studentId,
      payload.driverId,
      payload.pickupLocation,
      payload.dropLocation,
      payload.pickupLatitude,
      payload.pickupLongitude,
      payload.dropLatitude,
      payload.dropLongitude,
      payload.fare,
      payload.distance,
      payload.status || "assigned",
      payload.startTime || null,
      payload.endTime || null,
      Boolean(payload.isShared),
      payload.createdAt || isoHoursAgo(6),
      payload.updatedAt || isoHoursAgo(5),
    ]
  );

  return result.rows[0];
}

async function addRideCandidate(client, payload) {
  const result = await client.query(
    `
    INSERT INTO ride_request_candidates (
      request_id,
      driver_id,
      status,
      distance_km,
      retry_count,
      offered_at,
      responded_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      payload.requestId,
      payload.driverId,
      payload.status || "pending",
      payload.distanceKm,
      payload.retryCount || 0,
      payload.offeredAt || isoHoursAgo(2),
      payload.respondedAt || null,
    ]
  );

  return result.rows[0];
}

async function addDriverRating(client, payload) {
  const result = await client.query(
    `
    INSERT INTO driver_ratings (ride_id, student_id, driver_id, rating, review_text, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (ride_id)
    DO UPDATE SET
      student_id = EXCLUDED.student_id,
      driver_id = EXCLUDED.driver_id,
      rating = EXCLUDED.rating,
      review_text = EXCLUDED.review_text
    RETURNING *
    `,
    [payload.rideId, payload.studentId, payload.driverId, payload.rating, payload.reviewText, payload.createdAt || isoHoursAgo(4)]
  );

  return result.rows[0];
}

async function addSharedRide(client, payload) {
  const result = await client.query(
    `
    INSERT INTO shared_rides (base_ride_id, status, max_participants, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [payload.baseRideId, payload.status || "open", payload.maxParticipants || 3, payload.createdAt || isoHoursAgo(1)]
  );

  return result.rows[0];
}

async function addSharedRideParticipant(client, payload) {
  const result = await client.query(
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
      status,
      fare_split
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
    `,
    [
      payload.sharedRideId,
      payload.userId,
      payload.pickupLocation,
      payload.dropLocation,
      payload.pickupLatitude,
      payload.pickupLongitude,
      payload.dropLatitude,
      payload.dropLongitude,
      payload.status || "joined",
      payload.fareSplit || null,
    ]
  );

  return result.rows[0];
}

async function addBusRoute(client, payload) {
  const result = await client.query(
    `
    INSERT INTO bus_routes (name, departure_time, arrival_time, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [payload.name, payload.departureTime, payload.arrivalTime, payload.createdAt || isoHoursAgo(48), payload.updatedAt || isoHoursAgo(48)]
  );

  return result.rows[0];
}

async function addBusStop(client, payload) {
  const result = await client.query(
    `
    INSERT INTO bus_stops (name, latitude, longitude, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [payload.name, payload.latitude, payload.longitude, payload.createdAt || isoHoursAgo(48)]
  );

  return result.rows[0];
}

async function addBusRouteStop(client, payload) {
  const result = await client.query(
    `
    INSERT INTO bus_route_stops (route_id, stop_id, stop_order, stop_type, arrival_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [payload.routeId, payload.stopId, payload.stopOrder, payload.stopType, payload.arrivalTime]
  );

  return result.rows[0];
}

async function addBusBooking(client, payload) {
  const result = await client.query(
    `
    INSERT INTO bus_bookings (route_id, user_id, status, verified_by, seat_number, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      payload.routeId,
      payload.userId,
      payload.status || "pending",
      payload.verifiedBy || null,
      payload.seatNumber || null,
      payload.createdAt || isoHoursAgo(2),
      payload.updatedAt || isoHoursAgo(2),
    ]
  );

  return result.rows[0];
}

async function seedDemoData() {
  return withTransaction(async (client) => {
    await cleanupDemoData(client);

    const createdUsers = new Map();
    const createdDrivers = new Map();
    const createdBusDrivers = new Map();

    for (const userSeed of demoUsers) {
      const user = await upsertUser(client, userSeed);
      createdUsers.set(userSeed.email, user);

      if (userSeed.driver) {
        const driver = await upsertDriver(client, user.id, userSeed.driver);
        createdDrivers.set(userSeed.email, driver);
      }

      if (userSeed.busDriver) {
        const busDriver = await upsertBusDriver(client, user.id, userSeed.busDriver);
        createdBusDrivers.set(userSeed.email, busDriver);
      }
    }

    const student = createdUsers.get("demo.student@ghoomo.test");
    const passenger = createdUsers.get("demo.passenger@ghoomo.test");
    const driverOne = createdDrivers.get("demo.driver1@ghoomo.test");
    const driverTwo = createdDrivers.get("demo.driver2@ghoomo.test");
    const busDriver = createdBusDrivers.get("demo.busdriver@ghoomo.test");
    const busDriverUser = createdUsers.get("demo.busdriver@ghoomo.test");
    const admin = createdUsers.get("demo.admin@ghoomo.test");

    await addSavedLocation(client, student.id, "Demo Student Home", "Demo Student Home, Campus Road", 30.9002, 75.8568);
    await addSavedLocation(client, passenger.id, "Demo Passenger Hostel", "Demo Passenger Hostel, North Block", 30.9042, 75.8601);

    const requestOne = await addRideRequest(client, {
      studentId: student.id,
      pickupLocation: "Demo Hostel Gate",
      dropLocation: "Demo Main Gate",
      pickupLatitude: 30.900965,
      pickupLongitude: 75.857277,
      dropLatitude: 30.9123,
      dropLongitude: 75.8421,
      requestTime: isoHoursAgo(3),
      expiresAt: isoMinutesFromNow(90),
      status: "searching",
      locked: false,
      isShared: false,
      createdAt: isoHoursAgo(3),
      updatedAt: isoHoursAgo(3),
    });

    const requestTwo = await addRideRequest(client, {
      studentId: passenger.id,
      pickupLocation: "Demo Lecture Hall",
      dropLocation: "Demo City Market",
      pickupLatitude: 30.9046,
      pickupLongitude: 75.8619,
      dropLatitude: 30.9142,
      dropLongitude: 75.8484,
      requestTime: isoHoursAgo(26),
      expiresAt: isoHoursAgo(24),
      status: "matched",
      locked: true,
      isShared: true,
      createdAt: isoHoursAgo(26),
      updatedAt: isoHoursAgo(25),
    });

    await addRideCandidate(client, {
      requestId: requestOne.id,
      driverId: driverOne.id,
      status: "pending",
      distanceKm: 0.8,
      retryCount: 0,
      offeredAt: isoHoursAgo(2),
    });

    await addRideCandidate(client, {
      requestId: requestOne.id,
      driverId: driverTwo.id,
      status: "notified",
      distanceKm: 1.2,
      retryCount: 1,
      offeredAt: isoHoursAgo(2),
    });

    const rideOne = await addRide(client, {
      requestId: requestTwo.id,
      studentId: passenger.id,
      driverId: driverOne.id,
      pickupLocation: requestTwo.pickup_location,
      dropLocation: requestTwo.drop_location,
      pickupLatitude: requestTwo.pickup_latitude,
      pickupLongitude: requestTwo.pickup_longitude,
      dropLatitude: requestTwo.drop_latitude,
      dropLongitude: requestTwo.drop_longitude,
      fare: 162.0,
      distance: 7.15,
      status: "completed",
      startTime: isoHoursAgo(23),
      endTime: isoHoursAgo(23),
      isShared: true,
      createdAt: isoHoursAgo(24),
      updatedAt: isoHoursAgo(22),
    });

    await addDriverRating(client, {
      rideId: rideOne.id,
      studentId: passenger.id,
      driverId: driverOne.id,
      rating: 5,
      reviewText: "Quick pickup, clean ride, and polite driver.",
      createdAt: isoHoursAgo(21),
    });

    const sharedRide = await addSharedRide(client, {
      baseRideId: rideOne.id,
      status: "open",
      maxParticipants: 3,
      createdAt: isoHoursAgo(2),
    });

    await addSharedRideParticipant(client, {
      sharedRideId: sharedRide.id,
      userId: student.id,
      pickupLocation: "Demo Hostel Gate",
      dropLocation: "Demo City Market",
      pickupLatitude: 30.900965,
      pickupLongitude: 75.857277,
      dropLatitude: 30.9142,
      dropLongitude: 75.8484,
      status: "joined",
      fareSplit: 81.0,
    });

    const routeA = await addBusRoute(client, {
      name: "Demo Campus Loop A",
      departureTime: "09:00:00",
      arrivalTime: "10:00:00",
      createdAt: isoHoursAgo(72),
      updatedAt: isoHoursAgo(72),
    });

    const routeB = await addBusRoute(client, {
      name: "Demo Campus Loop B",
      departureTime: "17:00:00",
      arrivalTime: "18:30:00",
      createdAt: isoHoursAgo(72),
      updatedAt: isoHoursAgo(72),
    });

    const stopA = await addBusStop(client, {
      name: "Demo Hostel Gate",
      latitude: 30.900965,
      longitude: 75.857277,
      createdAt: isoHoursAgo(72),
    });

    const stopB = await addBusStop(client, {
      name: "Demo Library Stop",
      latitude: 30.9041,
      longitude: 75.8612,
      createdAt: isoHoursAgo(72),
    });

    const stopC = await addBusStop(client, {
      name: "Demo Main Gate",
      latitude: 30.9123,
      longitude: 75.8421,
      createdAt: isoHoursAgo(72),
    });

    await addBusRouteStop(client, {
      routeId: routeA.id,
      stopId: stopA.id,
      stopOrder: 1,
      stopType: "pickup",
      arrivalTime: "09:00:00",
    });

    await addBusRouteStop(client, {
      routeId: routeA.id,
      stopId: stopB.id,
      stopOrder: 2,
      stopType: "both",
      arrivalTime: "09:20:00",
    });

    await addBusRouteStop(client, {
      routeId: routeA.id,
      stopId: stopC.id,
      stopOrder: 3,
      stopType: "dropoff",
      arrivalTime: "10:00:00",
    });

    await addBusRouteStop(client, {
      routeId: routeB.id,
      stopId: stopC.id,
      stopOrder: 1,
      stopType: "pickup",
      arrivalTime: "17:00:00",
    });

    await addBusRouteStop(client, {
      routeId: routeB.id,
      stopId: stopB.id,
      stopOrder: 2,
      stopType: "both",
      arrivalTime: "17:20:00",
    });

    await addBusRouteStop(client, {
      routeId: routeB.id,
      stopId: stopA.id,
      stopOrder: 3,
      stopType: "dropoff",
      arrivalTime: "18:30:00",
    });

    await addBusBooking(client, {
      routeId: routeA.id,
      userId: student.id,
      status: "verified",
      verifiedBy: busDriverUser.id,
      seatNumber: 4,
      createdAt: isoHoursAgo(1),
      updatedAt: isoHoursAgo(1),
    });

    await addBusBooking(client, {
      routeId: routeB.id,
      userId: passenger.id,
      status: "pending",
      seatNumber: 5,
      createdAt: isoHoursAgo(1),
      updatedAt: isoHoursAgo(1),
    });

    return {
      users: Array.from(createdUsers.values()).map((user) => ({ email: user.email, role: user.role })),
      drivers: Array.from(createdDrivers.values()).map((driver) => ({ id: driver.id, userId: driver.user_id })),
      busDrivers: Array.from(createdBusDrivers.values()).map((row) => ({ id: row.id, userId: row.user_id })),
      rideRequestIds: [requestOne.id, requestTwo.id],
      rideIds: [rideOne.id],
      sharedRideIds: [sharedRide.id],
      busRouteIds: [routeA.id, routeB.id],
    };
  });
}

if (require.main === module) {
  seedDemoData()
    .then((summary) => {
      console.log("Demo seed complete.");
      console.log("Test accounts:");
      console.log(`- Student  : ${demoUsers[0].email} / ${DEMO_PASSWORD}`);
      console.log(`- Passenger: ${demoUsers[1].email} / ${DEMO_PASSWORD}`);
      console.log(`- Driver 1 : ${demoUsers[2].email} / ${DEMO_PASSWORD}`);
      console.log(`- Driver 2 : ${demoUsers[3].email} / ${DEMO_PASSWORD}`);
      console.log(`- Bus Driver: ${demoUsers[4].email} / ${DEMO_PASSWORD}`);
      console.log(`- Admin    : ${demoUsers[5].email} / ${DEMO_PASSWORD}`);
      console.log("");
      console.log(`Seeded users: ${summary.users.length}`);
      console.log(`Seeded drivers: ${summary.drivers.length}`);
      console.log(`Seeded bus drivers: ${summary.busDrivers.length}`);
      console.log(`Ride requests: ${summary.rideRequestIds.length}`);
      console.log(`Rides: ${summary.rideIds.length}`);
      console.log(`Shared rides: ${summary.sharedRideIds.length}`);
      console.log(`Bus routes: ${summary.busRouteIds.length}`);
    })
    .catch((error) => {
      console.error("Demo seeding failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}

module.exports = {
  seedDemoData,
};
