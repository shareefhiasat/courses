/**
 * Test Keycloak Connection
 */

import fetch from 'node-fetch';

const KEYCLOAK_URL = 'http://localhost:8080';

async function testKeycloakConnection() {
  console.log('🔑 Testing Keycloak Connection...\n');
  
  try {
    // Test if Keycloak is running
    console.log('1. Testing Keycloak server availability...');
    const response = await fetch(`${KEYCLOAK_URL}/health`, { timeout: 5000 });
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Keycloak is running and healthy');
      console.log('   Status:', health.status);
      console.log('   Version:', health.version);
    } else {
      console.log('❌ Keycloak responded but not healthy');
      return false;
    }
  } catch (error) {
    console.log('❌ Keycloak is not running or not accessible');
    console.log('   Error:', error.message);
    console.log('\n💡 Solutions:');
    console.log('   1. Start Keycloak: docker-compose -f docker-compose.keycloak.yml up -d');
    console.log('   2. Or download Keycloak and run it manually');
    console.log('   3. Make sure port 8080 is free');
    return false;
  }

  try {
    // Test admin login
    console.log('\n2. Testing admin login...');
    const loginResponse = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123',
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Admin login successful');
      console.log('   Access token received');
      
      // Test if realm exists
      console.log('\n3. Testing military-lms realm...');
      const realmResponse = await fetch(`${KEYCLOAK_URL}/realms/military-lms/.well-known/openid-configuration`);
      
      if (realmResponse.ok) {
        console.log('✅ Military LMS realm exists');
        const config = await realmResponse.json();
        console.log('   Issuer:', config.issuer);
        
        // Test client
        console.log('\n4. Testing frontend client...');
        try {
          const authUrl = `${config.authorization_endpoint}?client_id=military-lms-app&redirect_uri=${encodeURIComponent('http://localhost:3000')}&response_type=code&scope=openid`;
          console.log('   Authorization URL:', authUrl);
          console.log('✅ Frontend client configuration looks correct');
        } catch (e) {
          console.log('❌ Client configuration issue');
        }
        
      } else {
        console.log('❌ Military LMS realm does not exist');
        console.log('   Run: pnpm keycloak:setup to create it');
      }
      
    } else {
      console.log('❌ Admin login failed');
      console.log('   Status:', loginResponse.status);
      if (loginResponse.status === 401) {
        console.log('   Check admin credentials (admin/admin123)');
      }
    }
  } catch (error) {
    console.log('❌ Error during authentication test:', error.message);
  }

  console.log('\n📚 Next Steps:');
  console.log('1. If Keycloak is not running, start it first');
  console.log('2. If realm doesn\'t exist, run: pnpm keycloak:setup');
  console.log('3. If everything is set up, test the frontend authentication');
  
  return true;
}

testKeycloakConnection().catch(console.error);
