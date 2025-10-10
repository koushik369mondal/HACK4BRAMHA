import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import { supabaseAuth } from "../services/supabase";
import { userProfileAPI } from "../services/api";

// Demo users for fallback authentication
const demoUsers = {
  "naiyaksetu@gmail.com": { password: "123456", role: "admin", name: "Administrator" },
  "customer@email.com": { password: "123456", role: "customer", name: "Customer User" },
};

export default function SignIn({ onLoginSuccess, onSwitchToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputClassName = error
    ? "border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:ring-green-500";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // First try demo users for quick testing
      const demoUser = demoUsers[email.trim().toLowerCase()];
      if (demoUser && demoUser.password === password) {
        // Use demo user data
        const userData = {
          id: `demo-${demoUser.role}`,
          email: email.trim().toLowerCase(),
          name: demoUser.name,
          role: demoUser.role,
          phone: '',
          is_verified: true
        };
        
        // Create a demo JWT token for API calls
        const demoToken = btoa(JSON.stringify({
          user: userData,
          exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          iat: Date.now(),
          demo: true
        }));
        
        // Store token for API calls
        localStorage.setItem('token', demoToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        onLoginSuccess(userData);
        setIsLoading(false);
        return;
      }

      // If not a demo user, try Supabase authentication
      const { data, error } = await supabaseAuth.signIn(email.trim().toLowerCase(), password);
      
      if (error) {
        // Handle specific error messages
        if (error.message.includes('Email not confirmed')) {
          setError("Please check your email and click the confirmation link before signing in. Check your spam folder if you don't see it.");
        } else if (error.message.includes('Invalid login credentials')) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else {
          setError(error.message || "Invalid credentials — please check your email and password and try again.");
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          setError("Please check your email and click the confirmation link before signing in. Check your spam folder if you don't see it.");
          setIsLoading(false);
          return;
        }

        // Get user profile from our user_profiles table
        let userData;
        try {
          const profileResponse = await userProfileAPI.getProfile(data.user.id);
          const profile = profileResponse.profile;
          
          userData = {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name || data.user.user_metadata?.full_name || data.user.email,
            role: profile?.role || 'customer',
            phone: profile?.phone || data.user.user_metadata?.phone || '',
            is_verified: profile?.is_verified || data.user.email_confirmed_at ? true : false
          };
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
          // Create basic user data if profile doesn't exist
          userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email,
            role: 'customer',
            phone: data.user.user_metadata?.phone || '',
            is_verified: data.user.email_confirmed_at ? true : false
          };
        }

        // Store user data for the session
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Call the success callback with user data
        onLoginSuccess(userData);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Sign in error:", err);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">NS</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">NaiyakSetu</h1>
          </div>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${inputClassName}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="Enter your email"
                  aria-invalid={!!error}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${inputClassName}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Switch to Sign Up */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToSignUp}
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Admin</p>
                <p className="text-gray-600">naiyaksetu@gmail.com</p>
                <p className="text-gray-600">123456</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Customer</p>
                <p className="text-gray-600">customer@email.com</p>
                <p className="text-gray-600">123456</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}