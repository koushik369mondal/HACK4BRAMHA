const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const pool = require('./db'); // Use centralized database connection
require("dotenv").config();

// Import route modules
const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5174",
  credentials: true
}));

// Express middleware - handle req.body properly
app.use((req, res, next) => {
  express.json()(req, res, (err) => {
    if (!req.body) req.body = {};
    next(err);
  });
});

app.use(express.urlencoded({ extended: true }));

// Enhanced rate limiting configurations
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP requests per IP
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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per IP
  message: {
    success: false,
    message: 'Too many login attempts. Try again later.'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 general requests per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// ================================
// PUBLIC ENDPOINTS
// ================================

// Public endpoint to track complaint by complaint ID (no authentication required)
app.get("/api/track/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;

    const result = await pool.query(
      `SELECT 
        complaint_id,
        title,
        category,
        description,
        status,
        priority,
        created_at,
        updated_at,
        reporter_type
       FROM complaints 
       WHERE complaint_id = $1`,
      [complaintId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.json({
      success: true,
      complaint: result.rows[0]
    });
  } catch (error) {
    console.error("Failed to track complaint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track complaint"
    });
  }
});

// Public endpoint to get recent complaints (for tracking dashboard)
app.get("/api/complaints/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT 
        complaint_id,
        title,
        category,
        status,
        priority,
        created_at,
        reporter_type
       FROM complaints 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      complaints: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Failed to fetch recent complaints:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent complaints"
    });
  }
});

// Public endpoint to get complaint statistics
app.get("/api/complaints/stats", async (req, res) => {
  try {
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_complaints,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
       FROM complaints`
    );

    const categoryResult = await pool.query(
      `SELECT 
        category,
        COUNT(*) as count
       FROM complaints 
       GROUP BY category 
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      stats: {
        total: parseInt(statsResult.rows[0].total_complaints),
        status: {
          pending: parseInt(statsResult.rows[0].pending),
          in_progress: parseInt(statsResult.rows[0].in_progress),
          resolved: parseInt(statsResult.rows[0].resolved),
          closed: parseInt(statsResult.rows[0].closed)
        },
        byCategory: categoryResult.rows
      }
    });
  } catch (error) {
    console.error("Failed to fetch complaint stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaint statistics"
    });
  }
});

// ================================
// ROUTE REGISTRATIONS
// ================================

// Route registrations with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);

// Anonymous complaint submission (no authentication required)
app.post('/api/complaints/anonymous', async (req, res) => {
  try {
    // Create a temporary request object that mimics authenticated request
    const mockReq = {
      ...req,
      user: null // No user for anonymous complaints
    };

    // Import the complaint controller
    const { createComplaint } = require('./controllers/complaintController');
    
    // Call the existing createComplaint function
    await createComplaint(mockReq, res);
  } catch (error) {
    console.error('Anonymous complaint submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint'
    });
  }
});

// ================================
// GENERAL ROUTES
// ================================

// Root endpoint with API documentation
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CivicSecure Backend API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    documentation: {
      authentication: {
        sendOtp: "POST /api/auth/send-otp",
        verifyOtp: "POST /api/auth/verify-otp",
        validateToken: "GET /api/auth/validate-token"
      },
      complaints: {
        create: "POST /api/complaints",
        getUserComplaints: "GET /api/complaints/my",
        getComplaintById: "GET /api/complaints/:id",
        getUserStats: "GET /api/complaints/stats/my",
        trackPublic: "GET /api/track/:complaintId",
        recentPublic: "GET /api/complaints/recent",
        statsPublic: "GET /api/complaints/stats"
      },
      users: {
        updateProfile: "PUT /api/users/profile"
      },
      general: {
        health: "GET /api/health",
        documentation: "GET /"
      }
    }
  });
});

// Enhanced health check
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const dbTest = await pool.query('SELECT NOW()');
    
    res.json({
      success: true,
      message: "CivicSecure API is healthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        timestamp: dbTest.rows[0].now
      },
      environment: process.env.NODE_ENV || 'development',
      version: "2.0.0"
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ================================
// ERROR HANDLING
// ================================

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: "Check the API documentation at GET /"
  });
});

// ================================
// SERVER STARTUP
// ================================

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, gracefully shutting down...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 CivicSecure server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '⚠️  Using default (change in production!)'}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
});

module.exports = app;