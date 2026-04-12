/**
 * Create user roles in PostgreSQL database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUserRoles() {
  try {
    console.log('🏷️ Creating user roles in PostgreSQL...');
    
    const roles = [
      { code: 'super_admin', nameEn: 'Super Admin', nameAr: 'مدير عام', level: 5, description: 'Super Administrator with full access' },
      { code: 'admin', nameEn: 'Admin', nameAr: 'مدير', level: 4, description: 'Administrator with management access' },
      { code: 'hr', nameEn: 'HR', nameAr: 'الموارد البشرية', level: 3, description: 'Human Resources staff' },
      { code: 'instructor', nameEn: 'Instructor', nameAr: 'مدرب', level: 2, description: 'Course instructor' },
      { code: 'student', nameEn: 'Student', nameAr: 'طالب', level: 1, description: 'Student user' }
    ];
    
    for (const role of roles) {
      try {
        const existingRole = await prisma.userRoles.findUnique({
          where: { code: role.code }
        });
        
        if (existingRole) {
          console.log(`ℹ️ Role '${role.code}' already exists`);
        } else {
          const createdRole = await prisma.userRoles.create({
            data: role
          });
          console.log(`✅ Role '${role.code}' created with ID: ${createdRole.id}`);
        }
      } catch (error) {
        console.log(`⚠️ Error creating role '${role.code}': ${error.message}`);
      }
    }
    
    // List all roles
    const allRoles = await prisma.userRoles.findMany({
      orderBy: { level: 'desc' }
    });
    
    console.log('\n📋 All available roles:');
    allRoles.forEach(role => {
      console.log(`  ${role.id}: ${role.code} - ${role.nameEn} (${role.level})`);
    });
    
    console.log('\n🎉 User roles setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUserRoles();
