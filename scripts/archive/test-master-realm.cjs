/**
 * Test Keycloak with master realm using admin/admin123
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function testMasterRealm() {
  try {
    console.log('🔍 Testing Keycloak with master realm and admin/admin123...');
    
    // Try to get admin token from master realm
    const tokenResponse = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      console.log('✅ Admin token obtained successfully from master realm');
      console.log('🔑 Token length:', tokenData.access_token?.length || 0);
      
      // Try to list users in master realm
      const usersResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        console.log(`✅ Found ${users.length} users in master realm`);
        console.log('👥 Users:', users.map(u => u.email || u.username).join(', '));
      } else {
        console.log('❌ Failed to list users:', usersResponse.status);
      }
      
      // Try to create military-lm realm
      console.log('🏗️ Attempting to create military-lm realm...');
      const realmData = {
        realm: 'military-lm',
        enabled: true,
        displayName: 'Military LMS',
        registrationAllowed: false
      };
      
      const realmResponse = await fetch(`${KEYCLOAK_URL}/admin/realms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(realmData)
      });
      
      if (realmResponse.ok) {
        console.log('✅ military-lm realm created successfully!');
      } else {
        const errorData = await realmResponse.text();
        console.log('❌ Failed to create realm:', realmResponse.status, errorData);
        console.log('💡 You may need to create the realm manually in the admin console');
      }
      
    } else {
      const errorData = await tokenResponse.json();
      console.log('❌ Failed to get admin token:', errorData);
      console.log('💡 Check if admin/admin123 credentials are correct');
    }
    
  } catch (error) {
    console.error('❌ Error testing Keycloak:', error.message);
  }
}

testMasterRealm();
