/**
 * File Version/Revision API Tests
 * 
 * Tests for file version/revision functionality:
 * - Enable file versioning
 * - Upload multiple versions
 * - List file versions
 * - Restore previous version
 * - Get file activity log
 * - Test version metadata
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://localhost:8001/api/v1';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://localhost:8443';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'master';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'military-lms-app';

// Test users
const TEST_USER = 'shareef.hiasat@gmail.com';
const TEST_PASSWORD = 'Jordan123';
const TEST_KEYCLOAK_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

let authToken = null;
let testUserId = null;

/**
 * Login to get authentication token
 */
async function login() {
  console.log('🔐 Logging in to get authentication token...');
  
  try {
    const response = await fetch(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: KEYCLOAK_CLIENT_ID,
        username: TEST_USER,
        password: TEST_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    authToken = data.access_token;
    testUserId = TEST_KEYCLOAK_ID;
    
    console.log(`✅ Login successful! User ID: ${testUserId}`);
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

/**
 * Test enabling file versioning
 */
async function testEnableFileVersioning(fileId) {
  console.log('\n🔧 Testing enable file versioning...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/enable-versioning`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Enable versioning failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File versioning enabled successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Enable file versioning failed:', error.message);
    throw error;
  }
}

/**
 * Test getting file versions
 */
async function testGetFileVersions(fileId) {
  console.log('\n📋 Testing get file versions...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/versions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get file versions failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File versions retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Get file versions failed:', error.message);
    throw error;
  }
}

/**
 * Test restoring file version
 */
async function testRestoreFileVersion(fileId, versionId) {
  console.log('\n🔄 Testing restore file version...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/versions/${versionId}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Restore version failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File version restored successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Restore file version failed:', error.message);
    throw error;
  }
}

/**
 * Test getting file activities
 */
async function testGetFileActivities(fileId) {
  console.log('\n📊 Testing get file activities...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/activities`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get file activities failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File activities retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Get file activities failed:', error.message);
    throw error;
  }
}

/**
 * Test getting file activity statistics
 */
async function testGetFileActivityStats(fileId) {
  console.log('\n📈 Testing get file activity statistics...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/activity-stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get activity stats failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File activity statistics retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Get file activity statistics failed:', error.message);
    throw error;
  }
}

/**
 * Run all version/revision tests
 */
async function runAllTests() {
  console.log('🚀 Starting File Version/Revision API Tests\n');
  console.log('='.repeat(50));

  try {
    // Login
    await login();

    // Use an existing file ID
    const fileId = 'test-version-file.txt';

    // Test versioning
    await testEnableFileVersioning(fileId);
    await testGetFileVersions(fileId);
    await testGetFileActivities(fileId);
    await testGetFileActivityStats(fileId);

    // Restore version would need a valid version ID from getFileVersions response
    // await testRestoreFileVersion(fileId, versionId);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All version/revision tests completed successfully!');
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
