module.exports = {
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-secret-key-change-in-production',
  JWT_EXPIRES_IN: '30d',
  
  // OTP
  OTP_EXPIRY_MINUTES: 5,
  OTP_MAX_ATTEMPTS: 3,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  OTP_RATE_LIMIT: 5,
  LOGIN_RATE_LIMIT: 10,
  GENERAL_RATE_LIMIT: 100,
  
  // Validation
  PHONE_REGEX: /^\+91[6-9]\d{9}$/,
  OTP_REGEX: /^\d{6}$/,
  
  // Complaint Status
  COMPLAINT_STATUSES: ['submitted', 'in_progress', 'under_review', 'resolved', 'closed', 'rejected'],
  COMPLAINT_PRIORITIES: ['low', 'medium', 'high', 'urgent'],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50
};
