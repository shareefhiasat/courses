import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCheck() {
  try {
    const users = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    const programs = await prisma.$queryRaw`SELECT COUNT(*) as count FROM programs`;
    const subjects = await prisma.$queryRaw`SELECT COUNT(*) as count FROM subjects`;
    const classes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM classes`;
    const enrollments = await prisma.$queryRaw`SELECT COUNT(*) as count FROM enrollments`;
    const participations = await prisma.$queryRaw`SELECT COUNT(*) as count FROM participations`;
    const participationTypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM participation_types`;
    const userRoles = await prisma.$queryRaw`SELECT COUNT(*) as count FROM user_roles`;
    const userStatusTypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM user_status_types`;
    const enrollmentStatusTypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM enrollment_status_types`;
    
    console.log('📋 Final Database State:');
    console.log(`  Users: ${users[0].count}`);
    console.log(`  Programs: ${programs[0].count}`);
    console.log(`  Subjects: ${subjects[0].count}`);
    console.log(`  Classes: ${classes[0].count}`);
    console.log(`  Enrollments: ${enrollments[0].count}`);
    console.log(`  Participations: ${participations[0].count}`);
    console.log(`  Participation Types: ${participationTypes[0].count}`);
    console.log(`  User Roles: ${userRoles[0].count}`);
    console.log(`  User Status Types: ${userStatusTypes[0].count}`);
    console.log(`  Enrollment Status Types: ${enrollmentStatusTypes[0].count}`);
    
    // Show super admin
    const superAdmin = await prisma.$queryRaw`SELECT email, "displayName" FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    console.log(`\n👑 Super Admin: ${superAdmin[0].displayName} (${superAdmin[0].email})`);
    
    // Show sample users
    const sampleUsers = await prisma.$queryRaw`SELECT email, "displayName" FROM users ORDER BY id LIMIT 3`;
    console.log('\n👥 Sample Users:');
    sampleUsers.forEach(user => {
      console.log(`  - ${user.displayName} (${user.email})`);
    });
    
    // Show sample participations
    try {
      const sampleParticipations = await prisma.$queryRaw`
        SELECT p.points, pt.code as type_code, u."displayName", c.code as class_code 
        FROM participations p 
        JOIN participation_types pt ON p.typeId = pt.id 
        JOIN users u ON p.userId = u.id 
        JOIN classes c ON p.classId = c.id 
        LIMIT 3
      `;
      console.log('\n📊 Sample Participations:');
      sampleParticipations.forEach(p => {
        console.log(`  - ${p.displayName} in ${p.class_code}: ${p.type_code} (${p.points} points)`);
      });
    } catch (error) {
      console.log('\n📊 Sample Participations: No participations found or error');
    }
    
    // Show programs
    const programList = await prisma.$queryRaw`SELECT code, "nameEn" FROM programs ORDER BY id`;
    console.log('\n📚 Programs:');
    programList.forEach(program => {
      console.log(`  - ${program.nameEn} (${program.code})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalCheck();
