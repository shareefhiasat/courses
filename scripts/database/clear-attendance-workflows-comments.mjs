// Clear attendance, workflows, comments, and notes for testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAttendanceWorkflowsComments() {
  console.log('🗑️  CLEARING ATTENDANCE, WORKFLOWS, COMMENTS, AND NOTES...');
  console.log('===========================================================');
  
  try {
    // Clear in order respecting foreign keys
    const tables = [
      'WorkflowComment',
      'FileComment',
      'WorkflowStatusHistory',
      'WorkflowDocumentAttendance',
      'WorkflowDocument',
      'WorkflowHistory',
      'WorkflowStep',
      'WorkflowInstance',
      'Participation',
      'AttendanceChangeLog',
      'AttendanceAmendment',
      'StandupAttendance',
      'Attendance',
    ];
    
    for (const table of tables) {
      try {
        const result = await prisma[table].deleteMany({});
        console.log(`✅ Cleared ${table}: ${result.count} records`);
      } catch (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 ATTENDANCE, WORKFLOWS, COMMENTS, AND NOTES CLEARED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAttendanceWorkflowsComments();
