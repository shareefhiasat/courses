require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAdminUserToDatabase() {
  try {
    console.log('🔧 Adding admin Keycloak user to database...\n');

    // Get SUPER_ADMIN role
    const superAdminRole = await prisma.userRoles.findUnique({
      where: { code: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      console.error('❌ SUPER_ADMIN role not found!');
      return;
    }

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { keycloakId: '47bce160-7c70-4bea-a7fc-dd5af40a12ea' }
    });

    if (existingUser) {
      console.log('✅ Admin user already exists in database');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Keycloak ID: ${existingUser.keycloakId}`);
      return existingUser;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@keycloak.local',
        firstName: 'Keycloak',
        lastName: 'Admin',
        displayName: 'Keycloak Admin',
        keycloakId: '47bce160-7c70-4bea-a7fc-dd5af40a12ea',
        isActive: true,
        roleAssignments: {
          create: {
            roleId: superAdminRole.id
          }
        }
      }
    });

    console.log('✅ Admin user created successfully');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Keycloak ID: ${adminUser.keycloakId}`);
    console.log(`   Role: SUPER_ADMIN`);

    return adminUser;

  } catch (error) {
    console.error('❌ Error adding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminUserToDatabase();
