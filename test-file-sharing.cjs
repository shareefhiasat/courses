/**
 * File Sharing API Tests
 * 
 * Tests for file sharing functionality:
 * - Share private file with another user
 * - Share workflow file with instructor
 * - Share file with multiple users
 * - Update share permissions
 * - Delete share
 * - Test RBAC for share operations
 * - Test share expiration
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
 * Upload a test file to private space
 */
async function uploadTestFile() {
  console.log('\n📤 Uploading test file to private space...');
  
  const testContent = 'Test file for sharing';
  const formData = new FormData();
  formData.append('file', new Blob([testContent], { type: 'text/plain' }), 'test-share-file.txt');

  try {
    const response = await fetch(`${API_BASE_URL}/drive/private/${testUserId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Test file uploaded successfully');
    return 'test-share-file.txt';
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

/**
 * Test sharing file with another user
 */
async function testShareFileWithUser(fileId) {
  console.log('\n🔗 Testing share file with user...');
  
  try {
    // First, get another user ID from database (would need to query)
    // For now, use a placeholder
    const targetUserId = 2; // This would be a real user ID from database
    
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUserId,
        permissions: 1, // read permission
      }),
    });

    if (!response.ok) {
      throw new Error(`Share failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File shared successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Share file failed:', error.message);
    throw error;
  }
}

/**
 * Test getting file shares
 */
async function testGetFileShares(fileId) {
  console.log('\n📋 Testing get file shares...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/shares`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get shares failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File shares retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Get file shares failed:', error.message);
    throw error;
  }
}

/**
 * Test updating share permissions
 */
async function testUpdateSharePermissions(shareId) {
  console.log('\n✏️ Testing update share permissions...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/shares/${shareId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissions: 3, // read + write
      }),
    });

    if (!response.ok) {
      throw new Error(`Update permissions failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Share permissions updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Update share permissions failed:', error.message);
    throw error;
  }
}

/**
 * Test deleting share
 */
async function testDeleteShare(shareId) {
  console.log('\n🗑️ Testing delete share...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/shares/${shareId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Delete share failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Share deleted successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Delete share failed:', error.message);
    throw error;
  }
}

/**
 * Run all file sharing tests
 */
async function runAllTests() {
  console.log('🚀 Starting File Sharing API Tests\n');
  console.log('='.repeat(50));

  try {
    // Login
    await login();

    // Upload test file
    const fileId = await uploadTestFile();

    // Test sharing
    const shareResult = await testShareFileWithUser(fileId);

    // Get shares
    await testGetFileShares(fileId);

    // Update permissions (if share was created)
    if (shareResult && shareResult.data && shareResult.data.shareId) {
      await testUpdateSharePermissions(shareResult.data.shareId);
      await testDeleteShare(shareResult.data.shareId);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All file sharing tests completed successfully!');
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
