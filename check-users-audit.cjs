const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    // Check all users with their keycloak IDs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        keycloakId: true,
        createdBy: true,
        updatedBy: true
      },
      orderBy: { id: 'asc' }
    });

    console.log('👥 All Users:');
    users.forEach((user) => {
      console.log(`ID: ${user.id}, Email: ${user.email}, KeycloakID: ${user.keycloakId}, CreatedBy: ${user.createdBy}, UpdatedBy: ${user.updatedBy}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
