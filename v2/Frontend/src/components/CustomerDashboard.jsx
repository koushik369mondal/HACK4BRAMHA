import React, { useState, useEffect } from "react";
import {
  FaFileAlt,
  FaSearch,
  FaUser,
  FaBell,
  FaCheckCircle,
  FaSpinner,
  FaSync,
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

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent complaints (using the same pattern as Tracking.jsx)
      const complaintsResponse = await complaintAPI.getRecentComplaints({ limit: 5 });

      if (complaintsResponse.data && complaintsResponse.data.success) {
        const complaintsData = complaintsResponse.data.complaints || [];

        // Calculate stats from the complaints data
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

        // Update stats
        setStats(calculatedStats);

        // Format complaints data
        const formattedComplaints = complaintsData.map(complaint => ({
          id: complaint.complaint_id,
          title: complaint.title,
          status: formatStatus(complaint.status),
          date: new Date(complaint.created_at).toLocaleDateString('en-CA')
        }));

        setComplaints(formattedComplaints);
      } else {
        // If no data, set empty states
        setComplaints([]);
        setStats({
          total: 0,
          resolved: 0,
          inProgress: 0,
          pending: 0
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);

      // Set fallback demo data to show the UI works
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

      setError('Unable to fetch live data. Showing demo data. Please submit a complaint first.');
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
            <h1
              className="text-3xl lg:text-4xl font-bold mb-2"
              style={{ color: "#ffffff" }}
            >
              Dashboard 🏠
            </h1>
            <p className="text-lg" style={{ color: "#ffffff" }}>
              Let's make your community better together
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center bg-white bg-opacity-20 px-3 py-2 rounded-lg hover:bg-opacity-30 transition-all"
            >
              <FaSync className={`mr-2 text-black ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm text-black font-medium">
                {loading ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
            <div className="flex items-center bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <FaBell className="mr-2 animate-pulse text-black" />
              <span className="text-sm text-black font-medium">
                {stats.total} total complaints
              </span>
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
