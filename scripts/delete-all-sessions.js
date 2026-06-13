/**
 * Delete all scheduled sessions from the database
 * Run with: node scripts/delete-all-sessions.js
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function deleteAllSessions() {
  try {
    console.log('Deleting all scheduled sessions...');
    
    const result = await prisma.scheduledSession.deleteMany({});
    
    console.log(`✅ Deleted ${result.count} scheduled sessions`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting sessions:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

deleteAllSessions();
