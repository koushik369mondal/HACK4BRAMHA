const pool = require('../db');
const bcrypt = require('bcrypt');
const { generateOTP, generateToken, sanitizeUser, errorResponse, successResponse } = require('../utils/helpers');
const { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } = require('../utils/constants');

// Send OTP function
const sendOTP = async (phoneNumber, otp) => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`📱 Production: Sending OTP ${otp} to ${phoneNumber}`);
    return { success: true };
  } else {
    console.log(`📱 Development OTP for ${phoneNumber}: ${otp}`);
    return { success: true };
  }
};

// Send OTP controller
const sendOTPController = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { phoneNumber } = req.body;

    // Create user if doesn't exist
    await client.query(
      `INSERT INTO users (phone) VALUES ($1) 
       ON CONFLICT (phone) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
      [phoneNumber]
    );

    // Delete any existing unused OTPs
    await client.query(
      'DELETE FROM otp_codes WHERE phone = $1 AND (is_used = false OR otp_expiry < NOW())',
      [phoneNumber]
    );

    // Generate and store new OTP
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await client.query(
      'INSERT INTO otp_codes (phone, otp, otp_expiry) VALUES ($1, $2, $3)',
      [phoneNumber, otp, expiryTime]
    );

    // Send OTP
    const smsResult = await sendOTP(phoneNumber, otp);

    if (smsResult.success) {
      await client.query('COMMIT');
      res.json(successResponse(
        { expiresIn: OTP_EXPIRY_MINUTES * 60 },
        'OTP sent successfully'
      ));
    } else {
      await client.query('ROLLBACK');
      res.status(500).json(errorResponse('Failed to send OTP'));
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Send OTP error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  } finally {
    client.release();
  }
};

// Verify OTP controller
const verifyOTPController = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { phoneNumber, otp } = req.body;

    // Get latest OTP record
    const otpResult = await client.query(
      `SELECT * FROM otp_codes 
       WHERE phone = $1 AND is_used = false 
       ORDER BY created_at DESC LIMIT 1`,
      [phoneNumber]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json(errorResponse('OTP not found or expired. Please request a new one.'));
    }

    const otpRecord = otpResult.rows[0];

    // Check expiry
    if (new Date() > otpRecord.otp_expiry) {
      await client.query('DELETE FROM otp_codes WHERE id = $1', [otpRecord.id]);
      await client.query('COMMIT');
      return res.status(400).json(errorResponse('OTP has expired. Please request a new one.'));
    }

    // Check attempts
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await client.query('DELETE FROM otp_codes WHERE id = $1', [otpRecord.id]);
      await client.query('COMMIT');
      return res.status(400).json(errorResponse('Too many invalid attempts. Please request a new OTP.'));
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await client.query(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      await client.query('COMMIT');
      
      return res.status(400).json(errorResponse(
        `Invalid OTP. ${OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1)} attempts remaining.`
      ));
    }

    // OTP is valid - mark as used
    await client.query(
      'UPDATE otp_codes SET is_used = true WHERE id = $1',
      [otpRecord.id]
    );

    // Update user
    const userResult = await client.query(
      `UPDATE users 
       SET is_verified = true, last_login = CURRENT_TIMESTAMP 
       WHERE phone = $1 
       RETURNING id, phone, name, is_verified, created_at`,
      [phoneNumber]
    );

    const user = userResult.rows[0];
    const token = generateToken(user.id, phoneNumber);

    await client.query('COMMIT');

    res.json(successResponse({
      token,
      user: {
        ...sanitizeUser(user),
        isNewUser: !user.name
      }
    }, 'Login successful'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Verify OTP error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  } finally {
    client.release();
  }
};

// Validate token controller
const validateTokenController = async (req, res) => {
  try {
    res.json(successResponse({
      user: sanitizeUser(req.user)
    }, 'Token is valid'));
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

// Email/Password Registration
const registerController = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { fullName, email, phone, password } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json(errorResponse('Full name, email, and password are required'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json(errorResponse('Password must be at least 6 characters long'));
    }

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json(errorResponse('User with this email or phone already exists'));
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, phone, password, is_verified, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, full_name, email, phone, role, is_verified, created_at`,
      [fullName, email, phone, hashedPassword, true, 'customer'] // Set as verified for now
    );

    const user = userResult.rows[0];
    const token = generateToken(user.id, user.email);

    await client.query('COMMIT');

    res.status(201).json(successResponse({
      token,
      user: sanitizeUser(user)
    }, 'Registration successful'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  } finally {
    client.release();
  }
};

// Email/Password Login
const loginController = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    // Find user
    const userResult = await client.query(
      'SELECT id, full_name, email, phone, password, role, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json(errorResponse('Invalid email or password'));
    }

    const user = userResult.rows[0];

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(400).json(errorResponse('Email not confirmed. Please verify your account.'));
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json(errorResponse('Invalid email or password'));
    }

    // Update last login
    await client.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user.id, user.email);

    res.json(successResponse({
      token,
      user: sanitizeUser(user)
    }, 'Login successful'));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  } finally {
    client.release();
  }
};

module.exports = {
  sendOTPController,
  verifyOTPController,
  validateTokenController,
  registerController,
  loginController
};
