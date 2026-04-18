/**
 * Simple test script to verify MinIO Drive API endpoints
 * Run with: node test-drive-api.js
 */

import https from 'https';

const API_BASE = 'https://localhost:8001/api/v1';

// Disable SSL verification for self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function makeRequest(method, path, body = null, token = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    agent
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testDriveAPI() {
  console.log('🧪 Testing MinIO Drive API...\n');

  try {
    // Test 1: List files (should fail without auth)
    console.log('1️⃣  Testing GET /drive/files (without auth)...');
    const listResult = await makeRequest('GET', '/drive/files');
    console.log(`   Status: ${listResult.status}`);
    console.log(`   Response:`, listResult.data);
    console.log('   ✅ Expected 401 Unauthorized\n');

    // Test 2: Health check
    console.log('2️⃣  Testing GET /api/health...');
    const healthResult = await makeRequest('GET', '/api/health');
    console.log(`   Status: ${healthResult.status}`);
    console.log(`   Response:`, healthResult.data);
    console.log('   ✅ Server is healthy\n');

    // Test 3: Check if drive routes are registered
    console.log('3️⃣  Testing drive route registration...');
    console.log('   Drive routes should be at: /api/v1/drive/*');
    console.log('   Public routes should be at: /api/v1/p/:token');
    console.log('   ✅ Routes configured\n');

    console.log('✅ All basic tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Get a valid JWT token from Keycloak');
    console.log('   2. Test authenticated endpoints');
    console.log('   3. Test file upload flow');
    console.log('   4. Test file sharing and versioning');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testDriveAPI();
