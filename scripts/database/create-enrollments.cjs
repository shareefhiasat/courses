require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

async function createEnrollments() {
  console.log('📝 Creating student enrollments...\n');

  try {
    // Get super admin ID for createdBy
    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error('❌ Cannot create enrollments: Super admin not found');
      return;
    }

    // Get students and classes
    const students = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: {
            role: {
              code: 'STUDENT'
            }
          }
        }
      }
    });

    const classes = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        program: true,
        subject: true
      }
    });

    const enrollmentStatus = await prisma.enrollmentStatusTypes.findUnique({
      where: { code: 'ENROLLED' }
    });

    if (!enrollmentStatus) {
      console.error('❌ ENROLLED status not found!');
      return;
    }

    console.log(`Found ${students.length} students and ${classes.length} classes`);

    // Enroll students in classes
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      // Assign each student to a class
      const classIndex = i % classes.length;
      const assignedClass = classes[classIndex];

      const existing = await prisma.enrollment.findFirst({
        where: {
          userId: student.id,
          classId: assignedClass.id
        }
      });

      if (!existing) {
        await prisma.enrollment.create({
          data: {
            userId: student.id,
            programId: assignedClass.programId,
            subjectId: assignedClass.subjectId,
            classId: assignedClass.id,
            statusId: enrollmentStatus.id,
            createdBy: superAdminId
          }
        });
        console.log(`   ✅ Enrolled ${student.displayName} in ${assignedClass.nameEn}`);
      } else {
        console.log(`   ⚠️  ${student.displayName} already enrolled in ${assignedClass.nameEn}`);
      }
    }

    console.log('\n🎉 Student enrollments created successfully!');
    console.log('\n✅ System is fully ready for testing!\n');

  } catch (error) {
    console.error('❌ Error creating enrollments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createEnrollments()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
