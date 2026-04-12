/**
 * Check current database state
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  try {
    console.log('Checking database state...\n');
    
    // Check key tables
    const tables = [
      { name: 'users', model: 'user' },
      { name: 'programs', model: 'program' },
      { name: 'subjects', model: 'subject' },
      { name: 'classes', model: 'class' },
      { name: 'participations', model: 'participation' },
      { name: 'participationTypes', model: 'participationTypes' }
    ];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.model].count();
        console.log(`${table.name}: ${count} records`);
      } catch (error) {
        console.log(`${table.name}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('General error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
