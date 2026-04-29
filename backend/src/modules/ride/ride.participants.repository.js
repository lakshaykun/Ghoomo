const { query, withTransaction } = require("../../config/db");
const { AppError } = require("../../common/utils/helpers");

async function addParticipantToRide({ rideId, userId, passengersCount, pickupLocation, dropLocation, pickupLatitude, pickupLongitude, dropLatitude, dropLongitude }) {
  return withTransaction(async (client) => {
    // 1. Lock the ride row
    const rideResult = await client.query(
      `SELECT * FROM rides WHERE id = $1 FOR UPDATE`,
      [rideId]
    );

    const ride = rideResult.rows[0];
    if (!ride) {
      throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    }

    if (ride.status === 'FULL') {
      throw new AppError("Ride is already full", 400, "RIDE_FULL");
    }

    if (!['OPEN', 'SCHEDULED', 'CREATED'].includes(ride.status)) {
      throw new AppError("Ride is no longer accepting passengers", 400, "RIDE_NOT_OPEN");
    }

    if (ride.join_allowed_until && new Date() > new Date(ride.join_allowed_until)) {
      throw new AppError("Join time for this ride has expired", 400, "JOIN_EXPIRED");
    }

    // 2. Fetch current participants to calculate total passengers
    const partsResult = await client.query(
      `SELECT SUM(passengers_count) as total_passengers FROM ride_participants WHERE ride_id = $1 AND status != 'cancelled'`,
      [rideId]
    );
    
    const currentTotal = parseInt(partsResult.rows[0].total_passengers || 0, 10);

    // 3. Check capacity constraints based on creator capacity or snapshot
    // If we have a vehicle snapshot (driver accepted), enforce it
    let maxCapacity = null;
    if (ride.vehicle_seats_snapshot) {
      maxCapacity = ride.vehicle_seats_snapshot;
    } else {
      // Find the creator's capacity limit if we don't have driver yet? Wait, the user didn't specify a creator capacity column in ride, but it could be calculated or we rely on the prompt logic. Let's just say we don't enforce maxCapacity here if not set, BUT we know total must be <= vehicle_seats_snapshot.
    }

    if (maxCapacity && (currentTotal + passengersCount > maxCapacity)) {
      throw new AppError("Not enough seats available", 400, "NOT_ENOUGH_SEATS");
    }

    // 4. Insert participant — pickup/drop defaults to the ride's own locations if not provided
    const insertResult = await client.query(
      `
      INSERT INTO ride_participants (
        ride_id, user_id, pickup_location, drop_location, 
        pickup_latitude, pickup_longitude, drop_latitude, drop_longitude, 
        passengers_count, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'joined')
      ON CONFLICT (ride_id, user_id) DO UPDATE SET
        status = 'joined',
        passengers_count = EXCLUDED.passengers_count
      RETURNING *
      `,
      [
        rideId,
        userId,
        pickupLocation || ride.pickup_location,
        dropLocation || ride.drop_location,
        pickupLatitude,
        pickupLongitude,
        dropLatitude,
        dropLongitude,
        passengersCount,
      ]
    );

    // 5. Update status to FULL if maxCapacity is reached
    if (maxCapacity && (currentTotal + passengersCount === maxCapacity)) {
      await client.query(`UPDATE rides SET status = 'FULL', updated_at = NOW() WHERE id = $1`, [rideId]);
    }

    return insertResult.rows[0];
  });
}

async function removeParticipantFromRide({ rideId, userId }) {
  return withTransaction(async (client) => {
    // Lock the ride row
    const rideResult = await client.query(
      `SELECT * FROM rides WHERE id = $1 FOR UPDATE`,
      [rideId]
    );

    const ride = rideResult.rows[0];
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    // Check if participant exists and is creator
    const partResult = await client.query(
      `SELECT * FROM ride_participants WHERE ride_id = $1 AND user_id = $2 AND status != 'cancelled'`,
      [rideId, userId]
    );
    
    const participant = partResult.rows[0];
    if (!participant) {
      throw new AppError("Participant not found in ride", 404, "PARTICIPANT_NOT_FOUND");
    }

    if (participant.is_creator) {
      throw new AppError("Creator cannot leave the ride, they must cancel it.", 400, "CREATOR_CANNOT_LEAVE");
    }

    // Update participant status
    await client.query(
      `UPDATE ride_participants SET status = 'cancelled' WHERE id = $1`,
      [participant.id]
    );

    // If ride was FULL, make it OPEN again
    if (ride.status === 'FULL') {
      await client.query(`UPDATE rides SET status = 'OPEN', updated_at = NOW() WHERE id = $1`, [rideId]);
    }

    return true;
  });
}

async function getParticipants(rideId) {
  const result = await query(
    `
    SELECT rp.*, u.name as user_name, u.phone as user_phone 
    FROM ride_participants rp
    INNER JOIN users u ON u.id = rp.user_id
    WHERE rp.ride_id = $1 AND rp.status != 'cancelled'
    `,
    [rideId]
  );
  return result.rows;
}

module.exports = {
  addParticipantToRide,
  removeParticipantFromRide,
  getParticipants
};
