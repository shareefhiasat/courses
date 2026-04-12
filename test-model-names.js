/**
 * Test to find correct Prisma model names
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testModelNames() {
  try {
    console.log('Testing Prisma model names...');
    
    // Test various possible model names
    const models = [
      'userRoles',
      'subjectTypes', 
      'participationTypes',
      'participations',
      'user_status_types',
      'subject_types',
      'participation_types',
      'participations'
    ];
    
    for (const modelName of models) {
      try {
        const model = prisma[modelName];
        if (model) {
          const count = await model.count();
          console.log(`✅ ${modelName}: ${count} records`);
        } else {
          console.log(`❌ ${modelName}: Model not found`);
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

testModelNames();
