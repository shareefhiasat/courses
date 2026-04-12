import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignUserRoles() {
  try {
    console.log('🌱 Assigning roles to users...');
    
    // Get super admin user ID
    const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    const adminId = superAdmin[0].id;
    console.log(`👑 Using Super Admin ID: ${adminId}`);

    // Assign roles to existing users
    const userRoles = [
      { email: 'shareef.hiasat@gmail.com', roleCode: 'super_admin' },
      { email: 'ahmed.mohammed@military-lms.com', roleCode: 'instructor' },
      { email: 'khalid.alsaadi@military-lms.com', roleCode: 'student' },
      { email: 'fatima.alhashmi@military-lms.com', roleCode: 'student' },
      { email: 'mohammed.alrashid@military-lms.com', roleCode: 'student' },
      { email: 'nora.khalifa@military-lms.com', roleCode: 'student' }
    ];

    for (const userRole of userRoles) {
      await prisma.$queryRaw`
        INSERT INTO user_role_assignments ("userId", "roleId", "assignedBy", "assignedAt") 
        VALUES (
          (SELECT id FROM users WHERE email = ${userRole.email}), 
          (SELECT id FROM "user_roles" WHERE code = ${userRole.roleCode}), 
          ${adminId}, 
          NOW()
        ) 
        ON CONFLICT ("userId", "roleId") DO NOTHING
      `;
      console.log(`  ✅ Assigned ${userRole.roleCode} role to ${userRole.email}`);
    }

    console.log('✅ User roles assigned');
    
    // Verify the assignments
    const verification = await prisma.$queryRaw`
      SELECT u.email, u."displayName", r.code as role
      FROM users u
      JOIN user_role_assignments ura ON u.id = ura."userId"
      JOIN "user_roles" r ON ura."roleId" = r.id
      ORDER BY u.id
    `;
    
    console.log('\n📊 Role assignments:');
    verification.forEach(item => {
      console.log(`  - ${item.displayName} (${item.email}): ${item.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error assigning roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignUserRoles();
