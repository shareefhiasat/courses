const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 4 },
      select: { 
        id: true, 
        email: true, 
        displayName: true, 
        isActive: true,
        keycloakId: true,
        primaryRole: { select: { id: true, code: true } },
        roleAssignments: { 
          select: { 
            role: { select: { id: true, code: true } } 
          } 
        }
      }
    });
    
    console.log('📊 User Status After Disable Operation:');
    console.log(JSON.stringify(user, null, 2));
    
    // Also check all users to see the overall state
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        keycloakId: true
      }
    });
    
    console.log('\n📋 All Users Status:');
    allUsers.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Active: ${u.isActive}, Keycloak ID: ${u.keycloakId ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStatus();
