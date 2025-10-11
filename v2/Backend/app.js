const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoose = require("mongoose");
const connectDB = require('./db/mongodb'); // Use MongoDB connection
require("dotenv").config();

// Import route modules
const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { authenticateToken } = require('./middleware/auth');

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5174",
    "https://hack-4-bramha-f.vercel.app",
    "https://hack-4-bramha-f.vercel.app/",
    /\.vercel\.app$/
  ],
  credentials: true
}));

// Express middleware - handle req.body properly
app.use((req, res, next) => {
  express.json()(req, res, (err) => {
    if (!req.body) req.body = {};
    next(err);
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    nextWindow: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// JSON parsing middleware with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// ================================
// ROUTES
// ================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "🚀 NaiyakSetu API Server",
    version: "2.0.0",
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      complaints: '/api/complaints/*',
      user: '/api/user/*'
    },
    docs: "API documentation available at /api/health"
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/user', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      messages
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/send-otp',
      'POST /api/auth/verify-otp',
      'GET /api/user/profile',
      'PUT /api/user/profile',
      'POST /api/complaints/anonymous',
      'GET /api/complaints/my',
      'GET /api/complaints/:id'
    ]
  });
});

// ================================
// SERVER STARTUP
// ================================

// Graceful shutdown handlers (temporarily disabled for debugging)
// process.on('SIGINT', async () => {
//   console.log('🔄 Gracefully shutting down...');
//   await mongoose.connection.close();
//   console.log('✅ Database connections closed');
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   console.log('🔄 Received SIGTERM, gracefully shutting down...');
//   await mongoose.connection.close();
//   console.log('✅ Database connections closed');
//   process.exit(0);
// });

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 NaiyakSetu server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '⚠️  Using default (change in production!)'}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try using a different port by setting the PORT environment variable');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

module.exports = app;
