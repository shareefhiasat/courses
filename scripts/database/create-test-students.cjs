require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

async function createTestStudents() {
  console.log('�‍🎓 Creating test students...');

  try {
    // Get super admin ID for createdBy
    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error('❌ Cannot create students: Super admin not found');
      return;
    }

    // Get student role
    const studentRole = await prisma.userRoles.findFirst({
      where: { code: 'STUDENT' }
    });

    if (!studentRole) {
      console.error('❌ Student role not found!');
      return;
    }

    const students = [
      {
        email: 'student1@example.com',
        firstName: 'Ahmed',
        lastName: 'Mohammed',
        displayName: 'Ahmed Mohammed',
        studentNumber: 'STU001',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: studentRole.id
          }
        }
      },
      {
        email: 'student2@example.com',
        firstName: 'Fatima',
        lastName: 'Ali',
        displayName: 'Fatima Ali',
        studentNumber: 'STU002',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: studentRole.id
          }
        }
      },
      {
        email: 'student3@example.com',
        firstName: 'Mohammed',
        lastName: 'Khalid',
        displayName: 'Mohammed Khalid',
        studentNumber: 'STU003',
        isActive: true,
        createdBy: superAdminId,
        roleAssignments: {
          create: {
            roleId: studentRole.id
          }
        }
      }
    ];

    for (const studentData of students) {
      const existing = await prisma.user.findUnique({
        where: { email: studentData.email }
      });

      if (!existing) {
        // First create the user without role assignment
        const { roleAssignments, ...userData } = studentData;
        const user = await prisma.user.create({
          data: userData
        });
        
        // Then create the role assignment
        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            roleId: studentRole.id
          }
        });
        
        console.log(`   Created: ${studentData.displayName}`);
      } else {
        // Check if the user has the correct role
        const hasStudentRole = await prisma.userRoleAssignment.findFirst({
          where: {
            userId: existing.id,
            roleId: studentRole.id
          }
        });
        
        if (!hasStudentRole) {
          await prisma.userRoleAssignment.create({
            data: {
              userId: existing.id,
              roleId: studentRole.id
            }
          });
          console.log(`   Added student role to: ${existing.displayName}`);
        } else {
          console.log(`   Already exists: ${existing.displayName}`);
        }
      }
    }

    console.log('\n Test students created successfully!');
    console.log('\n Summary:');
    console.log('   - 3 Students created');
    console.log('\n System is ready for testing!\n');
    console.log('\n✅ System is ready for testing!\n');

  } catch (error) {
    console.error('❌ Error creating test students:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createTestStudents()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
