import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllTypes() {
  try {
    const typeTables = [
      'activity_log_action_types',
      'activity_types', 
      'assessment_types',
      'attendance_status_types',
      'behavior_types',
      'category_types',
      'config_types',
      'enrollment_status_types',
      'participation_types',
      'penalty_types',
      'priority_types',
      'question_difficulty_types',
      'question_types',
      'quiz_status_types',
      'requirement_types',
      'resource_types',
      'schedule_types',
      'subject_types',
      'submission_status_types',
      'target_audience_types',
      'template_types',
      'user_roles',
      'user_status_types'
    ];
    
    console.log('📋 All Type Tables Status:');
    for (const tableName of typeTables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(tableName)}`;
        console.log(`  ${tableName}: ${result[0].count} records`);
      } catch (error) {
        console.log(`  ${tableName}: Error - ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTypes();
