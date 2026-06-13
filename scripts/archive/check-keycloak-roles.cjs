const fetch = require('node-fetch');

async function checkKeycloakRoles() {
  try {
    console.log('🔍 Checking Keycloak roles for testuser@example.com...\n');
    
    // Get admin token first
    const tokenResponse = await fetch('http://localhost:8080/realms/master/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const tokenData = await tokenResponse.json();
    const adminToken = tokenData.access_token;
    
    // Get user by email
    const userResponse = await fetch('http://localhost:8080/admin/realms/military-lms/users?email=testuser@example.com', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const users = await userResponse.json();
    
    if (users.length > 0) {
      const user = users[0];
      console.log('👤 User Found:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Enabled:', user.enabled);
      
      // Get user roles
      const rolesResponse = await fetch(`http://localhost:8080/admin/realms/military-lms/users/${user.id}/role-mappings/realm`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const roles = await rolesResponse.json();
      console.log('\n🎭 Keycloak Roles:');
      roles.forEach(role => {
        console.log(`   - ${role.name} (${role.description || 'No description'})`);
      });
      
      console.log('\n🎯 What this means:');
      console.log('   ✅ User can access features for ALL these roles simultaneously');
      console.log('   ✅ No role switching required - all permissions are active');
      console.log('   ✅ UI will show combined features from all roles');
      
    } else {
      console.log('❌ User not found in Keycloak');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkKeycloakRoles();
