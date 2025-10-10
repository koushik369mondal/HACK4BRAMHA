const axios = require('axios');

const testComplaintSubmission = async () => {
  console.log('🧪 Testing Complaint Submission API...\n');
  
  const testComplaint = {
    title: 'Test API Complaint',
    category: 'Noise',
    description: 'This is a test complaint to verify the API is working properly.',
    priority: 'medium',
    reporterType: 'anonymous',
    contactMethod: 'email',
    location: {
      address: 'Test Address, Guwahati',
      latitude: 26.1445,
      longitude: 91.7362,
      formatted: 'Test Address, Guwahati, Assam'
    },
    attachments: []
  };

  try {
    console.log('📤 Sending request to: http://localhost:5000/api/complaints/anonymous');
    console.log('📦 Payload:', JSON.stringify(testComplaint, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/complaints/anonymous', testComplaint, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('🔍 Error Details:');
    console.log('   Status:', error.response?.status);
    console.log('   Status Text:', error.response?.statusText);
    console.log('   Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('   Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Connection refused - Server might not be running');
    }
  }
};

testComplaintSubmission();