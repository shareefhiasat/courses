require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

async function createTestHR() {
  console.log('� Creating test HR users...');

  try {
    // Get super admin ID for createdBy
    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error('❌ Cannot create HR users: Super admin not found');
      return;
    }

    // Get HR role
    const hrRole = await prisma.userRoles.findFirst({
      where: { code: 'HR' }
    });

    if (!hrRole) {
      console.error('❌ HR role not found! Please run the seed script first.');
      return;
    }

    const hrUsers = [
      {
        email: 'hr.manager@example.com',
        firstName: 'John',
        lastName: 'Anderson',
        displayName: 'John Anderson',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: hrRole.id
          }
        }
      },
      {
        email: 'hr.coordinator@example.com',
        firstName: 'Maria',
        lastName: 'Garcia',
        displayName: 'Maria Garcia',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: hrRole.id
          }
        }
      }
    ];

    for (const hrData of hrUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: hrData.email }
      });

      if (!existing) {
        await prisma.user.create({ data: hrData });
        console.log(`   ✅ Created: ${hrData.displayName}`);
      } else {
        console.log(`   ⚠️  Already exists: ${hrData.displayName}`);
      }
    }

    console.log('\n🎉 Test HR users created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 2 HR users created');
    console.log('\n✅ Ready for HR testing!\n');

  } catch (error) {
    console.error('❌ Error creating test HR users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createTestHR()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
