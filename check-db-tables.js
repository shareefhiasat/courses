/**
 * Check database tables directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseTables() {
  try {
    console.log('Checking database tables...');
    
    // Check if participation_types table exists by trying to query it
    try {
      const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'participation_types'`;
      console.log('participation_types table exists:', result.length > 0);
    } catch (error) {
      console.log('Error checking participation_types table:', error.message);
    }
    
    // Check if participations table exists
    try {
      const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'participations'`;
      console.log('participations table exists:', result.length > 0);
    } catch (error) {
      console.log('Error checking participations table:', error.message);
    }
    
    // List all tables
    try {
      const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
      console.log('All tables:');
      result.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } catch (error) {
      console.log('Error listing tables:', error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseTables();
