/**
 * Simple test to check if participation types table exists
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTables() {
  try {
    console.log('Testing tables...');
    
    // Test user roles (should work)
    try {
      const userRolesCount = await prisma.userRoles.count();
      console.log('✅ UserRoles count:', userRolesCount);
    } catch (error) {
      console.log('❌ UserRoles error:', error.message);
    }
    
    // Test participation types
    try {
      const participationTypesCount = await prisma.participationTypes.count();
      console.log('✅ ParticipationTypes count:', participationTypesCount);
    } catch (error) {
      console.log('❌ ParticipationTypes error:', error.message);
    }
    
    // Test participations
    try {
      const participationCount = await prisma.participation.count();
      console.log('✅ Participations count:', participationCount);
    } catch (error) {
      console.log('❌ Participations error:', error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTables();
