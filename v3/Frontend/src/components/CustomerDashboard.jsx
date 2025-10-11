import React, { useState, useEffect, useRef } from "react";
import {
  FaFileAlt,
  FaSearch,
  FaUser,
  FaBell,
  FaCheckCircle,
  FaSpinner,
  FaSync,
  FaTimes,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { complaintAPI } from "../services/api";

export default function CustomerDashboard({
  user,
  currentPage,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  setCurrentPage,
}) {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent complaints (limited for display)
      const complaintsResponse = await complaintAPI.getRecentComplaints({ limit: 5 });
      
      // Fetch all complaints to get actual total count
      const allComplaintsResponse = await complaintAPI.getRecentComplaints({ limit: 1000 }); // Large limit to get all

      if (complaintsResponse.data && complaintsResponse.data.success) {
        const complaintsData = complaintsResponse.data.complaints || [];
        const allComplaintsData = allComplaintsResponse.data?.complaints || [];

        // Calculate stats from ALL complaints data for accurate totals
        const calculatedStats = {
          total: allComplaintsData.length, // Use all complaints for total
          pending: 0,
          inProgress: 0,
          resolved: 0
        };

        // Count status occurrences from all complaints
        allComplaintsData.forEach(complaint => {
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

        // Update stats with accurate totals
        setStats(calculatedStats);

        // Format recent complaints data for display (limited to 5)
        const formattedComplaints = complaintsData.map(complaint => ({
          id: complaint.complaint_id,
          title: complaint.title,
          status: formatStatus(complaint.status),
          date: new Date(complaint.created_at).toLocaleDateString('en-CA')
        }));

        setComplaints(formattedComplaints);

        // Generate notifications from recent complaints only
        generateNotifications(complaintsData);
      } else {
        // If no data, set empty states
        setComplaints([]);
        setStats({
          total: 0,
          resolved: 0,
          inProgress: 0,
          pending: 0
        });
        setNotifications([]);
        setUnreadCount(0);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);

      // Set fallback demo data
      setComplaints([
        {
          id: "CMP12345DEMO",
          title: "Demo: Submit a complaint to see real data",
          status: "Pending",
          date: new Date().toLocaleDateString('en-CA')
        }
      ]);

      setStats({
        total: 1,
        resolved: 0,
        inProgress: 0,
        pending: 1
      });

      // Demo notifications
      setNotifications([
        {
          id: 1,
          type: 'info',
          title: 'Welcome to NaiyakSetu',
          message: 'Submit your first complaint to get started',
          time: 'Just now',
          read: false,
          icon: FaBell
        }
      ]);
      setUnreadCount(1);

      setError('Unable to fetch live data. Showing demo data. Please submit a complaint first.');
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = (complaintsData) => {
    const newNotifications = [];
    let unread = 0;

    complaintsData.forEach((complaint, index) => {
      const createdDate = new Date(complaint.created_at);
      const now = new Date();
      const diffHours = Math.floor((now - createdDate) / (1000 * 60 * 60));

      let timeText = '';
      if (diffHours < 1) {
        timeText = 'Just now';
      } else if (diffHours < 24) {
        timeText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        timeText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      // Create notification based on status
      if (complaint.status === 'resolved' || complaint.status === 'closed') {
        newNotifications.push({
          id: `resolved-${complaint.complaint_id}`,
          type: 'success',
          title: 'Complaint Resolved',
          message: `Your complaint "${complaint.title}" has been resolved`,
          time: timeText,
          read: diffHours > 24,
          icon: FaCheckCircle,
          complaintId: complaint.complaint_id
        });
        if (diffHours <= 24) unread++;
      } else if (complaint.status === 'in_progress') {
        newNotifications.push({
          id: `progress-${complaint.complaint_id}`,
          type: 'info',
          title: 'Complaint In Progress',
          message: `Your complaint "${complaint.title}" is being processed`,
          time: timeText,
          read: diffHours > 24,
          icon: FaSpinner,
          complaintId: complaint.complaint_id
        });
        if (diffHours <= 24) unread++;
      } else if (complaint.status === 'submitted') {
        newNotifications.push({
          id: `submitted-${complaint.complaint_id}`,
          type: 'pending',
          title: 'Complaint Submitted',
          message: `Your complaint "${complaint.title}" has been submitted`,
          time: timeText,
          read: diffHours > 48,
          icon: FaClock,
          complaintId: complaint.complaint_id
        });
        if (diffHours <= 48) unread++;
      }
    });

    // Add system notification if there are pending items
    if (stats.pending > 0) {
      newNotifications.unshift({
        id: 'system-pending',
        type: 'warning',
        title: 'Pending Complaints',
        message: `You have ${stats.pending} complaint${stats.pending > 1 ? 's' : ''} awaiting review`,
        time: 'System',
        read: false,
        icon: FaExclamationTriangle
      });
      unread++;
    }

    setNotifications(newNotifications);
    setUnreadCount(unread);
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

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prevNotifications =>
      prevNotifications.filter(notif => notif.id !== notificationId)
    );
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'info':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const quickActions = [
    {
      id: "file-complaint",
      label: "File New Complaint",
      icon: FaFileAlt,
      color: "bg-yellow-600 hover:bg-yellow-700",
      description: "Report a new issue in your area",
    },
    {
      id: "track-status",
      label: "Track Complaints",
      icon: FaSearch,
      color: "bg-purple-400 hover:bg-purple-500",
      description: "Check the status of your reports",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: FaUser,
      color: "bg-indigo-600 hover:bg-indigo-700",
      description: "Update your account settings",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "text-green-700 bg-green-100";
      case "Pending":
        return "text-yellow-700 bg-yellow-100";
      case "In Progress":
        return "text-blue-700 bg-blue-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Dashboard Header */}
      <div className="bg-green-800 rounded-xl shadow-lg p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: "#ffffff" }}>
              Dashboard 🏠
            </h1>
            <p className="text-lg" style={{ color: "#ffffff" }}>
              Let's make your community better together
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Refresh Button - FIXED TEXT COLOR TO BLACK */}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center bg-white bg-opacity-20 px-3 py-2 rounded-lg hover:bg-opacity-30 transition-all disabled:opacity-50"
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} style={{ color: "#000000" }} />
              <span className="text-sm font-medium" style={{ color: "#000000" }}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>

            {/* Notification Bell with Dropdown - FIXED TEXT COLOR TO BLACK */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={toggleNotifications}
                className="relative flex items-center bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all"
              >
                <FaBell className={`${unreadCount > 0 ? 'animate-pulse' : ''}`} style={{ color: "#000000" }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="text-sm font-medium ml-2 hidden sm:inline" style={{ color: "#000000" }}>
                  Notifications
                </span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <FaBell className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500">No notifications yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          We'll notify you when something happens
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {notifications.map((notification) => {
                          const Icon = notification.icon;
                          return (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                                }`}
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                                if (notification.complaintId) {
                                  setCurrentPage('track-status');
                                  setShowNotifications(false);
                                }
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getNotificationColor(notification.type)} border flex items-center justify-center`}>
                                  <Icon className={`${getIconColor(notification.type)}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {notification.time}
                                      </p>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="text-gray-400 hover:text-red-500 ml-2"
                                    >
                                      <FaTimes className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {!notification.read && (
                                    <div className="mt-2">
                                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          setCurrentPage('track-status');
                          setShowNotifications(false);
                        }}
                        className="text-sm text-green-600 hover:text-green-700 font-medium w-full text-center"
                      >
                        View all complaints →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-yellow-600 hover:text-yellow-800 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-green-600 text-2xl mr-3" />
          <span className="text-gray-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Stats Overview */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Complaints",
              value: stats.total,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              label: "Resolved",
              value: stats.resolved,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "text-yellow-600",
              bgColor: "bg-yellow-50",
            },
          ].map(({ label, value, color, bgColor }, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div
                className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-3`}
              >
                <span className={`text-xl font-bold ${color}`}>{value}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map(({ id, label, icon: Icon, color, description }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`${color} p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-left`}
            >
              <Icon className="text-3xl mb-4" style={{ color: "#ffffff" }} />
              <h4
                className="font-semibold text-lg mb-2"
                style={{ color: "#ffffff" }}
              >
                {label}
              </h4>
              <p className="text-sm opacity-90" style={{ color: "#ffffff" }}>
                {description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaFileAlt className="mr-2 text-green-600" />
            Recent Complaints
          </h3>
          <button
            onClick={() => setCurrentPage("track-status")}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        {complaints.length === 0 && !loading ? (
          <div className="text-center py-8">
            <FaFileAlt className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No complaints filed yet</p>
            <button
              onClick={() => setCurrentPage("file-complaint")}
              className="mt-3 text-green-600 hover:text-green-700 font-medium"
            >
              File your first complaint →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setCurrentPage("track-status")}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{complaint.title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    ID: {complaint.id} • Filed on {complaint.date}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    complaint.status
                  )}`}
                >
                  {complaint.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-l-4 border-l-green-500">
        <div className="flex items-start">
          <FaCheckCircle className="text-green-500 text-xl mt-1 mr-4 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help?
            </h4>
            <p className="text-gray-600 mb-4">
              Our support team is here to help with any questions about
              filing complaints or tracking their progress.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  📞 Emergency Helpline
                </p>
                <p className="text-gray-600">
                  Call 1800-XXX-XXXX for urgent matters
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  ⏱️ Response Time
                </p>
                <p className="text-gray-600">
                  We typically respond within 24-48 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
