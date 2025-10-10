import React, { useState, useEffect } from "react";
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaUsers, FaFileAlt, FaChartLine, FaSpinner, FaTimes, FaSave } from "react-icons/fa";
import { complaintAPI } from "../services/api";

export default function AdminDashboard({ user, sidebarOpen, setSidebarOpen, onLogout, currentPage, setCurrentPage }) {
  const [stats, setStats] = useState([
    { label: "Total Complaints", value: "-", icon: FaExclamationTriangle, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "Resolved", value: "-", icon: FaCheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
    { label: "Pending", value: "-", icon: FaClock, color: "text-yellow-600", bgColor: "bg-yellow-100" },
    { label: "Active Users", value: "-", icon: FaUsers, color: "text-purple-600", bgColor: "bg-purple-100" },
  ]);

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    notes: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      let statsData = null;
      let complaintsData = [];

      // For admin dashboard, we should use public endpoints for system-wide data
      // TODO: Create proper admin-specific endpoints in the future
      
      try {
        // Use public stats endpoint for system-wide statistics
        const publicStatsResponse = await complaintAPI.getComplaintStats();
        const publicStats = publicStatsResponse.data.stats;
        
        // Convert public stats format to match expected format
        statsData = {
          totalComplaints: publicStats.total,
          statusCounts: {
            submitted: publicStats.status.pending,
            inProgress: publicStats.status.in_progress,
            resolved: publicStats.status.resolved,
            closed: publicStats.status.closed
          }
        };
        
        // Use public recent complaints endpoint for system-wide complaints
        const publicComplaintsResponse = await complaintAPI.getRecentComplaints({ limit: 5 });
        complaintsData = publicComplaintsResponse.data.complaints || [];
        
      } catch (publicError) {
        console.log('Public endpoints failed, trying authenticated endpoints as fallback:', publicError);
        
        // Fallback to authenticated endpoints (user-specific data)
        try {
          const statsResponse = await complaintAPI.getUserComplaintStats();
          statsData = statsResponse.data.data;
          
          const complaintsResponse = await complaintAPI.getUserComplaints({ limit: 5, sort: 'created_at', order: 'DESC' });
          complaintsData = complaintsResponse.data.data;
          
        } catch (authError) {
          console.error('Both public and authenticated endpoints failed:', authError);
          throw new Error('Unable to fetch data from any endpoint');
        }
      }

      // Update stats with real data
      const updatedStats = [
        { 
          label: "Total Complaints", 
          value: statsData.totalComplaints.toString(), 
          icon: FaExclamationTriangle, 
          color: "text-blue-600", 
          bgColor: "bg-blue-100" 
        },
        { 
          label: "Resolved", 
          value: (statsData.statusCounts.resolved + statsData.statusCounts.closed).toString(), 
          icon: FaCheckCircle, 
          color: "text-green-600", 
          bgColor: "bg-green-100" 
        },
        { 
          label: "Pending", 
          value: statsData.statusCounts.submitted.toString(), 
          icon: FaClock, 
          color: "text-yellow-600", 
          bgColor: "bg-yellow-100" 
        },
        { 
          label: "Active Users", 
          value: "156", // TODO: Implement user count endpoint
          icon: FaUsers, 
          color: "text-purple-600", 
          bgColor: "bg-purple-100" 
        },
      ];

      setStats(updatedStats);

      // Format recent complaints data - store more complete data
      const formattedComplaints = complaintsData.map(complaint => ({
        id: complaint.complaint_id,
        complaintId: complaint.complaint_id,
        category: complaint.category,
        status: formatStatus(complaint.status),
        rawStatus: complaint.status, // Keep raw status for editing
        date: new Date(complaint.created_at).toLocaleDateString('en-CA'),
        priority: complaint.priority || 'Medium', // Default priority if not set
        title: complaint.title || 'N/A',
        description: complaint.description || 'N/A',
        createdAt: complaint.created_at,
        locationAddress: complaint.location_address || 'Not specified'
      }));

      setRecentComplaints(formattedComplaints);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'submitted':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
      case 'closed':
        return 'Resolved';
      default:
        return status;
    }
  };

  // Handle viewing complaint details
  const handleView = async (complaintId) => {
    try {
      // First try to find the complaint in our local data
      const localComplaint = recentComplaints.find(c => c.id === complaintId || c.complaintId === complaintId);
      
      if (localComplaint) {
        console.log('Using local complaint data for viewing:', localComplaint);
        // Use local data directly
        const complaint = {
          complaint_id: localComplaint.id,
          title: localComplaint.title,
          category: localComplaint.category,
          status: localComplaint.rawStatus || localComplaint.status.toLowerCase().replace(' ', '_'),
          priority: localComplaint.priority,
          description: localComplaint.description,
          location_address: localComplaint.locationAddress,
          created_at: localComplaint.createdAt
        };
        
        setSelectedComplaint(complaint);
        setShowViewModal(true);
        return;
      }
      
      // Fallback to public tracking API
      console.log('Attempting to fetch complaint details via public API for ID:', complaintId);
      const response = await complaintAPI.trackComplaint(complaintId);
      console.log('Public API response:', response);
      
      if (response.data && response.data.complaint) {
        setSelectedComplaint(response.data.complaint);
        setShowViewModal(true);
      } else {
        throw new Error('Complaint not found');
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      setError(`Failed to load complaint details: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle editing complaint
  const handleEdit = async (complaintId) => {
    try {
      // First try to find the complaint in our local data
      const localComplaint = recentComplaints.find(c => c.id === complaintId || c.complaintId === complaintId);
      
      if (localComplaint) {
        console.log('Using local complaint data for editing:', localComplaint);
        // Use local data directly
        const complaint = {
          complaint_id: localComplaint.id,
          title: localComplaint.title,
          category: localComplaint.category,
          status: localComplaint.rawStatus || localComplaint.status.toLowerCase().replace(' ', '_'),
          priority: localComplaint.priority,
          description: localComplaint.description,
          location_address: localComplaint.locationAddress,
          created_at: localComplaint.createdAt
        };
        
        setSelectedComplaint(complaint);
        setEditForm({
          status: complaint.status === 'submitted' ? 'submitted' : 
                 complaint.status === 'in_progress' ? 'in_progress' :
                 complaint.status === 'resolved' ? 'resolved' :
                 complaint.status === 'closed' ? 'closed' : 'submitted',
          notes: ''
        });
        setShowEditModal(true);
        return;
      }
      
      // Fallback to public tracking API if not found locally
      console.log('Attempting to fetch complaint details for editing via public API, ID:', complaintId);
      const response = await complaintAPI.trackComplaint(complaintId);
      console.log('Public API response for edit:', response);
      
      if (response.data && response.data.complaint) {
        const complaint = response.data.complaint;
        setSelectedComplaint(complaint);
        setEditForm({
          status: complaint.status === 'submitted' ? 'submitted' : 
                 complaint.status === 'in_progress' ? 'in_progress' :
                 complaint.status === 'resolved' ? 'resolved' :
                 complaint.status === 'closed' ? 'closed' : 'submitted',
          notes: ''
        });
        setShowEditModal(true);
      } else {
        throw new Error('Complaint not found');
      }
    } catch (error) {
      console.error('Error fetching complaint details for edit:', error);
      setError(`Failed to load complaint details: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedComplaint) return;
    
    setUpdateLoading(true);
    try {
      // Check if we have a token
      const token = localStorage.getItem('token');
      console.log('Current token in localStorage:', token ? 'Present' : 'Missing');
      
      console.log('Updating complaint status:', {
        complaintId: selectedComplaint.complaint_id,
        status: editForm.status,
        notes: editForm.notes
      });
      
      const response = await complaintAPI.updateComplaintStatus(selectedComplaint.complaint_id, {
        status: editForm.status,
        notes: editForm.notes
      });
      
      console.log('Status update response:', response);
      
      // Refresh dashboard data
      await fetchAdminDashboardData();
      
      // Close modal
      setShowEditModal(false);
      setSelectedComplaint(null);
      setEditForm({ status: '', notes: '' });
      
      // Show success message
      setError(null);
      
    } catch (error) {
      console.error('Error updating complaint status:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      setError(`Failed to update complaint status: ${errorMessage}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Close modals
  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedComplaint(null);
    setEditForm({ status: '', notes: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "text-red-600";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-green-800 rounded-xl shadow-lg p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1
              className="text-3xl lg:text-4xl font-bold mb-2"
              style={{ color: "#ffffff" }}
            >
              Admin Dashboard
            </h1>
            <p className="text-lg" style={{ color: "#ffffff" }}>
              Here's your system overview.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <FaChartLine className="mr-2 text-black" />
              <span className="text-sm text-black font-medium">System Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <button 
            onClick={fetchAdminDashboardData}
            className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-green-600 text-2xl mr-3" />
          <span className="text-gray-600">Loading admin dashboard data...</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color, bgColor }, idx) => (
          <div key={idx} className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
              </div>
              <div className={`${bgColor} p-3 rounded-lg`}>
                <Icon className={`${color} text-xl`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
              Recent Complaints
            </h3>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Export Data
              </button>
              <button 
                onClick={() => setCurrentPage("track-status")}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                View All
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentComplaints.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <FaFileAlt className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p>No complaints found.</p>
                  </td>
                </tr>
              ) : (
                recentComplaints.map(({ id, category, status, date, priority }) => (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700 capitalize">{category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium capitalize ${getPriorityColor(priority)}`}>
                        {priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleView(id)}
                        className="text-green-600 hover:text-green-800 font-medium mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEdit(id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
          <div className="space-y-3">
            <button className="w-full text-left p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Generate Monthly Report
            </button>
            <button className="w-full text-left p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Manage User Accounts
            </button>
            <button className="w-full text-left p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              System Settings
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">System Health</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Server Status</span>
              <span className="text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="text-green-600 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Response</span>
              <span className="text-green-600 font-medium">Fast</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900">New complaint submitted</p>
                <p className="text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900">Complaint status updated</p>
                <p className="text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900">User account created</p>
                <p className="text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedComplaint && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="fixed inset-0" onClick={closeModals}></div>
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Complaint ID</label>
                  <p className="text-gray-900">{selectedComplaint.complaint_id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-gray-900">{selectedComplaint.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900 capitalize">{selectedComplaint.category}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{selectedComplaint.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(formatStatus(selectedComplaint.status))}`}>
                      {formatStatus(selectedComplaint.status)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <span className={`font-medium capitalize ${getPriorityColor(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-900">{selectedComplaint.location_address || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900">{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedComplaint && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="fixed inset-0" onClick={closeModals}></div>
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Complaint</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Complaint ID</label>
                  <p className="text-gray-900">{selectedComplaint.complaint_id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-gray-900">{selectedComplaint.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="submitted">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Add notes about this status change..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updateLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors flex items-center"
                  >
                    {updateLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
