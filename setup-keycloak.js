#!/usr/bin/env node

/**
 * Keycloak Setup Script for Military LMS
 * 
 * This script automatically configures Keycloak with:
 * - Military LMS realm
 * - Frontend and backend clients
 * - Roles (ADMIN, INSTRUCTOR, STUDENT, HR)
 * - Test users
 */

import fetch from 'node-fetch';

const KEYCLOAK_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const REALM_NAME = 'military-lms';

// Configuration
const config = {
  realm: {
    realm: REALM_NAME,
    displayName: 'Military LMS',
    enabled: true,
    registrationAllowed: false,
    loginWithEmailAllowed: true,
    duplicateEmailsAllowed: false,
    resetPasswordAllowed: true,
    editUsernameAllowed: false,
    bruteForceProtected: true
  },
  
  frontendClient: {
    clientId: 'military-lms-app',
    name: 'Military LMS Frontend',
    description: 'Frontend application for Military LMS',
    enabled: true,
    clientAuthenticatorType: 'client-secret',
    secret: '',
    redirectUris: [
      'http://localhost:3000/*',
      'http://localhost:3000/callback',
      'http://localhost:3000/silent-check-sso.html'
    ],
    webOrigins: [
      'http://localhost:3000'
    ],
    publicClient: true,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: true,
    serviceAccountsEnabled: false,
    consentRequired: false
  },

  backendClient: {
    clientId: 'military-lms-backend',
    name: 'Military LMS Backend API',
    description: 'Backend API for Military LMS',
    enabled: true,
    clientAuthenticatorType: 'client-secret',
    redirectUris: [
      'http://localhost:8081/*'
    ],
    webOrigins: [
      'http://localhost:8081'
    ],
    publicClient: false,
    standardFlowEnabled: false,
    directAccessGrantsEnabled: false,
    serviceAccountsEnabled: true,
    consentRequired: false
  },

  roles: [
    { name: 'ADMIN', description: 'Full system access' },
    { name: 'INSTRUCTOR', description: 'Can manage courses and students' },
    { name: 'STUDENT', description: 'Can view courses and enroll' },
    { name: 'HR', description: 'Can manage employees and training' }
  ],

  users: [
    {
      username: 'admin',
      email: 'admin@milmanylms.com',
      firstName: 'System',
      lastName: 'Administrator',
      enabled: true,
      credentials: [{ type: 'password', value: 'admin123', temporary: false }],
      roles: ['ADMIN']
    },
    {
      username: 'instructor',
      email: 'instructor@milmanylms.com',
      firstName: 'Test',
      lastName: 'Instructor',
      enabled: true,
      credentials: [{ type: 'password', value: 'instructor123', temporary: false }],
      roles: ['INSTRUCTOR']
    },
    {
      username: 'student',
      email: 'student@milmanylms.com',
      firstName: 'Test',
      lastName: 'Student',
      enabled: true,
      credentials: [{ type: 'password', value: 'student123', temporary: false }],
      roles: ['STUDENT']
    }
  ]
};

class KeycloakSetup {
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
      console.log('\n💡 Make sure Keycloak is running on http://localhost:8080');
      console.log('💡 Check that admin credentials are correct (admin/admin123)');
      return false;
    }
  }

  async createRealm() {
    console.log('🏗️ Creating Military LMS realm...');
    
    try {
      const response = await fetch(`${this.baseUrl}/admin/realms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config.realm),
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 409) {
          console.log('ℹ️ Realm already exists, skipping...');
          return true;
        }
        throw new Error(`Failed to create realm: ${response.status} ${error}`);
      }

      console.log('✅ Military LMS realm created');
      return true;
    } catch (error) {
      console.error('❌ Failed to create realm:', error.message);
      return false;
    }
  }

  async createClients() {
    console.log('🔗 Creating clients...');

    try {
      // Create frontend client
      const frontendResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config.frontendClient),
      });

      if (!frontendResponse.ok) {
        throw new Error(`Failed to create frontend client: ${frontendResponse.status}`);
      }

      // Create backend client
      const backendResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config.backendClient),
      });

      if (!backendResponse.ok) {
        throw new Error(`Failed to create backend client: ${backendResponse.status}`);
      }

      console.log('✅ Clients created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create clients:', error.message);
      return false;
    }
  }

  async createRoles() {
    console.log('👥 Creating roles...');

    try {
      for (const role of config.roles) {
        const response = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/roles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(role),
        });

        if (!response.ok && response.status !== 409) {
          throw new Error(`Failed to create role ${role.name}: ${response.status}`);
        }
      }

      console.log('✅ Roles created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create roles:', error.message);
      return false;
    }
  }

  async createUsers() {
    console.log('👤 Creating users...');

    try {
      for (const user of config.users) {
        // Create user
        const userResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users`, {
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

        if (!userResponse.ok && userResponse.status !== 409) {
          throw new Error(`Failed to create user ${user.username}: ${userResponse.status}`);
        }

        // Get user ID
        await this.sleep(1000); // Wait for user to be created
        const getUserResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users?username=${user.username}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });

        if (!getUserResponse.ok) {
          throw new Error(`Failed to get user ID for ${user.username}`);
        }

        const users = await getUserResponse.json();
        if (users.length === 0) {
          throw new Error(`User ${user.username} not found after creation`);
        }

        const userId = users[0].id;

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

        // Assign roles
        for (const roleName of user.roles) {
          const roleResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/users/${userId}/role-mappings/realm`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ name: roleName }]),
          });

          if (!roleResponse.ok) {
            throw new Error(`Failed to assign role ${roleName} to ${user.username}: ${roleResponse.status}`);
          }
        }
      }

      console.log('✅ Users created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create users:', error.message);
      return false;
    }
  }

  async getBackendClientSecret() {
    console.log('🔑 Getting backend client secret...');

    try {
      // Get backend client ID
      const clientsResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/clients?clientId=military-lms-backend`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!clientsResponse.ok) {
        throw new Error(`Failed to get backend client: ${clientsResponse.status}`);
      }

      const clients = await clientsResponse.json();
      if (clients.length === 0) {
        throw new Error('Backend client not found');
      }

      const clientId = clients[0].id;

      // Get client secret
      const secretResponse = await fetch(`${this.baseUrl}/admin/realms/${REALM_NAME}/clients/${clientId}/client-secret`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!secretResponse.ok) {
        throw new Error(`Failed to get client secret: ${secretResponse.status}`);
      }

      const secretData = await secretResponse.json();
      console.log('✅ Backend client secret:', secretData.value);
      console.log('\n📝 Add this to your backend .env file:');
      console.log(`KEYCLOAK_CLIENT_SECRET=${secretData.value}`);
      
      return secretData.value;
    } catch (error) {
      console.error('❌ Failed to get client secret:', error.message);
      return null;
    }
  }

  async run() {
    console.log('🚀 Starting Keycloak setup for Military LMS...\n');

    const steps = [
      { name: 'Login', fn: () => this.login() },
      { name: 'Create Realm', fn: () => this.createRealm() },
      { name: 'Create Clients', fn: () => this.createClients() },
      { name: 'Create Roles', fn: () => this.createRoles() },
      { name: 'Create Users', fn: () => this.createUsers() },
      { name: 'Get Client Secret', fn: () => this.getBackendClientSecret() },
    ];

    for (const step of steps) {
      const success = await step.fn();
      if (!success) {
        console.log(`\n❌ Setup failed at step: ${step.name}`);
        return false;
      }
      console.log('');
    }

    console.log('🎉 Keycloak setup completed successfully!');
    console.log('\n📚 Access Keycloak Admin Console:');
    console.log('   URL: http://localhost:8080');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n👤 Test Users Created:');
    console.log('   admin / admin123 (ADMIN role)');
    console.log('   instructor / instructor123 (INSTRUCTOR role)');
    console.log('   student / student123 (STUDENT role)');
    
    return true;
  }
}

// Run the setup
const setup = new KeycloakSetup();
setup.run().catch(console.error);
