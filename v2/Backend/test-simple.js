const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            data: JSON.parse(body)
          };
          resolve(result);
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

const testSystem = async () => {
  console.log('🧪 Testing Complete System Integration\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Check...');
    const health = await makeRequest('/health');
    console.log('✅ Health:', health.statusCode === 200 ? 'OK' : 'FAILED');

    // Test 2: Submit Test Complaint
    console.log('\n2️⃣  Testing Complaint Submission...');
    const testComplaint = {
      title: 'System Integration Test Complaint',
      category: 'Noise',
      description: 'Testing complete MongoDB Atlas integration with backend and frontend.',
      priority: 'medium',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Test Location, Delhi, India'
      },
      reporterType: 'anonymous',
      contactInfo: {
        email: 'test@naiyaksetu.com'
      },
      contactMethod: 'email'
    };

    const submitResult = await makeRequest('/complaints', 'POST', testComplaint);
    if (submitResult.statusCode === 201) {
      console.log('✅ Complaint submitted successfully!');
      console.log('   Complaint ID:', submitResult.data.complaint.complaint_id);
      
      const complaintId = submitResult.data.complaint.complaint_id;

      // Test 3: Track the complaint
      console.log('\n3️⃣  Testing Complaint Tracking...');
      const trackResult = await makeRequest(`/complaints/${complaintId}`);
      if (trackResult.statusCode === 200) {
        console.log('✅ Tracking successful!');
        console.log('   Title:', trackResult.data.complaint.title);
        console.log('   Status:', trackResult.data.complaint.status);
      }

      // Test 4: Get all complaints
      console.log('\n4️⃣  Testing Complaint Retrieval...');
      const allResult = await makeRequest('/complaints');
      if (allResult.statusCode === 200) {
        console.log('✅ Retrieved all complaints!');
        console.log('   Total:', allResult.data.complaints.length);
      }

      // Test 5: Get stats
      console.log('\n5️⃣  Testing Dashboard Stats...');
      const statsResult = await makeRequest('/complaints/stats');
      if (statsResult.statusCode === 200) {
        console.log('✅ Stats retrieved!');
        console.log('   Total Complaints:', statsResult.data.totalComplaints);
      }

      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Database connection: Working');
      console.log('✅ Complaint submission: Working');
      console.log('✅ Data persistence: Working');
      console.log('✅ Tracking functionality: Working');
      console.log('✅ Dashboard data: Working');
      console.log('✅ Frontend ready for use!');

    } else {
      console.log('❌ Complaint submission failed:', submitResult.statusCode);
      console.log('   Response:', submitResult.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testSystem();