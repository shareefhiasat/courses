/**
 * Test military-lms realm with existing user
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function testMilitaryLMS() {
  try {
    console.log('🔍 Testing military-lms realm...');
    
    // Test if realm exists
    const realmResponse = await fetch(`${KEYCLOAK_URL}/realms/military-lms`);
    if (realmResponse.ok) {
      console.log('✅ military-lms realm exists');
      
      // Try different credential combinations
      const credentialTests = [
        { username: 'admin', password: 'admin123' },
        { username: 'admin', password: 'admin' },
        { username: 'shareef.hiasat@gmail.com', password: 'admin123' },
        { username: 'shareef.hiasat@gmail.com', password: 'admin' }
      ];
      
      for (const creds of credentialTests) {
        console.log(`🔑 Trying: ${creds.username} / ${creds.password}`);
        
        const tokenResponse = await fetch(`${KEYCLOAK_URL}/realms/military-lms/protocol/openid-connect/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: creds.username,
            password: creds.password
          })
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log(`✅ SUCCESS with ${creds.username}!`);
          console.log(`🔑 Token length: ${tokenData.access_token?.length || 0}`);
          
          // List users to verify
          const usersResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lms/users`, {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log(`👥 Found ${users.length} users:`);
            users.forEach(u => {
              console.log(`   - ${u.email || u.username} (${u.firstName || ''} ${u.lastName || ''})`);
            });
          }
          
          return { success: true, token: tokenData.access_token, username: creds.username };
        } else {
          const errorData = await tokenResponse.json();
          console.log(`❌ Failed: ${errorData.error_description}`);
        }
      }
      
      console.log('💡 None of the tested credentials work. You may need to:');
      console.log('   1. Check the correct admin credentials for military-lms');
      console.log('   2. Use a different client with proper configuration');
      console.log('   3. Set up service account credentials');
      
    } else {
      console.log('❌ military-lms realm does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMilitaryLMS();
