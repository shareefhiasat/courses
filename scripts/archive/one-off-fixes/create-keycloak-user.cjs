/**
 * Script to create existing PostgreSQL user in Keycloak
 */

const { createUser } = require('./backend/services/keycloakAdminService.js');

async function createExistingUserInKeycloak() {
  try {
    console.log('Creating shareef.hiasat@gmail.com in Keycloak...');
    
    const result = await createUser({
      email: 'shareef.hiasat@gmail.com',
      firstName: 'Shareef',
      lastName: 'Hiasat',
      enabled: true,
      temporaryPassword: 'Temp123!@#' // You can change this
    });
    
    if (result.success) {
      console.log('✅ User created successfully in Keycloak!');
      console.log('User ID:', result.data.id);
      console.log('Temporary password: Temp123!@#');
      console.log('\nYou can now login with:');
      console.log('Email: shareef.hiasat@gmail.com');
      console.log('Password: Temp123!@#');
    } else {
      console.error('❌ Failed to create user:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createExistingUserInKeycloak();
