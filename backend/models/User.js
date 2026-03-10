/**
 * User Model
 * Handles user-related database operations
 */

const pool = require('../config/database');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const query = `
      INSERT INTO users (name, email, phone, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, email, phone, role, created_at
    `;
    const values = [userData.name, userData.email, userData.phone, userData.role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get all users (admin)
   */
  static async getAll(limit = 20, offset = 0) {
    const query = 'SELECT id, name, email, phone, role, created_at FROM users LIMIT $1 OFFSET $2';
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Update user
   */
  static async update(id, userData) {
    const query = `
      UPDATE users 
      SET name = COALESCE($2, name), 
          phone = COALESCE($3, phone)
      WHERE id = $1
      RETURNING id, name, email, phone, role, created_at
    `;
    const result = await pool.query(query, [id, userData.name, userData.phone]);
    return result.rows[0];
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
