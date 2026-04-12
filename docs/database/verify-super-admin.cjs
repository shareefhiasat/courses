const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySuperAdmin() {
  console.log('🔍 Verifying super admin user...\n');

  try {
    const superAdminEmail = 'shareef.hiasat@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (user) {
      console.log('✅ Super admin found!');
      console.log('\n📋 User Details:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.displayName}`);
      console.log(`   First Name: ${user.firstName}`);
      console.log(`   Last Name: ${user.lastName}`);
      console.log(`   Roles: ${user.roles.join(', ')}`);
      console.log(`   Is Admin: ${user.isAdmin}`);
      console.log(`   Is Super Admin: ${user.isSuperAdmin}`);
      console.log(`   Is Instructor: ${user.isInstructor}`);
      console.log(`   Is Student: ${user.isStudent}`);
      console.log(`   Created At: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLoginAt}`);
      console.log(`   Login Count: ${user.loginCount}`);
      console.log('\n✅ Super admin is ready for use!\n');
    } else {
      console.log('❌ Super admin NOT found!');
      console.log('\n⚠️  You need to create the super admin user.');
      console.log('\nRun this MongoDB command:');
      console.log(`
db.users.insertOne({
  email: "shareef.hiasat@gmail.com",
  firstName: "Shareef",
  lastName: "Hiasat",
  displayName: "Shareef Hiasat",
  isAdmin: true,
  isSuperAdmin: true,
  isInstructor: true,
  isStudent: false,
  isHR: false,
  isDisabled: false,
  disabled: false,
  roles: ["super-admin", "admin", "instructor"],
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  loginCount: 0,
  theme: "light",
  language: "en",
  timezone: "UTC",
  emailVerified: true,
  phoneVerified: false,
  twoFactorEnabled: false,
  sessionTimeout: 3600,
  failedLoginAttempts: 0
});
      `);
    }

  } catch (error) {
    console.error('❌ Error verifying super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifySuperAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
