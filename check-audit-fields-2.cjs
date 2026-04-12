const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuditFields() {
  try {
    // Check current state of user 4
    const user = await prisma.user.findUnique({
      where: { id: 4 },
      select: {
        id: true,
        email: true,
        displayName: true,
        updatedBy: true,
        updatedAt: true
      }
    });
    
    console.log('📊 Current User 4 Status:');
    console.log(`ID: ${user?.id}`);
    console.log(`Email: ${user?.email}`);
    console.log(`Display Name: ${user?.displayName}`);
    console.log(`Updated By: ${user?.updatedBy}`);
    console.log(`Updated At: ${user?.updatedAt}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditFields();
