import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkParticipationTypes() {
  try {
    console.log('🔍 Checking participation types in database...');
    
    const types = await prisma.$queryRaw`SELECT id, code, "nameEn", "nameAr", "isPositive" FROM participation_types ORDER BY id`;
    
    console.log('Available participation types:');
    types.forEach(type => {
      console.log(`  - ID: ${type.id}, Code: ${type.code}, Name: ${type.nameEn} (${type.nameAr}), Positive: ${type.isPositive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParticipationTypes();
