const pool = require('../db');

// Create a new complaint
const createComplaint = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
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
      return res.status(400).json({
        success: false,
        message: 'Title, category, and description are required'
      });
    }
    
    // Generate complaint ID
    const complaintId = `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Insert main complaint record (using integer id that auto-increments)
    const complaintQuery = `
      INSERT INTO complaints (
        complaint_id, title, category, description, priority, status, 
        reporter_type, contact_method, phone,
        location_address, location_latitude, location_longitude, location_formatted,
        user_id, department,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING id, complaint_id, created_at
    `;
    
    const complaintValues = [
      complaintId,
      title,
      category,
      description,
      priority,
      'submitted',
      reporterType,
      contactMethod,
      phone,
      location?.address || null,
      location?.latitude || null,
      location?.longitude || null,
      location?.formatted || null,
      req.user?.id || null,
      category // Default department to category
    ];
    
    const complaintResult = await client.query(complaintQuery, complaintValues);
    const newComplaint = complaintResult.rows[0];
    
    // Insert Aadhaar data if verified complaint
    if (reporterType === 'verified' && aadhaarData) {
      const aadhaarQuery = `
        INSERT INTO complaint_aadhaar_data (
          complaint_id, aadhaar_number, name, gender, state, district, verified_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `;
      
      await client.query(aadhaarQuery, [
        newComplaint.id,
        aadhaarData.aadhaarNumber,
        aadhaarData.name,
        aadhaarData.gender,
        aadhaarData.state,
        aadhaarData.district
      ]);
    }
    
    // Insert attachments if any
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        const attachmentQuery = `
          INSERT INTO complaint_attachments (
            complaint_id, filename, original_name, file_type, file_size, file_path, url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;
        
        await client.query(attachmentQuery, [
          newComplaint.id,
          attachment.filename,
          attachment.originalName,
          attachment.fileType,
          attachment.fileSize,
          attachment.filePath,
          attachment.url
        ]);
      }
    }
    
    // Insert initial status history
    const statusHistoryQuery = `
      INSERT INTO complaint_status_history (
        complaint_id, status, notes, changed_by, changed_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `;
    
    await client.query(statusHistoryQuery, [
      newComplaint.id,
      'submitted',
      'Complaint submitted successfully',
      req.user?.id || null
    ]);
    
    await client.query('COMMIT');
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      data: {
        complaintId: newComplaint.complaint_id,
        id: newComplaint.id,
        status: 'submitted',
        createdAt: newComplaint.created_at,
        tracking: {
          complaintNumber: newComplaint.complaint_id,
          status: 'submitted',
          submittedAt: newComplaint.created_at
        }
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
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
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user?.id;
    
    // For demo users, return sample complaints instead of querying with invalid UUID
    if (userId && (userId.startsWith('demo-') || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))) {
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
      const paginatedComplaints = filteredComplaints.slice(offset, offset + parseInt(limit));
      
      return res.json({
        success: true,
        data: {
          complaints: paginatedComplaints,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            limit: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    }
    
    // Build WHERE clause for real users
    let whereClause = '1=1';
    const queryParams = [];
    let paramCounter = 1;
    
    if (userId) {
      whereClause += ` AND user_id = $${paramCounter}`;
      queryParams.push(userId);
      paramCounter++;
    }
    
    if (status) {
      whereClause += ` AND status = $${paramCounter}`;
      queryParams.push(status);
      paramCounter++;
    }
    
    if (category) {
      whereClause += ` AND category = $${paramCounter}`;
      queryParams.push(category);
      paramCounter++;
    }
    
    if (priority) {
      whereClause += ` AND priority = $${paramCounter}`;
      queryParams.push(priority);
      paramCounter++;
    }
    
    // Add pagination params
    queryParams.push(parseInt(limit), offset);
    
    const query = `
      SELECT 
        c.*,
        COUNT(*) OVER() as total_count
      FROM complaints c
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    const result = await pool.query(query, queryParams);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      success: true,
      data: {
        complaints: result.rows.map(row => ({
          id: row.id,
          complaintId: row.complaint_id,
          title: row.title,
          category: row.category,
          description: row.description,
          status: row.status,
          priority: row.priority,
          reporterType: row.reporter_type,
          contactMethod: row.contact_method,
          phone: row.phone,
          location: {
            address: row.location_address,
            latitude: row.location_latitude,
            longitude: row.location_longitude,
            formatted: row.location_formatted
          },
          department: row.department,
          assignedTo: row.assigned_to,
          estimatedResolutionDate: row.estimated_resolution_date,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
    let result;
    
    // For demo users, return sample stats instead of querying with invalid UUID
    if (userId && (userId.startsWith('demo-') || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))) {
      console.log('Demo user detected, returning sample stats for:', userId);
      result = {
        rows: [{
          total_complaints: '5',
          submitted_count: '1',
          in_progress_count: '2',
          resolved_count: '1',
          closed_count: '1',
          urgent_count: '1',
          high_priority_count: '1',
          avg_resolution_days: '3.5'
        }]
      };
    } else {
      console.log('Querying real stats for user:', userId);
      
      let statsQuery, queryParams;
      
      if (userId) {
        // Query for specific user
        statsQuery = `
          SELECT 
            COUNT(*) as total_complaints,
            COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
            COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
            COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
            COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
            AVG(CASE WHEN resolved_at IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (resolved_at - created_at))/86400 
            END) as avg_resolution_days
          FROM complaints 
          WHERE user_id = $1
        `;
        queryParams = [userId];
      } else {
        // Query for all complaints (admin view)
        statsQuery = `
          SELECT 
            COUNT(*) as total_complaints,
            COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
            COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
            COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
            COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
            AVG(CASE WHEN resolved_at IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (resolved_at - created_at))/86400 
            END) as avg_resolution_days
          FROM complaints
        `;
        queryParams = [];
      }
      
      result = await pool.query(statsQuery, queryParams);
    }
    
    // Ensure result and result.rows exist
    if (!result || !result.rows || result.rows.length === 0) {
      console.log('No stats data found, returning empty stats');
      return res.json({
        success: true,
        data: {
          totalComplaints: 0,
          statusCounts: {
            submitted: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0
          },
          priorityCounts: {
            urgent: 0,
            high: 0
          },
          averageResolutionDays: null
        }
      });
    }
    
    const stats = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalComplaints: parseInt(stats.total_complaints),
        statusCounts: {
          submitted: parseInt(stats.submitted_count),
          inProgress: parseInt(stats.in_progress_count),
          resolved: parseInt(stats.resolved_count),
          closed: parseInt(stats.closed_count)
        },
        priorityCounts: {
          urgent: parseInt(stats.urgent_count),
          high: parseInt(stats.high_priority_count)
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

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaintById,
  updateComplaintStatus,
  getUserComplaintStats
};