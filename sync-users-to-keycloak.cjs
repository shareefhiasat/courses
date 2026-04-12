const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Keycloak Admin configuration
const KEYCLOAK_CONFIG = {
  url: 'http://localhost:8080',
  realm: 'master',
  clientId: 'military-lms-app',
  admin: {
    clientId: 'admin-cli',
    username: 'admin', // Change if different
    password: 'admin123'  // Change if different
  }
};

async function getAdminToken() {
  try {
    const response = await fetch(`${KEYCLOAK_CONFIG.url}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: KEYCLOAK_CONFIG.admin.clientId,
        username: KEYCLOAK_CONFIG.admin.username,
        password: KEYCLOAK_CONFIG.admin.password,
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get admin token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting admin token:', error.message);
    throw error;
  }
}

async function findUserInKeycloak(email, token) {
  try {
    const response = await fetch(`${KEYCLOAK_CONFIG.url}/admin/realms/${KEYCLOAK_CONFIG.realm}/users?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to search for user: ${response.statusText}`);
    }

    const users = await response.json();
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('❌ Error finding user in Keycloak:', error.message);
    return null;
  }
}

async function createUserInKeycloak(user, token) {
  try {
    // Split display name into first and last name
    const nameParts = (user.displayName || user.email).split(' ');
    const firstName = nameParts[0] || user.email;
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData = {
      username: user.email,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      enabled: user.isActive,
      emailVerified: true,
      credentials: [{
        type: 'password',
        value: 'TempPassword123!', // Temporary password
        temporary: true
      }]
    };

    const response = await fetch(`${KEYCLOAK_CONFIG.url}/admin/realms/${KEYCLOAK_CONFIG.realm}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create user: ${response.statusText} - ${errorData}`);
    }

    // Get the created user's ID from Location header or by searching
    const createdUser = await findUserInKeycloak(user.email, token);
    return createdUser;
  } catch (error) {
    console.error('❌ Error creating user in Keycloak:', error.message);
    throw error;
  }
}

async function assignRolesToUser(keycloakUserId, roles, token) {
  try {
    // Get role mappings
    const roleMappings = {
      'student': 'student',
      'instructor': 'instructor', 
      'hr': 'hr',
      'admin': 'admin',
      'SUPER_ADMIN': 'admin' // Map SUPER_ADMIN to admin role in Keycloak
    };

    for (const roleCode of roles) {
      const keycloakRoleName = roleMappings[roleCode] || roleCode;
      
      // Get the role from Keycloak
      const roleResponse = await fetch(`${KEYCLOAK_CONFIG.url}/admin/realms/${KEYCLOAK_CONFIG.realm}/roles/${keycloakRoleName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (roleResponse.ok) {
        const role = await roleResponse.json();
        
        // Assign role to user
        const assignResponse = await fetch(`${KEYCLOAK_CONFIG.url}/admin/realms/${KEYCLOAK_CONFIG.realm}/users/${keycloakUserId}/role-mappings/realm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([role])
        });

        if (assignResponse.ok) {
          console.log(`✅ Assigned role ${keycloakRoleName} to user`);
        } else {
          console.log(`⚠️  Failed to assign role ${keycloakRoleName} to user`);
        }
      } else {
        console.log(`⚠️  Role ${keycloakRoleName} not found in Keycloak`);
      }
    }
  } catch (error) {
    console.error('❌ Error assigning roles:', error.message);
  }
}

async function syncUsersToKeycloak() {
  try {
    console.log('🔧 Starting Keycloak sync process...\n');

    // Get admin token
    console.log('🔑 Getting Keycloak admin token...');
    const token = await getAdminToken();
    console.log('✅ Admin token obtained\n');

    // Get users without Keycloak IDs
    const users = await prisma.user.findMany({
      where: { keycloakId: null },
      include: {
        primaryRole: true,
        roleAssignments: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`📊 Found ${users.length} users to sync:\n`);

    for (const user of users) {
      console.log(`\n🔄 Processing user: ${user.email} (ID: ${user.id})`);
      
      try {
        // Check if user already exists in Keycloak
        let keycloakUser = await findUserInKeycloak(user.email, token);
        
        if (keycloakUser) {
          console.log(`✅ User already exists in Keycloak (ID: ${keycloakUser.id})`);
        } else {
          console.log(`➕ Creating user in Keycloak...`);
          keycloakUser = await createUserInKeycloak(user, token);
          console.log(`✅ User created in Keycloak (ID: ${keycloakUser.id})`);
        }

        // Update database with Keycloak ID
        await prisma.user.update({
          where: { id: user.id },
          data: { keycloakId: keycloakUser.id }
        });
        console.log(`✅ Updated database with Keycloak ID`);

        // Assign roles
        const roles = [];
        if (user.primaryRole) {
          roles.push(user.primaryRole.code);
        }
        if (user.roleAssignments && user.roleAssignments.length > 0) {
          roles.push(...user.roleAssignments.map(ra => ra.role.code));
        }
        
        // Remove duplicates
        const uniqueRoles = [...new Set(roles)];
        
        if (uniqueRoles.length > 0) {
          console.log(`🎭 Assigning roles: ${uniqueRoles.join(', ')}`);
          await assignRolesToUser(keycloakUser.id, uniqueRoles, token);
        }

        console.log(`✅ User ${user.email} synced successfully!`);
        
      } catch (error) {
        console.error(`❌ Failed to sync user ${user.email}:`, error.message);
      }
    }

    console.log('\n🎉 Sync process completed!');
    
  } catch (error) {
    console.error('❌ Sync process failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncUsersToKeycloak();
