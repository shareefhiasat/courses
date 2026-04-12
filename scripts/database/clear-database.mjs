// Clear all database collections
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  CLEARING DATABASE...');
  console.log('========================');
  
  try {
    // Clear all collections in order (respecting foreign keys)
    const collections = [
      'Penalty',
      'Participation', 
      'Activity',
      'Announcement',
      'Enrollment',
      'Attendance',
      'AttendanceSession',
      'File',
      'Notification',
      'Config',
      'Resource',
      'Class',
      'Subject',
      'Program',
      'Category',
      'User'
    ];
    
    for (const collection of collections) {
      try {
        const result = await prisma[collection].deleteMany({});
        console.log(`✅ Cleared ${collection}: ${result.count} records`);
      } catch (error) {
        console.log(`⚠️  ${collection}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 DATABASE CLEARED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
