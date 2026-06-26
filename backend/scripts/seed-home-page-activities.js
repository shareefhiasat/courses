/**
 * Seed Home Page Test Data for PostgreSQL
 * Creates sample activities for E2E testing
 * Run: node backend/scripts/seed-home-page-activities.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHomePageActivities() {
  console.log('🌱 Seeding home page test activities...\n');

  try {
    // Get existing data
    const users = await prisma.user.findMany({ take: 1 });
    const classes = await prisma.class.findMany({ take: 1 });
    const activityTypes = await prisma.activityTypes.findMany();

    if (users.length === 0) {
      console.error('❌ No users found. Please seed users first.');
      return;
    }

    if (classes.length === 0) {
      console.error('❌ No classes found. Please seed classes first.');
      return;
    }

    const user = users[0];
    const classData = classes[0];

    // Use existing activity types
    const typeMap = {};
    const typeMapping = {
      'HOMEWORK': 'ASSIGNMENT',
      'TRAINING': 'WORKSHOP',
      'LAB_AND_PROJECT': 'LAB',
      'QUIZ': 'EXAM'
    };

    for (const [testType, dbType] of Object.entries(typeMapping)) {
      const existing = activityTypes.find(t => t.code === dbType);
      if (existing) {
        typeMap[testType] = existing.id;
        console.log(`✓ Mapped ${testType} -> ${dbType} (ID: ${existing.id})`);
      } else {
        console.warn(`⚠ Activity type not found: ${dbType}`);
      }
    }

    // Create sample activities
    const activities = [
      {
        titleEn: 'E2E Test Homework',
        titleAr: 'واجب منزلي للاختبار',
        descriptionEn: 'Sample homework for E2E testing',
        descriptionAr: 'واجب منزلي تجريبي للاختبار',
        typeId: typeMap.HOMEWORK,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        isActive: true,
        allowRetake: false
      },
      {
        titleEn: 'E2E Test Training',
        titleAr: 'تدريب للاختبار',
        descriptionEn: 'Sample training for E2E testing',
        descriptionAr: 'تدريب تجريبي للاختبار',
        typeId: typeMap.TRAINING,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        isActive: true,
        allowRetake: false
      },
      {
        titleEn: 'E2E Test Lab',
        titleAr: 'معمل للاختبار',
        descriptionEn: 'Sample lab for E2E testing',
        descriptionAr: 'معمل تجريبي للاختبار',
        typeId: typeMap.LAB_AND_PROJECT,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        isActive: true,
        allowRetake: false
      },
      {
        titleEn: 'E2E Test Quiz',
        titleAr: 'اختبار للاختبار',
        descriptionEn: 'Sample quiz for E2E testing',
        descriptionAr: 'اختبار تجريبي للاختبار',
        typeId: typeMap.QUIZ,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        isActive: true,
        allowRetake: true
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const activity of activities) {
      const existing = await prisma.activity.findFirst({
        where: { titleEn: activity.titleEn }
      });

      if (existing) {
        console.log(`⊘ Activity already exists: ${activity.titleEn}`);
        skippedCount++;
        continue;
      }

      await prisma.activity.create({
        data: {
          ...activity,
          classId: classData.id,
          createdBy: user.id
        }
      });
      console.log(`✓ Created activity: ${activity.titleEn}`);
      createdCount++;
    }

    console.log(`\n✅ Seeding complete: ${createdCount} created, ${skippedCount} skipped`);
    console.log(`📊 Total activities in database: ${await prisma.activity.count()}`);

  } catch (error) {
    console.error('❌ Error seeding activities:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedHomePageActivities()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
