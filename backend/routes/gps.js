/**
 * GPS Routes
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/gpsController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/log',                      ctrl.logLocation);       // POST /api/gps/log  (driver)
router.get('/ride/:rideId',              ctrl.getGPSLogs);        // GET  /api/gps/ride/:id
router.get('/driver/:driverId/location', ctrl.getDriverLocation); // GET  /api/gps/driver/:id/location

module.exports = router;
