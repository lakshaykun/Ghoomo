/**
 * Ride Controller
 * Handles ride_requests, ride lifecycle, ratings, and history
 */

const Ride = require('../models/Ride');
const pool = require('../config/database');

// ── POST /api/rides/request ────────────────────────────────────────
const requestRide = async (req, res) => {
  try {
    const student_id = req.user.id;
    const {
      pickup_location, drop_location,
      pickup_latitude,  pickup_longitude,
      drop_latitude,    drop_longitude,
    } = req.body;

    if (!pickup_location || !drop_location ||
        pickup_latitude == null || pickup_longitude == null ||
        drop_latitude   == null || drop_longitude == null) {
      return res.status(400).json({ error: 'All location fields are required' });
    }

    // Prevent duplicate active requests
    const existing = await Ride.getActiveRequest(student_id);
    if (existing) {
      return res.status(409).json({
        error: 'You already have an active ride request',
        request_id: existing.id,
      });
    }

    const request = await Ride.createRequest({
      student_id,
      pickup_location, drop_location,
      pickup_latitude,  pickup_longitude,
      drop_latitude,    drop_longitude,
    });

    // Async: find nearest driver and dispatch
    dispatchToNearestDriver(request).catch(err =>
      console.error('Dispatch error:', err)
    );

    res.status(201).json({
      message: 'Ride request created',
      request_id: request.id,
      status: request.status,
    });
  } catch (err) {
    console.error('requestRide error:', err);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
};

/** Internal: find nearest driver and notify via socket */
async function dispatchToNearestDriver(rideRequest) {
  const drivers = await Ride.findNearbyDrivers(
    rideRequest.pickup_latitude,
    rideRequest.pickup_longitude,
    10 // km
  );

  if (!drivers.length) {
    console.log(`[Dispatch] No drivers nearby for request ${rideRequest.id}`);
    return;
  }

  const nearest = drivers[0];
  console.log(`[Dispatch] Sending request ${rideRequest.id} to driver ${nearest.id}`);

  // Notify driver via socket (socket reference injected at server level)
  const io = require('../socket').getIO();
  if (io) {
    io.to(`driver:${nearest.id}`).emit('new_ride_request', {
      request_id:       rideRequest.id,
      pickup_location:  rideRequest.pickup_location,
      drop_location:    rideRequest.drop_location,
      pickup_latitude:  rideRequest.pickup_latitude,
      pickup_longitude: rideRequest.pickup_longitude,
      drop_latitude:    rideRequest.drop_latitude,
      drop_longitude:   rideRequest.drop_longitude,
    });
  }
}

// ── GET /api/rides/request/:id ─────────────────────────────────────
const getRideRequest = async (req, res) => {
  try {
    const request = await Ride.findRequestById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Ride request not found' });

    // Ensure student can only see their own request
    if (request.student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride request' });
  }
};

// ── DELETE /api/rides/request/:id ─────────────────────────────────
const cancelRideRequest = async (req, res) => {
  try {
    const cancelled = await Ride.cancelRequest(req.params.id, req.user.id);
    if (!cancelled) {
      return res.status(404).json({ error: 'Request not found or cannot be cancelled' });
    }
    res.json({ message: 'Ride request cancelled', request: cancelled });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel request' });
  }
};

// ── GET /api/rides/active ──────────────────────────────────────────
const getActiveRide = async (req, res) => {
  try {
    // Check for an active ride first
    const ride = await Ride.getActiveRide(req.user.id);
    if (ride) return res.json({ type: 'ride', data: ride });

    // Fall back to active request
    const request = await Ride.getActiveRequest(req.user.id);
    if (request) return res.json({ type: 'request', data: request });

    res.json({ type: null, data: null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active ride' });
  }
};

// ── GET /api/rides/:id ─────────────────────────────────────────────
const getRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    if (ride.student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ ride });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
};

// ── GET /api/rides/history ─────────────────────────────────────────
const getRideHistory = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit  || '20', 10);
    const offset = parseInt(req.query.offset || '0',  10);
    const rides  = await Ride.getHistory(req.user.id, limit, offset);
    res.json({ rides });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride history' });
  }
};

// ── POST /api/rides/:id/rate ───────────────────────────────────────
const rateDriver = async (req, res) => {
  try {
    const { rating, review_text } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1–5' });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.student_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (ride.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate a completed ride' });
    }

    const alreadyRated = await Ride.hasRating(ride.id, req.user.id);
    if (alreadyRated) return res.status(409).json({ error: 'You already rated this ride' });

    const ratingRecord = await Ride.createRating({
      ride_id:     ride.id,
      student_id:  req.user.id,
      driver_id:   ride.driver_id,
      rating,
      review_text,
    });

    res.status(201).json({ message: 'Rating submitted', rating: ratingRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

// ── GET /api/rides/nearby-drivers ─────────────────────────────────
const getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });
    const drivers = await Ride.findNearbyDrivers(
      parseFloat(lat), parseFloat(lng), parseFloat(radius || '5')
    );
    res.json({
      drivers: drivers.map(d => ({
        id:             d.id,
        name:           d.name,
        vehicle_number: d.vehicle_number,
        vehicle_type:   d.vehicle_type,
        distance_km:    parseFloat(d.distance_km).toFixed(2),
        lat:            d.current_latitude,
        lng:            d.current_longitude,
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to find nearby drivers' });
  }
};

module.exports = {
  requestRide,
  getRideRequest,
  cancelRideRequest,
  getActiveRide,
  getRide,
  getRideHistory,
  rateDriver,
  getNearbyDrivers,
};
