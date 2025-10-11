const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, PHONE_REGEX, OTP_REGEX } = require('./constants');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate Indian phone number format
const validatePhoneNumber = (phone) => {
  return PHONE_REGEX.test(phone);
};

// Validate OTP format
const validateOTP = (otp) => {
  return OTP_REGEX.test(otp);
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId,
      timestamp: Date.now(),
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Validate required fields
const validateRequiredFields = (fields, requiredFields) => {
  const missingFields = requiredFields.filter(field => !fields[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Sanitize user data for response
const sanitizeUser = (user) => {
  return {
    id: user.id,
    phone: user.phone.replace('+91', ''),
    name: user.name,
    isVerified: user.is_verified,
    memberSince: user.created_at,
    lastLogin: user.last_login
  };
};

// Format error response
const errorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  };
};

// Format success response
const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    ...data,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  generateOTP,
  validatePhoneNumber,
  validateOTP,
  generateToken,
  validateRequiredFields,
  sanitizeUser,
  errorResponse,
  successResponse
};
