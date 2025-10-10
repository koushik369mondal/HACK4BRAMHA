import React, { useState, useEffect } from "react";
import { complaintAPI } from '../services/api';

const statusSteps = [
  { label: "Pending", color: "bg-yellow-500" },
  { label: "In Progress", color: "bg-blue-500" },
  { label: "Resolved", color: "bg-green-500" },
];

const TrackStatus = ({ sidebarOpen, setSidebarOpen, user, onLogout, currentPage, setCurrentPage }) => {
  const [complaintId, setComplaintId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [error, setError] = useState(null);

  // Load recent complaints on component mount
  useEffect(() => {
    loadRecentComplaints();
  }, []);

  const loadRecentComplaints = async () => {
    try {
      const response = await complaintAPI.getRecentComplaints({ limit: 5 });
      if (response.data.success) {
        setRecentComplaints(response.data.complaints);
      }
    } catch (error) {
      console.error('Failed to load recent complaints:', error);
      // Fallback to show some demo data if API fails
      setRecentComplaints([
        { complaint_id: "CMP12345DEMO", title: "Demo: Track with any valid ID", status: "submitted" },
      ]);
    }
  };

  const handleTrack = async () => {
    if (!complaintId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await complaintAPI.trackComplaint(complaintId);
      if (response.data.success) {
        setStatus(response.data.complaint);
      } else {
        setStatus("not-found");
      }
    } catch (error) {
      console.error('Failed to track complaint:', error);
      if (error.response?.status === 404) {
        setStatus("not-found");
      } else {
        setError('Failed to track complaint. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTrack = async (id) => {
    setComplaintId(id);
    setLoading(true);
    setError(null);
    
    try {
      const response = await complaintAPI.trackComplaint(id);
      if (response.data.success) {
        setStatus(response.data.complaint);
      } else {
        setStatus("not-found");
      }
    } catch (error) {
      console.error('Failed to track complaint:', error);
      if (error.response?.status === 404) {
        setStatus("not-found");
      } else {
        setError('Failed to track complaint. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Map database status to display status
  const mapStatus = (dbStatus) => {
    const statusMap = {
      'submitted': 'Pending',
      'in_progress': 'In Progress', 
      'resolved': 'Resolved',
      'closed': 'Resolved'
    };
    return statusMap[dbStatus] || 'Pending';
  };

  const currentStepIndex = status ? statusSteps.findIndex(step => step.label === mapStatus(status.status)) : -1;

  const getStatusColor = (statusText) => {
    const mappedStatus = typeof statusText === 'string' ? statusText : mapStatus(statusText);
    if (mappedStatus === "Resolved") return "text-green-600 bg-green-100";
    if (mappedStatus === "In Progress") return "text-blue-600 bg-blue-100";
    return "text-yellow-600 bg-yellow-100";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Track Complaint Status</h2>
        <div className="flex gap-3 max-w-md mx-auto">
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter Complaint ID (e.g. CMP12345XXXXX)"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
          />
          <button
            onClick={handleTrack}
            disabled={loading || !complaintId.trim()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:bg-gray-400"
          >
            {loading ? "..." : "Track"}
          </button>
        </div>
        {error && (
          <p className="text-red-600 mt-2 text-sm">{error}</p>
        )}
      </div>

      {/* Quick Track & Instructions */}
      {!status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Track Examples */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Complaints</h3>
            <p className="text-gray-600 mb-4">Click any complaint ID below to track</p>
            <div className="space-y-3">
              {recentComplaints.length > 0 ? recentComplaints.map(complaint => (
                <div
                  key={complaint.complaint_id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleQuickTrack(complaint.complaint_id)}
                >
                  <div>
                    <p className="font-medium text-gray-900">ID: {complaint.complaint_id}</p>
                    <p className="text-sm text-gray-600">{complaint.title}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                    {mapStatus(complaint.status)}
                  </span>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No recent complaints found</p>
                  <p className="text-sm">Submit a complaint first to see tracking data</p>
                </div>
              )}
            </div>
          </div>

          {/* How to Track */}
          <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Track</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: "Enter Complaint ID", desc: "Use the complaint ID you received (starts with CMP)" },
                { step: 2, title: "Click Track", desc: "Get real-time status updates from database" },
                { step: 3, title: "View Results", desc: "See current status and submission details" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {step}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Meanings */}
      {!status && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Status Meanings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { color: "bg-yellow-500", status: "Pending", desc: "Complaint received and awaiting review" },
              { color: "bg-blue-500", status: "In Progress", desc: "Being processed by relevant department" },
              { color: "bg-green-500", status: "Resolved", desc: "Issue has been addressed and closed" },
            ].map(({ color, status, desc }) => (
              <div key={status} className="flex items-center gap-3">
                <div className={`${color} rounded-full w-4 h-4`}></div>
                <div>
                  <p className="font-medium text-gray-900">{status}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complaint Status Display */}
      {status && status !== "not-found" && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Complaint ID: {status.complaint_id}</h3>
            <button onClick={() => setStatus(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600"><span className="font-semibold">Issue:</span> {status.title}</p>
              <p className="text-gray-600"><span className="font-semibold">Category:</span> {status.category}</p>
              <p className="text-gray-600"><span className="font-semibold">Priority:</span> {status.priority}</p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-semibold">Status:</span>
                <span className={`ml-2 font-semibold ${
                  mapStatus(status.status) === "Resolved" ? "text-green-600" :
                  mapStatus(status.status) === "In Progress" ? "text-blue-600" : "text-yellow-600"
                }`}>
                  {mapStatus(status.status)}
                </span>
              </p>
              <p className="text-gray-600"><span className="font-semibold">Submitted:</span> {new Date(status.created_at).toLocaleDateString()}</p>
              {status.updated_at && status.updated_at !== status.created_at && (
                <p className="text-gray-600"><span className="font-semibold">Last Updated:</span> {new Date(status.updated_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {status.description && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2 text-gray-900">Description</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{status.description}</p>
            </div>
          )}

          {/* Location */}
          {status.location && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2 text-gray-900">Location</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                {status.location.address && (
                  <p className="text-gray-600 mb-1">📍 {status.location.address}</p>
                )}
                <p className="text-gray-600 text-sm">
                  Coordinates: {status.location.latitude}, {status.location.longitude}
                </p>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="mb-8">
            <h4 className="font-semibold mb-4 text-gray-900">Progress Timeline</h4>
            <div className="flex items-center justify-between relative">
              {statusSteps.map((step, idx) => (
                <div key={step.label} className="flex flex-col items-center z-10 bg-white px-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    idx <= currentStepIndex ? step.color : "bg-gray-400"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`mt-2 text-sm font-medium text-center ${
                    idx <= currentStepIndex ? "text-gray-900" : "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300 -z-10">
                <div 
                  className="h-1 bg-green-500 transition-all duration-500"
                  style={{ width: currentStepIndex >= 0 ? `${((currentStepIndex) / (statusSteps.length - 1)) * 100}%` : "0%" }}
                ></div>
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-900">Complaint Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600"><span className="font-medium">Reporter Type:</span> {status.reporter_type}</p>
              <p className="text-gray-600"><span className="font-medium">Submission Date:</span> {new Date(status.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Not found */}
      {status === "not-found" && (
        <div className="bg-white shadow rounded-lg p-6 text-center border-l-4 border-red-500">
          <p className="text-red-600 font-medium text-lg mb-2">
            No complaint found with ID: {complaintId}
          </p>
          <p className="text-gray-600 mb-4">Please check the complaint ID and try again.</p>
          <button 
            onClick={() => setStatus(null)}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
          >
            Try Another ID
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackStatus;
