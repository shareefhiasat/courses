/**
 * Test Drive API Endpoints
 * 
 * This script tests all the drive API endpoints to identify 404 errors
 */

const axios = require('axios');

const API_BASE = 'https://localhost/api/v1';
const TEST_FILE_ID = 'LMS%2FPrivate%2F1776309228413-teacher%20avaatar.png';

// Test with authentication cookie
const testAPI = async () => {
  console.log('=== Testing Drive API Endpoints ===\n');
  
  // Test 1: Get private files (should work)
  console.log('1. Testing GET /drive/private/{userId}/files...');
  try {
    const response = await axios.get(`${API_BASE}/drive/private/79d3cc1c-1257-4b94-8b39-10ee509cfb9e/files`, {
      headers: {
        'Cookie': 'connect.sid=your-session-id'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    console.log('   Status:', response.status);
    console.log('   Data length:', response.data?.length || 0);
  } catch (error) {
    console.log('   ERROR:', error.response?.status, error.message);
  }
  
  // Test 2: Get file shares (404 error)
  console.log('\n2. Testing GET /drive/files/{fileId}/shares...');
  try {
    const response = await axios.get(`${API_BASE}/drive/files/${TEST_FILE_ID}/shares`, {
      headers: {
        'Cookie': 'connect.sid=your-session-id'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
  } catch (error) {
    console.log('   ERROR:', error.response?.status, error.message);
    console.log('   Response:', error.response?.data);
  }
  
  // Test 3: Get Collabora edit URL
  console.log('\n3. Testing GET /drive/files/{fileId}/collabora/edit...');
  try {
    const response = await axios.get(`${API_BASE}/drive/files/${TEST_FILE_ID}/collabora/edit`, {
      headers: {
        'Cookie': 'connect.sid=your-session-id'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
  } catch (error) {
    console.log('   ERROR:', error.response?.status, error.message);
    console.log('   Response:', error.response?.data);
  }
  
  // Test 4: Get file comments
  console.log('\n4. Testing GET /drive/files/{fileId}/comments...');
  try {
    const response = await axios.get(`${API_BASE}/drive/files/${TEST_FILE_ID}/comments`, {
      headers: {
        'Cookie': 'connect.sid=your-session-id'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
  } catch (error) {
    console.log('   ERROR:', error.response?.status, error.message);
    console.log('   Response:', error.response?.data);
  }
  
  // Test 5: Get file versions
  console.log('\n5. Testing GET /drive/files/{fileId}/versions...');
  try {
    const response = await axios.get(`${API_BASE}/drive/files/${TEST_FILE_ID}/versions`, {
      headers: {
        'Cookie': 'connect.sid=your-session-id'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
  } catch (error) {
    console.log('   ERROR:', error.response?.status, error.message);
    console.log('   Response:', error.response?.data);
  }
  
  // Test 6: Get file activities
  console.log('\n6. Testing GET /drive/files/{fileId}/activities...');
  try {
    const response = await axios.get(`${API_BASE}/drive/files/${TEST_FILE_ID}/activities`, {
      headers: {
        'Cookie': 'connect.sid=your-session-id'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
  } catch (error) {
    console.log('   ERROR:', error.response?.status, error.message);
    console.log('   Response:', error.response?.data);
  }
  
  console.log('\n=== Test Complete ===');
};

// Check if backend routes are properly registered
const checkBackendRoutes = () => {
  console.log('\n=== Checking Backend Route Registration ===\n');
  
  // Read the drive routes file
  const fs = require('fs');
  const path = require('path');
  
  const routesPath = path.join(__dirname, 'backend/routes/drive.js');
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    console.log('Drive routes file exists');
    
    // Check if sharing routes are defined
    if (routesContent.includes('router.get(\'/files/:fileId/shares\'')) {
      console.log('   GET /files/:fileId/shares route found');
    } else {
      console.log('   GET /files/:fileId/shares route NOT found');
    }
    
    if (routesContent.includes('router.post(\'/files/:fileId/share\'')) {
      console.log('   POST /files/:fileId/share route found');
    } else {
      console.log('   POST /files/:fileId/share route NOT found');
    }
    
    if (routesContent.includes('router.get(\'/files/:fileId/collabora/edit\'')) {
      console.log('   GET /files/:fileId/collabora/edit route found');
    } else {
      console.log('   GET /files/:fileId/collabora/edit route NOT found');
    }
    
    if (routesContent.includes('router.get(\'/files/:fileId/comments\'')) {
      console.log('   GET /files/:fileId/comments route found');
    } else {
      console.log('   GET /files/:fileId/comments route NOT found');
    }
    
    if (routesContent.includes('router.get(\'/files/:fileId/versions\'')) {
      console.log('   GET /files/:fileId/versions route found');
    } else {
      console.log('   GET /files/:fileId/versions route NOT found');
    }
    
    if (routesContent.includes('router.get(\'/files/:fileId/activities\'')) {
      console.log('   GET /files/:fileId/activities route found');
    } else {
      console.log('   GET /files/:fileId/activities route NOT found');
    }
  } else {
    console.log('Drive routes file not found');
  }
};

// Run the tests
checkBackendRoutes();
testAPI().catch(console.error);
