import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Configuration:', {
    baseURL: API_BASE_URL,
    environment: import.meta.env.NODE_ENV || 'development',
    mode: import.meta.env.MODE || 'development'
});

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000, // 30 second timeout
    withCredentials: false // Set to false for CORS issues
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    // For anonymous complaint submission, don't add any token
    if (config.url === '/complaints/anonymous') {
        console.log('API Request - Anonymous complaint submission, no token needed');
        delete config.headers.Authorization;
        return config;
    }
    
    if (token) {
        // Debug: Log token info
        console.log('API Request - Token found:', {
            length: token.length,
            preview: token.substring(0, 50) + '...',
            startsWithBearer: token.startsWith('Bearer ')
        });
        
        // Ensure we don't double-add Bearer prefix
        const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
        config.headers.Authorization = `Bearer ${cleanToken}`;
        
        console.log('API Request - Authorization header:', config.headers.Authorization.substring(0, 50) + '...');
    } else {
        console.log('API Request - No token found in localStorage');
    }
    return config;
});

// Add response interceptor to handle auth errors and network issues
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response Success:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('❌ API Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
            isNetworkError: !error.response,
            baseURL: error.config?.baseURL
        });
        
        // Handle network errors specifically
        if (!error.response) {
            console.error('🌐 Network Error - Check if backend is accessible:', API_BASE_URL);
        }
        
        // Handle 401 errors
        if (error.response?.status === 401) {
            console.log('🔐 Authentication error - clearing token');
            localStorage.removeItem('token');
            // Optional: redirect to login
        }
        
        return Promise.reject(error);
    }
);
api.interceptors.response.use(
    (response) => {
        console.log('API Response - Success:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.log('API Response - Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.response?.data?.message,
            errorName: error.response?.data?.error,
            fullError: error.response?.data
        });
        
        if (error.response?.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // If it's a token format error, show a more specific message
            if (error.response.data?.message?.includes('token format')) {
                console.error('Token format error. Please login again.');
                // You could redirect to login here if needed
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    // Email/Password authentication
    register: (userData) =>
        api.post('/auth/register', userData),
        
    login: (credentials) =>
        api.post('/auth/login', credentials),

    // Phone/OTP authentication  
    sendOTP: (phoneNumber) =>
        api.post('/auth/send-otp', { phoneNumber }),

    verifyOTP: (phoneNumber, otp) =>
        api.post('/auth/verify-otp', { phoneNumber, otp }),

    validateToken: () =>
        api.get('/auth/validate-token'),

    getProfile: () =>
        api.get('/user/profile'),
        
    updateProfile: (data) =>
        api.put('/user/profile', data)
};

export const complaintAPI = {
    submitComplaint: (data) =>
        api.post('/complaints/anonymous', data),

    getUserComplaints: (params = {}) =>
        api.get('/complaints/my', { params }),

    getComplaintById: (id) =>
        api.get(`/complaints/${id}`),

    updateComplaintStatus: (id, statusData) =>
        api.put(`/complaints/${id}/status`, statusData),

    getUserComplaintStats: () =>
        api.get('/complaints/stats/my'),
    
    // Public tracking endpoints (no authentication required)
    trackComplaint: (complaintId) =>
        api.get(`/complaints/track/${complaintId}`),
    
    getRecentComplaints: (params = {}) =>
        api.get('/complaints/recent', { params }),
    
    getComplaintStats: () =>
        api.get('/complaints/stats')
};

// User Profile API
export const userProfileAPI = {
    createProfile: async (profileData) => {
        const response = await api.post('/users/user-profile', profileData);
        return response.data;
    },
    
    getProfile: async (userId) => {
        const response = await api.get(`/users/user-profile/${userId}`);
        return response.data;
    },
    
    updateProfile: async (userId, profileData) => {
        const response = await api.put(`/users/user-profile/${userId}`, profileData);
        return response.data;
    },

    // New APIs for current user profile
    getCurrentProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },
    
    updateCurrentProfile: async (profileData) => {
        const response = await api.put('/users/profile', profileData);
        return response.data;
    }
};

export default api;
