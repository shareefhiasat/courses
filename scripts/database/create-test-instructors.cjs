require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

async function createTestInstructors() {
  console.log('👨‍🏫 Creating test instructors...\n');

  try {
    // Get super admin ID for createdBy
    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error('❌ Cannot create instructors: Super admin not found');
      return;
    }

    // Get instructor role
    const instructorRole = await prisma.userRoles.findFirst({
      where: { code: 'INSTRUCTOR' }
    });

    if (!instructorRole) {
      console.error('❌ Instructor role not found!');
      return;
    }

    const instructors = [
      {
        email: 'instructor1@example.com',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        displayName: 'Dr. Sarah Johnson',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: instructorRole.id
          }
        }
      },
      {
        email: 'instructor2@example.com',
        firstName: 'Prof. Michael',
        lastName: 'Chen',
        displayName: 'Prof. Michael Chen',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: instructorRole.id
          }
        }
      },
      {
        email: 'instructor3@example.com',
        firstName: 'Dr. Emily',
        lastName: 'Williams',
        displayName: 'Dr. Emily Williams',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: instructorRole.id
          }
        }
      }
    ];

    for (const instructorData of instructors) {
      const existing = await prisma.user.findUnique({
        where: { email: instructorData.email }
      });

      if (!existing) {
        await prisma.user.create({ data: instructorData });
        console.log(`   ✅ Created: ${instructorData.displayName}`);
      } else {
        console.log(`   ⚠️  Already exists: ${instructorData.displayName}`);
      }
    }

    console.log('\n🎉 Test instructors created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 3 Instructors created');
    console.log('\n✅ Ready for instructor testing!\n');

  } catch (error) {
    console.error('❌ Error creating test instructors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createTestInstructors()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
