const rateLimit = require("express-rate-limit");
const { 
  RATE_LIMIT_WINDOW_MS, 
  OTP_RATE_LIMIT, 
  LOGIN_RATE_LIMIT, 
  GENERAL_RATE_LIMIT 
} = require('../utils/constants');

// OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: OTP_RATE_LIMIT,
  message: { 
    success: false, 
    message: 'Too many OTP requests. Try again later.' 
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests from this IP. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: LOGIN_RATE_LIMIT,
  message: { 
    success: false, 
    message: 'Too many login attempts. Try again later.' 
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: GENERAL_RATE_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

module.exports = {
  otpLimiter,
  loginLimiter,
  generalLimiter
};
