const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  try {
    const prisma = new PrismaClient();
    console.log('Prisma client loaded successfully');
    
    // Test if we can access subject model
    const subjectCount = await prisma.subject.count();
    console.log(`Found ${subjectCount} subjects`);
    
    // Try to create a test subject with nameEn/nameAr
    const testSubject = await prisma.subject.create({
      data: {
        nameEn: 'Test Subject EN',
        nameAr: 'Test Subject AR',
        code: 'TEST-001',
        description: 'Test description'
      }
    });
    console.log('Created test subject:', testSubject);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPrisma();
