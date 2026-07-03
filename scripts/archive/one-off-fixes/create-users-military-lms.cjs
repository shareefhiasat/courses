/**
 * Create users in military-lms realm (the correct realm for LMS)
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function createUsersInMilitaryLMS() {
  try {
    console.log('🏛️ Creating users in military-lms realm...');
    
    // First, we need to get admin token from master realm to create users in military-lms
    const masterTokenResponse = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
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
    
    if (!masterTokenResponse.ok) {
      throw new Error('Failed to get master admin token');
    }
    
    const masterTokenData = await masterTokenResponse.json();
    const masterToken = masterTokenData.access_token;
    console.log('✅ Master admin token obtained');
    
    // Create users in military-lms realm
    const usersToCreate = [
      {
        email: 'shareef.hiasat@gmail.com',
        firstName: 'Shareef',
        lastName: 'Hiasat',
        password: 'Jordan123',
        role: 'super_admin'
      },
      {
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Temp123!@#',
        role: 'student'
      }
    ];
    
    for (const user of usersToCreate) {
      console.log(`👤 Creating user: ${user.email}`);
      
      // Check if user already exists
      const existingUserResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lms/users?email=${user.email}`, {
        headers: {
          'Authorization': `Bearer ${masterToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (existingUserResponse.ok) {
        const existingUsers = await existingUserResponse.json();
        if (existingUsers.length > 0) {
          console.log(`ℹ️ User ${user.email} already exists in military-lms`);
          continue;
        }
      }
      
      // Create user
      const userData = {
        username: user.email,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: user.password,
          temporary: false
        }]
      };
      
      const userResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lms/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${masterToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (userResponse.ok) {
        console.log(`✅ User ${user.email} created successfully!`);
        
        // Get user ID
        const newUserResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lms/users?email=${user.email}`, {
          headers: {
            'Authorization': `Bearer ${masterToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (newUserResponse.ok) {
          const users = await newUserResponse.json();
          const userId = users[0].id;
          
          // Create role if it doesn't exist
          const roleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lms/roles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${masterToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: user.role,
              description: `${user.role.replace('_', ' ').toUpperCase()} Role`
            })
          });
          
          if (roleResponse.ok || roleResponse.status === 409) {
            // Assign role to user
            const assignResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lms/users/${userId}/role-mappings/realm`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${masterToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify([{
                name: user.role
              }])
            });
            
            if (assignResponse.ok) {
              console.log(`✅ Role ${user.role} assigned to ${user.email}`);
            } else {
              console.log(`⚠️ Role assignment failed for ${user.email}, but user created`);
            }
          }
        }
      } else {
        const errorData = await userResponse.text();
        console.log(`❌ Failed to create user ${user.email}:`, userResponse.status, errorData);
      }
    }
    
    console.log('\n🎉 User creation complete!');
    console.log('\n📋 Login Credentials for military-lms realm:');
    console.log('🌐 Login URL: http://localhost:8080/realms/military-lms/protocol/openid-connect/auth');
    console.log('');
    usersToCreate.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`🔑 Password: ${user.password}`);
      console.log(`🎯 Role: ${user.role}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUsersInMilitaryLMS();
