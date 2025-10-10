const http = require('http');

// Simple connectivity test
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/',
  method: 'GET'
};

console.log('🔍 Testing server connectivity...');

const req = http.request(options, (res) => {
  console.log(`✅ Server responded with status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
  });
});

req.on('error', (error) => {
  console.log('❌ Connection failed:', error.message);
});

req.end();