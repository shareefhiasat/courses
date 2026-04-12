const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Keep track of what we're deleting
    const collections = [
      'ActivityLog',
      'Attendance',
      'AttendanceSession',
      'Behavior',
      'Bookmark',
      'Chat',
      'Class',
      'Config',
      'Dashboard',
      'DirectRoom',
      'Email',
      'EmailTemplate',
      'Enrollment',
      'File',
      'Gamification',
      'Notification',
      'NotificationLog',
      'Participation',
      'Penalty',
      'Program',
      'Question',
      'QuestionBank',
      'Quiz',
      'QuizResult',
      'QuizSubmission',
      'Resource',
      'Schedule',
      'Subject',
      'SubjectEnrollment',
      'Submission',
      'Template',
      'Activity',
      'Announcement'
    ];

    console.log('📋 Collections to clean:');
    collections.forEach(col => console.log(`   - ${col}`));
    console.log('\n⚠️  Keeping: users collection (super admin only)\n');

    // Delete all records from each collection
    for (const collection of collections) {
      try {
        const modelName = collection.charAt(0).toLowerCase() + collection.slice(1);
        if (prisma[modelName]) {
          const result = await prisma[modelName].deleteMany({});
          console.log(`✅ Deleted ${result.count} records from ${collection}`);
        }
      } catch (error) {
        console.log(`⚠️  Skipped ${collection}: ${error.message}`);
      }
    }

    // Clean users except super admin
    const superAdminEmail = 'shareef.hiasat@gmail.com';
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          not: superAdminEmail
        }
      }
    });
    console.log(`✅ Deleted ${deletedUsers.count} users (kept super admin: ${superAdminEmail})`);

    // Verify super admin exists
    const superAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (superAdmin) {
      console.log('\n✅ Super admin verified:');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Name: ${superAdmin.displayName}`);
      console.log(`   Roles: ${superAdmin.roles.join(', ')}`);
    } else {
      console.log('\n⚠️  WARNING: Super admin not found! You may need to recreate it.');
    }

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📊 Ready for fresh start with Prisma schema sync.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
