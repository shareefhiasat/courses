import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { keycloakId: '79d3cc1c-1257-4b94-8b39-10ee509cfb9e' },
          { email: 'shareef.hiasat@gmail.com' }
        ]
      }
    });

    if (user) {
      console.log('✅ User found in database:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('❌ User NOT found in database');
      console.log('Keycloak ID: 79d3cc1c-1257-4b94-8b39-10ee509cfb9e');
      console.log('Email: shareef.hiasat@gmail.com');
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
