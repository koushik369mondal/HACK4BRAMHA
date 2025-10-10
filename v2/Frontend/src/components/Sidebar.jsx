import React, { useMemo } from "react";
import {
  FaHome,
  FaFileAlt,
  FaChartBar,
  FaInfoCircle,
  FaComments,
  FaIdCard,
  FaUser,
  FaSignOutAlt,
  FaShieldAlt,
  FaSearch,
  FaUsers,
  FaCog,
} from "react-icons/fa";
import ProfileAvatar from "./ProfileAvatar";

export default function Sidebar({
  user,
  onLogout,
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen
}) {

  const navigationItems = useMemo(() => {
    const adminItems = [
      { id: "dashboard", label: "Dashboard", icon: FaHome },
      { id: "track-status", label: "All Complaints", icon: FaSearch },
      { id: "community", label: "User Management", icon: FaUsers },
      { id: "profile", label: "Profile", icon: FaUser },
      { id: "settings", label: "Settings", icon: FaCog },
    ];

    const customerItems = [
      { id: "dashboard", label: "Dashboard", icon: FaHome },
      { id: "file-complaint", label: "File Complaint", icon: FaFileAlt },
      { id: "track-status", label: "Track Status", icon: FaSearch },
      { id: "info-hub", label: "Info Hub", icon: FaInfoCircle },
      { id: "community", label: "Community", icon: FaUsers },
      { id: "aadhaar-verify", label: "Verify Aadhaar", icon: FaIdCard },
      { id: "profile", label: "Profile", icon: FaUser },
    ];

    return user?.role === "admin" ? adminItems : customerItems;
  }, [user?.role]);

  // Fixed: Using the correct variable name
  const handleNavigation = (pageId) => {
    setCurrentPage(pageId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleProfileClick = () => {
    setCurrentPage("profile");
    setSidebarOpen(false);
  };

  // Enhanced logout with confirmation and data clearing
  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout? This will clear saved data including profile and Aadhaar verification."
    );

    if (!confirmLogout) return;

    try {
      const keysToRemove = [
        "userProfile",
        "aadhaarVerification",
        "complaintDraft",
        "userPreferences",
        "sessionData",
        "tempData",
        "userComplaints",
        "NaiyakSetuUser"
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();

      if (sidebarOpen && setSidebarOpen) setSidebarOpen(false);
      if (setCurrentPage) setCurrentPage("dashboard");
      if (onLogout) onLogout();

      alert("Successfully logged out! All data has been cleared.");
    } catch (err) {
      console.error("Error during logout:", err);
      alert("An error occurred during logout. Please try again.");
    }
  };

  // Logic for role display
  const displayRole = () => {
    if (!user || !user.role) return "";
    const roleLower = user.role.toString().toLowerCase();
    if (roleLower === "admin" || roleLower === "administrator") {
      return "Administrator";
    }
    if (roleLower === "customer") {
      return "Customer";
    }
    return "User"; // Default fallback
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ease-in-out duration-300 bg-white border-r border-gray-200 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      aria-label="Sidebar navigation"
    >
      {/* Header - Enhanced Responsive */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex items-center justify-between lg:justify-start">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 bg-emerald-600 text-white rounded-lg flex-shrink-0">
              <FaShieldAlt className="text-base sm:text-lg" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-emerald-600 truncate">
                NaiyakSetu
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm truncate">
                Citizen Grievance Hub
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="px-4 py-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-200">
          <button
            onClick={handleProfileClick}
            className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 group"
          >
            <ProfileAvatar name={user.name} avatarUrl={user.avatarUrl} />
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                {user.name}
              </div>
              <div className="text-xs text-gray-600">{displayRole()}</div>
            </div>
            <FaUser className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
          </button>
        </div>
      )}

      {/* Navigation Menu - FIXED */}
      <div className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
        <nav>
          <ul className="space-y-2 sm:space-y-3">
            {navigationItems.map(({ id, label, icon: Icon }) => {
              const active = currentPage === id;
              return (
                <li key={id}>
                  <button
                    onClick={() => {
                      if (setCurrentPage) setCurrentPage(id);
                      if (sidebarOpen && setSidebarOpen) setSidebarOpen(false);
                    }}
                    className={`flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 group ${active
                      ? "bg-emerald-600 text-white shadow-md transform scale-105"
                      : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:transform hover:scale-102"
                      }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={`text-base sm:text-lg mr-3 sm:mr-4 transition-colors duration-200 flex-shrink-0 ${active
                        ? "text-white"
                        : "text-gray-600 group-hover:text-emerald-600"
                        }`}
                    />
                    <span className="text-sm font-medium truncate">{label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full flex-shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom Section - Enhanced */}
      <div className="px-3 sm:px-4 pb-4">
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 border-2 border-red-200 hover:border-red-300 mb-3 sm:mb-4 group"
          >
            <FaSignOutAlt className="text-base sm:text-lg mr-3 sm:mr-4 group-hover:animate-pulse flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        )}

        <div className="pt-2 sm:pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 mb-1">Version 2.0.0</p>
          <p className="text-xs text-gray-400">© 2025 NaiyakSetu</p>
        </div>
      </div>
    </aside>
  );
}
