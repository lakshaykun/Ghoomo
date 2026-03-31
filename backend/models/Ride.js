/**
 * Ride Model
 * Handles ride_requests, rides, gps_logs, and driver_ratings DB operations
 */

const pool = require('../config/database');

class Ride {
  // ── Ride Requests ──────────────────────────────────────────────

  /** Create a new ride request */
  static async createRequest(data) {
    const query = `
      INSERT INTO ride_requests
        (student_id, pickup_location, drop_location,
         pickup_latitude, pickup_longitude,
         drop_latitude,  drop_longitude,
         status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
      RETURNING *
    `;
    const values = [
      data.student_id,
      data.pickup_location,
      data.drop_location,
      data.pickup_latitude,
      data.pickup_longitude,
      data.drop_latitude,
      data.drop_longitude,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /** Find ride request by id (with joined driver info) */
  static async findRequestById(id) {
    const query = `
      SELECT rr.*,
             u.name            AS student_name,
             u.phone_number    AS student_phone,
             d.id              AS driver_db_id,
             du.name           AS driver_name,
             du.phone_number   AS driver_phone,
             d.vehicle_number,
             d.vehicle_type,
             d.current_latitude  AS driver_lat,
             d.current_longitude AS driver_lng,
             (SELECT ROUND(AVG(rating)::NUMERIC,1)
              FROM driver_ratings WHERE driver_id = d.id) AS driver_rating
      FROM   ride_requests rr
      JOIN   users u    ON u.id  = rr.student_id
      LEFT JOIN drivers d   ON d.id  = rr.matched_driver_id
      LEFT JOIN users   du  ON du.id = d.user_id
      WHERE  rr.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /** Get active (pending/matched) request for a student */
  static async getActiveRequest(student_id) {
    const query = `
      SELECT * FROM ride_requests
      WHERE student_id = $1
        AND status IN ('pending','matched')
      ORDER BY request_time DESC LIMIT 1
    `;
    const result = await pool.query(query, [student_id]);
    return result.rows[0];
  }

  /** Cancel a ride request */
  static async cancelRequest(id, student_id) {
    const query = `
      UPDATE ride_requests
      SET    status = 'cancelled'
      WHERE  id = $1 AND student_id = $2 AND status IN ('pending','matched')
      RETURNING *
    `;
    const result = await pool.query(query, [id, student_id]);
    return result.rows[0];
  }

  /** Find nearby available approved drivers (Haversine) */
  static async findNearbyDrivers(lat, lng, radiusKm = 5) {
    const query = `
      SELECT d.*, u.name, u.phone_number,
        (6371 * acos(
          GREATEST(-1, LEAST(1,
            cos(radians($1)) * cos(radians(d.current_latitude)) *
            cos(radians(d.current_longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(d.current_latitude))
          ))
        )) AS distance_km
      FROM drivers d
      JOIN users u ON u.id = d.user_id
      WHERE d.status      = 'approved'
        AND d.is_available = true
        AND d.current_latitude  IS NOT NULL
        AND d.current_longitude IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 10
    `;
    const result = await pool.query(query, [lat, lng, radiusKm]);
    return result.rows.filter(r => parseFloat(r.distance_km) <= radiusKm);
  }

  // ── Rides ──────────────────────────────────────────────────────

  /** Find a ride by ID (with joined info) */
  static async findById(id) {
    const query = `
      SELECT r.*,
             u.name            AS student_name,
             u.phone_number    AS student_phone,
             du.name           AS driver_name,
             du.phone_number   AS driver_phone,
             d.vehicle_number,
             d.vehicle_type,
             d.current_latitude  AS driver_lat,
             d.current_longitude AS driver_lng,
             (SELECT ROUND(AVG(rating)::NUMERIC,1)
              FROM driver_ratings WHERE driver_id = d.id) AS driver_rating
      FROM rides r
      JOIN users   u  ON u.id  = r.student_id
      JOIN drivers d  ON d.id  = r.driver_id
      JOIN users   du ON du.id = d.user_id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /** Get active ride (accepted/started) for student */
  static async getActiveRide(student_id) {
    const query = `
      SELECT r.*,
             du.name  AS driver_name, du.phone_number AS driver_phone,
             d.vehicle_number, d.vehicle_type,
             d.current_latitude  AS driver_lat,
             d.current_longitude AS driver_lng,
             (SELECT ROUND(AVG(rating)::NUMERIC,1)
              FROM driver_ratings WHERE driver_id = d.id) AS driver_rating
      FROM rides r
      JOIN drivers d  ON d.id  = r.driver_id
      JOIN users   du ON du.id = d.user_id
      WHERE r.student_id = $1
        AND r.status IN ('accepted','started')
      ORDER BY r.created_at DESC LIMIT 1
    `;
    const result = await pool.query(query, [student_id]);
    return result.rows[0];
  }

  /** Get ride history for a student */
  static async getHistory(student_id, limit = 20, offset = 0) {
    const query = `
      SELECT r.id, r.pickup_location, r.drop_location, r.fare, r.distance,
             r.status, r.start_time, r.end_time, r.created_at,
             du.name AS driver_name, d.vehicle_number, d.vehicle_type,
             dr.rating, dr.review_text
      FROM rides r
      JOIN drivers d  ON d.id  = r.driver_id
      JOIN users   du ON du.id = d.user_id
      LEFT JOIN driver_ratings dr ON dr.ride_id = r.id AND dr.student_id = $1
      WHERE r.student_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [student_id, limit, offset]);
    return result.rows;
  }

  // ── GPS Logs ───────────────────────────────────────────────────

  /** Insert a GPS log entry */
  static async addGPSLog(data) {
    const query = `
      INSERT INTO gps_logs (driver_id, ride_id, latitude, longitude)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [
      data.driver_id, data.ride_id || null, data.latitude, data.longitude,
    ]);
    return result.rows[0];
  }

  /** Get GPS logs for a ride */
  static async getGPSLogs(ride_id, limit = 200) {
    const query = `
      SELECT latitude, longitude, timestamp
      FROM gps_logs
      WHERE ride_id = $1
      ORDER BY timestamp ASC LIMIT $2
    `;
    const result = await pool.query(query, [ride_id, limit]);
    return result.rows;
  }

  /** Get latest driver GPS position */
  static async getLatestDriverLocation(driver_id) {
    const query = `
      SELECT latitude, longitude, timestamp
      FROM gps_logs
      WHERE driver_id = $1
      ORDER BY timestamp DESC LIMIT 1
    `;
    const result = await pool.query(query, [driver_id]);
    return result.rows[0];
  }

  // ── Driver Ratings ─────────────────────────────────────────────

  /** Save a rating */
  static async createRating(data) {
    const query = `
      INSERT INTO driver_ratings (ride_id, student_id, driver_id, rating, review_text)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `;
    const values = [
      data.ride_id, data.student_id, data.driver_id,
      data.rating,  data.review_text || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /** Check if ride already rated by student */
  static async hasRating(ride_id, student_id) {
    const query = `SELECT id FROM driver_ratings WHERE ride_id=$1 AND student_id=$2`;
    const result = await pool.query(query, [ride_id, student_id]);
    return result.rows.length > 0;
  }
}

module.exports = Ride;

