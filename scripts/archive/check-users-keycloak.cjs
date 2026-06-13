const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Get all users with their keycloak status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        keycloakId: true,
        primaryRole: {
          select: {
            id: true,
            code: true,
            nameEn: true
          }
        },
        roleAssignments: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                nameEn: true
              }
            }
          }
        },
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.displayName || 'N/A'}`);
      console.log(`   Keycloak ID: ${user.keycloakId || '❌ MISSING'}`);
      console.log(`   Primary Role: ${user.primaryRole?.code || 'N/A'} (${user.primaryRole?.nameEn || 'N/A'})`);
      
      if (user.roleAssignments && user.roleAssignments.length > 0) {
        console.log(`   All Roles: ${user.roleAssignments.map(ra => ra.role.code).join(', ')}`);
      }
      
      console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Count users without Keycloak IDs
    const usersWithoutKeycloak = users.filter(u => !u.keycloakId);
    console.log(`\n⚠️  ${usersWithoutKeycloak.length} users missing Keycloak IDs:`);
    usersWithoutKeycloak.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.displayName || 'N/A'}`);
    });

    return users;
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkUsers();
