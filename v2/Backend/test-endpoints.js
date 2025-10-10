// Test the stats endpoints using Node.js built-in modules
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testEndpoints() {
  try {
    console.log('🧪 Testing complaint stats endpoints...\n');
    
    // Test global stats endpoint
    console.log('📊 Testing /complaints/stats (global stats)...');
    try {
      const globalStats = await makeRequest('/complaints/stats');
      console.log(`Status: ${globalStats.status}`);
      console.log('✅ Global stats response:', JSON.stringify(globalStats.data, null, 2));
    } catch (error) {
      console.log('❌ Global stats error:', error.message);
    }
    
    console.log('\n📊 Testing /complaints/stats/my (user stats - no auth)...');
    try {
      const userStats = await makeRequest('/complaints/stats/my');
      console.log(`Status: ${userStats.status}`);
      console.log('✅ User stats response:', JSON.stringify(userStats.data, null, 2));
    } catch (error) {
      console.log('❌ User stats error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints();