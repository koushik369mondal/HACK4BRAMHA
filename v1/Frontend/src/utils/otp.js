// OTP generation, validation, and formatting utilities

// Helper function to generate secure 6-digit OTP
export const generateSecureOTP = () => {
  // Use crypto API for better randomness if available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 1000000).toString().padStart(6, '0');
  }
  
  // Fallback to Math.random
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
};

// Format time in MM:SS format
export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Validate OTP input
export const validateOTP = (otp) => {
  if (!otp) {
    return { isValid: false, error: 'OTP is required' };
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, error: 'OTP must be exactly 6 digits' };
  }
  
  return { isValid: true, error: '' };
};

// Validate phone number
export const validatePhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/\s/g, '');
  
  if (!cleanPhone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  if (!/^\d{10}$/.test(cleanPhone)) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }
  
  return { isValid: true, error: '' };
};

// Mask phone number for display (show last 4 digits)
export const maskPhoneNumber = (phone) => {
  if (!phone || phone.length < 4) return '****';
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{6})(\d{4})/, '******$2');
  }
  return phone.replace(/(\d{6})(\d{4})/, '******$2');
};

// OTP timer configuration
export const OTP_TIMER_DURATION = 300; // 5 minutes
export const RESEND_COOLDOWN = 60; // 1 minute

// Development mode check
export const isDev = import.meta.env.MODE === 'development';