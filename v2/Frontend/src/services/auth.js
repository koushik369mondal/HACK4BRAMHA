import { authAPI } from './api';

// Authentication service using backend API
export const authService = {
  // Sign Up with email and password
  signUp: async (email, password, userData = {}) => {
    try {
      const response = await authAPI.register({
        email,
        password,
        name: userData.full_name,
        phone: userData.phone
      });
      
      return { 
        data: { 
          user: response.data.user,
          session: { access_token: response.data.token }
        }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { 
          message: error.response?.data?.message || error.message 
        } 
      };
    }
  },

  // Sign In with email and password
  signIn: async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      return { 
        data: { 
          user: response.data.user,
          session: { access_token: response.data.token }
        }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { 
          message: error.response?.data?.message || error.message 
        } 
      };
    }
  },

  // Sign Out
  signOut: async () => {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { error: null };
    } catch (error) {
      return { error: { message: error.message } };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await authAPI.getProfile();
      return { 
        data: { user: response.data }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error.response?.data?.message || error.message } 
      };
    }
  },

  // Get current session
  getCurrentSession: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      return {
        data: {
          session: { access_token: token },
          user: JSON.parse(user)
        },
        error: null
      };
    }
    
    return {
      data: { session: null, user: null },
      error: null
    };
  },

  // Listen to auth changes (simplified for API-based auth)
  onAuthStateChange: (callback) => {
    // For API-based auth, we can simulate this with storage events
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
          callback('SIGNED_IN', {
            session: { access_token: token },
            user: JSON.parse(user)
          });
        } else {
          callback('SIGNED_OUT', { session: null, user: null });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
          }
        }
      }
    };
  },

  // Reset password (this would need to be implemented in your backend)
  resetPassword: async (email) => {
    try {
      // This endpoint needs to be implemented in your backend
      // For now, return a placeholder response
      console.warn('Password reset functionality needs to be implemented in backend');
      return { 
        data: { message: 'Password reset email sent' }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error.message } 
      };
    }
  }
};

// User Profile API (using existing API service)
export const userProfileAPI = {
  // Create user profile (handled by registration)
  createProfile: async (profileData) => {
    try {
      // This is typically handled during registration
      // Just return success since profile is created during signup
      return { data: profileData, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  },

  // Get user profile
  getProfile: async (userId) => {
    try {
      const response = await authAPI.getProfile();
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error.response?.data?.message || error.message } 
      };
    }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error.response?.data?.message || error.message } 
      };
    }
  }
};