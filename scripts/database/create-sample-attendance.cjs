require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

// Helper to generate attendance records for past 60 days
function generateAttendanceRecords(daysBack = 60) {
  const records = [];
  const statuses = ['present', 'late', 'absent', 'absent_with_excuse'];
  const weights = [70, 15, 10, 5]; // Weighted distribution: mostly present

  for (let i = 0; i < daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Weighted random status selection
    const random = Math.random() * 100;
    let cumulative = 0;
    let status = 'present';
    
    for (let j = 0; j < weights.length; j++) {
      cumulative += weights[j];
      if (random < cumulative) {
        status = statuses[j];
        break;
      }
    }

    records.push({
      date: date, // Use Date object for Prisma DateTime
      status,
    });
  }

  return records;
}

async function createSampleAttendance() {
  console.log('📋 Creating sample attendance records...\n');

  try {
    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error('❌ Cannot create attendance: Super admin not found');
      return;
    }

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: true,
        class: {
          include: {
            subject: true,
          }
        }
      }
    });

    console.log(`Found ${enrollments.length} enrollments to create attendance for`);

    let created = 0;

    for (const enrollment of enrollments) {
      // Generate 60 days of attendance records
      const attendanceRecords = generateAttendanceRecords(60);

      for (const record of attendanceRecords) {
        // Check if attendance already exists for this date
        const existing = await prisma.attendance.findFirst({
          where: {
            userId: enrollment.userId,
            classId: enrollment.classId,
            date: record.date,
          }
        });

        if (existing) continue;

        await prisma.attendance.create({
          data: {
            userId: enrollment.userId,
            classId: enrollment.classId,
            subjectId: enrollment.subjectId,
            date: record.date,
            status: record.status,
            markedBy: superAdminId,
            createdBy: superAdminId,
          }
        });

        created++;
      }

      console.log(`   ✅ Created ${attendanceRecords.length} attendance records for ${enrollment.user.displayName} in ${enrollment.class.nameEn}`);
    }

    console.log(`\n✅ Created ${created} total attendance records`);

  } catch (error) {
    console.error('❌ Error creating sample attendance:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSampleAttendance();
