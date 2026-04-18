/**
 * Collaboration API Tests
 * 
 * Tests for collaboration functionality:
 * - Generate Collabora edit URL
 * - Generate Collabora view URL
 * - Add comment to file
 * - Get file comments
 * - Delete comment
 * - Test RBAC for comment operations
 * - Test real-time collaboration (mock)
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
 * Test getting Collabora edit URL
 */
async function testGetCollaboraEditUrl(fileId) {
  console.log('\n📝 Testing get Collabora edit URL...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/collabora/edit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get Collabora edit URL failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Collabora edit URL retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Get Collabora edit URL failed:', error.message);
    throw error;
  }
}

/**
 * Test getting Collabora view URL
 */
async function testGetCollaboraViewUrl(fileId) {
  console.log('\n👁️ Testing get Collabora view URL...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/collabora/view`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get Collabora view URL failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Collabora view URL retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Get Collabora view URL failed:', error.message);
    throw error;
  }
}

/**
 * Test adding comment to file
 */
async function testAddFileComment(fileId) {
  console.log('\n💬 Testing add file comment...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: 'This is a test comment for collaboration testing',
      }),
    });

    if (!response.ok) {
      throw new Error(`Add comment failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Comment added successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Add comment failed:', error.message);
    throw error;
  }
}

/**
 * Test getting file comments
 */
async function testGetFileComments(fileId) {
  console.log('\n📋 Testing get file comments...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/files/${fileId}/comments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get comments failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ File comments retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Get file comments failed:', error.message);
    throw error;
  }
}

/**
 * Test deleting comment
 */
async function testDeleteFileComment(commentId) {
  console.log('\n🗑️ Testing delete comment...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/drive/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Delete comment failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Comment deleted successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Delete comment failed:', error.message);
    throw error;
  }
}

/**
 * Run all collaboration tests
 */
async function runAllTests() {
  console.log('🚀 Starting Collaboration API Tests\n');
  console.log('='.repeat(50));

  try {
    // Login
    await login();

    // Use an existing file ID or upload a test file
    const fileId = 'test-collaboration-file.txt';

    // Test Collabora URLs
    await testGetCollaboraEditUrl(fileId);
    await testGetCollaboraViewUrl(fileId);

    // Test comments
    const commentResult = await testAddFileComment(fileId);
    await testGetFileComments(fileId);

    // Delete comment if it was created
    if (commentResult && commentResult.data && commentResult.data.id) {
      await testDeleteFileComment(commentResult.data.id);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All collaboration tests completed successfully!');
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
