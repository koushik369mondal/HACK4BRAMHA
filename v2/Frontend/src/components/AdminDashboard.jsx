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
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    fetchAdminDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAdminDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the same working endpoint as Tracking.jsx - getRecentComplaints
      const response = await complaintAPI.getRecentComplaints({ limit: 10 });

      if (response.data && response.data.success) {
        const complaintsData = response.data.complaints || [];

        // Calculate statistics from the complaints data
        const calculatedStats = {
          total: complaintsData.length,
          pending: 0,
          inProgress: 0,
          resolved: 0
        };

        // Count status occurrences
        complaintsData.forEach(complaint => {
          switch (complaint.status) {
            case 'submitted':
              calculatedStats.pending++;
              break;
            case 'in_progress':
              calculatedStats.inProgress++;
              break;
            case 'resolved':
            case 'closed':
              calculatedStats.resolved++;
              break;
            default:
              break;
          }
        });

        // Update stats with calculated values
        const updatedStats = [
          {
            label: "Total Complaints",
            value: calculatedStats.total.toString(),
            icon: FaExclamationTriangle,
            color: "text-blue-600",
            bgColor: "bg-blue-100"
          },
          {
            label: "Resolved",
            value: calculatedStats.resolved.toString(),
            icon: FaCheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-100"
          },
          {
            label: "Pending",
            value: calculatedStats.pending.toString(),
            icon: FaClock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100"
          },
          {
            label: "In Progress",
            value: calculatedStats.inProgress.toString(),
            icon: FaUsers,
            color: "text-purple-600",
            bgColor: "bg-purple-100"
          },
        ];

        setStats(updatedStats);

        // Format complaints data with complete information
        const formattedComplaints = complaintsData.map(complaint => ({
          id: complaint.complaint_id,
          complaintId: complaint.complaint_id,
          category: complaint.category || 'General',
          status: formatStatus(complaint.status),
          rawStatus: complaint.status,
          date: new Date(complaint.created_at).toLocaleDateString('en-CA'),
          priority: complaint.priority || 'Medium',
          title: complaint.title || 'N/A',
          description: complaint.description || 'N/A',
          createdAt: complaint.created_at,
          updatedAt: complaint.updated_at,
          locationAddress: complaint.location?.address || 'Not specified',
          location: complaint.location,
          reporterType: complaint.reporter_type
        }));

        setRecentComplaints(formattedComplaints);
      } else {
        // Set empty states
        setRecentComplaints([]);
      }

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);

      // Fallback demo data
      setRecentComplaints([
        {
          id: "CMP12345DEMO",
          complaintId: "CMP12345DEMO",
          title: "Demo: Submit complaints to see real data",
          category: "General",
          status: "Pending",
          rawStatus: "submitted",
          date: new Date().toLocaleDateString('en-CA'),
          priority: "Medium",
          description: "This is demo data. Submit a complaint to see real data.",
          createdAt: new Date().toISOString(),
          locationAddress: "Demo Location"
        }
      ]);

      setError('Unable to fetch live data. Showing demo data. Please ensure complaints are submitted.');
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
      // Find complaint in local data first
      const localComplaint = recentComplaints.find(c => c.id === complaintId || c.complaintId === complaintId);

      if (localComplaint) {
        const complaint = {
          complaint_id: localComplaint.id,
          title: localComplaint.title,
          category: localComplaint.category,
          status: localComplaint.rawStatus,
          priority: localComplaint.priority,
          description: localComplaint.description,
          location_address: localComplaint.locationAddress,
          created_at: localComplaint.createdAt,
          updated_at: localComplaint.updatedAt,
          reporter_type: localComplaint.reporterType
        };

        setSelectedComplaint(complaint);
        setShowViewModal(true);
        return;
      }

      // Fallback to tracking API
      const response = await complaintAPI.trackComplaint(complaintId);

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
      setUpdateSuccess(false);

      // Find complaint in local data first
      const localComplaint = recentComplaints.find(c => c.id === complaintId || c.complaintId === complaintId);

      if (localComplaint) {
        const complaint = {
          complaint_id: localComplaint.id,
          title: localComplaint.title,
          category: localComplaint.category,
          status: localComplaint.rawStatus,
          priority: localComplaint.priority,
          description: localComplaint.description,
          location_address: localComplaint.locationAddress,
          created_at: localComplaint.createdAt,
          updated_at: localComplaint.updatedAt
        };

        setSelectedComplaint(complaint);
        setEditForm({
          status: complaint.status,
          notes: ''
        });
        setShowEditModal(true);
        return;
      }

      // Fallback to tracking API
      const response = await complaintAPI.trackComplaint(complaintId);

      if (response.data && response.data.complaint) {
        const complaint = response.data.complaint;
        setSelectedComplaint(complaint);
        setEditForm({
          status: complaint.status,
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
    setError(null);

    try {
      // Check for admin token
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Admin authentication required. Please login again.');
      }

      const response = await complaintAPI.updateComplaintStatus(selectedComplaint.complaint_id, {
        status: editForm.status,
        notes: editForm.notes
      });

      // Show success message
      setUpdateSuccess(true);

      // Refresh dashboard data after a short delay
      setTimeout(async () => {
        await fetchAdminDashboardData();

        // Close modal
        setShowEditModal(false);
        setSelectedComplaint(null);
        setEditForm({ status: '', notes: '' });
        setUpdateSuccess(false);
      }, 1500);

    } catch (error) {
      console.error('Error updating complaint status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';

      if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
        setError('Admin authentication required. Please logout and login again with admin credentials.');
      } else {
        setError(`Failed to update complaint status: ${errorMessage}`);
      }
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
    setUpdateSuccess(false);
    setError(null);
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
            <button
              onClick={fetchAdminDashboardData}
              disabled={loading}
              className="flex items-center bg-white bg-opacity-20 px-3 py-2 rounded-lg hover:bg-opacity-30 transition-all"
            >
              <FaChartLine className={`mr-2 text-black ${loading ? 'animate-pulse' : ''}`} />
              <span className="text-sm text-black font-medium">
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchAdminDashboardData}
            className="mt-2 text-yellow-600 hover:text-yellow-800 underline text-sm"
          >
            Retry
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
      {!loading && (
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
      )}

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
                    <p className="text-sm mt-2">Complaints will appear here once submitted.</p>
                  </td>
                </tr>
              ) : (
                recentComplaints.map(({ id, category, status, date, priority }) => (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 text-sm">{id}</span>
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
            <button
              onClick={() => setCurrentPage("track-status")}
              className="w-full text-left p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              View All Complaints
            </button>
            <button className="w-full text-left p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Generate Monthly Report
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
                <p className="text-gray-500">Recently</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900">Dashboard data updated</p>
                <p className="text-gray-500">Just now</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900">System running smoothly</p>
                <p className="text-gray-500">Continuous</p>
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="fixed inset-0" onClick={closeModals}></div>
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Complaint Details</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complaint ID</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedComplaint.complaint_id}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(formatStatus(selectedComplaint.status))}`}>
                      {formatStatus(selectedComplaint.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-gray-900">{selectedComplaint.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900 capitalize">{selectedComplaint.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <span className={`font-medium capitalize ${getPriorityColor(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedComplaint.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p className="text-gray-900">{selectedComplaint.location_address || 'Not specified'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <p className="text-gray-600 text-sm">{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                  </div>

                  {selectedComplaint.updated_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                      <p className="text-gray-600 text-sm">{new Date(selectedComplaint.updated_at).toLocaleString()}</p>
                    </div>
                  )}
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <div className="fixed inset-0" onClick={!updateLoading ? closeModals : undefined}></div>
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Complaint Status</h3>
                <button
                  onClick={closeModals}
                  disabled={updateLoading}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              {updateSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  <FaCheckCircle className="inline mr-2" />
                  Status updated successfully! Refreshing data...
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complaint ID</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedComplaint.complaint_id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <p className="text-gray-900 text-sm">{selectedComplaint.title}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    disabled={updateLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="submitted">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={updateLoading}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Add notes about this status change (e.g., resolution details, action taken, etc.)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={closeModals}
                    disabled={updateLoading}
                    className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updateLoading || !editForm.status}
                    className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors flex items-center"
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
