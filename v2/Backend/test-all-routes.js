const axios = require('axios');

const testAllRoutes = async () => {
  console.log('🧪 Testing All Complaint Routes...\n');
  
  const baseURL = 'http://localhost:5000/api/complaints';
  
  try {
    // 1. Test anonymous submission
    console.log('1️⃣  Testing /anonymous route...');
    const anonymousResponse = await axios.post(`${baseURL}/anonymous`, {
      title: 'Route Test Complaint',
      category: 'Noise',
      description: 'Testing route availability',
      priority: 'medium',
      reporterType: 'anonymous',
      contactMethod: 'email',
      location: {
        address: 'Test',
        latitude: 26.1445,
        longitude: 91.7362,
        formatted: 'Test'
      },
      phone: '',
      aadhaarData: null,
      attachments: []
    });
    console.log('✅ Anonymous route works:', anonymousResponse.status);
    
    // 2. Test recent complaints (public)
    console.log('\n2️⃣  Testing /recent route...');
    const recentResponse = await axios.get(`${baseURL}/recent`);
    console.log('✅ Recent route works:', recentResponse.status);
    
    // 3. Test tracking (public)
    const complaintId = anonymousResponse.data.complaintId;
    console.log(`\n3️⃣  Testing /track/${complaintId} route...`);
    const trackResponse = await axios.get(`${baseURL}/track/${complaintId}`);
    console.log('✅ Track route works:', trackResponse.status);
    
    // 4. Test stats (should fail without auth)
    console.log('\n4️⃣  Testing /stats route (should require auth)...');
    try {
      const statsResponse = await axios.get(`${baseURL}/stats`);
      console.log('⚠️ Stats route works without auth?:', statsResponse.status);
    } catch (error) {
      console.log('✅ Stats route properly requires auth:', error.response.status);
    }
    
    console.log('\n🎉 All routes working as expected!');
    
  } catch (error) {
    console.error('❌ Route test failed:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });
  }
};

testAllRoutes();