const { validatePhoneNumber, validateOTP, validateRequiredFields, errorResponse } = require('../utils/helpers');
const { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } = require('../utils/constants');

// Validate phone number middleware
const validatePhone = (req, res, next) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json(errorResponse('Phone number is required'));
  }

  if (!validatePhoneNumber(phoneNumber)) {
    return res.status(400).json(errorResponse('Invalid phone number format. Use +91XXXXXXXXXX'));
  }

  next();
};

// Validate OTP middleware
const validateOTPFormat = (req, res, next) => {
  const { otp } = req.body;
  
  if (!otp) {
    return res.status(400).json(errorResponse('OTP is required'));
  }

  if (!validateOTP(otp)) {
    return res.status(400).json(errorResponse('OTP must be 6 digits'));
  }

  next();
};

// Validate complaint data middleware
const validateComplaint = (req, res, next) => {
  const { category, description, location, priority = 'medium' } = req.body;
  
  const validation = validateRequiredFields(req.body, ['category', 'description', 'location']);
  
  if (!validation.isValid) {
    return res.status(400).json(
      errorResponse(`Missing required fields: ${validation.missingFields.join(', ')}`)
    );
  }

  if (!COMPLAINT_PRIORITIES.includes(priority)) {
    return res.status(400).json(errorResponse('Invalid priority level'));
  }

  // Sanitize inputs
  req.body.category = category.trim();
  req.body.description = description.trim();
  req.body.location = location.trim();

  next();
};

// Validate profile update data
const validateProfile = (req, res, next) => {
  const { name } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json(errorResponse('Name is required'));
  }

  if (name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json(errorResponse('Name must be between 2 and 50 characters'));
  }

  req.body.name = name.trim();
  next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per page
  
  if (page < 1) {
    return res.status(400).json(errorResponse('Page must be greater than 0'));
  }

  if (limit < 1) {
    return res.status(400).json(errorResponse('Limit must be greater than 0'));
  }

  req.pagination = { page, limit };
  next();
};

module.exports = {
  validatePhone,
  validateOTPFormat,
  validateComplaint,
  validateProfile,
  validatePagination
};
