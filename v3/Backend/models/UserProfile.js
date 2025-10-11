const mongoose = require('mongoose');

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar_url: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'staff'],
    default: 'customer',
    index: true
  },
  is_verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('UserProfile', userProfileSchema);