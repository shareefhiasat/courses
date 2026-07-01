/**
 * Script to test Keycloak connection and create user
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function testKeycloakConnection() {
  try {
    console.log('🔍 Testing Keycloak connection...');
    
    // Test if Keycloak is running
    const masterResponse = await fetch(`${KEYCLOAK_URL}/realms/master`);
    if (masterResponse.ok) {
      console.log('✅ Keycloak is running on master realm');
    } else {
      console.log('❌ Keycloak not responding');
      return;
    }
    
    // Test military-lm realm
    const militaryResponse = await fetch(`${KEYCLOAK_URL}/realms/military-lm`);
    if (militaryResponse.ok) {
      console.log('✅ military-lm realm exists');
      
      // Try to get admin token using client credentials
      const tokenResponse = await fetch(`${KEYCLOAK_URL}/realms/military-lm/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: 'admin-cli',
          client_secret: 'admin-cli-secret'
        })
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        console.log('✅ Admin token obtained successfully');
        console.log('🔑 Token length:', tokenData.access_token?.length || 0);
        
        // Try to list users
        const usersResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lm/users`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          console.log(`✅ Found ${users.length} users in military-lm realm`);
          console.log('👥 Users:', users.map(u => u.email).join(', '));
        } else {
          console.log('❌ Failed to list users:', usersResponse.status);
        }
      } else {
        const errorData = await tokenResponse.json();
        console.log('❌ Failed to get admin token:', errorData);
        console.log('💡 You may need to:');
        console.log('   1. Create an admin user in military-lm realm');
        console.log('   2. Use correct admin credentials');
        console.log('   3. Create a proper client with credentials');
      }
    } else {
      console.log('❌ military-lm realm does not exist');
      console.log('💡 Please create the realm in Keycloak admin console first');
    }
    
  } catch (error) {
    console.error('❌ Error testing Keycloak:', error.message);
  }
}

testKeycloakConnection();
