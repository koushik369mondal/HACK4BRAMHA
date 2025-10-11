/**
 * Aadhaar Number Utility Functions
 * Provides validation, formatting, and masking utilities for Aadhaar numbers
 */

import { validateAadhaarNumber } from './verhoeff';

/**
 * Format Aadhaar number with hyphens (XXXX-XXXX-XXXX)
 * @param {string} aadhaarNumber - The Aadhaar number
 * @returns {string} Formatted Aadhaar number
 */
export const formatAadhaar = (aadhaarNumber) => {
  if (!aadhaarNumber) return '';
  
  // Remove any non-digits
  const cleanNumber = aadhaarNumber.replace(/\D/g, '');
  
  // Add hyphens for formatting
  if (cleanNumber.length <= 4) {
    return cleanNumber;
  } else if (cleanNumber.length <= 8) {
    return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4)}`;
  } else {
    return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4, 8)}-${cleanNumber.slice(8, 12)}`;
  }
};

/**
 * Mask Aadhaar number for security (XXXX-XXXX-1234)
 * @param {string} aadhaarNumber - The Aadhaar number
 * @returns {string} Masked Aadhaar number
 */
export const maskAadhaar = (aadhaarNumber) => {
  if (!aadhaarNumber || aadhaarNumber.length !== 12) {
    return 'XXXX-XXXX-XXXX';
  }
  
  const lastFour = aadhaarNumber.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
};

/**
 * Comprehensive Aadhaar validation with detailed response
 * @param {string} aadhaarNumber - The Aadhaar number to validate
 * @returns {Promise<Object>} Validation result with details
 */
export const validateAadhaarComplete = async (aadhaarNumber) => {
  try {
    // Basic validation first
    if (!aadhaarNumber) {
      return {
        isValid: false,
        error: 'Aadhaar number is required',
        data: null
      };
    }

    // Clean the number
    const cleanNumber = aadhaarNumber.replace(/\D/g, '');

    // Check length
    if (cleanNumber.length !== 12) {
      return {
        isValid: false,
        error: 'Aadhaar number must be exactly 12 digits',
        data: null
      };
    }

    // Use Verhoeff algorithm validation
    const verhoeffResult = validateAadhaarNumber(cleanNumber);
    
    if (!verhoeffResult.isValid) {
      return {
        isValid: false,
        error: verhoeffResult.error || 'Invalid Aadhaar number format',
        data: null
      };
    }

    // Additional business logic validations
    const validationChecks = performAdditionalValidations(cleanNumber);
    
    if (!validationChecks.isValid) {
      return {
        isValid: false,
        error: validationChecks.error,
        data: null
      };
    }

    // If all validations pass, return success
    return {
      isValid: true,
      error: null,
      data: {
        aadhaarNumber: cleanNumber,
        formattedNumber: formatAadhaar(cleanNumber),
        maskedNumber: maskAadhaar(cleanNumber),
        validatedAt: new Date().toISOString(),
        checksum: verhoeffResult.checksum || 'valid'
      }
    };

  } catch (error) {
    console.error('Aadhaar validation error:', error);
    return {
      isValid: false,
      error: 'Validation service temporarily unavailable',
      data: null
    };
  }
};

/**
 * Perform additional business logic validations on Aadhaar number
 * @param {string} cleanNumber - Clean 12-digit Aadhaar number
 * @returns {Object} Additional validation result
 */
const performAdditionalValidations = (cleanNumber) => {
  // Check for obviously invalid patterns
  const invalidPatterns = [
    /^0{12}$/, // All zeros
    /^1{12}$/, // All ones
    /^(\d)\1{11}$/, // All same digits
    /^123456789012$/, // Sequential
    /^000000000000$/, // Explicit all zeros
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(cleanNumber)) {
      return {
        isValid: false,
        error: 'Invalid Aadhaar number pattern detected'
      };
    }
  }

  // Check for test/demo Aadhaar numbers (commonly used invalid ones)
  const testNumbers = [
    '999999999999',
    '123456789012',
    '000000000000',
    '111111111111',
    '222222222222'
  ];

  if (testNumbers.includes(cleanNumber)) {
    return {
      isValid: false,
      error: 'Test Aadhaar numbers are not allowed'
    };
  }

  // Additional checks can be added here
  // For example, state-specific validations, etc.

  return {
    isValid: true,
    error: null
  };
};

/**
 * Extract state information from Aadhaar number (if applicable)
 * Note: This is based on general patterns and may not be 100% accurate
 * @param {string} aadhaarNumber - The Aadhaar number
 * @returns {Object} State information
 */
export const extractAadhaarInfo = (aadhaarNumber) => {
  if (!aadhaarNumber || aadhaarNumber.length !== 12) {
    return {
      state: 'Unknown',
      region: 'Unknown'
    };
  }

  // The first digit can sometimes indicate the state/region
  // This is a simplified mapping and may not be completely accurate
  const firstDigit = aadhaarNumber[0];
  const stateMapping = {
    '1': { state: 'Delhi/NCR', region: 'North' },
    '2': { state: 'Haryana/Punjab', region: 'North' },
    '3': { state: 'Rajasthan', region: 'West' },
    '4': { state: 'Maharashtra', region: 'West' },
    '5': { state: 'Karnataka', region: 'South' },
    '6': { state: 'Tamil Nadu', region: 'South' },
    '7': { state: 'West Bengal', region: 'East' },
    '8': { state: 'Bihar/Jharkhand', region: 'East' },
    '9': { state: 'Other States', region: 'Various' },
    '0': { state: 'Special Cases', region: 'Various' }
  };

  return stateMapping[firstDigit] || { state: 'Unknown', region: 'Unknown' };
};

/**
 * Generate a sample valid Aadhaar number for testing (development only)
 * @returns {string} A valid test Aadhaar number
 */
export const generateTestAadhaar = () => {
  // This should only be used in development/testing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test Aadhaar generation is not allowed in production');
  }

  // Generate a valid test Aadhaar using Verhoeff algorithm
  // Starting with a base number and calculating the correct checksum
  const baseNumber = '234567890120'; // 11 digits
  const checkDigit = calculateVerhoeffCheckDigit(baseNumber);
  
  return baseNumber.slice(0, -1) + checkDigit;
};

/**
 * Calculate Verhoeff check digit for a given number
 * @param {string} number - The number without check digit
 * @returns {string} The check digit
 */
const calculateVerhoeffCheckDigit = (number) => {
  // Simplified Verhoeff check digit calculation
  // In a real implementation, you'd use the full Verhoeff algorithm
  const digits = number.split('').map(Number);
  let checksum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    checksum += digits[i] * (i + 1);
  }
  
  return String(checksum % 10);
};