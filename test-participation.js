/**
 * Simple test script to create participation data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test participation data...');
    
    // First create some participation types
    const positiveType = await prisma.participationTypes.create({
      data: {
        code: 'POSITIVE',
        nameEn: 'Positive Participation',
        nameAr: 'مشاركة إيجابية',
        isPositive: true,
        createdBy: 1
      }
    });
    
    const negativeType = await prisma.participationTypes.create({
      data: {
        code: 'NEGATIVE',
        nameEn: 'Negative Participation',
        nameAr: 'مشاركة سلبية',
        isPositive: false,
        createdBy: 1
      }
    });
    
    console.log('Created participation types:', { positiveType, negativeType });
    
    // Create some users if they don't exist
    let testUser = await prisma.user.findFirst({
      where: { email: 'shareef.hiasat@gmail.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          displayName: 'Shareef Hiasat',
          email: 'shareef.hiasat@gmail.com',
          isActive: true,
          createdBy: 1
        }
      });
      console.log('Created test user:', testUser);
    }
    
    // Create some participations
    const participation1 = await prisma.participation.create({
      data: {
        userId: testUser.id,
        typeId: positiveType.id,
        points: 5,
        comment: 'Great participation in class discussion',
        createdBy: 1,
        updatedBy: 1
      }
    });
    
    const participation2 = await prisma.participation.create({
      data: {
        userId: testUser.id,
        typeId: negativeType.id,
        points: -2,
        comment: 'Late to class',
        createdBy: 1,
        updatedBy: 1
      }
    });
    
    console.log('Created participations:', { participation1, participation2 });
    
    // Test query
    const allParticipations = await prisma.participation.findMany({
      include: {
        user: true,
        participationType: true
      }
    });
    
    console.log('All participations:', allParticipations);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
