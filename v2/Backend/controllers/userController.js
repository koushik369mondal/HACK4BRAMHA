const { UserProfile } = require('../models');
const { sanitizeUser, errorResponse, successResponse } = require('../utils/helpers');

// Create user profile controller
const createProfileController = async (req, res) => {
  try {
    const { user_id, email, phone, name, avatar_url } = req.body;

    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({ user_id });

    if (existingProfile) {
      return res.status(409).json(errorResponse('Profile already exists for this user'));
    }

    // Create new profile
    const newProfile = new UserProfile({
      user_id,
      email,
      phone,
      full_name: name,
      avatar_url
    });

    await newProfile.save();

    res.status(201).json(successResponse({
      profile: newProfile.toObject()
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
        full_name: fullName || req.user.full_name,
        email: email || req.user.email,
        phone: phone || req.user.phone,
        avatar_url: '',
        role: req.user.role,
        is_verified: req.user.is_verified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.json(successResponse({
        profile: demoProfile
      }, 'Demo profile updated successfully (simulated)'));
    }

    // Find and update profile or create if doesn't exist
    let profile = await UserProfile.findOne({ _id: userId });

    if (!profile) {
      // Create new profile if doesn't exist
      profile = new UserProfile({
        _id: userId,
        full_name: fullName || '',
        email: email || '',
        phone: phone || '',
        aadhaar_number: aadhaar || ''
      });
    } else {
      // Update existing profile
      if (fullName !== undefined) profile.full_name = fullName;
      if (email !== undefined) profile.email = email;
      if (phone !== undefined) profile.phone = phone;
      if (aadhaar !== undefined) profile.aadhaar_number = aadhaar;
    }

    await profile.save();

    res.json(successResponse({
      profile: profile.toObject()
    }, profile.isNew ? 'Profile created successfully' : 'Profile updated successfully'));
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
        full_name: req.user.full_name,
        email: req.user.email,
        phone: req.user.phone || '',
        avatar_url: '',
        role: req.user.role,
        is_verified: req.user.is_verified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.json(successResponse({
        profile: demoProfile
      }, 'Demo profile retrieved successfully'));
    }
    
    let profile;
    
    if (userId) {
      // Check if requested userId is a demo user
      if (userId.startsWith('demo-')) {
        return res.status(400).json(errorResponse('Demo user profiles cannot be accessed by ID'));
      }
      profile = await UserProfile.findOne({ _id: userId });
    } else if (email) {
      profile = await UserProfile.findOne({ email });
    } else if (currentUserId) {
      profile = await UserProfile.findOne({ _id: currentUserId });
    } else {
      return res.status(400).json(errorResponse('User ID or email is required'));
    }

    if (!profile) {
      // Return empty profile structure instead of error
      return res.json(successResponse({
        profile: {
          full_name: '',
          email: email || '',
          phone: '',
          avatar_url: '',
          aadhaar_number: ''
        }
      }, 'No profile found, empty profile returned'));
    }

    res.json(successResponse({
      profile: profile.toObject()
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
        full_name: req.user.full_name,
        email: req.user.email,
        phone: req.user.phone || '',
        avatar_url: '',
        role: req.user.role,
        is_verified: req.user.is_verified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.json(successResponse({
        profile: demoProfile
      }, 'Demo profile retrieved successfully'));
    }
    
    let profile;
    
    if (userId) {
      profile = await UserProfile.findOne({ _id: userId });
    } else {
      profile = await UserProfile.findOne({ email: userEmail });
    }

    if (!profile) {
      // Return empty profile structure for frontend to populate
      return res.json(successResponse({
        profile: {
          full_name: '',
          email: userEmail || '',
          phone: '',
          avatar_url: ''
        }
      }, 'No profile found, empty profile returned'));
    }

    res.json(successResponse({
      profile: profile.toObject()
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
