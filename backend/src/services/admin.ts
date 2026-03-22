/**
 * Admin Service
 */

import { query } from '../database';
import { User } from '../core';

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const result = await query('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'driver' THEN 1 ELSE 0 END) as total_drivers,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as total_customers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
      FROM users
    `);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

/**
 * Get ride statistics
 */
export const getRideStats = async () => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_rides,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_rides,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_rides,
        AVG(fare) as average_fare
      FROM rides
    `);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting ride stats:', error);
    throw error;
  }
};
