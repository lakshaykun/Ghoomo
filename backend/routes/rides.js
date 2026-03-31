/**
 * Rides Routes  –  student-facing
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/rideController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/active',           ctrl.getActiveRide);      // GET  /api/rides/active
router.get('/history',          ctrl.getRideHistory);     // GET  /api/rides/history
router.get('/nearby-drivers',   ctrl.getNearbyDrivers);   // GET  /api/rides/nearby-drivers
router.post('/request',         ctrl.requestRide);        // POST /api/rides/request
router.get('/request/:id',      ctrl.getRideRequest);     // GET  /api/rides/request/:id
router.delete('/request/:id',   ctrl.cancelRideRequest);  // DEL  /api/rides/request/:id
router.get('/:id',              ctrl.getRide);            // GET  /api/rides/:id
router.post('/:id/rate',        ctrl.rateDriver);         // POST /api/rides/:id/rate

module.exports = router;
