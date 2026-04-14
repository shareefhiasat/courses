/**
 * Sync existing database users to Keycloak
 * 
 * This script:
 * 1. Finds users in database without keycloakId
 * 2. Creates them in Keycloak
 * 3. Updates database with the Keycloak UUID
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createUser, setUserRoles, getUserByEmail } from './backend/services/keycloakAdminService.js';

const prisma = new PrismaClient();

async function syncUsersToKeycloak() {
  console.log('🔑 Syncing database users to Keycloak...\n');

  try {
    // Find users without keycloakId
    const usersWithoutKeycloakId = await prisma.user.findMany({
      where: { keycloakId: null },
      include: {
        roleAssignments: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`Found ${usersWithoutKeycloakId.length} users without keycloakId`);

    if (usersWithoutKeycloakId.length === 0) {
      console.log('✅ All users already have keycloakId');
      return;
    }

    // Role mapping
    const roleMapping = {
      'SUPER_ADMIN': 'super_admin',
      'ADMIN': 'admin',
      'INSTRUCTOR': 'instructor',
      'HR': 'hr',
      'STUDENT': 'student'
    };

    for (const user of usersWithoutKeycloakId) {
      console.log(`\nProcessing: ${user.email}`);

      try {
        let keycloakId;
        let temporaryPassword;

        // Check if user already exists in Keycloak
        const existingUser = await getUserByEmail(user.email);
        
        if (existingUser.success) {
          // User exists in Keycloak, use their existing ID
          keycloakId = existingUser.data.id;
          console.log(`✅ Found existing user in Keycloak with ID: ${keycloakId}`);
        } else {
          // User doesn't exist, create them
          temporaryPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

          const keycloakUser = await createUser({
            email: user.email,
            firstName: user.firstName || 'Pending',
            lastName: user.lastName || 'Sync',
            enabled: user.isActive,
            temporaryPassword: temporaryPassword
          });

          if (!keycloakUser.success) {
            console.error(`❌ Failed to create ${user.email} in Keycloak:`, keycloakUser.error);
            continue;
          }

          keycloakId = keycloakUser.data.id;
          console.log(`✅ Created in Keycloak with ID: ${keycloakId}`);
        }

        // Get user's primary role from database
        const primaryRole = user.roleAssignments[0]?.role?.code;
        const keycloakRole = roleMapping[primaryRole] || 'student';

        // Assign role in Keycloak
        const roleResult = await setUserRoles({ keycloakUserId: keycloakId, roles: [keycloakRole] });
        if (roleResult.success) {
          console.log(`✅ Assigned role: ${keycloakRole}`);
        } else {
          console.warn(`⚠️ Failed to assign role:`, roleResult.error);
        }

        // Update database with keycloakId
        await prisma.user.update({
          where: { id: user.id },
          data: { keycloakId }
        });

        console.log(`✅ Updated database with keycloakId`);
        
        if (temporaryPassword) {
          console.log(`📧 Temporary password: ${temporaryPassword}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message);
      }
    }

    console.log('\n✅ Sync complete');

  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUsersToKeycloak();
