require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAndResetAll() {
  console.log('🧹 Clearing all data and resetting auto-increment counters...\n');

  try {
    // Get all table names from Prisma metadata
    const tableNames = [
      // User-related tables
      'roleAssignments',
      'enrollments',
      'penalties',
      'participations',
      'behaviors',
      'users',
      
      // Academic tables
      'class',
      'subjects',
      'programs',
      
      // Content tables
      'resources',
      'announcements',
      
      // Lookup tables (keep these for reference)
      // We'll clear lookup tables last
      'helpItems',
      
      // All other lookup tables
      'userRoles',
      'userStatusTypes',
      'enrollmentStatusTypes',
      'subjectTypes',
      'requirementTypes',
      'penaltyTypes',
      'behaviorTypes',
      'priorityTypes',
      'resourceTypes',
      'categoryTypes',
      'questionTypes',
      'targetAudienceTypes',
      'participationTypes',
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
      'academicTerms'
    ];

    // Disable foreign key constraints temporarily
    await prisma.$executeRaw`SET session_replication_role = replica;`;

    // Clear all tables in reverse order of dependencies
    for (const tableName of tableNames.reverse()) {
      try {
        console.log(`🗑️  Clearing table: ${tableName}`);
        await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
        
        // Reset auto-increment counter
        console.log(`🔄 Resetting auto-increment for: ${tableName}`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH 1;`);
        
        console.log(`✅ Cleared and reset: ${tableName}\n`);
      } catch (error) {
        // Some tables might not exist or have different sequence names
        console.log(`⚠️  Note for ${tableName}: ${error.message}\n`);
      }
    }

    // Re-enable foreign key constraints
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;

    console.log('🎉 All data cleared and auto-increment counters reset!');
    console.log('\n✅ Database is now clean and ready for fresh seeding.\n');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

// Run the function
clearAndResetAll()
  .catch(console.error)
  .finally(() => process.exit(0));
