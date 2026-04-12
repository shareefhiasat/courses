require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateClassInstructors() {
  console.log('👨‍🏫 Updating class instructors...\n');

  try {
    // Get instructors and classes
    const instructors = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: {
            role: {
              code: 'INSTRUCTOR'
            }
          }
        }
      }
    });

    const classes = await prisma.class.findMany({
      where: {
        instructorId: null
      }
    });

    if (instructors.length === 0) {
      console.log('❌ No instructors found!');
      return;
    }

    if (classes.length === 0) {
      console.log('✅ All classes already have instructors assigned!');
      return;
    }

    // Update classes with instructors
    for (let i = 0; i < classes.length; i++) {
      const classData = classes[i];
      const instructorIndex = i % instructors.length;
      const instructor = instructors[instructorIndex];

      await prisma.class.update({
        where: { id: classData.id },
        data: { 
          instructorId: instructor.id,
          ownerEmail: instructor.email
        }
      });

      console.log(`   ✅ Updated: ${classData.nameEn} → ${instructor.displayName}`);
    }

    console.log('\n🎉 Class instructors updated successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - ${classes.length} classes updated`);
    console.log(`   - ${instructors.length} instructors assigned`);

  } catch (error) {
    console.error('❌ Error updating class instructors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateClassInstructors()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
