#!/usr/bin/env node

/**
 * Add/Update Keycloak Users for Permission Testing
 * 
 * This script adds or updates users in Keycloak with the correct roles
 * for testing the new permission system.
 */

import fetch from 'node-fetch';

const KEYCLOAK_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const REALM_NAME = 'master';

// Users to create/update (matching existing database users)
const users = [
  // HR Users
  {
    username: 'hr1',
    email: 'hr1@example.com',
    firstName: 'Emily',
    lastName: 'Brown',
    enabled: true,
    credentials: [{ type: 'password', value: 'hr123', temporary: false }],
    keycloakRole: 'HR'
  },
  {
    username: 'hr2',
    email: 'hr2@example.com',
    firstName: 'David',
    lastName: 'Miller',
    enabled: true,
    credentials: [{ type: 'password', value: 'hr123', temporary: false }],
    keycloakRole: 'HR'
  },
  {
    username: 'hr3',
    email: 'hr3@example.com',
    firstName: 'Sarah',
    lastName: 'Wilson',
    enabled: true,
    credentials: [{ type: 'password', value: 'hr123', temporary: false }],
    keycloakRole: 'HR'
  },
  {
    username: 'hr4',
    email: 'hr4@example.com',
    firstName: 'James',
    lastName: 'Taylor',
    enabled: true,
    credentials: [{ type: 'password', value: 'hr123', temporary: false }],
    keycloakRole: 'HR'
  },
  {
    username: 'hr5',
    email: 'hr5@example.com',
    firstName: 'Lisa',
    lastName: 'Anderson',
    enabled: true,
    credentials: [{ type: 'password', value: 'hr123', temporary: false }],
    keycloakRole: 'HR'
  },

  // Admin Users
  {
    username: 'admin1',
    email: 'admin1@example.com',
    firstName: 'Robert',
    lastName: 'Johnson',
    enabled: true,
    credentials: [{ type: 'password', value: 'admin123', temporary: false }],
    keycloakRole: 'ADMIN'
  },
  {
    username: 'admin2',
    email: 'admin2@example.com',
    firstName: 'Michael',
    lastName: 'Davis',
    enabled: true,
    credentials: [{ type: 'password', value: 'admin123', temporary: false }],
    keycloakRole: 'ADMIN'
  },
  {
    username: 'admin3',
    email: 'admin3@example.com',
    firstName: 'Jennifer',
    lastName: 'Garcia',
    enabled: true,
    credentials: [{ type: 'password', value: 'admin123', temporary: false }],
    keycloakRole: 'ADMIN'
  },
  {
    username: 'admin4',
    email: 'admin4@example.com',
    firstName: 'William',
    lastName: 'Martinez',
    enabled: true,
    credentials: [{ type: 'password', value: 'admin123', temporary: false }],
    keycloakRole: 'ADMIN'
  },
  {
    username: 'admin5',
    email: 'admin5@example.com',
    firstName: 'Patricia',
    lastName: 'Rodriguez',
    enabled: true,
    credentials: [{ type: 'password', value: 'admin123', temporary: false }],
    keycloakRole: 'ADMIN'
  },

  // Instructor Users
  {
    username: 'instructor1',
    email: 'instructor1@example.com',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    enabled: true,
    credentials: [{ type: 'password', value: 'instructor123', temporary: false }],
    keycloakRole: 'INSTRUCTOR'
  },
  {
    username: 'instructor2',
    email: 'instructor2@example.com',
    firstName: 'Prof. Michael',
    lastName: 'Chen',
    enabled: true,
    credentials: [{ type: 'password', value: 'instructor123', temporary: false }],
    keycloakRole: 'INSTRUCTOR'
  },
  {
    username: 'instructor3',
    email: 'instructor3@example.com',
    firstName: 'Dr. James',
    lastName: 'Wilson',
    enabled: true,
    credentials: [{ type: 'password', value: 'instructor123', temporary: false }],
    keycloakRole: 'INSTRUCTOR'
  },
  {
    username: 'instructor4',
    email: 'instructor4@example.com',
    firstName: 'Dr. Maria',
    lastName: 'Gonzalez',
    enabled: true,
    credentials: [{ type: 'password', value: 'instructor123', temporary: false }],
    keycloakRole: 'INSTRUCTOR'
  },
  {
    username: 'instructor5',
    email: 'instructor5@example.com',
    firstName: 'Prof. Ahmed',
    lastName: 'Khalid',
    enabled: true,
    credentials: [{ type: 'password', value: 'instructor123', temporary: false }],
    keycloakRole: 'INSTRUCTOR'
  },

  // Student Users
  {
    username: 'student1',
    email: 'student1@example.com',
    firstName: 'Ahmed',
    lastName: 'Mohammed',
    enabled: true,
    credentials: [{ type: 'password', value: 'student123', temporary: false }],
    keycloakRole: 'STUDENT'
  },
  {
    username: 'student2',
    email: 'student2@example.com',
    firstName: 'Fatima',
    lastName: 'Ali',
    enabled: true,
    credentials: [{ type: 'password', value: 'student123', temporary: false }],
    keycloakRole: 'STUDENT'
  },
  {
    username: 'student3',
    email: 'student3@example.com',
    firstName: 'Mohammed',
    lastName: 'Khalid',
    enabled: true,
    credentials: [{ type: 'password', value: 'student123', temporary: false }],
    keycloakRole: 'STUDENT'
  },
  {
    username: 'student4',
    email: 'student4@example.com',
    firstName: 'Aisha',
    lastName: 'Hassan',
    enabled: true,
    credentials: [{ type: 'password', value: 'student123', temporary: false }],
    keycloakRole: 'STUDENT'
  },
  {
    username: 'student9',
    email: 'student9@example.com',
    firstName: 'Abdullah',
    lastName: 'Khalifa',
    enabled: true,
    credentials: [{ type: 'password', value: 'student123', temporary: false }],
    keycloakRole: 'STUDENT'
  },
  {
    username: 'student10',
    email: 'student10@example.com',
    firstName: 'Noura',
    lastName: 'Al-Fahad',
    enabled: true,
    credentials: [{ type: 'password', value: 'student123', temporary: false }],
    keycloakRole: 'STUDENT'
  },

  // Super Admin (for testing full access)
  {
    username: 'superadmin',
    email: 'superadmin@example.com',
    firstName: 'Super',
    lastName: 'Admin',
    enabled: true,
    credentials: [{ type: 'password', value: 'superadmin123', temporary: false }],
    keycloakRole: 'SUPER_ADMIN'
  }
];

class KeycloakUserManager {
  constructor() {
    this.accessToken = null;
    this.baseUrl = KEYCLOAK_URL;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login() {
    console.log('🔐 Logging into Keycloak admin console...');
    
    try {
      const response = await fetch(`${this.baseUrl}/realms/master/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD,
        }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      console.log('✅ Successfully logged into Keycloak');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return false;
    }
  }

  async createRoles() {
    console.log('👥 Creating roles in Keycloak...');
    
    const roles = [
      { name: 'SUPER_ADMIN', description: 'Super Administrator' },
      { name: 'ADMIN', description: 'Administrator' },
      { name: 'HR', description: 'HR Manager' },
      { name: 'INSTRUCTOR', description: 'Instructor' },
      { name: 'STUDENT', description: 'Student' }
    ];

    for (const role of roles) {
      try {
        const response = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/roles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: role.name,
            description: role.description
          }),
        });

        if (!response.ok && response.status !== 409) {
          console.log(`   ⚠️ Failed to create role ${role.name}: ${response.status}`);
        } else if (response.status === 409) {
          console.log(`   ℹ️ Role ${role.name} already exists`);
        } else {
          console.log(`   ✅ Role ${role.name} created`);
        }
      } catch (error) {
        console.error(`   ❌ Error creating role ${role.name}:`, error.message);
      }
    }
    
    console.log('✅ Roles creation completed');
    return true;
  }

  async getUserId(username) {
    const response = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users?username=${username}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const users = await response.json();
    return users.length > 0 ? users[0].id : null;
  }

  async createOrUpdateUser(user) {
    console.log(`👤 Processing user: ${user.username} (${user.email})...`);

    try {
      let userId = await this.getUserId(user.username);

      if (userId) {
        // Update existing user
        console.log(`   ℹ️ User ${user.username} exists, updating...`);
        
        const updateResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: user.enabled,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error(`Failed to update user ${user.username}: ${updateResponse.status}`);
        }

        console.log(`   ✅ User ${user.username} updated`);
      } else {
        // Create new user
        console.log(`   ℹ️ Creating new user ${user.username}...`);
        
        const createResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: user.enabled,
          }),
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create user ${user.username}: ${createResponse.status}`);
        }

        await this.sleep(1000); // Wait for user to be created
        userId = await this.getUserId(user.username);
        
        if (!userId) {
          throw new Error(`User ${user.username} not found after creation`);
        }

        console.log(`   ✅ User ${user.username} created`);
      }

      // Set password
      const passwordResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          value: user.credentials[0].value,
          temporary: user.credentials[0].temporary,
        }),
      });

      if (!passwordResponse.ok) {
        throw new Error(`Failed to set password for ${user.username}: ${passwordResponse.status}`);
      }

      console.log(`   ✅ Password set for ${user.username}`);

      // Get Keycloak role ID
      const roleResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/roles/${user.keycloakRole}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!roleResponse.ok) {
        throw new Error(`Failed to get role ${user.keycloakRole}: ${roleResponse.status}`);
      }

      const role = await roleResponse.json();

      // Get client ID
      const clientsResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/clients?clientId=military-lms-app`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!clientsResponse.ok) {
        throw new Error(`Failed to get client: ${clientsResponse.status}`);
      }

      const clients = await clientsResponse.json();
      if (clients.length === 0) {
        throw new Error('Client military-lms-app not found');
      }

      const clientId = clients[0].id;

      // Get client role
      const clientRoleResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/clients/${clientId}/roles/${user.keycloakRole}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      let clientRole;
      if (clientRoleResponse.ok) {
        const roleText = await clientRoleResponse.text();
        clientRole = roleText ? JSON.parse(roleText) : { name: user.keycloakRole };
      } else {
        // Client role doesn't exist, create it
        const createRoleResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/clients/${clientId}/roles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: user.keycloakRole,
            description: `${user.keycloakRole} role`
          }),
        });

        if (!createRoleResponse.ok) {
          throw new Error(`Failed to create client role ${user.keycloakRole}: ${createRoleResponse.status}`);
        }

        const roleText = await createRoleResponse.text();
        clientRole = roleText ? JSON.parse(roleText) : { name: user.keycloakRole };
      }

      // Assign Keycloak client role
      const assignRoleResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users/${userId}/role-mappings/clients/${clientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([clientRole]),
      });

      if (!assignRoleResponse.ok) {
        throw new Error(`Failed to assign role ${user.keycloakRole} to ${user.username}: ${assignRoleResponse.status}`);
      }

      console.log(`   ✅ Keycloak role ${user.keycloakRole} assigned to ${user.username}`);

      return true;
    } catch (error) {
      console.error(`   ❌ Failed to process user ${user.username}:`, error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Adding/Updating Keycloak users for permission testing...\n');

    const success = await this.login();
    if (!success) {
      return false;
    }

    console.log('');

    // Create roles first
    await this.createRoles();
    console.log('');

    let allSuccess = true;
    for (const user of users) {
      const success = await this.createOrUpdateUser(user);
      if (!success) {
        allSuccess = false;
      }
      console.log('');
    }

    if (allSuccess) {
      console.log('🎉 All users created/updated successfully!');
      console.log('\n📚 Test Users Created/Updated:');
      console.log('\n   HR Users (password: hr123):');
      console.log('   - hr1@example.com (Emily Brown)');
      console.log('   - hr2@example.com (David Miller)');
      console.log('   - hr3@example.com (Sarah Wilson)');
      console.log('   - hr4@example.com (James Taylor)');
      console.log('   - hr5@example.com (Lisa Anderson)');
      console.log('\n   Admin Users (password: admin123):');
      console.log('   - admin1@example.com (Robert Johnson)');
      console.log('   - admin2@example.com (Michael Davis)');
      console.log('   - admin3@example.com (Jennifer Garcia)');
      console.log('   - admin4@example.com (William Martinez)');
      console.log('   - admin5@example.com (Patricia Rodriguez)');
      console.log('\n   Instructor Users (password: instructor123):');
      console.log('   - instructor1@example.com (Dr. Sarah Johnson)');
      console.log('   - instructor2@example.com (Prof. Michael Chen)');
      console.log('   - instructor3@example.com (Dr. James Wilson)');
      console.log('   - instructor4@example.com (Dr. Maria Gonzalez)');
      console.log('   - instructor5@example.com (Prof. Ahmed Khalid)');
      console.log('\n   Student Users (password: student123):');
      console.log('   - student1@example.com (Ahmed Mohammed)');
      console.log('   - student2@example.com (Fatima Ali)');
      console.log('   - student3@example.com (Mohammed Khalid)');
      console.log('   - student4@example.com (Aisha Hassan)');
      console.log('   - student9@example.com (Abdullah Khalifa)');
      console.log('   - student10@example.com (Noura Al-Fahad)');
      console.log('\n   Super Admin (for testing full access):');
      console.log('   - superadmin@example.com / superadmin123');
      console.log('\n🔗 Keycloak Admin Console: http://localhost:8080/admin');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('\n📝 Next Steps:');
      console.log('   1. Ensure database users have correct role values (hr, admin, instructor, student)');
      console.log('   2. Login with each test user to verify permissions');
      console.log('   3. Check that side menu items are filtered correctly');
      console.log('   4. Verify button visibility based on role');
      console.log('   5. Test delete operations are restricted appropriately');
    } else {
      console.log('❌ Some users failed to create/update. Please check the errors above.');
    }

    return allSuccess;
  }
}

// Run the script
const manager = new KeycloakUserManager();
manager.run().catch(console.error);
