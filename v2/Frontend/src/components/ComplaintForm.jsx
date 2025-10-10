import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { complaintAPI } from '../services/api';
import {
  FaFileAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaUpload,
  FaShieldAlt,
  FaInfoCircle,
  FaTimes,
  FaEye,
  FaUser,
  FaSearchLocation
} from "react-icons/fa";

// Simplified Aadhaar Verification Component
const AadhaarVerification = React.memo(({ onVerificationComplete }) => {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const handleAadhaarChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 12) {
      setAadhaarNumber(value);
      setError('');
      if (isVerified) setIsVerified(false);
    }
  }, [isVerified]);

  const handleVerification = useCallback(async () => {
    if (aadhaarNumber.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = {
        name: 'John Doe',
        state: 'Assam',
        district: 'Kamrup Metropolitan'
      };

      setIsVerified(true);
      onVerificationComplete?.({
        success: true,
        aadhaarNumber,
        data: mockData
      });
    } catch (err) {
      setError('Verification failed. Please try again.');
      onVerificationComplete?.({ success: false });
    } finally {
      setIsVerifying(false);
    }
  }, [aadhaarNumber, onVerificationComplete]);

  const handleReset = useCallback(() => {
    setIsVerified(false);
    setAadhaarNumber('');
    setError('');
    onVerificationComplete?.({ success: false });
  }, [onVerificationComplete]);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FaShieldAlt className="text-green-600" />
        Aadhaar Verification
        <span className="text-red-500">*</span>
        {isVerified && (
          <div className="flex items-center text-green-600 ml-auto">
            <FaCheckCircle className="w-5 h-5 mr-1" />
            Verified
          </div>
        )}
      </h3>

      <div className="flex space-x-3">
        <input
          type="text"
          value={isVerified ? `****-****-${aadhaarNumber.slice(-4)}` : aadhaarNumber}
          onChange={handleAadhaarChange}
          placeholder="Enter 12-digit Aadhaar"
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${isVerified ? 'border-green-500 bg-green-50' :
              error ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          disabled={isVerified || isVerifying}
          maxLength={12}
        />

        <button
          type="button"
          onClick={isVerified ? handleReset : handleVerification}
          disabled={isVerifying || (!isVerified && aadhaarNumber.length !== 12)}
          className={`px-4 py-2 text-white rounded-md font-medium transition-colors min-w-[100px] ${isVerified ? 'bg-gray-600 hover:bg-gray-700' :
              'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
            }`}
        >
          {isVerifying ? (
            <>
              <FaSpinner className="animate-spin mr-2 h-4 w-4 inline" />
              Verifying...
            </>
          ) : (
            isVerified ? 'Change' : 'Verify'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md mt-3">
          <FaExclamationTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
});

AadhaarVerification.displayName = 'AadhaarVerification';

// Enhanced Location Picker with Mapbox Integration
const LocationPicker = React.memo(({ onLocationSelect, disabled }) => {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  // Initialize Mapbox with proper cleanup
  useEffect(() => {
    if (!showMap || !mapContainer.current || map.current) return;

    // Set Mapbox access token
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('Mapbox access token not found');
      return;
    }

    mapboxgl.accessToken = accessToken;

    // Initialize map
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [91.7362, 26.1445], // Guwahati coordinates
      zoom: 12
    });

    map.current = mapInstance;

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click event listener for location selection
    const handleMapClick = (e) => {
      const { lng, lat } = e.lngLat;

      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({ color: '#dc2626' })
        .setLngLat([lng, lat])
        .addTo(mapInstance);

      // Update coordinates
      setCoordinates({ lat, lng });

      // Reverse geocoding to get address
      reverseGeocode(lng, lat);
    };

    mapInstance.on('click', handleMapClick);

    // Add geolocation control
    mapInstance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: false
      }),
      'top-right'
    );

    // Cleanup function
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (mapInstance) {
        mapInstance.remove();
      }
      map.current = null;
    };
  }, [showMap]);

  // Reverse geocoding function
  const reverseGeocode = async (lng, lat) => {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      const fallbackAddress = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setAddress(fallbackAddress);
      onLocationSelect?.({
        address: fallbackAddress,
        latitude: lat,
        longitude: lng,
        formatted: fallbackAddress
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const locationAddress = place.place_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        setAddress(locationAddress);
        onLocationSelect?.({
          address: locationAddress,
          latitude: lat,
          longitude: lng,
          formatted: locationAddress
        });
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      const locationAddress = `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setAddress(locationAddress);
      onLocationSelect?.({
        address: locationAddress,
        latitude: lat,
        longitude: lng,
        formatted: locationAddress
      });
    }
  };

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setCoordinates({ lat: latitude, lng: longitude });

        // If map is shown, update map view and marker
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15
          });

          // Remove existing marker
          if (marker.current) {
            marker.current.remove();
          }

          // Add new marker
          marker.current = new mapboxgl.Marker({ color: '#dc2626' })
            .setLngLat([longitude, latitude])
            .addTo(map.current);
        }

        // Reverse geocoding
        reverseGeocode(longitude, latitude);
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please check permissions.');
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const handleAddressChange = useCallback((e) => {
    const value = e.target.value;
    setAddress(value);
  }, []);

  const geocodeAddress = async (searchAddress) => {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      alert('Mapbox configuration error. Please use Current Location button.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?access_token=${accessToken}&country=IN&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const [lng, lat] = place.center;

        setCoordinates({ lat, lng });
        setAddress(place.place_name);

        // Update map if shown
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 15
          });

          // Remove existing marker
          if (marker.current) {
            marker.current.remove();
          }

          // Add new marker
          marker.current = new mapboxgl.Marker({ color: '#dc2626' })
            .setLngLat([lng, lat])
            .addTo(map.current);
        }

        onLocationSelect?.({
          address: place.place_name,
          latitude: lat,
          longitude: lng,
          formatted: place.place_name
        });
      } else {
        alert('Location not found. Please try a different address or use Current Location.');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      alert('Failed to search location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSearch = () => {
    if (address.trim()) {
      geocodeAddress(address.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <input
          type="text"
          value={address}
          onChange={handleAddressChange}
          onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
          placeholder="Enter address (e.g., MG Road, Guwahati)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={disabled || isLoading}
        />

        <button
          type="button"
          onClick={handleAddressSearch}
          disabled={disabled || isLoading || !address.trim()}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FaSearchLocation />
          Search
        </button>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={disabled || isLoading}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaSearchLocation />
          )}
          Current
        </button>
      </div>

      {/* Map Toggle Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          disabled={disabled}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FaMapMarkerAlt />
          {showMap ? 'Hide Map' : 'Show Interactive Map'}
        </button>
      </div>

      {/* Interactive Map */}
      {showMap && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Click on the map to select a location, or use the location controls
            </p>
          </div>
          <div
            ref={mapContainer}
            className="w-full h-96"
            style={{ minHeight: '384px' }}
          />
        </div>
      )}

      {/* Selected Location Display */}
      {coordinates.lat && coordinates.lng && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <FaMapMarkerAlt className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">Location Selected</p>
              <p className="text-sm text-green-700 break-words">{address}</p>
              <p className="text-xs text-green-600">
                Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
            {showMap && map.current && (
              <button
                type="button"
                onClick={() => {
                  map.current.flyTo({
                    center: [coordinates.lng, coordinates.lat],
                    zoom: 16
                  });
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex-shrink-0"
              >
                Center Map
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

LocationPicker.displayName = 'LocationPicker';

// Form Field Component
const FormField = React.memo(({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  maxLength,
  required = true,
  icon: Icon,
  disabled = false,
  as = "input",
  rows,
  options = []
}) => {
  const renderElement = () => {
    const baseClassName = `w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${error ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200 focus:border-green-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    if (as === "select") {
      return (
        <select
          value={value}
          onChange={onChange}
          className={baseClassName}
          required={required}
          disabled={disabled}
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }

    if (as === "textarea") {
      return (
        <textarea
          value={value}
          onChange={onChange}
          className={`${baseClassName} resize-none`}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          rows={rows}
        />
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={baseClassName}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
      />
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="text-green-600" />}
          <span>{label}</span>
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      </label>

      {renderElement()}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <FaExclamationTriangle className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

// File Upload Component
const FileUpload = React.memo(({ files, onFilesChange, disabled, maxFiles = 3 }) => {
  const fileInputRef = useRef(null);

  const handleFileInput = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file sizes (5MB max)
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    const totalFiles = [...files, ...validFiles];

    if (totalFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      onFilesChange([...files, ...validFiles].slice(0, maxFiles));
    } else {
      onFilesChange(totalFiles);
    }

    // Reset input value
    if (e.target) {
      e.target.value = '';
    }
  }, [files, onFilesChange, maxFiles]);

  const removeFile = useCallback((index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  }, [files, onFilesChange]);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-400'
          }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <FaUpload className="mx-auto text-2xl text-gray-500 mb-2" />
        <p className="text-sm text-gray-700">Click to upload files (max {maxFiles})</p>
        <p className="text-xs text-gray-500">Images, PDF, DOC (max 5MB each)</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-gray-900 truncate">{file.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                disabled={disabled}
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

// Success Message Component
const SuccessMessage = React.memo(({ complaintId, onReset }) => (
  <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
      <FaCheckCircle className="h-8 w-8 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Complaint Submitted Successfully!
    </h2>
    <p className="text-gray-700 mb-4">
      Your complaint has been registered and assigned to the relevant department.
    </p>
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-green-800 mb-1"><strong>Complaint ID:</strong></p>
      <p className="text-lg font-mono font-bold text-green-900">{complaintId}</p>
      <p className="text-xs text-green-700 mt-2">Save this ID to track your complaint</p>
    </div>
    <button
      onClick={onReset}
      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
    >
      Submit Another Complaint
    </button>
  </div>
));

SuccessMessage.displayName = 'SuccessMessage';

// Main ComplaintForm Component
function ComplaintForm({ setCurrentPage }) {
  // State management
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: { address: "", latitude: null, longitude: null, formatted: "" },
    priority: "medium",
    reporterType: "anonymous",
    contactMethod: "email",
    phone: ""
  });

  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarData, setAadhaarData] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateField = useCallback((field, value) => {
    let error = '';

    switch (field) {
      case 'title':
        if (!value.trim()) {
          error = 'Title is required';
        } else if (value.trim().length < 5) {
          error = 'Title must be at least 5 characters';
        } else if (value.trim().length > 100) {
          error = 'Title must not exceed 100 characters';
        }
        break;

      case 'category':
        if (!value) {
          error = 'Category is required';
        }
        break;

      case 'description':
        if (!value.trim()) {
          error = 'Description is required';
        } else if (value.trim().length < 10) {
          error = 'Description must be at least 10 characters';
        } else if (value.trim().length > 1000) {
          error = 'Description must not exceed 1000 characters';
        }
        break;

      case 'phone':
        if ((formData.contactMethod === 'phone' || formData.contactMethod === 'both')) {
          const cleanPhone = value.replace(/\D/g, '');
          if (!cleanPhone) {
            error = 'Phone number is required';
          } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            error = 'Enter a valid 10-digit mobile number starting with 6-9';
          }
        }
        break;

      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, [formData.contactMethod]);

  // Form validation check
  const isFormValid = useMemo(() => {
    const hasRequiredFields = formData.title.trim() &&
      formData.category &&
      formData.description.trim();

    const hasLocation = formData.location.latitude !== null &&
      formData.location.longitude !== null;

    const hasValidPhone = formData.contactMethod === 'email' ||
      (formData.phone && /^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, '')));

    const hasAadhaarIfNeeded = formData.reporterType !== 'verified' || aadhaarVerified;

    const hasNoErrors = Object.values(errors).every(error => !error);

    return hasRequiredFields && hasLocation && hasValidPhone && hasAadhaarIfNeeded && hasNoErrors;
  }, [formData, errors, aadhaarVerified]);

  // Input change handler
  const handleInputChange = useCallback((field, value) => {
    if (field === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Location select handler
  const handleLocationSelect = useCallback((locationData) => {
    setFormData(prev => ({ ...prev, location: locationData }));
  }, []);

  // Aadhaar verification handler
  const handleAadhaarVerification = useCallback((result) => {
    setAadhaarVerified(result.success);
    setAadhaarData(result.data || null);
  }, []);

  // Form submission handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const titleValid = validateField('title', formData.title);
    const categoryValid = validateField('category', formData.category);
    const descriptionValid = validateField('description', formData.description);
    const phoneValid = validateField('phone', formData.phone);

    if (!titleValid || !categoryValid || !descriptionValid || !phoneValid || !isFormValid) {
      alert('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare attachment data
      const attachmentData = attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        originalName: file.name,
        filename: `${Date.now()}_${file.name}`,
        fileType: file.type,
        fileSize: file.size
      }));

      // Submit complaint
      const response = await complaintAPI.submitComplaint({
        ...formData,
        aadhaarData: aadhaarVerified ? aadhaarData : null,
        attachments: attachmentData
      });

      if (response.data && response.data.complaintId) {
        setComplaintId(response.data.complaintId);
        setIsSuccess(true);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Submission failed:', error);

      let errorMessage = 'Submission failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data. Please check your inputs.';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, attachments, aadhaarVerified, aadhaarData, isFormValid, validateField]);

  // Reset form handler
  const handleReset = useCallback(() => {
    setFormData({
      title: "",
      category: "",
      description: "",
      location: { address: "", latitude: null, longitude: null, formatted: "" },
      priority: "medium",
      reporterType: "anonymous",
      contactMethod: "email",
      phone: ""
    });
    setAttachments([]);
    setAadhaarVerified(false);
    setAadhaarData(null);
    setIsSuccess(false);
    setComplaintId('');
    setErrors({});
  }, []);

  // Constants
  const categories = [
    "Roads & Infrastructure",
    "Water Supply",
    "Electricity",
    "Sanitation & Waste",
    "Public Safety",
    "Traffic & Transportation",
    "Environment",
    "Health Services",
    "Plot Issue",
    "Plumbing",
    "Garbage",
    "Noise",
    "Other"
  ];

  const priorities = [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "urgent", label: "Urgent" }
  ];

  const reporterTypes = [
    { value: "anonymous", label: "Anonymous Report" },
    { value: "pseudonymous", label: "Pseudonymous Report" },
    { value: "verified", label: "Verified Report (Aadhaar Required)" }
  ];

  const contactMethods = [
    { value: "email", label: "Email Only" },
    { value: "phone", label: "Phone Only" },
    { value: "both", label: "Both Email & Phone" }
  ];

  // Render success message if form submitted successfully
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <SuccessMessage complaintId={complaintId} onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">File a Complaint</h1>
              <p className="text-gray-700 text-base lg:text-lg">
                Help us serve you better by reporting issues in your area
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-md"
                onClick={() => setCurrentPage?.("track-status")}
              >
                <FaEye />
                Track Status
              </button>
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-md"
                onClick={() => setCurrentPage?.("dashboard")}
              >
                <FaUser />
                Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Aadhaar Verification */}
              {formData.reporterType === "verified" && (
                <div className="border-b border-gray-200 pb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <FaShieldAlt className="text-green-600" />
                    Identity Verification
                  </h3>
                  <AadhaarVerification onVerificationComplete={handleAadhaarVerification} />
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaFileAlt className="text-green-600" />
                  Complaint Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    label="Complaint Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    onBlur={() => validateField('title', formData.title)}
                    error={errors.title}
                    placeholder="Brief description of the issue"
                    maxLength={100}
                    icon={FaFileAlt}
                    disabled={isSubmitting}
                  />

                  <FormField
                    label="Category"
                    as="select"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    onBlur={() => validateField('category', formData.category)}
                    error={errors.category}
                    options={categories}
                    disabled={isSubmitting}
                  />

                  <FormField
                    label="Priority Level"
                    as="select"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    options={priorities}
                    disabled={isSubmitting}
                    required={false}
                  />

                  <FormField
                    label="Reporter Type"
                    as="select"
                    value={formData.reporterType}
                    onChange={(e) => handleInputChange('reporterType', e.target.value)}
                    options={reporterTypes}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div className="mt-6">
                  <FormField
                    label="Detailed Description"
                    as="textarea"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    onBlur={() => validateField('description', formData.description)}
                    error={errors.description}
                    placeholder="Please provide detailed information about the issue..."
                    maxLength={1000}
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-green-600" />
                  Location
                  <span className="text-red-500">*</span>
                </h3>
                <LocationPicker onLocationSelect={handleLocationSelect} disabled={isSubmitting} />
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaEnvelope className="text-green-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Contact Method"
                    as="select"
                    value={formData.contactMethod}
                    onChange={(e) => handleInputChange('contactMethod', e.target.value)}
                    options={contactMethods}
                    disabled={isSubmitting}
                    icon={FaEnvelope}
                    required={false}
                  />

                  {(formData.contactMethod === "phone" || formData.contactMethod === "both") && (
                    <FormField
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={() => validateField('phone', formData.phone)}
                      error={errors.phone}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      icon={FaPhone}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              </div>

              {/* File Attachments */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaUpload className="text-green-600" />
                  Attachments
                  <span className="text-sm font-normal text-gray-600 ml-2">(Optional)</span>
                </h3>
                <FileUpload
                  files={attachments}
                  onFilesChange={setAttachments}
                  disabled={isSubmitting}
                  maxFiles={3}
                />
              </div>

              {/* Validation Messages */}
              {formData.reporterType === "verified" && !aadhaarVerified && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-orange-800">
                      Please complete Aadhaar verification to submit a verified complaint
                    </p>
                  </div>
                </div>
              )}

              {(!formData.location.latitude || !formData.location.longitude) && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-orange-800">
                      Please select a location using the map or search above
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`px-8 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[160px] ${isSubmitting || !isFormValid
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaFileAlt />
                      Submit Complaint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 border-l-4 border-l-blue-500 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaInfoCircle className="text-blue-600" />
            Need Help?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-1">Emergency Issues</p>
              <p className="text-gray-700">
                For urgent matters, call:{' '}
                <span className="font-mono text-green-600 font-bold">1800-XXX-XXXX</span>
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Response Time</p>
              <p className="text-gray-700">We typically respond within 24-48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintForm;
