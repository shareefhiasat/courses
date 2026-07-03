/**
 * Clean up Keycloak realms and set up master realm properly
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function cleanupAndSetupMasterRealm() {
  try {
    console.log('🧹 Cleaning up Keycloak realms and setting up master realm...');
    
    // Get admin token from master realm
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
    console.log('✅ Master admin token obtained');
    
    // List all realms
    const realmsResponse = await fetch(`${KEYCLOAK_URL}/admin/realms`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (realmsResponse.ok) {
      const realms = await realmsResponse.json();
      console.log('📋 Current realms:', realms.map(r => r.realm));
      
      // Delete military-lms and military-lm realms
      const realmsToDelete = ['military-lms', 'military-lm'];
      
      for (const realmName of realmsToDelete) {
        const realm = realms.find(r => r.realm === realmName);
        if (realm) {
          console.log(`🗑️ Deleting realm: ${realmName}`);
          const deleteResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/${realmName}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Realm ${realmName} deleted successfully`);
          } else {
            console.log(`⚠️ Failed to delete realm ${realmName}: ${deleteResponse.status}`);
          }
        } else {
          console.log(`ℹ️ Realm ${realmName} doesn't exist`);
        }
      }
    }
    
    // Set up master realm with proper roles
    console.log('🏛️ Setting up master realm roles...');
    
    const roles = ['super_admin', 'admin', 'hr', 'instructor', 'student'];
    
    for (const roleName of roles) {
      const roleData = {
        name: roleName,
        description: `${roleName.replace('_', ' ').toUpperCase()} role for LMS`
      };
      
      const roleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });
      
      if (roleResponse.ok) {
        console.log(`✅ Role '${roleName}' created in master realm`);
      } else if (roleResponse.status === 409) {
        console.log(`ℹ️ Role '${roleName}' already exists in master realm`);
      } else {
        console.log(`⚠️ Failed to create role '${roleName}': ${roleResponse.status}`);
      }
    }
    
    // Ensure shareef.hiasat@gmail.com exists and has super_admin role
    console.log('👤 Setting up shareef.hiasat@gmail.com user...');
    
    // Check if user exists
    const existingUserResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users?email=shareef.hiasat@gmail.com`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    let userId;
    if (existingUserResponse.ok) {
      const existingUsers = await existingUserResponse.json();
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log(`ℹ️ User shareef.hiasat@gmail.com already exists with ID: ${userId}`);
      } else {
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
        
        const createResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        if (createResponse.ok) {
          console.log('✅ User shareef.hiasat@gmail.com created successfully');
          
          // Get user ID
          const newUserResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users?email=shareef.hiasat@gmail.com`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (newUserResponse.ok) {
            const users = await newUserResponse.json();
            userId = users[0].id;
          }
        } else {
          console.log('❌ Failed to create user shareef.hiasat@gmail.com');
        }
      }
    }
    
    // Assign super_admin role to the user
    if (userId) {
      console.log('🎯 Assigning super_admin role to shareef.hiasat@gmail.com...');
      
      // Get the super_admin role
      const roleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/roles/super_admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (roleResponse.ok) {
        const superAdminRole = await roleResponse.json();
        
        const assignResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users/${userId}/role-mappings/realm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([superAdminRole])
        });
        
        if (assignResponse.ok) {
          console.log('✅ super_admin role assigned to shareef.hiasat@gmail.com');
        } else {
          console.log('⚠️ Failed to assign super_admin role');
        }
      }
    }
    
    console.log('\n🎉 Master realm setup complete!');
    console.log('📋 Login credentials:');
    console.log('📧 Email: shareef.hiasat@gmail.com');
    console.log('🔑 Password: Jordan123');
    console.log('🎯 Role: super_admin');
    console.log('🌐 Realm: master');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Update frontend to use master realm');
    console.log('2. Restart backend server');
    console.log('3. Test user creation in UsersPage');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupAndSetupMasterRealm();
