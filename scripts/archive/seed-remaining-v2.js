import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRemaining() {
  try {
    console.log('🚀 Seeding remaining data...\n');

    // 1. Programs (check if they exist first)
    console.log('🌱 Checking programs...');
    const programCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM programs`;
    console.log(`  Programs already exist: ${programCount[0].count}`);

    // 2. Subjects
    console.log('\n🌱 Creating subjects...');
    try {
      await prisma.$queryRaw`INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdAt", "updatedAt") VALUES ('CS101', 'Introduction to Programming', 'مقدمة في البرمجة', 4, (SELECT id FROM programs WHERE code = 'CS-ENG'), (SELECT id FROM subject_types WHERE code = 'CORE'), (SELECT id FROM requirement_types WHERE code = 'MANDATORY'), 'Fundamentals of programming using Python and problem-solving techniques', 'أساسيات البرمجة باستخدام بايثون وتقنيات حل المشكلات', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdAt", "updatedAt") VALUES ('CS102', 'Data Structures and Algorithms', 'هياكل البيانات والخوارزميات', 4, (SELECT id FROM programs WHERE code = 'CS-ENG'), (SELECT id FROM subject_types WHERE code = 'CORE'), (SELECT id FROM requirement_types WHERE code = 'MANDATORY'), 'Advanced data structures and algorithm design and analysis', 'هياكل البيانات المتقدمة وتصميم وتحليل الخوارزميات', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdAt", "updatedAt") VALUES ('CS201', 'Database Systems', 'أنظمة قواعد البيانات', 3, (SELECT id FROM programs WHERE code = 'CS-ENG'), (SELECT id FROM subject_types WHERE code = 'CORE'), (SELECT id FROM requirement_types WHERE code = 'MANDATORY'), 'Relational database design, SQL, and database management', 'تصميم قواعد البيانات العلائقية وSQL وإدارة قواعد البيانات', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdAt", "updatedAt") VALUES ('ME101', 'Engineering Mathematics', 'الرياضيات الهندسية', 4, (SELECT id FROM programs WHERE code = 'ME-ENG'), (SELECT id FROM subject_types WHERE code = 'CORE'), (SELECT id FROM requirement_types WHERE code = 'MANDATORY'), 'Advanced mathematics for engineering applications', 'رياضيات متقدمة للتطبيقات الهندسية', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdAt", "updatedAt") VALUES ('ME102', 'Thermodynamics', 'الديناميكا الحرارية', 3, (SELECT id FROM programs WHERE code = 'ME-ENG'), (SELECT id FROM subject_types WHERE code = 'CORE'), (SELECT id FROM requirement_types WHERE code = 'MANDATORY'), 'Principles of thermodynamics and heat transfer', 'مبادئ الديناميكا الحرارية وانتقال الحرارة', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdAt", "updatedAt") VALUES ('EE101', 'Circuit Analysis', 'تحليل الدوائر', 4, (SELECT id FROM programs WHERE code = 'EE-ENG'), (SELECT id FROM subject_types WHERE code = 'CORE'), (SELECT id FROM requirement_types WHERE code = 'MANDATORY'), 'Analysis of electrical circuits and network theorems', 'تحليل الدوائر الكهربائية ونظريات الشبكات', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      console.log('  ✅ Subjects created');
    } catch (error) {
      console.log('  ℹ️  Subjects already exist or error:', error.message);
    }

    // 3. Classes
    console.log('\n🌱 Creating classes...');
    try {
      await prisma.$queryRaw`INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "isActive", "createdAt", "updatedAt") VALUES ('CS101-SEC1', 'Programming Fundamentals - Section 1', 'أساسيات البرمجة - شعبة 1', 30, (SELECT p.id FROM programs p JOIN subjects s ON p.id = s."programId" WHERE s.code = 'CS101'), (SELECT id FROM subjects WHERE code = 'CS101'), (SELECT id FROM users WHERE email = 'ahmed.mohammed@military-lms.com'), '2024-FALL', '2024', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "isActive", "createdAt", "updatedAt") VALUES ('CS101-SEC2', 'Programming Fundamentals - Section 2', 'أساسيات البرمجة - شعبة 2', 30, (SELECT p.id FROM programs p JOIN subjects s ON p.id = s."programId" WHERE s.code = 'CS101'), (SELECT id FROM subjects WHERE code = 'CS101'), (SELECT id FROM users WHERE email = 'ahmed.mohammed@military-lms.com'), '2024-FALL', '2024', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "isActive", "createdAt", "updatedAt") VALUES ('CS102-SEC1', 'Data Structures - Section 1', 'هياكل البيانات - شعبة 1', 25, (SELECT p.id FROM programs p JOIN subjects s ON p.id = s."programId" WHERE s.code = 'CS102'), (SELECT id FROM subjects WHERE code = 'CS102'), (SELECT id FROM users WHERE email = 'khalid.alsaadi@military-lms.com'), '2024-FALL', '2024', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "isActive", "createdAt", "updatedAt") VALUES ('ME101-SEC1', 'Engineering Mathematics - Section 1', 'الرياضيات الهندسية - شعبة 1', 35, (SELECT p.id FROM programs p JOIN subjects s ON p.id = s."programId" WHERE s.code = 'ME101'), (SELECT id FROM subjects WHERE code = 'ME101'), (SELECT id FROM users WHERE email = 'khalid.alsaadi@military-lms.com'), '2024-FALL', '2024', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "isActive", "createdAt", "updatedAt") VALUES ('EE101-SEC1', 'Circuit Analysis - Section 1', 'تحليل الدوائر - شعبة 1', 30, (SELECT p.id FROM programs p JOIN subjects s ON p.id = s."programId" WHERE s.code = 'EE101'), (SELECT id FROM subjects WHERE code = 'EE101'), (SELECT id FROM users WHERE email = 'ahmed.mohammed@military-lms.com'), '2024-FALL', '2024', true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
      console.log('  ✅ Classes created');
    } catch (error) {
      console.log('  ℹ️  Classes already exist or error:', error.message);
    }

    // 4. Enrollments
    console.log('\n🌱 Creating enrollments...');
    try {
      await prisma.$queryRaw`INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'fatima.alhashmi@military-lms.com'), (SELECT "programId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT id FROM classes WHERE code = 'CS101-SEC1'), (SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'), NOW(), NOW()) ON CONFLICT ("userId", "classId") DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'mohammed.alrashid@military-lms.com'), (SELECT "programId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT id FROM classes WHERE code = 'CS101-SEC1'), (SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'), NOW(), NOW()) ON CONFLICT ("userId", "classId") DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'nora.khalifa@military-lms.com'), (SELECT "programId" FROM classes WHERE code = 'CS101-SEC2'), (SELECT "subjectId" FROM classes WHERE code = 'CS101-SEC2'), (SELECT id FROM classes WHERE code = 'CS101-SEC2'), (SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'), NOW(), NOW()) ON CONFLICT ("userId", "classId") DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'khalid.alsaadi@military-lms.com'), (SELECT "programId" FROM classes WHERE code = 'CS102-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'CS102-SEC1'), (SELECT id FROM classes WHERE code = 'CS102-SEC1'), (SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'), NOW(), NOW()) ON CONFLICT ("userId", "classId") DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'), (SELECT "programId" FROM classes WHERE code = 'ME101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'ME101-SEC1'), (SELECT id FROM classes WHERE code = 'ME101-SEC1'), (SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'), NOW(), NOW()) ON CONFLICT ("userId", "classId") DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'fatima.alhashmi@military-lms.com'), (SELECT "programId" FROM classes WHERE code = 'EE101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'EE101-SEC1'), (SELECT id FROM classes WHERE code = 'EE101-SEC1'), (SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'), NOW(), NOW()) ON CONFLICT ("userId", "classId") DO NOTHING`;
      console.log('  ✅ Enrollments created');
    } catch (error) {
      console.log('  ℹ️  Enrollments already exist or error:', error.message);
    }

    // 5. Participations
    console.log('\n🌱 Creating participations...');
    try {
      await prisma.$queryRaw`INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'fatima.alhashmi@military-lms.com'), (SELECT id FROM classes WHERE code = 'CS101-SEC1'), (SELECT "programId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT id FROM participation_types WHERE code = 'POSITIVE'), 5, 'Excellent participation in class discussion about algorithms', 'مشاركة ممتازة في مناقشة الفصل حول الخوارزميات', 'Student provided insightful contributions to the algorithm discussion', true, NOW(), NOW()) ON CONFLICT DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'fatima.alhashmi@military-lms.com'), (SELECT id FROM classes WHERE code = 'CS101-SEC1'), (SELECT "programId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT id FROM participation_types WHERE code = 'LATE'), -2, 'Arrived 15 minutes late to programming lab', 'وصلت متأخرة 15 دقيقة إلى معمل البرمجة', 'Student missed important lab setup instructions', true, NOW(), NOW()) ON CONFLICT DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'mohammed.alrashid@military-lms.com'), (SELECT id FROM classes WHERE code = 'CS101-SEC1'), (SELECT "programId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'CS101-SEC1'), (SELECT id FROM participation_types WHERE code = 'HELPFUL'), 3, 'Helped fellow students understand Python syntax', 'ساعد الزملاء في فهم بناء جملة بايثون', 'Student volunteered to assist peers during coding exercise', true, NOW(), NOW()) ON CONFLICT DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'nora.khalifa@military-lms.com'), (SELECT id FROM classes WHERE code = 'CS101-SEC2'), (SELECT "programId" FROM classes WHERE code = 'CS101-SEC2'), (SELECT "subjectId" FROM classes WHERE code = 'CS101-SEC2'), (SELECT id FROM participation_types WHERE code = 'EXCELLENT'), 5, 'Perfect score on programming assignment', 'درجة كاملة في واجب البرمجة', 'Student submitted exceptional work with advanced features', true, NOW(), NOW()) ON CONFLICT DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'khalid.alsaadi@military-lms.com'), (SELECT id FROM classes WHERE code = 'CS102-SEC1'), (SELECT "programId" FROM classes WHERE code = 'CS102-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'CS102-SEC1'), (SELECT id FROM participation_types WHERE code = 'POSITIVE'), 4, 'Active participation in data structures discussion', 'مشاركة نشطة في مناقشة هياكل البيانات', 'Student consistently contributed to class discussions', true, NOW(), NOW()) ON CONFLICT DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'), (SELECT id FROM classes WHERE code = 'ME101-SEC1'), (SELECT "programId" FROM classes WHERE code = 'ME101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'ME101-SEC1'), (SELECT id FROM participation_types WHERE code = 'POSITIVE'), 3, 'Good participation in mathematics problem solving', 'مشاركة جيدة في حل المسائل الرياضية', 'Student showed good understanding of mathematical concepts', true, NOW(), NOW()) ON CONFLICT DO NOTHING`;
      await prisma.$queryRaw`INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") VALUES ((SELECT id FROM users WHERE email = 'fatima.alhashmi@military-lms.com'), (SELECT id FROM classes WHERE code = 'EE101-SEC1'), (SELECT "programId" FROM classes WHERE code = 'EE101-SEC1'), (SELECT "subjectId" FROM classes WHERE code = 'EE101-SEC1'), (SELECT id FROM participation_types WHERE code = 'LATE'), -2, 'Late to circuit analysis lecture', 'متأخر عن محاضرة تحليل الدوائر', 'Student arrived 10 minutes late but caught up quickly', true, NOW(), NOW()) ON CONFLICT DO NOTHING`;
      console.log('  ✅ Participations created');
    } catch (error) {
      console.log('  ℹ️  Participations already exist or error:', error.message);
    }

    console.log('\n🎉 Remaining data seeding completed!');
    
    // Check final state
    await checkFinalState();
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkFinalState() {
  console.log('\n📋 Final Database State:');
  
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
  
  // Show sample participations
  try {
    const sampleParticipations = await prisma.$queryRaw`
      SELECT p.points, pt.code as type_code, u."displayName", c.code as class_code 
      FROM participations p 
      JOIN participation_types pt ON p.typeId = pt.id 
      JOIN users u ON p.userId = u.id 
      JOIN classes c ON p.classId = c.id 
      LIMIT 5
    `;
    console.log('\n📊 Sample Participations:');
    sampleParticipations.forEach(p => {
      console.log(`  - ${p.displayName} in ${p.class_code}: ${p.type_code} (${p.points} points)`);
    });
  } catch (error) {
    console.log('\n📊 Sample Participations: No participations found');
  }
  
  // Show programs
  const programList = await prisma.$queryRaw`SELECT code, "nameEn" FROM programs ORDER BY id`;
  console.log('\n📚 Programs:');
  programList.forEach(program => {
    console.log(`  - ${program.nameEn} (${program.code})`);
  });
}

seedRemaining();
