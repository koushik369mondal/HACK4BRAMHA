const { Complaint, UserProfile, Department } = require('../models');
const { errorResponse, successResponse } = require('../utils/helpers');

// Create a new complaint
const createComplaint = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      priority = 'medium',
      reporterType = 'anonymous',
      contactMethod = 'email',
      phone,
      location,
      aadhaarData,
      attachments = []
    } = req.body;
    
    // Validate required fields
    if (!title || !category || !description) {
      return res.status(400).json(errorResponse('Title, category, and description are required'));
    }
    
    // Generate complaint ID
    const complaintId = `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create complaint document
    const newComplaint = new Complaint({
      complaint_id: complaintId,
      title,
      category,
      description,
      priority,
      status: 'submitted',
      reporter_type: reporterType,
      contact_method: contactMethod,
      phone,
      location: location ? {
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        formatted: location.formatted
      } : undefined,
      user_id: req.user?.id || null,
      department: category, // Default department to category
      
      // Embedded documents
      aadhaar_data: (reporterType === 'verified' && aadhaarData) ? {
        aadhaar_number: aadhaarData.aadhaarNumber,
        name: aadhaarData.name,
        gender: aadhaarData.gender,
        state: aadhaarData.state,
        district: aadhaarData.district,
        verified_at: new Date()
      } : undefined,
      
      attachments: attachments.map(attachment => ({
        filename: attachment.filename,
        original_name: attachment.originalName,
        file_type: attachment.fileType,
        file_size: attachment.fileSize,
        file_path: attachment.filePath,
        url: attachment.url
      })),
      
      status_history: [{
        status: 'submitted',
        notes: 'Complaint submitted successfully',
        changed_by: req.user?.id || null,
        changed_at: new Date()
      }]
    });
    
    await newComplaint.save();
    
    // Return success response
    res.status(201).json(successResponse({
      complaintId: newComplaint.complaint_id,
      id: newComplaint._id,
      status: 'submitted',
      createdAt: newComplaint.createdAt,
      tracking: {
        complaintNumber: newComplaint.complaint_id,
        status: 'submitted',
        submittedAt: newComplaint.createdAt
      }
    }, 'Complaint registered successfully'));
    
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json(errorResponse(
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to register complaint'
    ));
  }
};

// Get complaints for a user with pagination
const getUserComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user?.id;
    
    // For demo users, return sample complaints instead of querying with invalid UUID
    if (userId && (userId.startsWith('demo-') || !userId.match(/^[0-9a-f]{24}$/))) {
      console.log('Demo user detected, returning sample complaints for:', userId);
      
      // Sample complaints for demo users
      const sampleComplaints = [
        {
          id: 'demo-complaint-1',
          complaintId: 'CMP-2024-001',
          title: 'Street Light Not Working',
          category: 'Public Safety',
          description: 'The street light on Main Road has been malfunctioning for the past week.',
          status: 'in_progress',
          priority: 'medium',
          reporterType: 'registered',
          contactMethod: 'email',
          phone: req.user.phone || '',
          location: {
            address: '123 Main Road, City Center',
            latitude: 12.9716,
            longitude: 77.5946,
            formatted: '123 Main Road, City Center'
          },
          department: 'Electricity',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-complaint-2',
          complaintId: 'CMP-2024-002',
          title: 'Water Supply Issue',
          category: 'Water Supply',
          description: 'No water supply in our area for the past 3 days.',
          status: 'submitted',
          priority: 'high',
          reporterType: 'registered',
          contactMethod: 'phone',
          phone: req.user.phone || '',
          location: {
            address: '456 Park Avenue, Suburb',
            latitude: 12.9716,
            longitude: 77.5946,
            formatted: '456 Park Avenue, Suburb'
          },
          department: 'Water Supply',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Apply filters to sample data
      let filteredComplaints = sampleComplaints;
      if (status) {
        filteredComplaints = filteredComplaints.filter(c => c.status === status);
      }
      if (category) {
        filteredComplaints = filteredComplaints.filter(c => c.category === category);
      }
      if (priority) {
        filteredComplaints = filteredComplaints.filter(c => c.priority === priority);
      }
      
      // Apply pagination
      const totalCount = filteredComplaints.length;
      const totalPages = Math.ceil(totalCount / parseInt(limit));
      const paginatedComplaints = filteredComplaints.slice(skip, skip + parseInt(limit));
      
      return res.json(successResponse({
        complaints: paginatedComplaints,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }));
    }
    
    // Build query filter for real users
    const filter = {};
    
    if (userId) {
      filter.user_id = userId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get total count and complaints
    const [totalCount, complaints] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json(successResponse({
      complaints: complaints.map(complaint => ({
        id: complaint._id,
        complaintId: complaint.complaint_id,
        title: complaint.title,
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        priority: complaint.priority,
        reporterType: complaint.reporter_type,
        contactMethod: complaint.contact_method,
        phone: complaint.phone,
        location: complaint.location,
        department: complaint.department,
        assignedTo: complaint.assigned_to,
        estimatedResolutionDate: complaint.estimated_resolution_date,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        resolvedAt: complaint.resolved_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }));
    
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json(errorResponse(
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch complaints'
    ));
  }
};

// Get complaint by ID with full details
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get main complaint data
    const complaintQuery = `
      SELECT c.*, d.name as department_name, d.contact_email as department_email
      FROM complaints c
      LEFT JOIN departments d ON c.department = d.name
      WHERE c.id = $1 OR c.complaint_id = $1
    `;
    
    const complaintResult = await pool.query(complaintQuery, [id]);
    
    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    const complaint = complaintResult.rows[0];
    
    // Get attachments
    const attachmentsQuery = `
      SELECT id, filename, original_name, file_type, file_size, file_path, url, created_at
      FROM complaint_attachments
      WHERE complaint_id = $1
      ORDER BY created_at ASC
    `;
    
    const attachmentsResult = await pool.query(attachmentsQuery, [complaint.id]);
    
    // Get Aadhaar data if available
    const aadhaarQuery = `
      SELECT aadhaar_number, name, gender, state, district, verified_at
      FROM complaint_aadhaar_data
      WHERE complaint_id = $1
    `;
    
    const aadhaarResult = await pool.query(aadhaarQuery, [complaint.id]);
    
    // Get status history
    const historyQuery = `
      SELECT 
        csh.status, csh.notes, csh.changed_at,
        u.full_name as changed_by_name
      FROM complaint_status_history csh
      LEFT JOIN users u ON csh.changed_by = u.id
      WHERE csh.complaint_id = $1
      ORDER BY csh.changed_at DESC
    `;
    
    const historyResult = await pool.query(historyQuery, [complaint.id]);
    
    const fullComplaint = {
      id: complaint.id,
      complaintId: complaint.complaint_id,
      title: complaint.title,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      priority: complaint.priority,
      reporterType: complaint.reporter_type,
      contactMethod: complaint.contact_method,
      phone: complaint.phone,
      location: {
        address: complaint.location_address,
        latitude: complaint.location_latitude,
        longitude: complaint.location_longitude,
        formatted: complaint.location_formatted
      },
      department: {
        name: complaint.department,
        displayName: complaint.department_name,
        contactEmail: complaint.department_email
      },
      assignedTo: complaint.assigned_to,
      estimatedResolutionDate: complaint.estimated_resolution_date,
      attachments: attachmentsResult.rows,
      aadhaarData: aadhaarResult.rows.length > 0 ? aadhaarResult.rows[0] : null,
      statusHistory: historyResult.rows,
      createdAt: complaint.created_at,
      updatedAt: complaint.updated_at,
      resolvedAt: complaint.resolved_at
    };
    
    res.json({
      success: true,
      data: fullComplaint
    });
    
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user complaint statistics
const getUserComplaintStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    let stats;
    
    // For demo users, return sample stats instead of querying with invalid UUID
    if (userId && (userId.startsWith('demo-') || !userId.match(/^[0-9a-f]{24}$/))) {
      console.log('Demo user detected, returning sample stats for:', userId);
      stats = {
        total_complaints: 5,
        submitted_count: 1,
        in_progress_count: 2,
        resolved_count: 1,
        closed_count: 1,
        urgent_count: 1,
        high_priority_count: 1,
        avg_resolution_days: 3.5
      };
    } else {
      console.log('Querying real stats for user:', userId);
      
      // Build match condition
      let matchCondition = {};
      if (userId) {
        matchCondition.user_id = userId;
      }
      
      // MongoDB aggregation pipeline for stats
      const pipeline = [
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            total_complaints: { $sum: 1 },
            submitted_count: {
              $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] }
            },
            in_progress_count: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
            },
            resolved_count: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
            },
            closed_count: {
              $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
            },
            urgent_count: {
              $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] }
            },
            high_priority_count: {
              $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] }
            },
            resolved_complaints: {
              $push: {
                $cond: [
                  { $ne: ["$resolved_at", null] },
                  {
                    resolution_days: {
                      $divide: [
                        { $subtract: ["$resolved_at", "$created_at"] },
                        86400000 // milliseconds in a day
                      ]
                    }
                  },
                  "$$REMOVE"
                ]
              }
            }
          }
        },
        {
          $addFields: {
            avg_resolution_days: {
              $cond: [
                { $gt: [{ $size: "$resolved_complaints" }, 0] },
                { $avg: "$resolved_complaints.resolution_days" },
                null
              ]
            }
          }
        }
      ];
      
      const result = await Complaint.aggregate(pipeline);
      
      if (result.length === 0) {
        stats = {
          total_complaints: 0,
          submitted_count: 0,
          in_progress_count: 0,
          resolved_count: 0,
          closed_count: 0,
          urgent_count: 0,
          high_priority_count: 0,
          avg_resolution_days: null
        };
      } else {
        stats = result[0];
      }
    }
    
    res.json({
      success: true,
      data: {
        totalComplaints: parseInt(stats.total_complaints || 0),
        statusCounts: {
          submitted: parseInt(stats.submitted_count || 0),
          inProgress: parseInt(stats.in_progress_count || 0),
          resolved: parseInt(stats.resolved_count || 0),
          closed: parseInt(stats.closed_count || 0)
        },
        priorityCounts: {
          urgent: parseInt(stats.urgent_count || 0),
          high: parseInt(stats.high_priority_count || 0)
        },
        averageResolutionDays: stats.avg_resolution_days ? parseFloat(stats.avg_resolution_days).toFixed(1) : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update complaint status (Admin only)
const updateComplaintStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['submitted', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    await client.query('BEGIN');
    
    // Update complaint status
    const updateQuery = `
      UPDATE complaints 
      SET status = $1, updated_at = NOW()
      WHERE complaint_id = $2
      RETURNING id, complaint_id, status, updated_at
    `;

    const result = await client.query(updateQuery, [status, id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    const updatedComplaint = result.rows[0];
    
    // Add status history entry (skip for demo users to avoid UUID errors)
    const userId = req.user?.id;
    const isValidUuid = userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isValidUuid) {
      const historyQuery = `
        INSERT INTO complaint_status_history (
          complaint_id, status, notes, changed_by, changed_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await client.query(historyQuery, [
        updatedComplaint.id,
        status,
        notes || `Status changed to ${status}`,
        userId
      ]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      data: {
        complaintId: updatedComplaint.complaint_id,
        status: updatedComplaint.status,
        updatedAt: updatedComplaint.updated_at
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating complaint status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
};

// Get global complaint stats (all complaints)
const getComplaintStats = async (req, res) => {
  try {
    console.log('Querying global complaint stats');
    
    // MongoDB aggregation pipeline for global stats
    const pipeline = [
      {
        $group: {
          _id: null,
          total_complaints: { $sum: 1 },
          submitted_count: {
            $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] }
          },
          in_progress_count: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
          },
          resolved_count: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          closed_count: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
          },
          urgent_count: {
            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] }
          },
          high_priority_count: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] }
          },
          resolved_complaints: {
            $push: {
              $cond: [
                { $ne: ["$resolved_at", null] },
                {
                  resolution_days: {
                    $divide: [
                      { $subtract: ["$resolved_at", "$created_at"] },
                      86400000 // milliseconds in a day
                    ]
                  }
                },
                "$$REMOVE"
              ]
            }
          }
        }
      },
      {
        $addFields: {
          avg_resolution_days: {
            $cond: [
              { $gt: [{ $size: "$resolved_complaints" }, 0] },
              { $avg: "$resolved_complaints.resolution_days" },
              null
            ]
          }
        }
      }
    ];
    
    const result = await Complaint.aggregate(pipeline);
    
    let stats;
    if (result.length === 0) {
      stats = {
        total_complaints: 0,
        submitted_count: 0,
        in_progress_count: 0,
        resolved_count: 0,
        closed_count: 0,
        urgent_count: 0,
        high_priority_count: 0,
        avg_resolution_days: null
      };
    } else {
      stats = result[0];
    }
    
    res.json({
      success: true,
      data: {
        totalComplaints: parseInt(stats.total_complaints || 0),
        statusCounts: {
          submitted: parseInt(stats.submitted_count || 0),
          inProgress: parseInt(stats.in_progress_count || 0),
          resolved: parseInt(stats.resolved_count || 0),
          closed: parseInt(stats.closed_count || 0)
        },
        priorityCounts: {
          urgent: parseInt(stats.urgent_count || 0),
          high: parseInt(stats.high_priority_count || 0)
        },
        averageResolutionDays: stats.avg_resolution_days ? parseFloat(stats.avg_resolution_days).toFixed(1) : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching global complaint stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaintById,
  updateComplaintStatus,
  getUserComplaintStats,
  getComplaintStats
};