const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../utils/constants');
const { errorResponse } = require('../utils/helpers');

// Enhanced middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Access token required'));
    }

    const token = authHeader.substring(7);

    // Check if it's a demo token (base64 encoded JSON)
    try {
      const decodedDemo = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      if (decodedDemo.demo && decodedDemo.user) {
        // This is a demo token
        console.log('Demo token detected for user:', decodedDemo.user.email);
        req.user = {
          id: decodedDemo.user.id,
          email: decodedDemo.user.email,
          name: decodedDemo.user.name,
          role: decodedDemo.user.role,
          phone: decodedDemo.user.phone || '',
          is_verified: decodedDemo.user.is_verified
        };
        return next();
      }
    } catch (demoError) {
      // Not a demo token, continue with regular JWT verification
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        let message = 'Invalid token';
        if (err.name === 'TokenExpiredError') {
          message = 'Token has expired';
        } else if (err.name === 'JsonWebTokenError') {
          message = 'Invalid token format';
        }
        
        return res.status(401).json(errorResponse(message));
      }

      try {
        const result = await pool.query(
          'SELECT id, phone, name, is_verified, created_at, last_login FROM users WHERE phone = $1',
          [decoded.phone]
        );

        if (result.rows.length === 0) {
          return res.status(401).json(errorResponse('User not found'));
        }

        req.user = result.rows[0];
        next();
      } catch (dbError) {
        console.error('Database error in auth middleware:', dbError);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

module.exports = {
  authenticateToken
};
