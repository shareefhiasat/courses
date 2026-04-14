/**
 * Create a new user in Keycloak and database
 * 
 * Usage: node scripts/keycloak/create-user-in-keycloak.js
 * 
 * This script:
 * 1. Creates a user in Keycloak
 * 2. Creates the user in the database with the Keycloak UUID
 * 3. Assigns roles in both systems
 * 
 * Environment variables required:
 * - DATABASE_URL
 * - KEYCLOAK_URL
 * - KEYCLOAK_REALM
 * - KEYCLOAK_CLIENT_ID
 * - KEYCLOAK_CLIENT_SECRET
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createUser, setUserRoles } from '../../backend/services/keycloakAdminService.js';

const prisma = new PrismaClient();

async function createUserInKeycloak() {
  console.log('👤 Creating new user in Keycloak and database...\n');

  try {
    // Get user details from command line arguments or prompt
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('Usage: node create-user-in-keycloak.js <email> <firstName> <lastName> [role]');
      console.log('Roles: super_admin, admin, instructor, hr, student (default: student)');
      console.log('\nExample:');
      console.log('  node create-user-in-keycloak.js john@example.com John Doe instructor');
      process.exit(1);
    }

    const [email, firstName, lastName, role = 'student'] = args;

    // Validate role
    const validRoles = ['super_admin', 'admin', 'instructor', 'hr', 'student'];
    if (!validRoles.includes(role)) {
      console.error(`❌ Invalid role: ${role}. Valid roles: ${validRoles.join(', ')}`);
      process.exit(1);
    }

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    console.log(`Creating user: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Role: ${role}`);
    console.log(`Temporary password: ${temporaryPassword}\n`);

    // 1. Create user in Keycloak
    console.log('1. Creating user in Keycloak...');
    const keycloakUser = await createUser({
      email,
      firstName,
      lastName,
      enabled: true,
      temporaryPassword
    });

    if (!keycloakUser.success) {
      console.error(`❌ Failed to create user in Keycloak:`, keycloakUser.error);
      process.exit(1);
    }

    const keycloakId = keycloakUser.data.id;
    console.log(`✅ Created in Keycloak with ID: ${keycloakId}`);

    // 2. Assign role in Keycloak
    console.log('2. Assigning role in Keycloak...');
    const roleResult = await setUserRoles({ keycloakUserId: keycloakId, roles: [role] });
    if (roleResult.success) {
      console.log(`✅ Assigned role: ${role}`);
    } else {
      console.warn(`⚠️ Failed to assign role:`, roleResult.error);
    }

    // 3. Get role ID from database
    console.log('3. Getting role ID from database...');
    const roleRecord = await prisma.userRoles.findUnique({
      where: { code: role.toUpperCase() }
    });

    if (!roleRecord) {
      console.error(`❌ Role ${role} not found in database`);
      process.exit(1);
    }

    // 4. Create user in database
    console.log('4. Creating user in database...');
    const user = await prisma.user.create({
      data: {
        displayName: `${firstName} ${lastName}`,
        realName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        isActive: true,
        keycloakId
      }
    });
    console.log(`✅ Created in database with ID: ${user.id}`);

    // 5. Create role assignment
    console.log('5. Creating role assignment...');
    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        roleId: roleRecord.id,
        assignedBy: 1 // TODO: Get actual admin user ID
      }
    });
    console.log(`✅ Role assigned in database`);

    console.log('\n✅ User creation complete!');
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Temporary password: ${temporaryPassword}`);
    console.log(`🆔 Keycloak ID: ${keycloakId}`);
    console.log(`🆔 Database ID: ${user.id}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUserInKeycloak();
