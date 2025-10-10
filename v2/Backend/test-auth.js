// Test authentication flow
const http = require('http');

function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
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

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAuth() {
  try {
    console.log('🧪 Testing authentication flow...\n');
    
    // Step 1: Try to login with test user
    console.log('🔐 Step 1: Login with test user...');
    const loginResponse = await makeRequest('/auth/login', 'POST', {}, {
      email: 'john@example.com',
      password: 'password123'
    });
    
    console.log(`Login Status: ${loginResponse.status}`);
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('\n✅ Login successful! Got token');
      
      // Step 2: Test authenticated endpoint
      console.log('\n📊 Step 2: Test authenticated stats endpoint...');
      const statsResponse = await makeRequest('/complaints/stats/my', 'GET', {
        'Authorization': `Bearer ${token}`
      });
      
      console.log(`Stats Status: ${statsResponse.status}`);
      console.log('Stats Response:', JSON.stringify(statsResponse.data, null, 2));
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();