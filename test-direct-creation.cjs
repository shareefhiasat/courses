/**
 * Test user creation directly via Keycloak API
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function testDirectUserCreation() {
  try {
    console.log('🧪 Testing direct user creation via Keycloak API...');
    
    // Get admin token
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
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get admin token');
    }
    
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    console.log('✅ Admin token obtained');
    
    // Create test user
    const userData = {
      username: 'test@test.com',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: 'Temp123!@#',
        temporary: false
      }]
    };
    
    console.log('🔧 Creating test user...');
    const userResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (userResponse.ok) {
      console.log('✅ Test user created successfully in Keycloak!');
      
      // Get user ID
      const newUserResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users?email=test@test.com`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (newUserResponse.ok) {
        const users = await newUserResponse.json();
        const userId = users[0].id;
        console.log(`🆔 User ID: ${userId}`);
        
        // Create student role
        console.log('🏷️ Creating student role...');
        const roleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/roles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'student',
            description: 'Student Role'
          })
        });
        
        if (roleResponse.ok || roleResponse.status === 409) {
          console.log('✅ student role ready');
          
          // Assign role to user
          console.log('🎯 Assigning student role...');
          const assignResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users/${userId}/role-mappings/realm`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
              id: 'student',
              name: 'student'
            }])
          });
          
          if (assignResponse.ok) {
            console.log('✅ student role assigned successfully!');
          } else {
            console.log('⚠️ Role assignment failed, but user created');
          }
        }
        
        console.log('🎉 Direct user creation complete!');
        console.log('📧 Email: test@test.com');
        console.log('🔑 Password: Temp123!@#');
        console.log('🎯 Role: student');
        console.log('🌐 You can now login to Keycloak with these credentials');
        console.log('');
        console.log('💡 This proves Keycloak API works. The backend issue might be:');
        console.log('   - Wrong realm configuration');
        console.log('   - Network/firewall issues');
        console.log('   - Different token endpoint');
        
      }
    } else {
      const errorData = await userResponse.text();
      console.log('❌ Failed to create user:', userResponse.status, errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectUserCreation();
