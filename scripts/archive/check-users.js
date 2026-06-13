import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const students = await prisma.$queryRaw`SELECT email, "displayName" FROM users WHERE email LIKE '%@military-lms.com'`;
    console.log('Students:', students);
    
    const specificStudent = await prisma.$queryRaw`SELECT email, "displayName" FROM users WHERE email = 'sara.ahmed@military-lms.com'`;
    console.log('Sara Ahmed:', specificStudent);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
