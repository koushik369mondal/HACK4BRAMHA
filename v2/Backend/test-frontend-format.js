// Debug test to match exactly what the frontend is sending

const axios = require('axios');

const testFrontendRequest = async () => {
  console.log('🔍 Testing Frontend-style Request...\n');
  
  // This matches exactly what the ComplaintForm is sending
  const formData = {
    title: "Test Frontend Complaint",
    category: "Noise", 
    description: "This matches the frontend format exactly",
    location: {
      address: "Test Location",
      latitude: 26.1445,
      longitude: 91.7362,
      formatted: "Test Location, Guwahati"
    },
    priority: "medium",
    reporterType: "anonymous", 
    contactMethod: "email",
    phone: ""
  };

  const attachments = [];
  
  const requestData = {
    ...formData,
    aadhaarData: null,
    attachments: attachments.map(f => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type,
      originalName: f.name,
      filename: `${Date.now()}_${f.name}`,
      fileType: f.type,
      fileSize: f.size,
      filePath: `/uploads/${Date.now()}_${f.name}`,
      url: `/uploads/${Date.now()}_${f.name}`
    }))
  };

  try {
    console.log('📤 Sending frontend-style request...');
    console.log('🎯 URL: http://localhost:5000/api/complaints/anonymous');
    console.log('📦 Data:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/complaints/anonymous', requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ SUCCESS!');
    console.log('📊 Status:', response.status);
    console.log('📋 Full Response:', JSON.stringify(response.data, null, 2));
    console.log('\n🔍 Key fields:');
    console.log('   - response.data.complaintId:', response.data.complaintId);
    console.log('   - response.data.data?.complaintId:', response.data.data?.complaintId);
    
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log('📊 Status:', error.response?.status);
    console.log('💬 Message:', error.response?.data?.message || error.message);
    console.log('📋 Full Error Data:', JSON.stringify(error.response?.data, null, 2));
    
    // Check if it's a network error
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Backend server is not running on port 5000');
    }
  }
};

testFrontendRequest();