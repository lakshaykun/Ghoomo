/**
 * GPS Controller
 * Handles GPS log queries for the user app (read-only from user side)
 */

const Ride = require('../models/Ride');

// ── GET /api/gps/ride/:rideId ──────────────────────────────────────
const getGPSLogs = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    if (ride.student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const limit = parseInt(req.query.limit || '200', 10);
    const logs  = await Ride.getGPSLogs(req.params.rideId, limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GPS logs' });
  }
};

// ── GET /api/gps/driver/:driverId/location ─────────────────────────
const getDriverLocation = async (req, res) => {
  try {
    const location = await Ride.getLatestDriverLocation(req.params.driverId);
    if (!location) {
      return res.status(404).json({ error: 'No location data for this driver' });
    }
    res.json({ location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver location' });
  }
};

// ── POST /api/gps/log  (driver-facing, reused here for completeness) ─
const logLocation = async (req, res) => {
  try {
    const { driver_id, ride_id, latitude, longitude } = req.body;
    if (!driver_id || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'driver_id, latitude, longitude are required' });
    }

    const log = await Ride.addGPSLog({ driver_id, ride_id, latitude, longitude });

    // Update driver's current position in drivers table
    await require('../config/database').query(
      `UPDATE drivers SET current_latitude=$1, current_longitude=$2, updated_at=NOW()
       WHERE id=$3`,
      [latitude, longitude, driver_id]
    );

    // Broadcast to any user tracking this ride
    const io = require('../socket').getIO();
    if (io && ride_id) {
      io.to(`ride:${ride_id}`).emit('driver_location', { latitude, longitude });
    }

    res.status(201).json({ message: 'Location logged', log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log location' });
  }
};

module.exports = { getGPSLogs, getDriverLocation, logLocation };
