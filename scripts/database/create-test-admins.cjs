require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

async function createTestAdmins() {
  console.log('🔧 Creating test Admin users...\n');

  try {
    // Get super admin ID for createdBy
    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error('❌ Cannot create Admin users: Super admin not found');
      return;
    }

    // Get the ADMIN role
    const adminRole = await prisma.userRoles.findUnique({
      where: { code: 'ADMIN' }
    });

    if (!adminRole) {
      console.error('❌ ADMIN role not found! Please run the seed script first.');
      return;
    }

    const adminUsers = [
      {
        email: 'admin.system@example.com',
        firstName: 'Robert',
        lastName: 'Taylor',
        displayName: 'Robert Taylor',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: adminRole.id
          }
        }
      },
      {
        email: 'admin.academic@example.com',
        firstName: 'Jennifer',
        lastName: 'Lee',
        displayName: 'Jennifer Lee',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: adminRole.id
          }
        }
      }
    ];

    for (const adminData of adminUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: adminData.email }
      });

      if (!existing) {
        await prisma.user.create({ data: adminData });
        console.log(`   ✅ Created: ${adminData.displayName}`);
      } else {
        console.log(`   ⚠️  Already exists: ${adminData.displayName}`);
      }
    }

    console.log('\n🎉 Test Admin users created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 2 Admin users created');
    console.log('\n✅ Ready for Admin testing!\n');

  } catch (error) {
    console.error('❌ Error creating test Admin users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createTestAdmins()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
