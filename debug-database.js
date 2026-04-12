import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database state...\n');
    
    // Check if programs exist
    const programs = await prisma.$queryRaw`SELECT * FROM programs LIMIT 3`;
    console.log('📚 Programs:');
    if (programs.length === 0) {
      console.log('  No programs found - this is the root issue!');
    } else {
      programs.forEach(p => {
        console.log(`  - ${p.nameEn} (${p.code}) - ID: ${p.id}`);
      });
    }
    
    // Check if subject_types exist
    const subjectTypes = await prisma.$queryRaw`SELECT * FROM subject_types LIMIT 3`;
    console.log('\n📖 Subject Types:');
    if (subjectTypes.length === 0) {
      console.log('  No subject types found!');
    } else {
      subjectTypes.forEach(st => {
        console.log(`  - ${st.nameEn} (${st.code}) - ID: ${st.id}`);
      });
    }
    
    // Check if requirement_types exist
    const requirementTypes = await prisma.$queryRaw`SELECT * FROM requirement_types LIMIT 3`;
    console.log('\n📋 Requirement Types:');
    if (requirementTypes.length === 0) {
      console.log('  No requirement types found!');
    } else {
      requirementTypes.forEach(rt => {
        console.log(`  - ${rt.nameEn} (${rt.code}) - ID: ${rt.id}`);
      });
    }
    
    // Check if users exist
    const users = await prisma.$queryRaw`SELECT id, email, "displayName" FROM users LIMIT 3`;
    console.log('\n👥 Users:');
    if (users.length === 0) {
      console.log('  No users found!');
    } else {
      users.forEach(u => {
        console.log(`  - ${u.displayName} (${u.email}) - ID: ${u.id}`);
      });
    }
    
    // Try to manually create a program to see what happens
    console.log('\n🌱 Attempting to create a program manually...');
    try {
      await prisma.$queryRaw`
        INSERT INTO programs (code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours", "isActive", "createdAt", "updatedAt") 
        VALUES ('TEST-PROG', 'Test Program', 'برنامج اختبار', 'Test description', 'وصف اختبار', 4, 2.5, 140, true, NOW(), NOW())
      `;
      console.log('  ✅ Test program created successfully');
      
      // Check if it was actually created
      const testProgram = await prisma.$queryRaw`SELECT * FROM programs WHERE code = 'TEST-PROG'`;
      if (testProgram.length > 0) {
        console.log(`  ✅ Confirmed: Test program exists with ID: ${testProgram[0].id}`);
      } else {
        console.log('  ❌ Test program was not created despite no error');
      }
    } catch (error) {
      console.log('  ❌ Error creating test program:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();
