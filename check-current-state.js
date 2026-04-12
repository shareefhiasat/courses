/**
 * Check current database state
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentState() {
  try {
    console.log('🔍 Checking current database state...\n');
    
    const tables = [
      { name: 'userRoles', model: 'userRoles' },
      { name: 'userStatusTypes', model: 'userStatusTypes' },
      { name: 'enrollmentStatusTypes', model: 'enrollmentStatusTypes' },
      { name: 'subjectTypes', model: 'subjectTypes' },
      { name: 'requirementTypes', model: 'requirementTypes' },
      { name: 'participationTypes', model: 'participationTypes' },
      { name: 'users', model: 'user' },
      { name: 'programs', model: 'program' },
      { name: 'subjects', model: 'subject' },
      { name: 'classes', model: 'class' },
      { name: 'enrollments', model: 'enrollment' },
      { name: 'participations', model: 'participation' }
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

checkCurrentState();
