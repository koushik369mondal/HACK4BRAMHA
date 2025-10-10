const pool = require('../db');
const { sanitizeUser, errorResponse, successResponse } = require('../utils/helpers');

// Create user profile controller
const createProfileController = async (req, res) => {
  try {
    const { user_id, email, phone, name, avatar_url } = req.body;

    // Check if profile already exists
    const existingProfile = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [user_id]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json(errorResponse('Profile already exists for this user'));
    }

    // Create new profile
    const result = await pool.query(
      'INSERT INTO user_profiles (user_id, email, phone, name, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, email, phone, name, avatar_url]
    );

    res.status(201).json(successResponse({
      profile: result.rows[0]
    }, 'Profile created successfully'));
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

// Update user profile controller
const updateProfileController = async (req, res) => {
  try {
    const { fullName, email, phone, aadhaar } = req.body;
    const userId = req.user?.id || req.params.userId;

    if (!userId) {
      return res.status(400).json(errorResponse('User ID is required'));
    }

    // Check if this is a demo user
    if (userId.startsWith('demo-')) {
      // For demo users, return a success response but don't actually update anything
      const demoProfile = {
        user_id: userId,
        name: fullName || req.user.name,
        email: email || req.user.email,
        phone: phone || req.user.phone,
        avatar_url: '',
        role: req.user.role,
        is_verified: req.user.is_verified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return res.json(successResponse({
        profile: demoProfile
      }, 'Demo profile updated successfully (simulated)'));
    }

    // First check if profile exists
    const existingProfile = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      // Create new profile if doesn't exist
      const createQuery = `
        INSERT INTO user_profiles (user_id, name, email, phone) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
      `;
      const createValues = [userId, fullName || '', email || '', phone || ''];
      const createResult = await pool.query(createQuery, createValues);
      
      return res.json(successResponse({
        profile: createResult.rows[0]
      }, 'Profile created successfully'));
    }

    // Build dynamic update query for existing profile
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(fullName);
      paramCount++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    // Add aadhaar field if provided (you may need to add this column to schema)
    if (aadhaar !== undefined) {
      // For now, we'll store it in a custom field or skip if column doesn't exist
      // updateFields.push(`aadhaar = $${paramCount}`);
      // values.push(aadhaar);
      // paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('No fields to update'));
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE user_profiles 
      SET ${updateFields.join(', ')} 
      WHERE user_id = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('User profile not found'));
    }

    res.json(successResponse({
      profile: result.rows[0]
    }, 'Profile updated successfully'));
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

// Get user profile controller
const getProfileController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.query;
    const currentUserId = req.user?.id;
    
    // Check if this is a demo user
    if (currentUserId && currentUserId.startsWith('demo-')) {
      // Return demo user profile from req.user data
      const demoProfile = {
        user_id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        avatar_url: '',
        role: req.user.role,
        is_verified: req.user.is_verified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return res.json(successResponse({
        profile: demoProfile
      }, 'Demo profile retrieved successfully'));
    }
    
    let query;
    let queryParams;
    
    if (userId) {
      // Check if requested userId is a demo user
      if (userId.startsWith('demo-')) {
        return res.status(400).json(errorResponse('Demo user profiles cannot be accessed by ID'));
      }
      query = 'SELECT * FROM user_profiles WHERE user_id = $1';
      queryParams = [userId];
    } else if (email) {
      query = 'SELECT * FROM user_profiles WHERE email = $1';
      queryParams = [email];
    } else if (currentUserId) {
      query = 'SELECT * FROM user_profiles WHERE user_id = $1';
      queryParams = [currentUserId];
    } else {
      return res.status(400).json(errorResponse('User ID or email is required'));
    }
    
    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      // Return empty profile structure instead of error
      return res.json(successResponse({
        profile: {
          name: '',
          email: email || '',
          phone: '',
          avatar_url: '',
          // aadhaar: '' // Add when column exists
        }
      }, 'No profile found, empty profile returned'));
    }

    res.json(successResponse({
      profile: result.rows[0]
    }, 'Profile retrieved successfully'));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

// Get current user profile controller
const getCurrentProfileController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    
    if (!userId && !userEmail) {
      return res.status(401).json(errorResponse('User not authenticated'));
    }
    
    // Check if this is a demo user
    if (userId && userId.startsWith('demo-')) {
      // Return demo user profile from req.user data
      const demoProfile = {
        user_id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        avatar_url: '',
        role: req.user.role,
        is_verified: req.user.is_verified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return res.json(successResponse({
        profile: demoProfile
      }, 'Demo profile retrieved successfully'));
    }
    
    let query;
    let queryParams;
    
    if (userId) {
      query = 'SELECT * FROM user_profiles WHERE user_id = $1';
      queryParams = [userId];
    } else {
      query = 'SELECT * FROM user_profiles WHERE email = $1';
      queryParams = [userEmail];
    }
    
    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      // Return empty profile structure for frontend to populate
      return res.json(successResponse({
        profile: {
          name: '',
          email: userEmail || '',
          phone: '',
          avatar_url: ''
        }
      }, 'No profile found, empty profile returned'));
    }

    res.json(successResponse({
      profile: result.rows[0]
    }, 'Profile retrieved successfully'));
  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};

module.exports = {
  createProfileController,
  updateProfileController,
  getProfileController,
  getCurrentProfileController
};
