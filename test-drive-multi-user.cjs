require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { provisionUser } = require('./backend/services/nextcloudProvisionService.js');

const prisma = new PrismaClient();

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:8001').replace('http://', 'https://').replace(/\/$/, '') + '/api/v1';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'master';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'military-lms-app';

// Ignore SSL certificate errors for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Login to get authentication token
 */
async function login(email, password) {
  try {
    const response = await fetch(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: KEYCLOAK_CLIENT_ID,
        username: email,
        password: password,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    return null;
  }
}

/**
 * Test list private files
 */
async function testListPrivateFiles(token, keycloakId) {
  try {
    const response = await fetch(`${API_BASE}/drive/private/${keycloakId}/files`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();
    return response.ok && data.success ? data.data || [] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Test list shared files
 */
async function testListSharedFiles(token) {
  try {
    const response = await fetch(`${API_BASE}/drive/shared/files`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();
    return response.ok && data.success ? data.data || [] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get password based on user role
 */
function getPasswordForUser(user) {
  const roles = user.roleAssignments.map(ra => ra.role.code);
  
  if (roles.includes('SUPER_ADMIN')) {
    return 'Jordan123'; // Shareef uses Jordan123
  } else if (roles.includes('ADMIN')) {
    return 'admin123';
  } else if (roles.includes('HR')) {
    return 'hr123';
  } else if (roles.includes('INSTRUCTOR')) {
    return 'instructor123';
  } else if (roles.includes('STUDENT')) {
    return 'student123';
  }
  
  return 'admin123'; // Default fallback
}

/**
 * Test user drive functionality
 */
async function testUser(user) {
  const password = getPasswordForUser(user);
  
  console.log(`\n🧪 Testing User: ${user.displayName} (${user.email})`);
  console.log(`   Role: ${user.roleAssignments.map(ra => ra.role.code).join(', ')}`);
  console.log(`   Keycloak ID: ${user.keycloakId}`);
  console.log(`   Password: ${password}`);

  // Login
  const token = await login(user.email, password);
  if (!token) {
    console.log('   ❌ Login failed (invalid credentials)');
    return { success: false, error: 'Login failed' };
  }
  console.log('   ✅ Login successful');

  // Test private space
  const privateFiles = await testListPrivateFiles(token, user.keycloakId);
  if (privateFiles === null) {
    console.log('   ❌ Private space: Failed (user not provisioned?)');
  } else {
    console.log(`   ✅ Private space: Found ${privateFiles.length} files`);
  }

  // Test shared space
  const sharedFiles = await testListSharedFiles(token);
  if (sharedFiles === null) {
    console.log('   ❌ Shared space: Failed');
  } else {
    console.log(`   ✅ Shared space: Found ${sharedFiles.length} files`);
  }

  return {
    success: true,
    privateSpace: privateFiles !== null,
    sharedSpace: sharedFiles !== null,
    privateFileCount: privateFiles?.length || 0,
    sharedFileCount: sharedFiles?.length || 0
  };
}

/**
 * Main test runner
 */
async function runMultiUserTests() {
  console.log('========================================');
  console.log('  Multi-User Drive API Tests');
  console.log('========================================');

  try {
    // Get users from database
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        roleAssignments: {
          include: { role: true }
        }
      },
      take: 15
    });

    console.log(`\n📋 Found ${users.length} users in database\n`);

    const results = [];

    for (const user of users) {
      const result = await testUser(user);
      results.push({
        user: user.displayName,
        email: user.email,
        roles: user.roleAssignments.map(ra => ra.role.code),
        ...result
      });
    }

    // Summary
    console.log('\n========================================');
    console.log('  Test Summary');
    console.log('========================================');
    
    const successful = results.filter(r => r.success);
    const privateWorking = results.filter(r => r.privateSpace);
    const sharedWorking = results.filter(r => r.sharedSpace);

    console.log(`Total users tested: ${results.length}`);
    console.log(`Login successful: ${successful.length}`);
    console.log(`Private space working: ${privateWorking.length}`);
    console.log(`Shared space working: ${sharedWorking.length}`);

    console.log('\n📊 Detailed Results:');
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`   ${status} ${r.user}: Private=${r.privateSpace ? '✅' : '❌'}, Shared=${r.sharedSpace ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMultiUserTests();
