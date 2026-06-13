/**
 * Simple test to check Prisma client for participations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testParticipation() {
  try {
    console.log('Testing Prisma client...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Test participation types table
    try {
      const participationTypesCount = await prisma.participationTypes.count();
      console.log('Participation types count:', participationTypesCount);
    } catch (error) {
      console.error('Error with participationTypes:', error.message);
    }
    
    // Test participations table
    try {
      const participationCount = await prisma.participation.count();
      console.log('Participation count:', participationCount);
    } catch (error) {
      console.error('Error with participations:', error.message);
    }
    
    // Test classes table (should work)
    try {
      const classCount = await prisma.class.count();
      console.log('Class count:', classCount);
    } catch (error) {
      console.error('Error with classes:', error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testParticipation();
