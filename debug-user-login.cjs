/**
 * Debug shareef.hiasat@gmail.com login issue
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function debugUserLogin() {
  try {
    console.log('🔍 Debugging shareef.hiasat@gmail.com login issue...\n');
    
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
    
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    console.log('✅ Admin token obtained');
    
    // Check if user exists in Keycloak
    console.log('🔍 Checking if shareef.hiasat@gmail.com exists in Keycloak...');
    const usersResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users?email=shareef.hiasat@gmail.com`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      
      if (users.length > 0) {
        const user = users[0];
        console.log('✅ User found in Keycloak:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Username:', user.username);
        console.log('  Enabled:', user.enabled);
        console.log('  Email Verified:', user.emailVerified);
        console.log('  Created:', user.createdTimestamp);
        
        // Check user roles
        console.log('\n🔍 Checking user roles...');
        const rolesResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users/${user.id}/role-mappings/realm`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (rolesResponse.ok) {
          const roles = await rolesResponse.json();
          console.log('📋 User roles:', roles.map(r => r.name));
          
          if (roles.some(r => r.name === 'super_admin')) {
            console.log('✅ User has super_admin role');
          } else {
            console.log('⚠️ User does not have super_admin role');
          }
        }
        
        // Check if user is enabled
        if (!user.enabled) {
          console.log('❌ User is disabled in Keycloak');
          console.log('🔧 Enabling user...');
          
          const enableResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...user,
              enabled: true,
              emailVerified: true
            })
          });
          
          if (enableResponse.ok) {
            console.log('✅ User enabled and email verified');
          }
        }
        
        // Test direct login as this user
        console.log('\n🧪 Testing direct login...');
        try {
          const loginResponse = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'password',
              client_id: 'military-lms-app',
              username: 'shareef.hiasat@gmail.com',
              password: 'Jordan123'
            })
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Direct login successful!');
            console.log('  Access token length:', loginData.access_token.length);
            console.log('  Refresh token length:', loginData.refresh_token?.length || 0);
            console.log('  Expires in:', loginData.expires_in);
          } else {
            const errorData = await loginResponse.json();
            console.log('❌ Direct login failed:', errorData);
            console.log('  Error:', errorData.error_description || errorData.error);
            
            if (loginResponse.status === 401) {
              console.log('\n🔧 Possible issues:');
              console.log('1. Password is incorrect');
              console.log('2. User is disabled');
              console.log('3. Email not verified');
              console.log('4. Client configuration issue');
              
              console.log('\n🔧 Let me reset the user password...');
              const resetResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users/${user.id}/reset-password`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: 'password',
                  value: 'Jordan123',
                  temporary: false
                })
              });
              
              if (resetResponse.ok) {
                console.log('✅ Password reset to Jordan123');
              } else {
                console.log('⚠️ Failed to reset password');
              }
            }
          }
        } catch (loginError) {
          console.log('❌ Login test error:', loginError.message);
        }
        
      } else {
        console.log('❌ User not found in Keycloak');
        console.log('🔧 Creating user...');
        
        const newUser = {
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
          body: JSON.stringify(newUser)
        });
        
        if (createResponse.ok) {
          console.log('✅ User created successfully');
          
          // Get the created user ID
          const createdUsersResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users?email=shareef.hiasat@gmail.com`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (createdUsersResponse.ok) {
            const createdUsers = await createdUsersResponse.json();
            if (createdUsers.length > 0) {
              const createdUser = createdUsers[0];
              
              // Assign super_admin role
              const superAdminRoleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/roles/super_admin`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (superAdminRoleResponse.ok) {
                const superAdminRole = await superAdminRoleResponse.json();
                
                const assignRoleResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/users/${createdUser.id}/role-mappings/realm`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify([superAdminRole])
                });
                
                if (assignRoleResponse.ok) {
                  console.log('✅ super_admin role assigned');
                }
              }
            }
          }
        } else {
          console.log('❌ Failed to create user');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugUserLogin();
