// Test frontend API configuration
console.log('🔍 Frontend API Configuration Test');
console.log('Environment Variables:');
console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  - NODE_ENV:', import.meta.env.NODE_ENV);
console.log('  - Mode:', import.meta.env.MODE);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('  - Resolved API_BASE_URL:', API_BASE_URL);

// Test a simple fetch request
async function testAPIConnection() {
  try {
    console.log('\n🧪 Testing API Connection...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check successful:', data);
    
    // Test complaint submission
    console.log('\n📤 Testing complaint submission...');
    const testComplaint = {
      title: 'Browser Test Complaint',
      category: 'Noise',
      description: 'Testing from browser environment',
      priority: 'medium',
      reporterType: 'anonymous',
      contactMethod: 'email',
      location: {
        address: 'Test Address',
        latitude: 26.1445,
        longitude: 91.7362,
        formatted: 'Test Address, Guwahati'
      },
      phone: '',
      aadhaarData: null,
      attachments: []
    };
    
    const submitResponse = await fetch(`${API_BASE_URL}/complaints/anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testComplaint)
    });
    
    if (!submitResponse.ok) {
      throw new Error(`HTTP ${submitResponse.status}: ${submitResponse.statusText}`);
    }
    
    const submitData = await submitResponse.json();
    console.log('✅ Complaint submission successful:', submitData);
    console.log('🎯 Complaint ID:', submitData.complaintId);
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test
testAPIConnection();