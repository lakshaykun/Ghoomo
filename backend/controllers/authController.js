/**
 * Authentication Controller
 * Phone-number OTP login + JWT issuance
 */

const User = require('../models/User');
const pool = require('../config/database');
const jwt  = require('jsonwebtoken');

const JWT_SECRET   = process.env.JWT_SECRET || 'ghoomo-dev-secret';
const OTP_EXPIRES  = 10; // minutes

/** Generate a random 6-digit OTP */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Sign JWT for a user */
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone_number },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// ── POST /api/auth/send-otp ────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { phone_number, name } = req.body;
    if (!phone_number) {
      return res.status(400).json({ error: 'phone_number is required' });
    }

    // Auto-register if first time
    let user = await User.findByPhone(phone_number);
    if (!user) {
      if (!name) {
        return res.status(400).json({
          error: 'New user – please also provide your name'
        });
      }
      user = await User.create({ name, phone_number, role: 'student' });
    }

    // Store OTP (invalidate old ones for this phone)
    const otp      = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES * 60 * 1000);

    await pool.query(`UPDATE otp_codes SET used = true WHERE phone_number=$1`, [phone_number]);
    await pool.query(
      `INSERT INTO otp_codes (phone_number, otp, expires_at) VALUES ($1,$2,$3)`,
      [phone_number, otp, expiresAt]
    );

    // In production: send via SMS gateway (Twilio / MSG91 / Fast2SMS)
    console.log(`[OTP] ${phone_number} → ${otp}`);

    res.json({
      message: `OTP sent to ${phone_number}`,
      user_id: user.id,
      // Include OTP only in dev
      ...(process.env.NODE_ENV !== 'production' && { dev_otp: otp }),
    });
  } catch (err) {
    console.error('sendOTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// ── POST /api/auth/verify-otp ──────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { phone_number, otp } = req.body;
    if (!phone_number || !otp) {
      return res.status(400).json({ error: 'phone_number and otp are required' });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'OTP must be 6 digits' });
    }

    const row = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone_number=$1 AND otp=$2 AND used=false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone_number, otp]
    );
    if (!row.rows.length) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await pool.query(`UPDATE otp_codes SET used=true WHERE id=$1`, [row.rows[0].id]);

    const user = await User.findByPhone(phone_number);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = signToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id:           user.id,
        name:         user.name,
        phone_number: user.phone_number,
        role:         user.role,
      },
    });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ── PUT /api/auth/profile ──────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const updated = await User.update(req.user.id, req.body);
    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Legacy handlers kept for compatibility
const register = async (req, res) => {
  return res.status(410).json({ error: 'Use /api/auth/send-otp for registration' });
};
const login = async (req, res) => {
  return res.status(410).json({ error: 'Use /api/auth/send-otp for login' });
};

module.exports = { sendOTP, verifyOTP, getMe, updateProfile, register, login };

