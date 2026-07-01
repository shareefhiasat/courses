require('dotenv/config');
const fs = require('fs');
const path = require('path');

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:8001').replace('http://', 'https://').replace(/\/$/, '') + '/api/v1';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'master';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'military-lms-app';
const TEST_USER = process.env.TEST_USER || 'shareef.hiasat@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Jordan123';
const TEST_KEYCLOAK_ID = process.env.TEST_KEYCLOAK_ID || '79d3cc1c-1257-4b94-8b39-10ee509cfb9e';

// Ignore SSL certificate errors for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let authToken = null;
let testUserId = null;
let uploadedFileId = null;

/**
 * Login to get authentication token
 */
async function login() {
  console.log('🔐 Logging in to get authentication token...');
  console.log(`Keycloak URL: ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`);
  console.log(`Client ID: ${KEYCLOAK_CLIENT_ID}`);
  console.log(`User: ${TEST_USER}`);
  console.log(`Keycloak ID: ${TEST_KEYCLOAK_ID}`);
  
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
    
    // Use the pre-configured Keycloak ID from database
    testUserId = TEST_KEYCLOAK_ID;
    
    console.log(`✅ Login successful! User ID: ${testUserId}`);
    console.log(`📝 Token (first 50 chars): ${authToken.substring(0, 50)}...`);
    
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

/**
 * Test list private files
 */
async function testListPrivateFiles() {
  console.log('\n📂 Testing GET /drive/private/:userId/files...');
  console.log(`URL: ${API_BASE}/drive/private/${testUserId}/files`);
  
  try {
    const response = await fetch(`${API_BASE}/drive/private/${testUserId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response ok: ${response.ok}`);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log(`✅ List private files successful! Found ${data.data?.length || 0} files`);
      return data.data || [];
    } else {
      console.error('❌ List private files failed:', data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ List private files error:', error.message);
    console.error('Error stack:', error.stack);
    return [];
  }
}

/**
 * Test upload file to private space
 */
async function testUploadPrivateFile() {
  console.log('\n📤 Testing POST /drive/private/:userId/upload...');
  
  try {
    // Create a test PDF file (minimal valid PDF)
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const formData = new FormData();
    formData.append('file', new Blob([pdfContent], { type: 'application/pdf' }), 'test-upload.pdf');
    
    const response = await fetch(`${API_BASE}/drive/private/${testUserId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Upload successful!');
      console.log(`File name: ${data.data.fileName}`);
      console.log(`File path: ${data.data.filePath}`);
      uploadedFileId = data.data.filePath.split('/').pop();
      console.log(`File ID for delete test: ${uploadedFileId}`);
      return data.data;
    } else {
      console.error('❌ Upload failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return null;
  }
}

/**
 * Test delete file from private space
 */
async function testDeletePrivateFile() {
  if (!uploadedFileId) {
    console.log('\n⚠️  No file to delete (upload may have failed)');
    return;
  }
  
  console.log(`\n🗑️  Testing DELETE /drive/private/${testUserId}/files/${uploadedFileId}...`);
  
  try {
    const response = await fetch(`${API_BASE}/drive/private/${testUserId}/files/${uploadedFileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Delete successful!');
      return true;
    } else {
      console.error('❌ Delete failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Delete error:', error.message);
    return false;
  }
}

/**
 * Test list shared files
 */
async function testListSharedFiles() {
  console.log('\n📂 Testing GET /drive/shared/files...');
  
  try {
    const response = await fetch(`${API_BASE}/drive/shared/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log(`✅ List shared files successful! Found ${data.data?.length || 0} files`);
      return data.data || [];
    } else {
      console.error('❌ List shared files failed:', data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ List shared files error:', error.message);
    return [];
  }
}

/**
 * Test upload file to shared space
 */
async function testUploadSharedFile() {
  console.log('\n📤 Testing POST /drive/shared/upload...');
  
  try {
    // Create a test PDF file (minimal valid PDF)
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const formData = new FormData();
    formData.append('file', new Blob([pdfContent], { type: 'application/pdf' }), 'test-shared.pdf');
    
    const response = await fetch(`${API_BASE}/drive/shared/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Shared upload successful!');
      console.log(`File name: ${data.data.fileName}`);
      console.log(`File path: ${data.data.filePath}`);
      uploadedFileId = data.data.filePath.split('/').pop();
      return data.data;
    } else {
      console.error('❌ Shared upload failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Shared upload error:', error.message);
    return null;
  }
}

/**
 * Test delete file from shared space
 */
async function testDeleteSharedFile(files) {
  // Find the test file we just uploaded
  const testFile = files.find(f => f.name.includes('test-shared.pdf'));
  
  if (!testFile) {
    console.log('\n⚠️  No test file found to delete');
    return;
  }
  
  const fileId = testFile.name; // Use the full filename for deletion
  console.log(`\n🗑️  Testing DELETE /drive/shared/files/${fileId}...`);
  
  try {
    const response = await fetch(`${API_BASE}/drive/shared/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Shared delete successful!');
      return true;
    } else {
      console.error('❌ Shared delete failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Shared delete error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('========================================');
  console.log('  Drive API Integration Tests');
  console.log('========================================');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Keycloak URL: ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`);
  console.log(`Client ID: ${KEYCLOAK_CLIENT_ID}`);
  console.log(`Test User: ${TEST_USER}`);
  console.log('========================================\n');

  try {
    // Login first
    await login();
    
    // Test private space operations
    console.log('\n📁 --- PRIVATE SPACE TESTS ---');
    await testListPrivateFiles();
    await testUploadPrivateFile();
    await testListPrivateFiles(); // List again to see uploaded file
    await testDeletePrivateFile();
    await testListPrivateFiles(); // List again to confirm deletion
    
    // Test shared space operations
    console.log('\n📁 --- SHARED SPACE TESTS ---');
    const sharedFilesBefore = await testListSharedFiles();
    await testUploadSharedFile();
    const sharedFilesAfterUpload = await testListSharedFiles(); // List again to see uploaded file
    await testDeleteSharedFile(sharedFilesAfterUpload);
    await testListSharedFiles(); // List again to confirm deletion
    
    console.log('\n========================================');
    console.log('  ✅ All tests completed!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
