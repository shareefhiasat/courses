require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getUserInfo() {
  try {
    console.log('🔍 Querying database for users...\n');

    // Get shareef user
    const shareefUser = await prisma.user.findUnique({
      where: { email: 'shareef.hiasat@gmail.com' },
      include: {
        roleAssignments: {
          include: {
            role: true
          }
        }
      }
    });

    if (shareefUser) {
      console.log('✅ Shareef User Found:');
      console.log(`   ID: ${shareefUser.id}`);
      console.log(`   Email: ${shareefUser.email}`);
      console.log(`   Name: ${shareefUser.displayName}`);
      console.log(`   Keycloak ID: ${shareefUser.keycloakId}`);
      console.log(`   Active: ${shareefUser.isActive}`);
      console.log(`   Roles: ${shareefUser.roleAssignments.map(ra => ra.role.code).join(', ')}`);
    } else {
      console.log('❌ Shareef user not found in database');
    }

    // Get other users for testing
    console.log('\n📋 Other Users in Database:');
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        email: {
          not: 'shareef.hiasat@gmail.com'
        }
      },
      include: {
        roleAssignments: {
          include: {
            role: true
          }
        }
      },
      take: 10
    });

    const usersByRole = {
      STUDENT: [],
      INSTRUCTOR: [],
      HR: [],
      ADMIN: [],
      SUPER_ADMIN: []
    };

    users.forEach(user => {
      user.roleAssignments.forEach(ra => {
        const roleCode = ra.role.code;
        if (usersByRole[roleCode]) {
          usersByRole[roleCode].push({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            keycloakId: user.keycloakId
          });
        }
      });
    });

    Object.entries(usersByRole).forEach(([role, users]) => {
      if (users.length > 0) {
        console.log(`\n   ${role}:`);
        users.forEach(u => {
          console.log(`      - ${u.displayName} (${u.email})`);
          console.log(`        ID: ${u.id}, Keycloak: ${u.keycloakId}`);
        });
      }
    });

    // Get Nextcloud account info for shareef
    console.log('\n📁 Nextcloud Account Info:');
    const nextcloudAccount = await prisma.nextcloudAccount.findUnique({
      where: { userId: shareefUser?.id }
    });

    if (nextcloudAccount) {
      console.log(`   User ID: ${nextcloudAccount.userId}`);
      console.log(`   Nextcloud User: ${nextcloudAccount.nextcloudUserId}`);
      console.log(`   Provisioned: ${nextcloudAccount.isProvisioned}`);
      console.log(`   Last Sync: ${nextcloudAccount.lastSyncAt}`);
    } else {
      console.log('   ❌ No Nextcloud account found for shareef');
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserInfo();
