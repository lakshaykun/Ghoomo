/**
 * Authentication Routes
 * Placeholder for testing
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);

module.exports = router;
