/**
 * Authentication Routes
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public
router.post('/send-otp',   ctrl.sendOTP);
router.post('/verify-otp', ctrl.verifyOTP);

// Protected
router.get('/me',      verifyToken, ctrl.getMe);
router.put('/profile', verifyToken, ctrl.updateProfile);

module.exports = router;
