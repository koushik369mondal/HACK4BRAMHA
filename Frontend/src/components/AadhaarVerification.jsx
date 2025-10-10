import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaIdCard,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaSpinner,
  FaRedo,
  FaArrowLeft,
  FaTimes,
  FaUpload,
  FaImage,
  FaCamera
} from 'react-icons/fa';

// Import utility functions directly
import { validateAadhaarNumber } from '../utils/verhoeff';
import {
  generateSecureOTP,
  validateOTP,
  validatePhoneNumber,
  maskPhoneNumber,
  formatTime,
  OTP_TIMER_DURATION,
  RESEND_COOLDOWN,
  isDev
} from '../utils/otp';
import {
  validateAadhaarComplete,
  maskAadhaar
} from '../utils/aadhaar';

// Constants
const VERIFICATION_STORAGE_KEY = 'aadhaarVerification';
const VERIFICATION_DURATION = 10 * 60 * 1000; // 10 minutes

// Image validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Fixed Image Upload Component [web:122][web:125]
const ImageUploadField = ({
  id,
  label,
  image,
  preview,
  error,
  onFileSelect,
  onRemove,
  required = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPG, PNG, WEBP)';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFileSelect = (file) => {
    const error = validateFile(file);
    if (error) {
      onFileSelect(null, error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onFileSelect(file, null, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // [web:122][web:125]
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // [web:122][web:125]
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // [web:122][web:125]
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleRemove = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // [web:122][web:125]

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  }, [onRemove]);

  // Fixed: Separate click handlers to prevent double triggering [web:122][web:125]
  const handleUploadAreaClick = useCallback((e) => {
    // Only trigger if clicked directly on the upload area, not on child elements
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      fileInputRef.current?.click();
    }
  }, []);

  const handleChooseFileClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // [web:122][web:125]
    fileInputRef.current?.click();
  }, []);

  const handleReplaceClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // [web:122][web:125]
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        id={id}
      />

      {/* Upload Area */}
      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${isDragging
              ? 'border-emerald-500 bg-emerald-50'
              : error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadAreaClick} // Fixed: Only trigger on direct click [web:122]
        >
          <div className="space-y-3 pointer-events-none"> {/* Prevent child clicks from bubbling */}
            <div className="flex justify-center">
              <FaUpload className={`text-3xl ${error ? 'text-red-400' : 'text-gray-400'
                }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={handleChooseFileClick} // Fixed: Separate handler [web:122]
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 pointer-events-auto" // Re-enable pointer events for button
              >
                <FaImage className="mr-2" />
                Choose File
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview */
        <div className="relative">
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt={`${label} preview`}
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="absolute top-2 right-2 space-x-2">
            <button
              type="button"
              onClick={handleReplaceClick} // Fixed: Separate handler [web:122]
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm transition-colors"
              title="Replace image"
            >
              <FaCamera className="text-sm" />
            </button>
            <button
              type="button"
              onClick={handleRemove} // Fixed: Already has stopPropagation [web:122]
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm transition-colors"
              title="Remove image"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            <div className="flex items-center">
              <FaCheckCircle className="mr-2 text-green-600" />
              <span className="font-medium">Image uploaded successfully</span>
            </div>
            <div className="mt-1 text-xs text-green-600">
              Size: {image ? (image.size / 1024 / 1024).toFixed(2) : 0}MB
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
          <FaExclamationTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

// Custom hooks for better code organization
const useTimer = (initialTime = 0) => {
  const [time, setTime] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback((duration = initialTime) => {
    setTime(duration);
    setIsActive(true);
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setTime(0);
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            setIsActive(false);
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, time]);

  return { time, isActive, start, stop, reset };
};

// Form validation hook
const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  const validateField = useCallback((field, value, validator) => {
    const result = validator(value);
    setErrors(prev => ({
      ...prev,
      [field]: result.isValid ? null : result.error
    }));
    return result.isValid;
  }, []);

  const clearError = useCallback((field) => {
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = Object.values(errors).some(error => error);

  return { errors, validateField, clearError, clearAllErrors, hasErrors };
};

// Image upload hook
const useImageUpload = () => {
  const [images, setImages] = useState({
    front: { file: null, preview: null, error: null },
    back: { file: null, preview: null, error: null }
  });

  const handleImageSelect = useCallback((type, file, error, preview) => {
    setImages(prev => ({
      ...prev,
      [type]: { file, preview, error }
    }));
  }, []);

  const handleImageRemove = useCallback((type) => {
    setImages(prev => ({
      ...prev,
      [type]: { file: null, preview: null, error: null }
    }));
  }, []);

  const clearAllImages = useCallback(() => {
    setImages({
      front: { file: null, preview: null, error: null },
      back: { file: null, preview: null, error: null }
    });
  }, []);

  const hasValidImages = images.front.file && images.back.file &&
    !images.front.error && !images.back.error;

  return {
    images,
    handleImageSelect,
    handleImageRemove,
    clearAllImages,
    hasValidImages
  };
};

// Simple Mode Component
const SimpleVerification = ({
  initialAadhaar = '',
  onVerificationComplete,
  isRequired = true
}) => {
  const [aadhaarNumber, setAadhaarNumber] = useState(initialAadhaar);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const { errors, validateField, clearError } = useFormValidation();

  const handleAadhaarChange = useCallback((e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 12) {
      setAadhaarNumber(value);
      clearError('aadhaar');
      if (verificationStatus) {
        setVerificationStatus(null);
        setVerifiedData(null);
      }
    }
  }, [verificationStatus, clearError]);

  const handleVerification = useCallback(async () => {
    if (!validateField('aadhaar', aadhaarNumber, validateAadhaarNumber)) {
      return;
    }

    setIsVerifying(true);

    try {
      const result = await validateAadhaarComplete(aadhaarNumber);

      if (result.isValid) {
        setVerificationStatus('success');
        setVerifiedData(result.data);
        onVerificationComplete?.({
          success: true,
          aadhaarNumber,
          data: result.data
        });
      } else {
        setVerificationStatus('error');
        validateField('aadhaar', aadhaarNumber, () => ({ isValid: false, error: result.error }));
        onVerificationComplete?.({ success: false });
      }
    } catch (error) {
      setVerificationStatus('error');
      validateField('aadhaar', aadhaarNumber, () => ({
        isValid: false,
        error: error.message || 'Verification failed'
      }));
      onVerificationComplete?.({ success: false });
    } finally {
      setIsVerifying(false);
    }
  }, [aadhaarNumber, validateField, onVerificationComplete]);

  const handleReset = useCallback(() => {
    setAadhaarNumber('');
    setVerificationStatus(null);
    setVerifiedData(null);
    clearError('aadhaar');
    onVerificationComplete?.({ success: false });
  }, [clearError, onVerificationComplete]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Aadhaar Verification
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {verificationStatus === 'success' && (
          <div className="flex items-center text-green-600">
            <FaCheckCircle className="w-5 h-5 mr-2" />
            Verified ✓
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhaar Number
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              value={verificationStatus === 'success' ? maskAadhaar(aadhaarNumber) : formatAadhaar(aadhaarNumber)}
              onChange={handleAadhaarChange}
              placeholder="1234 5678 9012"
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${verificationStatus === 'success'
                  ? 'border-green-500 bg-green-50'
                  : errors.aadhaar
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              disabled={verificationStatus === 'success' || isVerifying}
              maxLength="14"
            />

            {verificationStatus !== 'success' ? (
              <button
                onClick={handleVerification}
                disabled={isVerifying || aadhaarNumber.length !== 12}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center min-w-[100px]"
              >
                {isVerifying ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errors.aadhaar && (
          <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
            <FaExclamationTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{errors.aadhaar}</span>
          </div>
        )}

        {/* Success Message & Data */}
        {verifiedData && verificationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">✅ Verification Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">{verifiedData.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Gender:</span>
                <span className="ml-2 text-gray-900">{verifiedData.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">State:</span>
                <span className="ml-2 text-gray-900">{verifiedData.state || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">District:</span>
                <span className="ml-2 text-gray-900">{verifiedData.district || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Enter your 12-digit Aadhaar number without spaces</p>
          <p>• This is a demo verification system for testing purposes</p>
          <p>• Your data is secure and not stored permanently</p>
        </div>
      </div>
    </div>
  );
};

// Full Mode Component with Image Upload (rest of the component remains the same)
const FullVerification = ({
  initialAadhaar = '',
  initialPhone = '',
  onVerificationComplete,
  onCancel,
  title = "Aadhaar Verification",
  showTitle = true
}) => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    aadhaarNumber: initialAadhaar,
    phoneNumber: initialPhone,
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [devOTP, setDevOTP] = useState('');
  const [verificationData, setVerificationData] = useState(null);

  const { errors, validateField, clearError, clearAllErrors } = useFormValidation();
  const { images, handleImageSelect, handleImageRemove, clearAllImages, hasValidImages } = useImageUpload();
  const otpTimer = useTimer(OTP_TIMER_DURATION);
  const resendTimer = useTimer(RESEND_COOLDOWN);

  // Check existing verification on mount
  useEffect(() => {
    const checkExistingVerification = () => {
      try {
        const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          const now = Date.now();
          const verificationTime = new Date(data.verificationTimestamp).getTime();

          if (now - verificationTime < VERIFICATION_DURATION) {
            setVerificationData(data);
            setStep('success');
            setFormData({
              aadhaarNumber: data.aadhaarVerified,
              phoneNumber: data.verifiedPhone,
              otp: ''
            });
          } else {
            localStorage.removeItem(VERIFICATION_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error checking existing verification:', error);
        localStorage.removeItem(VERIFICATION_STORAGE_KEY);
      }
    };

    checkExistingVerification();
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  }, [clearError]);

  const handleSendOTP = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    clearAllErrors();

    try {
      // Validate fields
      const isAadhaarValid = validateField('aadhaarNumber', formData.aadhaarNumber, validateAadhaarNumber);
      const isPhoneValid = validateField('phoneNumber', formData.phoneNumber, validatePhoneNumber);

      if (!isAadhaarValid || !isPhoneValid) {
        setLoading(false);
        return;
      }

      // Validate images
      if (!hasValidImages) {
        validateField('images', '', () => ({
          isValid: false,
          error: 'Please upload both front and back side images of your Aadhaar card.'
        }));
        setLoading(false);
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const otp = generateSecureOTP();
      setDevOTP(otp);
      setStep('otp');
      otpTimer.start();

    } catch (error) {
      validateField('general', '', () => ({ isValid: false, error: 'Failed to send OTP. Please try again.' }));
    } finally {
      setLoading(false);
    }
  }, [formData, validateField, clearAllErrors, otpTimer, hasValidImages]);

  const handleVerifyOTP = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    clearAllErrors();

    try {
      if (formData.otp.length !== 6) {
        validateField('otp', formData.otp, () => ({ isValid: false, error: 'OTP must be 6 digits' }));
        setLoading(false);
        return;
      }

      if (otpTimer.time === 0) {
        validateField('otp', formData.otp, () => ({ isValid: false, error: 'OTP has expired. Please request a new one.' }));
        setLoading(false);
        return;
      }

      if (isDev && formData.otp !== devOTP) {
        validateField('otp', formData.otp, () => ({ isValid: false, error: 'Invalid OTP. Please check and try again.' }));
        setLoading(false);
        return;
      }

      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      const verificationInfo = {
        aadhaarVerified: formData.aadhaarNumber,
        verifiedPhone: formData.phoneNumber,
        verificationTimestamp: new Date().toISOString(),
        images: {
          front: images.front.file?.name,
          back: images.back.file?.name
        }
      };

      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verificationInfo));
      setVerificationData(verificationInfo);
      onVerificationComplete?.(verificationInfo);
      setStep('success');

    } catch (error) {
      validateField('general', '', () => ({ isValid: false, error: 'OTP verification failed. Please try again.' }));
    } finally {
      setLoading(false);
    }
  }, [formData, validateField, clearAllErrors, otpTimer.time, devOTP, onVerificationComplete, images]);

  const handleResendOTP = useCallback(async () => {
    if (resendTimer.time > 0) return;

    setLoading(true);
    clearAllErrors();

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const otp = generateSecureOTP();
      setDevOTP(otp);
      otpTimer.start();
      resendTimer.start();
    } catch (error) {
      validateField('general', '', () => ({ isValid: false, error: 'Failed to resend OTP. Please try again.' }));
    } finally {
      setLoading(false);
    }
  }, [resendTimer.time, clearAllErrors, validateField, otpTimer, resendTimer]);

  const handleStartOver = useCallback(() => {
    setStep('form');
    setFormData({ aadhaarNumber: '', phoneNumber: '', otp: '' });
    clearAllErrors();
    clearAllImages();
    setDevOTP('');
    setVerificationData(null);
    otpTimer.reset();
    resendTimer.reset();
    localStorage.removeItem(VERIFICATION_STORAGE_KEY);
  }, [clearAllErrors, clearAllImages, otpTimer, resendTimer]);

  const maskAadhaarFull = (aadhaarNumber) => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) return 'Not provided';
    return `****-****-${aadhaarNumber.slice(-4)}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      {showTitle && (
        <div className="flex items-center mb-6">
          <FaIdCard className="text-3xl text-emerald-600 mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
        </div>
      )}

      {/* Form Step */}
      {step === 'form' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Verify Your Aadhaar
          </h2>
          <form onSubmit={handleSendOTP} className="space-y-6">
            {/* Aadhaar Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Aadhaar Number
              </label>
              <input
                type="text"
                value={formData.aadhaarNumber}
                onChange={(e) => handleInputChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your 12-digit Aadhaar number"
                className={`w-full px-4 py-3 bg-white border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                maxLength={12}
                required
              />
              {errors.aadhaarNumber && (
                <div className="flex items-center mt-1">
                  <FaExclamationTriangle className="text-red-500 text-sm mr-1" />
                  <p className="text-red-600 text-sm">{errors.aadhaarNumber}</p>
                </div>
              )}
              {formData.aadhaarNumber.length === 12 && !errors.aadhaarNumber && (
                <div className="flex items-center mt-1">
                  <FaCheckCircle className="text-green-500 text-sm mr-1" />
                  <p className="text-green-600 text-sm">Valid Aadhaar number</p>
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your 10-digit phone number"
                className={`w-full px-4 py-3 bg-white border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                maxLength={10}
                required
              />
              {errors.phoneNumber && (
                <div className="flex items-center mt-1">
                  <FaExclamationTriangle className="text-red-500 text-sm mr-1" />
                  <p className="text-red-600 text-sm">{errors.phoneNumber}</p>
                </div>
              )}
              {formData.phoneNumber.length === 10 && !errors.phoneNumber && (
                <div className="flex items-center mt-1">
                  <FaCheckCircle className="text-green-500 text-sm mr-1" />
                  <p className="text-green-600 text-sm">Valid phone number</p>
                </div>
              )}
            </div>

            {/* Image Upload Section - Fixed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Front Side Image Upload */}
              <ImageUploadField
                id="aadhaar-front"
                label="Front Side of Aadhaar Card"
                image={images.front.file}
                preview={images.front.preview}
                error={images.front.error}
                onFileSelect={(file, error, preview) => handleImageSelect('front', file, error, preview)}
                onRemove={() => handleImageRemove('front')}
                required={true}
              />

              {/* Back Side Image Upload */}
              <ImageUploadField
                id="aadhaar-back"
                label="Back Side of Aadhaar Card"
                image={images.back.file}
                preview={images.back.preview}
                error={images.back.error}
                onFileSelect={(file, error, preview) => handleImageSelect('back', file, error, preview)}
                onRemove={() => handleImageRemove('back')}
                required={true}
              />
            </div>

            {/* General Error Messages */}
            {(errors.general || errors.images) && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center">
                <FaExclamationTriangle className="h-5 w-5 mr-2" />
                <span>{errors.general || errors.images}</span>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className={`px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 inline-block" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Rest of the component steps remain the same... */}
      {/* OTP Step */}
      {step === 'otp' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Enter OTP</h2>
          <p className="text-gray-700 mb-4">
            OTP has been sent to {maskPhoneNumber(formData.phoneNumber)}
          </p>

          {/* Development OTP Display */}
          {isDev && devOTP && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <p className="text-blue-800 text-sm font-medium mb-1">
                🔧 Development Mode
              </p>
              <p className="text-blue-700 text-lg font-mono">
                OTP: <span className="font-bold">{devOTP}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                OTP
              </label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className={`w-full px-4 py-3 bg-white border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.otp ? 'border-red-500' : 'border-gray-300'
                  }`}
                maxLength={6}
                required
              />
              {errors.otp && (
                <div className="flex items-center mt-1">
                  <FaExclamationTriangle className="text-red-500 text-sm mr-1" />
                  <p className="text-red-600 text-sm">{errors.otp}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-700">
              {otpTimer.time > 0 ? (
                <span className="flex items-center gap-2">
                  <FaClock />
                  Expires in {formatTime(otpTimer.time)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-emerald-600 hover:text-emerald-700 font-medium underline"
                  disabled={resendTimer.time > 0 || loading}
                >
                  {resendTimer.time > 0 ? `Resend in ${resendTimer.time}s` : 'Resend OTP'}
                </button>
              )}
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center">
                <FaExclamationTriangle className="h-5 w-5 mr-2" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                className={`px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                disabled={loading || otpTimer.time === 0}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 inline-block" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
              <button
                type="button"
                onClick={handleStartOver}
                className="px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold rounded-md transition-colors duration-200 flex items-center"
              >
                <FaArrowLeft className="mr-2" />
                Start Over
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-600 text-2xl mr-3" />
              <h2 className="text-xl font-bold text-green-800">
                Aadhaar Successfully Verified
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Verification Details
            </h3>

            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-900 min-w-[120px] mb-1 sm:mb-0">
                  Aadhaar:
                </span>
                <span className="text-gray-900 font-mono text-lg">
                  {maskAadhaarFull(formData.aadhaarNumber)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-900 min-w-[120px] mb-1 sm:mb-0">
                  Phone:
                </span>
                <span className="text-gray-900 font-mono text-lg">
                  +91-{maskPhoneNumber(formData.phoneNumber)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-900 min-w-[120px] mb-1 sm:mb-0">
                  Verified on:
                </span>
                <span className="text-gray-900">
                  {new Date(verificationData?.verificationTimestamp).toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>

              {verificationData?.images && (
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-900 min-w-[120px] mb-1 sm:mb-0">
                    Documents:
                  </span>
                  <div className="flex items-center space-x-4 text-sm text-green-600">
                    <span className="flex items-center">
                      <FaCheckCircle className="mr-1" />
                      Front Side Uploaded
                    </span>
                    <span className="flex items-center">
                      <FaCheckCircle className="mr-1" />
                      Back Side Uploaded
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleStartOver}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200 flex items-center justify-center"
              >
                <FaRedo className="mr-2" />
                Verify Different Number
              </button>

              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const AadhaarVerification = ({
  initialAadhaar = '',
  initialPhone = '',
  onVerificationComplete,
  onCancel,
  title = "Aadhaar Verification",
  showTitle = true,
  mode = 'full',
  isRequired = true
}) => {
  if (mode === 'simple') {
    return (
      <SimpleVerification
        initialAadhaar={initialAadhaar}
        onVerificationComplete={onVerificationComplete}
        isRequired={isRequired}
      />
    );
  }

  return (
    <FullVerification
      initialAadhaar={initialAadhaar}
      initialPhone={initialPhone}
      onVerificationComplete={onVerificationComplete}
      onCancel={onCancel}
      title={title}
      showTitle={showTitle}
    />
  );
};

export default AadhaarVerification;
