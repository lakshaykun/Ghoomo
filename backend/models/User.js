/**
 * User Model
 * Handles user-related database operations
 */

const pool = require('../config/database');

const PUBLIC_COLS = 'id, name, email, phone_number, role, created_at, updated_at';

class User {
  /**
   * Create a new user (student by default)
   */
  static async create(userData) {
    const query = `
      INSERT INTO users (name, email, phone_number, role)
      VALUES ($1, $2, $3, $4)
      RETURNING ${PUBLIC_COLS}
    `;
    const values = [
      userData.name,
      userData.email || null,
      userData.phone_number,
      userData.role || 'student',
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /** Find user by phone number */
  static async findByPhone(phone_number) {
    const query = `SELECT ${PUBLIC_COLS} FROM users WHERE phone_number = $1`;
    const result = await pool.query(query, [phone_number]);
    return result.rows[0];
  }

  /** Find user by email */
  static async findByEmail(email) {
    const query = `SELECT ${PUBLIC_COLS} FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /** Find user by ID */
  static async findById(id) {
    const query = `SELECT ${PUBLIC_COLS} FROM users WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /** Get all users (admin) */
  static async getAll(limit = 20, offset = 0) {
    const query = `SELECT ${PUBLIC_COLS} FROM users LIMIT $1 OFFSET $2`;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /** Update user profile */
  static async update(id, userData) {
    const query = `
      UPDATE users
      SET name         = COALESCE($2, name),
          phone_number = COALESCE($3, phone_number),
          email        = COALESCE($4, email)
      WHERE id = $1
      RETURNING ${PUBLIC_COLS}
    `;
    const result = await pool.query(query, [
      id,
      userData.name        || null,
      userData.phone_number || null,
      userData.email       || null,
    ]);
    return result.rows[0];
  }

  /** Delete user */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
