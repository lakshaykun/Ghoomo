/**
 * Authentication Controller
 * Handles user registration, login, and OTP verification
 */

const User = require('../models/User');

/**
 * Register user
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    // Validation
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({ name, email, phone, role });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user (placeholder for OTP logic)
 */
const login = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In production: Send OTP to email/phone
    console.log('OTP would be sent to:', user.phone);

    res.json({
      message: 'OTP sent to registered phone',
      user_id: user.id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Verify OTP and login
 */
const verifyOTP = async (req, res) => {
  try {
    const { user_id, otp } = req.body;

    if (!user_id || !otp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In production: Verify OTP from cache/database
    // For now: Accept any 6-digit OTP
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate JWT token (placeholder)
    const token = 'jwt-token-placeholder';

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

module.exports = {
  register,
  login,
  verifyOTP
};
