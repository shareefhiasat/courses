/**
 * Test Data Seeder for Home Page Tests
 * Creates sample activities, quizzes, and resources for E2E testing
 */

import { addActivity } from '@services/business/activitiesService';
import { getAllQuizzes } from '@services/business/quizService';
import { getActivities } from '@services/business/activitiesService';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Create sample test activities if they don't exist
 * @param {Object} options - Configuration options
 * @param {boolean} options.force - Force recreate even if exists
 * @returns {Promise<Object>} Created activities data
 */
export async function seedHomePageTestData(options = { force: false }) {
  const { force } = options;
  
  try {
    // Check existing data
    const existingActivities = await getActivities();
    const existingQuizzes = await getAllQuizzes();
    
    const existingActivityTitles = new Set(
      (existingActivities.data || []).map(a => a.titleEn || a.title)
    );
    
    const sampleActivities = [
      {
        titleEn: 'Test Homework Activity',
        titleAr: 'نشاط واجب منزلي تجريبي',
        descriptionEn: 'Sample homework for testing',
        descriptionAr: 'واجب منزلي تجريبي للاختبار',
        type: 'HOMEWORK',
        difficulty: 'BEGINNER',
        maxScore: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        show: true,
        optional: false,
        requiresSubmission: true,
        featured: false
      },
      {
        titleEn: 'Test Training Activity',
        titleAr: 'نشاط تدريبي تجريبي',
        descriptionEn: 'Sample training for testing',
        descriptionAr: 'تدريب تجريبي للاختبار',
        type: 'TRAINING',
        difficulty: 'INTERMEDIATE',
        maxScore: 100,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        show: true,
        optional: false,
        requiresSubmission: false,
        featured: true
      },
      {
        titleEn: 'Test Lab Activity',
        titleAr: 'نشاط معمل تجريبي',
        descriptionEn: 'Sample lab for testing',
        descriptionAr: 'معمل تجريبي للاختبار',
        type: 'LAB_AND_PROJECT',
        difficulty: 'ADVANCED',
        maxScore: 100,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
        show: true,
        optional: true,
        requiresSubmission: true,
        featured: false
      },
      {
        titleEn: 'Test Quiz Activity',
        titleAr: 'اختبار تجريبي',
        descriptionEn: 'Sample quiz for testing',
        descriptionAr: 'اختبار تجريبي للاختبار',
        type: 'QUIZ',
        difficulty: 'BEGINNER',
        maxScore: 100,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        show: true,
        optional: false,
        requiresSubmission: true,
        featured: true,
        allowRetake: true
      }
    ];
    
    const createdActivities = [];
    
    for (const activity of sampleActivities) {
      if (!force && existingActivityTitles.has(activity.titleEn)) {
        debug('[TestSeeder] Activity already exists:', activity.titleEn);
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
          createdActivities.push(result.data);
          info('[TestSeeder] Created activity:', activity.titleEn);
        } else {
          warn('[TestSeeder] Failed to create activity:', activity.titleEn, result.error);
        }
      } catch (err) {
        error('[TestSeeder] Error creating activity:', activity.titleEn, err);
      }
    }
    
    return {
      activities: createdActivities,
      totalActivities: existingActivities.data?.length || 0,
      totalQuizzes: existingQuizzes.data?.length || 0
    };
  } catch (err) {
    error('[TestSeeder] Error seeding test data:', err);
    throw err;
  }
}

/**
 * Clean up test data (optional)
 * @param {Array} activityIds - IDs of activities to delete
 */
export async function cleanupTestData(activityIds = []) {
  // Implementation for cleanup if needed
  // For now, we'll leave test data in place for debugging
  warn('[TestSeeder] Cleanup not implemented - test data left in place');
}
