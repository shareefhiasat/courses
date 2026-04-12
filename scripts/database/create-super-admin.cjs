require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('👤 Creating super admin user...\n');

  try {
    // Get the SUPER_ADMIN role ID
    const superAdminRole = await prisma.userRoles.findUnique({
      where: { code: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      console.error('❌ SUPER_ADMIN role not found! Please run the seed script first.');
      return;
    }

    const superAdminData = {
      email: 'shareef.hiasat@gmail.com',
      firstName: 'Shareef',
      lastName: 'Hiasat',
      displayName: 'Shareef Hiasat',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      roleAssignments: {
        create: {
          roleId: superAdminRole.id
        }
      }
    };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: superAdminData.email },
      include: { 
        roleAssignments: {
          include: {
            role: true
          }
        }
      }
    });

    if (existingUser) {
      console.log('⚠️  Super admin already exists!');
      console.log('\n📋 Existing User Details:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.displayName}`);
      const userRole = existingUser.roleAssignments[0]?.role;
      if (userRole) {
        console.log(`   Role: ${userRole.nameEn} (${userRole.code})`);
        console.log(`   Role ID: ${userRole.id}`);
      }
      console.log(`   Is Active: ${existingUser.isActive}`);
      console.log('\n✅ Super admin is ready for use!\n');
      return;
    }

    // Create super admin
    const user = await prisma.user.create({
      data: superAdminData,
      include: { 
        roleAssignments: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('✅ Super admin created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   First Name: ${user.firstName}`);
    console.log(`   Last Name: ${user.lastName}`);
    const userRole = user.roleAssignments[0]?.role;
    if (userRole) {
      console.log(`   Role: ${userRole.nameEn} (${userRole.code})`);
      console.log(`   Role ID: ${userRole.id}`);
    }
    console.log(`   Is Active: ${user.isActive}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log('\n✅ Super admin is ready for use!\n');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: (Set via Keycloak or your authentication system)`);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createSuperAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
