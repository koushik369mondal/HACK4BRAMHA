const axios = require('axios');

const testComplaintSubmissionDetailed = async () => {
  console.log('🔍 Testing ComplaintForm Data Format...\n');
  
  const complaintData = {
    title: "Test Complaint - Schema Fix",
    category: "Noise",
    description: "Testing the updated schema and form submission.",
    priority: "medium",
    reporterType: "anonymous",
    contactMethod: "email",
    phone: "",
    location: {
      address: "Test Location, Guwahati",
      latitude: 26.1445,
      longitude: 91.7362,
      formatted: "Test Location, Guwahati, Assam"
    },
    aadhaarData: null,
    attachments: []
  };

  try {
    console.log('📤 Submitting to: http://localhost:5000/api/complaints/anonymous');
    console.log('📦 Data:', JSON.stringify(complaintData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/complaints/anonymous', complaintData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n🎯 Complaint ID:', response.data.complaintId);
    
    // Verify the complaint was saved correctly
    const trackResponse = await axios.get(`http://localhost:5000/api/complaints/track/${response.data.complaintId}`);
    console.log('\n🔍 Tracking verification:');
    console.log('Track Status:', trackResponse.status);
    console.log('Saved Data:', JSON.stringify(trackResponse.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
  }
};

testComplaintSubmissionDetailed();