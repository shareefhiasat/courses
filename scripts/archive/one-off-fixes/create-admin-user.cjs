/**
 * Create admin user in military-lm realm
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function createAdminUser() {
  try {
    console.log('👤 Creating admin user in military-lm realm...');
    
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
    
    // Create admin user in military-lm realm
    const userData = {
      username: 'admin',
      email: 'admin@military-lm.com',
      firstName: 'Admin',
      lastName: 'User',
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: 'admin123',
        temporary: false
      }]
    };
    
    console.log('🔧 Creating admin user...');
    const userResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lm/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (userResponse.ok) {
      console.log('✅ Admin user created successfully!');
      
      // Get the created user ID
      const usersResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lm/users?username=admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        if (users.length > 0) {
          const adminUserId = users[0].id;
          console.log(`🆔 Admin user ID: ${adminUserId}`);
          
          // Create required roles
          console.log('🏷️ Creating roles...');
          const roles = ['super_admin', 'admin', 'instructor', 'hr', 'student'];
          
          for (const roleName of roles) {
            const roleData = {
              name: roleName,
              description: `${roleName.replace('_', ' ').toUpperCase()} role`
            };
            
            const roleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lm/roles`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(roleData)
            });
            
            if (roleResponse.ok) {
              console.log(`✅ Role '${roleName}' created`);
            } else {
              console.log(`⚠️ Role '${roleName}' might already exist`);
            }
          }
          
          // Assign super_admin role to admin user
          console.log('🎯 Assigning super_admin role to admin user...');
          const roleMappingResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lm/users/${adminUserId}/role-mappings/realm`, {
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
          
          if (roleMappingResponse.ok) {
            console.log('✅ Super admin role assigned to admin user');
          } else {
            console.log('⚠️ Failed to assign role (might need manual assignment)');
          }
        }
      }
      
      console.log('🎉 Setup complete! You can now:');
      console.log('   1. Login to military-lm realm with admin/admin123');
      console.log('   2. Create users through the application');
      
    } else {
      const errorData = await userResponse.text();
      console.log('❌ Failed to create admin user:', userResponse.status, errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminUser();
