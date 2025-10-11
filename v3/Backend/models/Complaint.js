const mongoose = require('mongoose');

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  complaint_id: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true,
    enum: [
      'Roads & Infrastructure',
      'Water Supply', 
      'Electricity',
      'Sanitation & Waste',
      'Public Safety',
      'Traffic & Transportation',
      'Environment',
      'Health Services',
      'Plot Issue',
      'Plumbing',
      'Garbage',
      'Noise',
      'Other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['submitted', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'submitted',
    index: true
  },
  reporter_type: {
    type: String,
    enum: ['anonymous', 'pseudonymous', 'verified'],
    default: 'anonymous'
  },
  contact_method: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: 'email'
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    address: String,
    latitude: { type: Number, index: '2dsphere' },
    longitude: { type: Number, index: '2dsphere' },
    formatted: String
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
    index: true
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  estimated_resolution_date: Date,
  resolved_at: Date,
  attachments: [{
    filename: String,
    original_name: String,
    file_type: String,
    file_size: Number,
    file_path: String,
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  aadhaar_data: {
    aadhaar_number: String,
    name: String,
    gender: String,
    state: String,
    district: String,
    verified_at: Date
  },
  status_history: [{
    status: String,
    notes: String,
    changed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile'
    },
    changed_at: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile'
    },
    comment: String,
    is_internal: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create compound index for location queries
complaintSchema.index({ "location.latitude": 1, "location.longitude": 1 });

// Auto-generate complaint_id before saving
complaintSchema.pre('save', async function(next) {
  if (!this.complaint_id) {
    try {
      const count = await this.constructor.countDocuments();
      this.complaint_id = `NS${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);