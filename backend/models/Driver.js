/**
 * Driver Model
 * Handles driver-related database operations
 */

const pool = require('../config/database');

class Driver {
  /**
   * Create a new driver profile
   */
  static async create(driverData) {
    const query = `
      INSERT INTO drivers (user_id, vehicle_number, license_number, rc_number, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, user_id, vehicle_number, license_number, rc_number, status, created_at
    `;
    const values = [
      driverData.user_id,
      driverData.vehicle_number,
      driverData.license_number,
      driverData.rc_number,
      driverData.status || 'pending'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find driver by ID
   */
  static async findById(id) {
    const query = `
      SELECT d.*, u.name, u.email, u.phone 
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get all drivers
   */
  static async getAll(status = null, limit = 20, offset = 0) {
    let query = `
      SELECT d.*, u.name, u.email, u.phone 
      FROM drivers d
      JOIN users u ON d.user_id = u.id
    `;
    const values = [];

    if (status) {
      query += ' WHERE d.status = $1';
      query += ' LIMIT $2 OFFSET $3';
      values.push(status, limit, offset);
    } else {
      query += ' LIMIT $1 OFFSET $2';
      values.push(limit, offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update driver status
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE drivers 
      SET status = $2
      WHERE id = $1
      RETURNING id, user_id, vehicle_number, license_number, rc_number, status
    `;
    const result = await pool.query(query, [id, status]);
    return result.rows[0];
  }

  /**
   * Get online drivers
   */
  static async getOnlineDrivers() {
    const query = `
      SELECT d.*, u.name, u.phone 
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'approved' AND d.is_online = true
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Driver;
