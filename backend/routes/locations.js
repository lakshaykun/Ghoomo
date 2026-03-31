/**
 * Locations Routes  –  saved favourite places
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/locationController');
const { verifyToken } = require('../middleware/auth');

router.get('/defaults',       ctrl.getDefaultLocations);          // GET  /api/locations/defaults (public)

router.use(verifyToken);

router.get('/saved',          ctrl.getSavedLocations);            // GET  /api/locations/saved
router.post('/saved',         ctrl.addSavedLocation);             // POST /api/locations/saved
router.delete('/saved/:id',   ctrl.deleteSavedLocation);          // DEL  /api/locations/saved/:id

module.exports = router;
