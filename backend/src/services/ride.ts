/**
 * Ride Service
 */

import { query } from '../database';
import { Ride, Location, RideStatus } from '../core';
import { generateId } from '../utils';

/**
 * Create a new ride
 */
export const createRide = async (
  userId: string,
  pickupLocation: Location,
  dropLocation: Location,
  rideType: string
): Promise<Ride> => {
  try {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO rides (
        id, user_id, pickup_lat, pickup_lon, pickup_address,
        drop_lat, drop_lon, drop_address, ride_type, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        userId,
        pickupLocation.latitude,
        pickupLocation.longitude,
        pickupLocation.address,
        dropLocation.latitude,
        dropLocation.longitude,
        dropLocation.address,
        rideType,
        RideStatus.PENDING,
        now,
        now
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating ride:', error);
    throw error;
  }
};

/**
 * Get ride by ID
 */
export const getRideById = async (id: string): Promise<Ride | null> => {
  try {
    const result = await query(
      'SELECT * FROM rides WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting ride:', error);
    throw error;
  }
};

/**
 * Get user's rides
 */
export const getUserRides = async (userId: string): Promise<Ride[]> => {
  try {
    const result = await query(
      'SELECT * FROM rides WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting user rides:', error);
    throw error;
  }
};

/**
 * Update ride status
 */
export const updateRideStatus = async (
  rideId: string,
  status: RideStatus
): Promise<Ride | null> => {
  try {
    const result = await query(
      'UPDATE rides SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      [status, new Date(), rideId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating ride status:', error);
    throw error;
  }
};

/**
 * Assign driver to ride
 */
export const assignDriverToRide = async (
  rideId: string,
  driverId: string
): Promise<Ride | null> => {
  try {
    const result = await query(
      'UPDATE rides SET driver_id = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      [driverId, new Date(), rideId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error assigning driver:', error);
    throw error;
  }
};
