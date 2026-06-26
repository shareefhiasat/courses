import prisma from './db/prismaClient.js';


async function testModels() {
  try {
    console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key] === 'object'));
    
    // Test if subjectTypes model exists
    if (prisma.subjectTypes) {
      console.log('subjectTypes model exists');
      const count = await prisma.subjectTypes.count();
      console.log('subjectTypes count:', count);
    } else {
      console.log('subjectTypes model does not exist');
    }
    
    // Test if requirementTypes model exists
    if (prisma.requirementTypes) {
      console.log('requirementTypes model exists');
      const count = await prisma.requirementTypes.count();
      console.log('requirementTypes count:', count);
    } else {
      console.log('requirementTypes model does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModels();
