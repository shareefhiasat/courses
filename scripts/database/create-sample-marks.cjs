require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

// Helper to generate realistic marks based on student performance tier
function generateMarks(tier = 'average') {
  const tiers = {
    excellent: { mid: [85, 100], final: [85, 100], homework: [90, 100], labs: [85, 100], quizzes: [85, 100], participation: [8, 10], attendance: [9, 10] },
    good: { mid: [70, 84], final: [70, 84], homework: [75, 89], labs: [70, 84], quizzes: [70, 84], participation: [6, 8], attendance: [7, 9] },
    average: { mid: [60, 69], final: [60, 69], homework: [60, 74], labs: [60, 69], quizzes: [60, 69], participation: [5, 7], attendance: [6, 8] },
    weak: { mid: [50, 59], final: [50, 59], homework: [50, 59], labs: [50, 59], quizzes: [50, 59], participation: [3, 5], attendance: [4, 6] },
  };

  const range = tiers[tier];
  const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  return {
    midTermExam: randomInRange(...range.mid),
    finalExam: randomInRange(...range.final),
    homework: randomInRange(...range.homework),
    labsProjectResearch: randomInRange(...range.labs),
    quizzes: randomInRange(...range.quizzes),
    participation: randomInRange(...range.participation),
    attendance: randomInRange(...range.attendance),
  };
}

async function createSampleMarks() {
  console.log('📊 Creating sample student marks...\n');

  try {
    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error('❌ Cannot create marks: Super admin not found');
      return;
    }

    // Get all enrollments with student and class info
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: true,
        class: {
          include: {
            subject: true,
            program: true,
          }
        }
      }
    });

    console.log(`Found ${enrollments.length} enrollments to create marks for`);

    // Performance tiers for variety
    const tiers = ['excellent', 'good', 'average', 'weak'];
    let created = 0;

    for (const enrollment of enrollments) {
      // Check if marks already exist
      const existing = await prisma.studentMarks.findFirst({
        where: {
          userId: enrollment.userId,
          classId: enrollment.classId,
          subjectId: enrollment.subjectId,
        }
      });

      if (existing) {
        console.log(`   ⚠️  Marks already exist for ${enrollment.user.displayName} in ${enrollment.class.nameEn}`);
        continue;
      }

      // Assign random performance tier
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const marks = generateMarks(tier);

      // Calculate total marks
      const totalMarks = marks.midTermExam + marks.finalExam + marks.homework + 
                        marks.labsProjectResearch + marks.quizzes + marks.participation + marks.attendance;

      await prisma.studentMarks.create({
        data: {
          userId: enrollment.userId,
          classId: enrollment.classId,
          subjectId: enrollment.subjectId,
          midTermExam: marks.midTermExam,
          finalExam: marks.finalExam,
          homework: marks.homework,
          labsProjectResearch: marks.labsProjectResearch,
          quizzes: marks.quizzes,
          participation: marks.participation,
          attendance: marks.attendance,
          totalMarks,
          createdBy: superAdminId,
          updatedBy: superAdminId,
        }
      });

      created++;
      console.log(`   ✅ Created marks for ${enrollment.user.displayName} in ${enrollment.class.nameEn} (${tier}, total: ${totalMarks})`);
    }

    console.log(`\n✅ Created ${created} student marks records`);

  } catch (error) {
    console.error('❌ Error creating sample marks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSampleMarks();
