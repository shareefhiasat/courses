/**
 * Standalone Test Data Seeder for Home Page E2E Tests
 * Run this from client root: node seed-home-data.js
 */

import { addActivity } from './src/services/business/activitiesService.js';
import { getActivities } from './src/services/business/activitiesService.js';
import { getAllQuizzes } from './src/services/business/quizService.js';
import { info, error, warn, debug } from './src/services/utils/logger.js';

async function seedHomePageTestData(options = { force: false }) {
  const { force } = options;
  
  console.log('[TestSeeder] Starting home page test data seeding...');
  
  try {
    // Check existing data
    const existingActivities = await getActivities();
    const existingQuizzes = await getAllQuizzes();
    
    const existingActivityTitles = new Set(
      (existingActivities.data || []).map(a => a.titleEn || a.title)
    );
    
    console.log(`[TestSeeder] Found ${existingActivityTitles.size} existing activities`);
    console.log(`[TestSeeder] Found ${(existingQuizzes.data || []).length} existing quizzes`);
    
    const sampleActivities = [
      {
        titleEn: 'E2E Test Homework',
        titleAr: 'واجب منزلي للاختبار',
        descriptionEn: 'Sample homework for E2E testing',
        descriptionAr: 'واجب منزلي تجريبي للاختبار',
        type: 'HOMEWORK',
        difficulty: 'BEGINNER',
        maxScore: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        show: true,
        optional: false,
        requiresSubmission: true,
        featured: false
      },
      {
        titleEn: 'E2E Test Training',
        titleAr: 'تدريب للاختبار',
        descriptionEn: 'Sample training for E2E testing',
        descriptionAr: 'تدريب تجريبي للاختبار',
        type: 'TRAINING',
        difficulty: 'INTERMEDIATE',
        maxScore: 100,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        show: true,
        optional: false,
        requiresSubmission: false,
        featured: true
      },
      {
        titleEn: 'E2E Test Lab',
        titleAr: 'معمل للاختبار',
        descriptionEn: 'Sample lab for E2E testing',
        descriptionAr: 'معمل تجريبي للاختبار',
        type: 'LAB_AND_PROJECT',
        difficulty: 'ADVANCED',
        maxScore: 100,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        show: true,
        optional: true,
        requiresSubmission: true,
        featured: false
      },
      {
        titleEn: 'E2E Test Quiz',
        titleAr: 'اختبار للاختبار',
        descriptionEn: 'Sample quiz for E2E testing',
        descriptionAr: 'اختبار تجريبي للاختبار',
        type: 'QUIZ',
        difficulty: 'BEGINNER',
        maxScore: 100,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        show: true,
        optional: false,
        requiresSubmission: true,
        featured: true,
        allowRetake: true
      }
    ];
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const activity of sampleActivities) {
      if (!force && existingActivityTitles.has(activity.titleEn)) {
        console.log(`[TestSeeder] ✓ Activity already exists: ${activity.titleEn}`);
        skippedCount++;
        continue;
      }
      
      try {
        const result = await addActivity({
          ...activity,
          programId: '',
          subjectId: '',
          classId: '',
          categoryId: null
        });
        
        if (result.success) {
          console.log(`[TestSeeder] ✓ Created activity: ${activity.titleEn}`);
          createdCount++;
        } else {
          console.warn(`[TestSeeder] ✗ Failed to create activity: ${activity.titleEn}`, result.error);
        }
      } catch (err) {
        console.error(`[TestSeeder] ✗ Error creating activity: ${activity.titleEn}`, err.message);
      }
    }
    
    console.log(`[TestSeeder] Seeding complete: ${createdCount} created, ${skippedCount} skipped`);
    console.log(`[TestSeeder] Total activities: ${existingActivityTitles.size + createdCount}`);
    
    return {
      created: createdCount,
      skipped: skippedCount,
      total: existingActivityTitles.size + createdCount
    };
  } catch (err) {
    console.error('[TestSeeder] Fatal error seeding test data:', err);
    throw err;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  
  seedHomePageTestData({ force })
    .then(() => {
      console.log('[TestSeeder] Done');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[TestSeeder] Failed:', err);
      process.exit(1);
    });
}

export { seedHomePageTestData };
