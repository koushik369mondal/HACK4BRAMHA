const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const complaintController = require('../controllers/complaintController');

// Anonymous complaint submission (no authentication required)
router.post('/anonymous', complaintController.createComplaint);

// Public tracking endpoint (no authentication required)
router.get('/track/:complaintId', complaintController.trackComplaint);

// Public recent complaints endpoint (no authentication required)
router.get('/recent', complaintController.getRecentComplaints);

// Authenticated routes
router.post('/', authenticateToken, complaintController.createComplaint);
router.get('/my', authenticateToken, complaintController.getUserComplaints);
router.get('/:id', authenticateToken, complaintController.getComplaintById);
router.put('/:id/status', authenticateToken, complaintController.updateComplaintStatus);
router.get('/stats/my', authenticateToken, complaintController.getUserComplaintStats);
router.get('/stats', authenticateToken, complaintController.getComplaintStats);

module.exports = router;
