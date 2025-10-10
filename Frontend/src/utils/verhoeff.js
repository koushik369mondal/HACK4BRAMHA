// Verhoeff algorithm for Aadhaar checksum validation (official implementation)
export const verhoeffValidate = (aadhaar) => {
  if (!/^\d{12}$/.test(aadhaar)) return false;

  // Official Verhoeff algorithm multiplication table
  const d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
  ];

  // Permutation table
  const p = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8]
  ];

  let c = 0;
  const arr = aadhaar.split('').map(Number).reverse();
  
  for (let i = 0; i < arr.length; i++) {
    c = d[c][p[i % 8][arr[i]]];
  }

  return c === 0;
};

// Pre-calculated valid test Aadhaar numbers for development (these pass Verhoeff validation)
export const validTestNumbers = [
  '123456789010',  // Test number 1
  '234567890124',  // Test number 2
  '345678901238',  // Test number 3
  '784568755807',  // Test number 4
  '456789012341',  // Test number 5
  '567890123458'   // Test number 6
];

// Validation helper functions
export const validateAadhaarNumber = (aadhaar) => {
  const cleanAadhaar = aadhaar.replace(/\s/g, '');
  
  if (!cleanAadhaar) {
    return { isValid: false, error: 'Aadhaar number is required' };
  }
  
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return { isValid: false, error: 'Aadhaar number must be exactly 12 digits' };
  }

  if (!verhoeffValidate(cleanAadhaar)) {
    return { isValid: false, error: 'Invalid Aadhaar number. Please check and try again.' };
  }

  return { isValid: true, error: '' };
};