/**
 * SavedLocation Model
 * Handles saved_locations table operations
 */

const pool = require('../config/database');

class SavedLocation {
  /** Get all saved locations for a user */
  static async getByUserId(user_id) {
    const query = `
      SELECT id, name, address, latitude, longitude, created_at
      FROM saved_locations
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows;
  }

  /** Create a saved location */
  static async create(data) {
    const query = `
      INSERT INTO saved_locations (user_id, name, address, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, address, latitude, longitude, created_at
    `;
    const values = [
      data.user_id, data.name, data.address, data.latitude, data.longitude,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /** Delete a saved location (must belong to user) */
  static async delete(id, user_id) {
    const query = `
      DELETE FROM saved_locations
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [id, user_id]);
    return result.rows[0];
  }

  /** Default IIT Ropar campus locations */
  static getDefaultLocations() {
    return [
      { name: 'IIT Ropar Main Gate',   address: 'IIT Ropar Main Gate, Rupnagar, Punjab' },
      { name: 'Ropar Bus Stand',        address: 'PRTC Bus Stand, Rupnagar, Punjab' },
      { name: 'Ropar Railway Station',  address: 'Rupnagar Railway Station, Punjab' },
      { name: 'Sector 70 Mohali',       address: 'Sector 70, SAS Nagar, Mohali, Punjab' },
    ];
  }
}

module.exports = SavedLocation;
