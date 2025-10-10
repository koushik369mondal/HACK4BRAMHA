import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  FaUser,
  FaCamera,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaTimes,
  FaEdit,
  FaSave,
  FaIdCard,
  FaInfoCircle,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaUserCheck,
  FaCog,
  FaChartLine
} from 'react-icons/fa';
import { userProfileAPI } from '../services/api';

// Constants - Matching Dashboard Style
const PROFILE_STORAGE_KEY = 'userProfile';
const AADHAAR_VERIFICATION_KEY = 'aadhaarVerification';
const PROFILE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Enhanced form validation hook [web:179][web:175]
const useFormValidation = () => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [validFields, setValidFields] = useState({});

  const validateField = useCallback((field, value) => {
    let error = '';
    let isValid = false;

    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Full name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          error = 'Full name must be less than 50 characters';
        } else if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
          error = 'Full name can only contain letters, spaces, hyphens, and apostrophes';
        } else {
          isValid = true;
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        } else {
          isValid = true;
        }
        break;

      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^[6-9]\d{9}$/.test(value)) {
          error = 'Enter a valid 10-digit mobile number';
        } else {
          isValid = true;
        }
        break;

      case 'aadhaar':
        if (!value.trim()) {
          error = 'Aadhaar number is required';
        } else if (!/^\d{12}$/.test(value)) {
          error = 'Enter a valid 12-digit Aadhaar number';
        } else {
          isValid = true;
        }
        break;

      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    setValidFields(prev => ({ ...prev, [field]: isValid }));
    return isValid;
  }, []);

  const setFieldTouched = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const clearError = useCallback((field) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setTouched({});
    setValidFields({});
  }, []);

  const isFormValid = useCallback((formData) => {
    return Object.values(formData).every(value => value.trim() !== '') &&
      Object.values(errors).every(error => error === '') &&
      Object.keys(formData).every(field => validFields[field]);
  }, [errors, validFields]);

  return {
    errors,
    touched,
    validFields,
    validateField,
    setFieldTouched,
    clearError,
    clearAllErrors,
    isFormValid
  };
};

// Dashboard-Style Profile Photo Upload Component [web:174][web:175]
const ProfilePhotoUpload = ({
  profilePhoto,
  onPhotoChange,
  onPhotoRemove,
  error,
  loading
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoClick = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      simulateUpload(() => onPhotoChange(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      simulateUpload(() => onPhotoChange(file));
    }
  };

  const simulateUpload = (callback) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          callback();
          setTimeout(() => setUploadProgress(0), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <input
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        aria-label="Upload profile photo"
      />

      <div className="relative group">
        <div
          onClick={handlePhotoClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-4 shadow-md cursor-pointer transition-all duration-200 ${isDragOver
              ? 'border-green-500 scale-105 shadow-lg bg-green-50'
              : 'border-gray-200 hover:border-green-300 hover:shadow-lg hover:bg-gray-50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Click to upload or drag and drop photo"
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-green-600 transition-colors duration-200">
              <FaCloudUploadAlt className="text-3xl mb-2" />
              <span className="text-sm font-medium text-center px-2">
                {isDragOver ? 'Drop photo here' : 'Upload Photo'}
              </span>
            </div>
          )}

          {/* Upload Progress Overlay */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
              <div className="text-white text-center">
                <FaSpinner className="animate-spin text-xl mb-1 mx-auto" />
                <div className="text-xs">{uploadProgress}%</div>
              </div>
            </div>
          )}
        </div>

        {profilePhoto && !loading && (
          <div className="absolute -top-1 -right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={handlePhotoClick}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
              title="Change photo"
              aria-label="Change profile photo"
            >
              <FaEdit className="text-xs" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPhotoRemove();
              }}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
              title="Remove photo"
              aria-label="Remove profile photo"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 text-center">
        <p className="text-sm text-gray-700 mb-1">
          Click to upload or drag & drop
        </p>
        <p className="text-xs text-gray-600">
          JPG, PNG, GIF or WEBP (max 5MB)
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <FaExclamationTriangle className="mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

// Dashboard-Style Form Field Component [web:179][web:184]
const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  touched,
  valid,
  placeholder,
  maxLength,
  required = true,
  icon: Icon,
  disabled = false,
  helpText
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="text-green-600" />}
          <span className="text-gray-900">{label}</span>
          {required && <span className="text-red-500 ml-1">*</span>}
          {helpText && (
            <div className="group relative">
              <FaInfoCircle className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {helpText}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur(e);
          }}
          className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${error && touched
              ? 'border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500'
              : valid && touched
                ? 'border-green-500 bg-green-50 focus:ring-green-200 focus:border-green-500'
                : isFocused
                  ? 'border-green-500 focus:ring-green-200'
                  : 'border-gray-300 hover:border-gray-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          aria-invalid={error && touched ? 'true' : 'false'}
          aria-describedby={error && touched ? `${label}-error` : undefined}
        />

        {/* Success/Error Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {touched && !error && valid && (
            <FaCheckCircle className="text-green-500" />
          )}

          {touched && error && (
            <FaExclamationTriangle className="text-red-500" />
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && touched && (
        <div
          id={`${label}-error`}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
          role="alert"
        >
          <FaExclamationTriangle className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {value && !error && touched && valid && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <FaCheckCircle className="flex-shrink-0" />
          <span className="text-sm">Valid {label.toLowerCase()}</span>
        </div>
      )}
    </div>
  );
};

// Dashboard-Style Aadhaar Verification Status Component [web:175][web:183]
const AadhaarVerificationStatus = ({
  isVerified,
  onVerificationClick,
  aadhaarNumber
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaShieldAlt className="text-green-600" />
          <span className="text-sm font-semibold text-gray-900">
            Aadhaar Verification Status
          </span>
        </div>

        {isVerified ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              <FaUserCheck className="text-xs" />
              Verified
            </span>
            <span className="text-xs text-gray-600 font-mono">
              ****-****-{aadhaarNumber.slice(-4)}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onVerificationClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-colors duration-200"
          >
            <FaExclamationTriangle className="text-sm" />
            Verify Now
          </button>
        )}
      </div>

      {!isVerified && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <FaInfoCircle className="inline mr-1" />
            Complete Aadhaar verification to secure your account and access all features
          </p>
        </div>
      )}
    </div>
  );
};

// Dashboard-Style Progress Indicator Component [web:174][web:183]
const ProgressIndicator = ({ progress, label }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <span className="text-sm text-gray-600">{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-green-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// Dashboard-Style Stats Component [web:174]
const ProfileStats = ({ profileCompletion, totalFields, completedFields, verificationStatus }) => {
  const stats = [
    {
      label: "Profile Completion",
      value: `${profileCompletion}%`,
      icon: FaChartLine,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Fields Completed",
      value: `${completedFields}/${totalFields}`,
      icon: FaUser,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Verification",
      value: verificationStatus ? "Complete" : "Pending",
      icon: FaShieldAlt,
      color: verificationStatus ? "text-green-600" : "text-amber-500",
      bgColor: verificationStatus ? "bg-green-50" : "bg-amber-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map(({ label, value, icon: Icon, color, bgColor }, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
              <p className="text-gray-700 font-medium text-sm">{label}</p>
            </div>
            <div className={`p-3 rounded-full ${bgColor}`}>
              <Icon className={`${color} text-2xl`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Profile Component - Dashboard Style [web:174][web:175]
export default function Profile({ setCurrentPage }) {
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    aadhaar: ""
  });

  // UI state
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Custom hooks
  const {
    errors,
    touched,
    validFields,
    validateField,
    setFieldTouched,
    clearError,
    clearAllErrors,
    isFormValid
  } = useFormValidation();

  // Calculate profile completion percentage - Dashboard style
  const profileCompletion = useMemo(() => {
    const fields = ['fullName', 'email', 'phone', 'aadhaar'];
    const filledFields = fields.filter(field => formData[field].trim() !== '').length;
    const photoBonus = profilePhoto ? 1 : 0;
    const verificationBonus = aadhaarVerified ? 1 : 0;

    return Math.round(((filledFields + photoBonus + verificationBonus) / (fields.length + 2)) * 100);
  }, [formData, profilePhoto, aadhaarVerified]);

  const completedFields = useMemo(() => {
    return Object.values(formData).filter(value => value.trim() !== '').length +
      (profilePhoto ? 1 : 0);
  }, [formData, profilePhoto]);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
    checkAadhaarVerification();
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch profile data from database API instead of localStorage
      const response = await userProfileAPI.getCurrentProfile();
      
      if (response.success && response.data.profile) {
        const profile = response.data.profile;
        
        // Map database fields to form fields
        setFormData({
          fullName: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          aadhaar: "" // Add aadhaar field when available in schema
        });
        
        // Set profile photo if available
        if (profile.avatar_url) {
          setProfilePhoto(profile.avatar_url);
        }
      } else {
        // No profile found, keep fields empty for user to fill
        console.log('No profile found in database, fields will remain empty');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      // On error, keep fields empty so user can enter their data
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAadhaarVerification = useCallback(() => {
    try {
      const storedVerification = localStorage.getItem(AADHAAR_VERIFICATION_KEY);
      if (storedVerification) {
        const verificationData = JSON.parse(storedVerification);
        const now = Date.now();
        const verificationTime = new Date(verificationData.verificationTimestamp).getTime();

        if (now - verificationTime < PROFILE_DURATION) {
          setAadhaarVerified(true);
          if (!formData.aadhaar && verificationData.aadhaarVerified) {
            setFormData(prev => ({
              ...prev,
              aadhaar: verificationData.aadhaarVerified
            }));
          }
        } else {
          setAadhaarVerified(false);
        }
      }
    } catch (error) {
      console.error('Error checking Aadhaar verification:', error);
      setAadhaarVerified(false);
    }
  }, [formData.aadhaar]);

  const saveProfileData = useCallback(async () => {
    try {
      // Save profile data to database instead of localStorage
      const profileData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
        // aadhaar: formData.aadhaar // Add when schema supports it
      };
      
      const response = await userProfileAPI.updateCurrentProfile(profileData);
      
      if (response.success) {
        console.log('Profile saved to database successfully');
        return true;
      } else {
        console.error('Failed to save profile to database:', response.message);
        return false;
      }
    } catch (error) {
      console.error('Error saving profile data:', error);
      return false;
    }
  }, [formData]);

  const handlePhotoChange = useCallback((file) => {
    setPhotoError('');

    if (file.size > MAX_FILE_SIZE) {
      setPhotoError('File size must be less than 5MB');
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError('Please select a valid image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePhoto(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoRemove = useCallback(() => {
    setProfilePhoto(null);
    setPhotoError('');
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    let processedValue = value;

    if (field === 'phone' || field === 'aadhaar') {
      processedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));

    if (touched[field] && errors[field]) {
      clearError(field);
    }
  }, [touched, errors, clearError]);

  const handleFieldBlur = useCallback((field, value) => {
    setFieldTouched(field);
    validateField(field, value);
  }, [setFieldTouched, validateField]);

  const handleAadhaarVerification = useCallback(() => {
    if (setCurrentPage) {
      setCurrentPage("aadhaar-verify");
    }
  }, [setCurrentPage]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setUpdateSuccess(false);
    clearAllErrors();

    const fieldValidations = Object.entries(formData).map(([field, value]) =>
      validateField(field, value)
    );

    if (!fieldValidations.every(Boolean)) {
      setLoading(false);
      return;
    }

    try {
      // Save profile data to database
      const saveSuccess = await saveProfileData();
      
      if (saveSuccess) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 4000);
      } else {
        console.error('Failed to save profile data');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, validateField, clearAllErrors, saveProfileData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Dashboard-Style Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">User Profile</h1>
            <p className="text-gray-700 text-base">Manage your account information and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center gap-2 font-medium transition-colors"
              onClick={() => setCurrentPage && setCurrentPage("dashboard")}
            >
              <FaChartLine />
              View Dashboard
            </button>
          </div>
        </div>

        {/* Stats Cards - Dashboard Style */}
        <ProfileStats
          profileCompletion={profileCompletion}
          totalFields={5}
          completedFields={completedFields}
          verificationStatus={aadhaarVerified}
        />

        {/* Success Message - Dashboard Style */}
        {updateSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-green-800">
                  Profile Updated Successfully!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your changes have been saved and will be retained for 10 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card - Dashboard Style */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo Section */}
              <ProfilePhotoUpload
                profilePhoto={profilePhoto}
                onPhotoChange={handlePhotoChange}
                onPhotoRemove={handlePhotoRemove}
                error={photoError}
                loading={loading}
              />

              {/* Progress Indicator */}
              <ProgressIndicator
                progress={profileCompletion}
                label="Profile Completion Progress"
              />

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  onBlur={(e) => handleFieldBlur('fullName', e.target.value)}
                  error={errors.fullName}
                  touched={touched.fullName}
                  valid={validFields.fullName}
                  placeholder="Enter your full name"
                  maxLength={50}
                  icon={FaUser}
                  disabled={loading}
                  helpText="Your complete name as it appears on official documents"
                />

                <FormField
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={(e) => handleFieldBlur('email', e.target.value)}
                  error={errors.email}
                  touched={touched.email}
                  valid={validFields.email}
                  placeholder="Enter your email address"
                  disabled={loading}
                  helpText="We'll use this for important account notifications"
                />

                <FormField
                  label="Mobile Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                  error={errors.phone}
                  touched={touched.phone}
                  valid={validFields.phone}
                  placeholder="Enter your 10-digit mobile number"
                  maxLength={10}
                  disabled={loading}
                  helpText="Required for OTP verification and notifications"
                />

                <div>
                  <FormField
                    label="Aadhaar Number"
                    type="text"
                    value={formData.aadhaar}
                    onChange={(e) => handleFieldChange('aadhaar', e.target.value)}
                    onBlur={(e) => handleFieldBlur('aadhaar', e.target.value)}
                    error={errors.aadhaar}
                    touched={touched.aadhaar}
                    valid={validFields.aadhaar}
                    placeholder="Enter your 12-digit Aadhaar number"
                    maxLength={12}
                    icon={FaIdCard}
                    disabled={loading}
                    helpText="Required for identity verification and KYC compliance"
                  />

                  <AadhaarVerificationStatus
                    isVerified={aadhaarVerified}
                    onVerificationClick={handleAadhaarVerification}
                    aadhaarNumber={formData.aadhaar}
                  />
                </div>
              </div>

              {/* Submit Button - Dashboard Style */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || !isFormValid(formData)}
                  className={`px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200 flex items-center gap-2 min-w-48 ${loading || !isFormValid(formData)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Updating Profile...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Cards - Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Privacy & Security Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FaShieldAlt className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Privacy & Security
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Your data is encrypted and stored securely</p>
                  <p>• Profile data auto-expires after 10 minutes for security</p>
                  <p>• Complete Aadhaar verification for enhanced security</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <FaCog className="text-amber-600 text-xl" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Data Management
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Profile completion: {profileCompletion}%</p>
                  <p>• Auto-save enabled for all changes</p>
                  <p>• Data stored in secure browser storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
