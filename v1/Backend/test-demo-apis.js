// Quick test script to verify the demo user APIs are working
const http = require('http');

// Create demo token
const demoUser = {
  demo: true,
  user: {
    id: 'demo-customer',
    email: 'customer@email.com',
    name: 'Demo Customer',
    role: 'customer',
    phone: '1234567890'
  }
};

const token = Buffer.from(JSON.stringify(demoUser)).toString('base64');

// Test complaint stats API
function testComplaintStats() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/complaints/stats/my',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('✅ Complaint Stats API Response:', data);
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (err) => {
      console.error('❌ Complaint Stats API Error:', err.message);
      reject(err);
    });

    req.end();
  });
}

// Test user complaints API
function testUserComplaints() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/complaints/my',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('✅ User Complaints API Response:', data);
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (err) => {
      console.error('❌ User Complaints API Error:', err.message);
      reject(err);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Demo User APIs...\n');
  
  try {
    await testComplaintStats();
    console.log('\n');
    await testUserComplaints();
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
}

runTests();