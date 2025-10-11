const { UserProfile, OtpCode } = require('../models');
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
  try {
    const { phoneNumber } = req.body;

    // Delete any existing unused OTPs
    await OtpCode.deleteMany({
      phone: phoneNumber,
      $or: [
        { is_used: false },
        { otp_expiry: { $lt: new Date() } }
      ]
    });

    // Generate and store new OTP
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OtpCode.create({
      phone: phoneNumber,
      otp_code: otp,
      otp_expiry: expiryTime,
      purpose: 'verification'
    });

    // Send OTP
    const smsResult = await sendOTP(phoneNumber, otp);

    if (smsResult.success) {
      res.json(successResponse(
        { expiresIn: OTP_EXPIRY_MINUTES * 60 },
        'OTP sent successfully'
      ));
    } else {
      res.status(500).json(errorResponse('Failed to send OTP'));
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

// Verify OTP controller
const verifyOTPController = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Get latest OTP record
    const otpRecord = await OtpCode.findOne({
      phone: phoneNumber,
      is_used: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json(errorResponse('No valid OTP found for this phone number'));
    }

    // Check if OTP has expired
    if (otpRecord.otp_expiry < new Date()) {
      await OtpCode.deleteOne({ _id: otpRecord._id });
      return res.status(400).json(errorResponse('OTP has expired'));
    }

    // Check if too many attempts
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await OtpCode.deleteOne({ _id: otpRecord._id });
      return res.status(400).json(errorResponse('Too many OTP attempts. Please request a new OTP'));
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      await OtpCode.findByIdAndUpdate(otpRecord._id, {
        $inc: { attempts: 1 }
      });
      
      const remainingAttempts = OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return res.status(400).json(errorResponse(
        `Invalid OTP. ${remainingAttempts} attempts remaining`
      ));
    }

    // Mark OTP as used
    await OtpCode.findByIdAndUpdate(otpRecord._id, { is_used: true });

    // Find or create user
    let user = await UserProfile.findOne({ phone: phoneNumber });
    
    if (!user) {
      user = await UserProfile.create({
        phone: phoneNumber,
        email: `${phoneNumber}@temp.local`, // Temporary email
        name: `User ${phoneNumber}`,
        password: 'otp-verified', // Placeholder password for OTP users
        role: 'customer'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json(successResponse({
      token,
      user: sanitizeUser(user.toObject())
    }, 'OTP verified successfully'));

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json(errorResponse('Internal server error'));
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
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json(errorResponse('Name, email, and password are required'));
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
    const existingUser = await UserProfile.findOne({
      $or: [{ email }, { phone: phone || '' }]
    });

    if (existingUser) {
      return res.status(400).json(errorResponse('User with this email or phone already exists'));
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await UserProfile.create({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      is_verified: true, // Set as verified for now
      role: 'customer'
    });

    const token = generateToken(user._id);

    res.status(201).json(successResponse({
      token,
      user: sanitizeUser(user.toObject())
    }, 'Registration successful'));

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json(errorResponse(`${field} already exists`));
    }
    res.status(500).json(errorResponse('Internal server error'));
  }
};

// Email/Password Login
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    // Find user
    const user = await UserProfile.findOne({ email });

    if (!user) {
      return res.status(400).json(errorResponse('Invalid email or password'));
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(400).json(errorResponse('Email not confirmed. Please verify your account.'));
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json(errorResponse('Invalid email or password'));
    }

    // Update last login (using updatedAt field)
    user.updatedAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json(successResponse({
      token,
      user: sanitizeUser(user.toObject())
    }, 'Login successful'));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

module.exports = {
  sendOTPController,
  verifyOTPController,
  validateTokenController,
  registerController,
  loginController
};
