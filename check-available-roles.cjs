const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAvailableRoles() {
  try {
    const roles = await prisma.userRoles.findMany({
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameAr: true,
        isActive: true
      },
      orderBy: { code: 'asc' }
    });
    
    console.log('🎭 Available Roles:');
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.code} - ${role.nameEn} (${role.nameAr}) - Active: ${role.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailableRoles();
