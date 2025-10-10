const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

// User profile routes
router.post('/user-profile', userController.createProfileController);
router.get('/user-profile/:userId', userController.getProfileController);
router.put('/user-profile/:userId', userController.updateProfileController);

// Current user profile routes (with authentication)
router.get('/profile', authenticateToken, userController.getCurrentProfileController);
router.put('/profile', authenticateToken, userController.updateProfileController);

// Legacy profile route
router.put('/profile', authenticateToken, userController.updateProfileController);

module.exports = router;
