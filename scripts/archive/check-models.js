/**
 * Check all available Prisma models
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllModels() {
  try {
    console.log('Available Prisma models:');
    
    // Test specific models we expect to exist
    const expectedModels = [
      'userRoles',
      'userStatusTypes', 
      'enrollmentStatusTypes',
      'subjectTypes',
      'requirementTypes',
      'participationTypes',
      'participations',
      'behaviorTypes',
      'penaltyTypes',
      'priorityTypes',
      'resourceTypes',
      'categoryTypes',
      'questionTypes',
      'targetAudienceTypes',
      'activityTypes',
      'activityLogActionTypes',
      'assessmentTypes',
      'quizStatusTypes',
      'questionDifficultyTypes',
      'scheduleTypes',
      'templateTypes',
      'configTypes',
      'attendanceStatusTypes',
      'submissionStatusTypes',
      'academicTerms',
      'user',
      'program',
      'subject',
      'class',
      'enrollment'
    ];
    
    for (const modelName of expectedModels) {
      try {
        const model = prisma[modelName];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          console.log(`✅ ${modelName}: ${count} records`);
        } else {
          console.log(`❌ ${modelName}: Model not found or no count method`);
        }
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('General error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllModels();
