require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

async function testSuperAdmin() {
  console.log('🧪 Testing super admin ID retrieval...');
  
  const superAdminId = await getSuperAdminId();
  console.log('Super Admin ID:', superAdminId);
  
  // Get the super admin user
  const superAdmin = await prisma.user.findFirst({
    where: {
      roleAssignments: {
        some: {
          role: {
            code: 'SUPER_ADMIN'
          }
        }
      }
    }
  });
  
  console.log('Super Admin Email:', superAdmin.email);
  console.log('✅ Test completed successfully!');
}

testSuperAdmin()
  .catch(console.error)
  .finally(() => process.exit(0));
