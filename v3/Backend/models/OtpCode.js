const mongoose = require('mongoose');

// OTP Code Schema
const otpCodeSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  otp_code: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['verification', 'login', 'password_reset'],
    default: 'verification'
  },
  otp_expiry: {
    type: Date,
    required: true,
    expires: 0 // Auto-remove expired OTPs
  },
  is_used: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OtpCode', otpCodeSchema);