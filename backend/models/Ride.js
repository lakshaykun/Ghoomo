/**
 * Ride Model
 * Handles ride-related database operations
 */

const pool = require('../config/database');

class Ride {
  /**
   * Create a new ride request
   */
  static async create(rideData) {
    const query = `
      INSERT INTO rides (student_id, driver_id, pickup_location, drop_location, status, start_time)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, student_id, driver_id, pickup_location, drop_location, status, start_time
    `;
    const values = [
      rideData.student_id,
      rideData.driver_id || null,
      rideData.pickup_location,
      rideData.drop_location,
      rideData.status || 'requested'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find ride by ID
   */
  static async findById(id) {
    const query = `
      SELECT r.*, u.name as student_name, d.name as driver_name
      FROM rides r
      LEFT JOIN users u ON r.student_id = u.id
      LEFT JOIN users d ON r.driver_id = d.id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get active rides
   */
  static async getActive() {
    const query = `
      SELECT r.*, u.name as student_name, d.name as driver_name
      FROM rides r
      LEFT JOIN users u ON r.student_id = u.id
      LEFT JOIN users d ON r.driver_id = d.id
      WHERE r.status IN ('requested', 'accepted', 'in-progress')
      ORDER BY r.start_time DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get rides by student ID
   */
  static async getByStudentId(studentId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM rides
      WHERE student_id = $1
      ORDER BY start_time DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [studentId, limit, offset]);
    return result.rows;
  }

  /**
   * Update ride status
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE rides 
      SET status = $2,
          end_time = CASE WHEN $2 = 'completed' THEN NOW() ELSE end_time END
      WHERE id = $1
      RETURNING id, status, start_time, end_time
    `;
    const result = await pool.query(query, [id, status]);
    return result.rows[0];
  }

  /**
   * Assign driver to ride
   */
  static async assignDriver(rideId, driverId) {
    const query = `
      UPDATE rides 
      SET driver_id = $2, status = 'accepted'
      WHERE id = $1
      RETURNING id, driver_id, status
    `;
    const result = await pool.query(query, [rideId, driverId]);
    return result.rows[0];
  }
}

module.exports = Ride;
