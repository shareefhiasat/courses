import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRoles() {
  try {
    console.log('🔍 Checking user roles...');
    
    // Check all users
    const allUsers = await prisma.$queryRaw`
      SELECT u.id, u.email, u."displayName", array_agg(r.code) as roles
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura."userId"
      LEFT JOIN "user_roles" r ON ura."roleId" = r.id
      GROUP BY u.id, u.email, u."displayName"
      ORDER BY u.id
    `;
    
    console.log('All users and their roles:');
    allUsers.forEach(user => {
      console.log(`  - ${user.displayName} (${user.email}): ${JSON.stringify(user.roles)}`);
    });
    
    // Check student role specifically
    const studentRole = await prisma.$queryRaw`SELECT id, code FROM "user_roles" WHERE code = 'student'`;
    console.log('\nStudent role:', studentRole);
    
    // Check users with student role
    const students = await prisma.$queryRaw`
      SELECT u.id, u.email, u."displayName"
      FROM users u
      JOIN user_role_assignments ura ON u.id = ura."userId"
      JOIN "user_roles" r ON ura."roleId" = r.id
      WHERE r.code = 'student'
      ORDER BY u.id
    `;
    
    console.log('\nUsers with student role:');
    students.forEach(student => {
      console.log(`  - ${student.displayName} (${student.email})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
