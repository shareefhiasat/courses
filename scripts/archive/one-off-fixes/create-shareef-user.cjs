/**
 * Create shareef.hiasat@gmail.com user in Keycloak master realm
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function createShareefUser() {
  try {
    console.log('👤 Creating shareef.hiasat@gmail.com user in master realm...');
    
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
    
    // Check if user already exists
    const existingUserResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users?email=shareef.hiasat@gmail.com`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (existingUserResponse.ok) {
      const existingUsers = await existingUserResponse.json();
      if (existingUsers.length > 0) {
        console.log('ℹ️ User shareef.hiasat@gmail.com already exists');
        console.log('🆔 User ID:', existingUsers[0].id);
        return existingUsers[0];
      }
    }
    
    // Create user
    const userData = {
      username: 'shareef.hiasat@gmail.com',
      email: 'shareef.hiasat@gmail.com',
      firstName: 'Shareef',
      lastName: 'Hiasat',
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: 'Jordan123',
        temporary: false
      }]
    };
    
    console.log('🔧 Creating user...');
    const userResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (userResponse.ok) {
      console.log('✅ User created successfully!');
      
      // Get user ID
      const newUserResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users?email=shareef.hiasat@gmail.com`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (newUserResponse.ok) {
        const users = await newUserResponse.json();
        const userId = users[0].id;
        console.log(`🆔 User ID: ${userId}`);
        
        // Create super_admin role if it doesn't exist
        console.log('🏷️ Creating super_admin role...');
        const roleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/roles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'super_admin',
            description: 'Super Admin Role'
          })
        });
        
        if (roleResponse.ok || roleResponse.status === 409) {
          console.log('✅ super_admin role ready');
          
          // Assign role to user
          console.log('🎯 Assigning super_admin role...');
          const assignResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users/${userId}/role-mappings/realm`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
              id: 'super_admin',
              name: 'super_admin'
            }])
          });
          
          if (assignResponse.ok) {
            console.log('✅ super_admin role assigned successfully!');
          } else {
            console.log('⚠️ Role assignment failed, but user created');
          }
        }
        
        console.log('🎉 User setup complete!');
        console.log('📧 Email: shareef.hiasat@gmail.com');
        console.log('🔑 Password: Jordan123');
        console.log('🎯 Role: super_admin');
        console.log('🌐 You can now login to Keycloak with these credentials');
        
      }
    } else {
      const errorData = await userResponse.text();
      console.log('❌ Failed to create user:', userResponse.status, errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createShareefUser();
