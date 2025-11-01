import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Auth from "./components/Auth";
import AdminDashboard from "./components/AdminDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import ComplaintForm from "./components/ComplaintForm";
import Profile from "./components/Profile";
import AadhaarVerification from "./components/AadhaarVerification";
import Tracking from "./components/Tracking";
import Chat from "./components/Chat";
import InfoHub from "./components/InfoHub";
import Community from "./components/Community";
import Gbot from "./components/Gbot";

function App() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Application State
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Initialize app and check authentication
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate authentication check
        const savedUser = localStorage.getItem("NaiyakSetuUser");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage("dashboard");
    localStorage.setItem("NaiyakSetuUser", JSON.stringify(userData));
    
    // Welcome notification with auto-dismiss
    const welcomeNotification = {
      id: Date.now(),
      message: `Welcome back, ${userData.name}!`,
      type: "success",
      isVisible: true
    };
    
    setNotifications(prev => [...prev, welcomeNotification]);
    
    // Auto-dismiss after 3 seconds with fade-out
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === welcomeNotification.id 
            ? { ...notif, isVisible: false }
            : notif
        )
      );
      
      // Remove from DOM after fade-out animation completes
      setTimeout(() => {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== welcomeNotification.id)
        );
      }, 300); // 300ms for fade-out transition
    }, 3000); // 3 seconds display time
  };

  // Handle user logout
  const handleLogout = () => {
    setUser(null);
    setCurrentPage("dashboard");
    setSidebarOpen(false);
    localStorage.removeItem("NaiyakSetuUser");
    localStorage.removeItem("token"); // Clear the authentication token
    
    // Clear any notifications
    setNotifications([]);
  };

  // Navigate between pages
  const navigateToPage = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  // Update user data (for real-time profile updates)
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem("NaiyakSetuUser", JSON.stringify(updatedUser));
  };

  // Common props passed to all page components
  const getCommonProps = () => ({
    user,
    updateUser,
    currentPage,
    sidebarOpen,
    setSidebarOpen,
    onLogout: handleLogout,
    setCurrentPage: navigateToPage,
    notifications,
    setNotifications
  });

  // Centralized page content rendering
  const renderPageContent = () => {
    if (!user) {
      return <Auth onLoginSuccess={handleLoginSuccess} />;
    }

    const commonProps = getCommonProps();

    // Debug log to check current page
    console.log("Current page:", currentPage, "User role:", user.role);

    switch (currentPage) {
      case "dashboard":
        return user.role === "admin" 
          ? <AdminDashboard {...commonProps} />
          : <CustomerDashboard {...commonProps} />;

      case "profile":
        // Ensure Profile gets the same treatment as other components
        console.log("Rendering Profile component with props:", commonProps);
        return <Profile {...commonProps} />;

      case "file-complaint":
        return <ComplaintForm {...commonProps} />;

      case "track-status":
        return <Tracking {...commonProps} />;

      case "aadhaar-verify":
        return <AadhaarVerification {...commonProps} />;

      case "chat":
        return <Chat {...commonProps} />;

      case "info-hub":
        return <InfoHub {...commonProps} />;

      case "community":
        return <Community {...commonProps} />;

      case "settings":
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">App settings and preferences will be available here.</p>
            </div>
          </div>
        );

      default:
        return user.role === "admin" 
          ? <AdminDashboard {...commonProps} />
          : <CustomerDashboard {...commonProps} />;
    }
  };

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-green-800 mb-2">NaiyakSetu</h1>
            <p className="text-green-600">Connecting Citizens with Solutions</p>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Main app render
  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Layout {...getCommonProps()}>
          {renderPageContent()}
        </Layout>
      ) : (
        // Login screen without layout
        <div className="min-h-screen">
          {renderPageContent()}
        </div>
      )}
      
      {/* Global notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.slice(-3).map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-sm transform transition-all duration-300 ${
                notification.isVisible === false ? 'opacity-0' : 'opacity-100'
              } ${
                notification.type === 'success' ? 'bg-green-600' :
                notification.type === 'error' ? 'bg-red-600' :
                notification.type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
              }`}
              style={{
                transition: 'opacity 0.3s ease-in-out',
                display: notification.isVisible === false && notification.fadeComplete ? 'none' : 'block'
              }}
            >
              <p className="text-sm">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* AI Chatbot - Available on all pages */}
      <Gbot />
    </div>
  );
}

export default App;
