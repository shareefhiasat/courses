/**
 * Sync Keycloak Users to Database
 * 
 * This script fetches all users from Keycloak and ensures they exist in the database.
 * Run this when you have Keycloak users that don't have corresponding DB records.
 */

import prisma from '../db/prismaClient.js';
import { listUsers } from '../services/keycloakAdminService.js';


async function syncKeycloakUsers() {
  try {
    console.log('🔄 Fetching users from Keycloak...');
    
    const result = await listUsers({ search: '', first: 0, max: 1000 });
    
    if (!result.success) {
      console.error('❌ Failed to fetch Keycloak users:', result.error);
      process.exit(1);
    }
    
    const keycloakUsers = result.data;
    console.log(`✅ Found ${keycloakUsers.length} users in Keycloak`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const kcUser of keycloakUsers) {
      try {
        // Check if user exists in database
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { keycloakId: kcUser.id },
              { email: kcUser.email }
            ]
          }
        });
        
        if (existingUser) {
          // Update keycloakId if missing
          if (!existingUser.keycloakId && kcUser.id) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { keycloakId: kcUser.id }
            });
            console.log(`  ✏️  Updated keycloakId for: ${kcUser.email}`);
            updated++;
          } else {
            console.log(`  ⏭️  Skipped (exists): ${kcUser.email}`);
            skipped++;
          }
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: {
              keycloakId: kcUser.id,
              email: kcUser.email,
              displayName: `${kcUser.firstName || ''} ${kcUser.lastName || ''}`.trim() || kcUser.username,
              firstName: kcUser.firstName,
              lastName: kcUser.lastName,
              isActive: kcUser.enabled !== false
            }
          });
          console.log(`  ✅ Created: ${kcUser.email} (DB ID: ${newUser.id})`);
          created++;
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${kcUser.email}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`  Created: ${created}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total: ${keycloakUsers.length}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncKeycloakUsers();
