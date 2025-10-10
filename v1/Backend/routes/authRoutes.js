const express = require('express');
const router = express.Router();

const { 
  sendOTPController, 
  verifyOTPController, 
  validateTokenController, 
  registerController, 
  loginController 
} = require('../controllers/authController');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { validatePhone, validateOTPFormat } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Email/Password authentication routes
router.post('/register', registerController);
router.post('/login', loginController);

// Send OTP route with rate limiter and phone validation
router.post('/send-otp', otpLimiter, validatePhone, sendOTPController);

// Verify OTP route with rate limiter and validations
router.post('/verify-otp', loginLimiter, validatePhone, validateOTPFormat, verifyOTPController);

// Validate token route with JWT authentication
router.get('/validate-token', authenticateToken, validateTokenController);

module.exports = router;
