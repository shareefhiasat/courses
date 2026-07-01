/**
 * Complete seed script using raw SQL queries
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeSeed() {
  try {
    console.log('🚀 Starting complete database seeding...\n');

    // 1. Programs
    console.log('🌱 Creating programs...');
    const programsData = [
      {
        code: 'CS-ENG',
        nameEn: 'Computer Science Engineering',
        nameAr: 'هندسة علوم الحاسب',
        descriptionEn: 'Bachelor program in Computer Science Engineering with focus on software development, algorithms, and system design',
        descriptionAr: 'برنامج بكالوريوس في هندسة علوم الحاسب مع التركيز على تطوير البرمجيات والخوارزميات وتصميم الأنظمة',
        durationYears: 4,
        minGPA: 2.5,
        totalCreditHours: 140
      },
      {
        code: 'ME-ENG',
        nameEn: 'Mechanical Engineering',
        nameAr: 'الهندسة الميكانيكية',
        descriptionEn: 'Bachelor program in Mechanical Engineering covering thermodynamics, fluid mechanics, and materials science',
        descriptionAr: 'برنامج بكالوريوس في الهندسة الميكانيكية يغطي الديناميكا الحرارية وميكانيكا المواد وعلم المواد',
        durationYears: 4,
        minGPA: 2.5,
        totalCreditHours: 140
      },
      {
        code: 'EE-ENG',
        nameEn: 'Electrical Engineering',
        nameAr: 'الهندسة الكهربائية',
        descriptionEn: 'Bachelor program in Electrical Engineering with focus on power systems, electronics, and control systems',
        descriptionAr: 'برنامج بكالوريوس في الهندسة الكهربائية مع التركيز على أنظمة الطاقة والإلكترونيات وأنظمة التحكم',
        durationYears: 4,
        minGPA: 2.5,
        totalCreditHours: 140
      }
    ];

    for (const programData of programsData) {
      try {
        await prisma.$queryRaw`
          INSERT INTO programs (code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours", "isActive", "createdAt", "updatedAt") 
          VALUES (${programData.code}, ${programData.nameEn}, ${programData.nameAr}, ${programData.descriptionEn}, ${programData.descriptionAr}, ${programData.durationYears}, ${programData.minGPA}, ${programData.totalCreditHours}, true, NOW(), NOW()) 
          ON CONFLICT (code) DO NOTHING
        `;
        console.log(`  ✅ Created program: ${programData.nameEn}`);
      } catch (error) {
        console.log(`  ℹ️  Program ${programData.nameEn} already exists or error: ${error.message}`);
      }
    }

    // 2. Subjects
    console.log('\n🌱 Creating subjects...');
    const subjectsData = [
      {
        code: 'CS101',
        nameEn: 'Introduction to Programming',
        nameAr: 'مقدمة في البرمجة',
        credits: 4,
        programCode: 'CS-ENG',
        subjectTypeCode: 'CORE',
        requirementTypeCode: 'MANDATORY',
        descriptionEn: 'Fundamentals of programming using Python and problem-solving techniques',
        descriptionAr: 'أساسيات البرمجة باستخدام بايثون وتقنيات حل المشكلات'
      },
      {
        code: 'CS102',
        nameEn: 'Data Structures and Algorithms',
        nameAr: 'هياكل البيانات والخوارزميات',
        credits: 4,
        programCode: 'CS-ENG',
        subjectTypeCode: 'CORE',
        requirementTypeCode: 'MANDATORY',
        descriptionEn: 'Advanced data structures and algorithm design and analysis',
        descriptionAr: 'هياكل البيانات المتقدمة وتصميم وتحليل الخوارزميات'
      },
      {
        code: 'CS201',
        nameEn: 'Database Systems',
        nameAr: 'أنظمة قواعد البيانات',
        credits: 3,
        programCode: 'CS-ENG',
        subjectTypeCode: 'CORE',
        requirementTypeCode: 'MANDATORY',
        descriptionEn: 'Relational database design, SQL, and database management',
        descriptionAr: 'تصميم قواعد البيانات العلائقية وSQL وإدارة قواعد البيانات'
      },
      {
        code: 'ME101',
        nameEn: 'Engineering Mathematics',
        nameAr: 'الرياضيات الهندسية',
        credits: 4,
        programCode: 'ME-ENG',
        subjectTypeCode: 'CORE',
        requirementTypeCode: 'MANDATORY',
        descriptionEn: 'Advanced mathematics for engineering applications',
        descriptionAr: 'رياضيات متقدمة للتطبيقات الهندسية'
      },
      {
        code: 'ME102',
        nameEn: 'Thermodynamics',
        nameAr: 'الديناميكا الحرارية',
        credits: 3,
        programCode: 'ME-ENG',
        subjectTypeCode: 'CORE',
        requirementTypeCode: 'MANDATORY',
        descriptionEn: 'Principles of thermodynamics and heat transfer',
        descriptionAr: 'مبادئ الديناميكا الحرارية وانتقال الحرارة'
      },
      {
        code: 'EE101',
        nameEn: 'Circuit Analysis',
        nameAr: 'تحليل الدوائر',
        credits: 4,
        programCode: 'EE-ENG',
        subjectTypeCode: 'CORE',
        requirementTypeCode: 'MANDATORY',
        descriptionEn: 'Analysis of electrical circuits and network theorems',
        descriptionAr: 'تحليل الدوائر الكهربائية ونظريات الشبكات'
      }
    ];

    for (const subjectData of subjectsData) {
      try {
        await prisma.$queryRaw`
          INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdAt", "updatedAt") 
          SELECT ${subjectData.code}, ${subjectData.nameEn}, ${subjectData.nameAr}, ${subjectData.credits}, p.id, st.id, rt.id, ${subjectData.descriptionEn}, ${subjectData.descriptionAr}, true, NOW(), NOW()
          FROM programs p, subject_types st, requirement_types rt 
          WHERE p.code = ${subjectData.programCode} AND st.code = ${subjectData.subjectTypeCode} AND rt.code = ${subjectData.requirementTypeCode}
          ON CONFLICT (code) DO NOTHING
        `;
        console.log(`  ✅ Created subject: ${subjectData.nameEn}`);
      } catch (error) {
        console.log(`  ℹ️  Subject ${subjectData.nameEn} already exists or error: ${error.message}`);
      }
    }

    // 3. Classes
    console.log('\n🌱 Creating classes...');
    const classesData = [
      {
        code: 'CS101-SEC1',
        nameEn: 'Programming Fundamentals - Section 1',
        nameAr: 'أساسيات البرمجة - شعبة 1',
        maxCapacity: 30,
        subjectCode: 'CS101',
        instructorEmail: 'ahmed.mohammed@military-lms.com',
        term: '2024-FALL',
        year: '2024',
        locationEn: 'Engineering Building - Room 101',
        locationAr: 'مبنى الهندسة - قاعة 101',
        schedule: 'Sun/Tue/Thu 08:00-10:00'
      },
      {
        code: 'CS101-SEC2',
        nameEn: 'Programming Fundamentals - Section 2',
        nameAr: 'أساسيات البرمجة - شعبة 2',
        maxCapacity: 30,
        subjectCode: 'CS101',
        instructorEmail: 'ahmed.mohammed@military-lms.com',
        term: '2024-FALL',
        year: '2024',
        locationEn: 'Engineering Building - Room 102',
        locationAr: 'مبنى الهندسة - قاعة 102',
        schedule: 'Mon/Wed/Fri 10:00-12:00'
      },
      {
        code: 'CS102-SEC1',
        nameEn: 'Data Structures - Section 1',
        nameAr: 'هياكل البيانات - شعبة 1',
        maxCapacity: 25,
        subjectCode: 'CS102',
        instructorEmail: 'khalid.alsaadi@military-lms.com',
        term: '2024-FALL',
        year: '2024',
        locationEn: 'Engineering Building - Room 201',
        locationAr: 'مبنى الهندسة - قاعة 201',
        schedule: 'Sun/Tue/Thu 10:00-12:00'
      },
      {
        code: 'ME101-SEC1',
        nameEn: 'Engineering Mathematics - Section 1',
        nameAr: 'الرياضيات الهندسية - شعبة 1',
        maxCapacity: 35,
        subjectCode: 'ME101',
        instructorEmail: 'khalid.alsaadi@military-lms.com',
        term: '2024-FALL',
        year: '2024',
        locationEn: 'Engineering Building - Room 301',
        locationAr: 'مبنى الهندسة - قاعة 301',
        schedule: 'Mon/Wed/Fri 08:00-10:00'
      },
      {
        code: 'EE101-SEC1',
        nameEn: 'Circuit Analysis - Section 1',
        nameAr: 'تحليل الدوائر - شعبة 1',
        maxCapacity: 30,
        subjectCode: 'EE101',
        instructorEmail: 'ahmed.mohammed@military-lms.com',
        term: '2024-FALL',
        year: '2024',
        locationEn: 'Engineering Building - Room 401',
        locationAr: 'مبنى الهندسة - قاعة 401',
        schedule: 'Sun/Tue/Thu 14:00-16:00'
      }
    ];

    for (const classData of classesData) {
      try {
        await prisma.$queryRaw`
          INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "locationEn", "locationAr", schedule, "isActive", "createdAt", "updatedAt") 
          SELECT ${classData.code}, ${classData.nameEn}, ${classData.nameAr}, ${classData.maxCapacity}, s."programId", s.id, u.id, ${classData.term}, ${classData.year}, ${classData.locationEn}, ${classData.locationAr}, ${classData.schedule}, true, NOW(), NOW()
          FROM subjects s, users u 
          WHERE s.code = ${classData.subjectCode} AND u.email = ${classData.instructorEmail}
          ON CONFLICT (code) DO NOTHING
        `;
        console.log(`  ✅ Created class: ${classData.nameEn}`);
      } catch (error) {
        console.log(`  ℹ️  Class ${classData.nameEn} already exists or error: ${error.message}`);
      }
    }

    // 4. Enrollments
    console.log('\n🌱 Creating enrollments...');
    const enrollmentsData = [
      { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1' },
      { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1' },
      { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2' },
      { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1' },
      { studentEmail: 'shareef.hiasat@gmail.com', classCode: 'ME101-SEC1' },
      { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'EE101-SEC1' }
    ];

    for (const enrollmentData of enrollmentsData) {
      try {
        await prisma.$queryRaw`
          INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdAt", "updatedAt") 
          SELECT u.id, c."programId", c."subjectId", c.id, est.id, NOW(), NOW()
          FROM users u, classes c, enrollment_status_types est 
          WHERE u.email = ${enrollmentData.studentEmail} AND c.code = ${enrollmentData.classCode} AND est.code = 'ENROLLED'
          ON CONFLICT ("userId", "classId") DO NOTHING
        `;
        console.log(`  ✅ Created enrollment for ${enrollmentData.studentEmail} in ${enrollmentData.classCode}`);
      } catch (error) {
        console.log(`  ℹ️  Enrollment for ${enrollmentData.studentEmail} in ${enrollmentData.classCode} already exists or error: ${error.message}`);
      }
    }

    // 5. Participations
    console.log('\n🌱 Creating participations...');
    const participationsData = [
      { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1', participationTypeCode: 'POSITIVE', points: 5, descriptionEn: 'Excellent participation in class discussion about algorithms', descriptionAr: 'مشاركة ممتازة في مناقشة الفصل حول الخوارزميات', comment: 'Student provided insightful contributions to the algorithm discussion' },
      { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1', participationTypeCode: 'LATE', points: -2, descriptionEn: 'Arrived 15 minutes late to programming lab', descriptionAr: 'وصلت متأخرة 15 دقيقة إلى معمل البرمجة', comment: 'Student missed important lab setup instructions' },
      { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1', participationTypeCode: 'HELPFUL', points: 3, descriptionEn: 'Helped fellow students understand Python syntax', descriptionAr: 'ساعد الزملاء في فهم بناء جملة بايثون', comment: 'Student volunteered to assist peers during coding exercise' },
      { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2', participationTypeCode: 'EXCELLENT', points: 5, descriptionEn: 'Perfect score on programming assignment', descriptionAr: 'درجة كاملة في واجب البرمجة', comment: 'Student submitted exceptional work with advanced features' },
      { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1', participationTypeCode: 'POSITIVE', points: 4, descriptionEn: 'Active participation in data structures discussion', descriptionAr: 'مشاركة نشطة في مناقشة هياكل البيانات', comment: 'Student consistently contributed to class discussions' },
      { studentEmail: 'shareef.hiasat@gmail.com', classCode: 'ME101-SEC1', participationTypeCode: 'POSITIVE', points: 3, descriptionEn: 'Good participation in mathematics problem solving', descriptionAr: 'مشاركة جيدة في حل المسائل الرياضية', comment: 'Student showed good understanding of mathematical concepts' },
      { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'EE101-SEC1', participationTypeCode: 'LATE', points: -2, descriptionEn: 'Late to circuit analysis lecture', descriptionAr: 'متأخر عن محاضرة تحليل الدوائر', comment: 'Student arrived 10 minutes late but caught up quickly' }
    ];

    for (const participationData of participationsData) {
      try {
        await prisma.$queryRaw`
          INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt") 
          SELECT u.id, c.id, c."programId", c."subjectId", pt.id, ${participationData.points}, ${participationData.descriptionEn}, ${participationData.descriptionAr}, ${participationData.comment}, true, NOW(), NOW()
          FROM users u, classes c, participation_types pt 
          WHERE u.email = ${participationData.studentEmail} AND c.code = ${participationData.classCode} AND pt.code = ${participationData.participationTypeCode}
          ON CONFLICT DO NOTHING
        `;
        console.log(`  ✅ Created participation for ${participationData.studentEmail} in ${participationData.classCode}`);
      } catch (error) {
        console.log(`  ℹ️  Participation for ${participationData.studentEmail} in ${participationData.classCode} already exists or error: ${error.message}`);
      }
    }

    console.log('\n🎉 Complete seeding completed successfully!');
    
    // Check final state
    await checkCompleteState();
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkCompleteState() {
  console.log('\n📋 Final database state:');
  
  const tables = [
    { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'programs', query: 'SELECT COUNT(*) as count FROM programs' },
    { name: 'subjects', query: 'SELECT COUNT(*) as count FROM subjects' },
    { name: 'classes', query: 'SELECT COUNT(*) as count FROM classes' },
    { name: 'enrollments', query: 'SELECT COUNT(*) as count FROM enrollments' },
    { name: 'participations', query: 'SELECT COUNT(*) as count FROM participations' },
    { name: 'participation_types', query: 'SELECT COUNT(*) as count FROM "participation_types"' },
    { name: 'user_roles', query: 'SELECT COUNT(*) as count FROM "user_roles"' },
    { name: 'user_status_types', query: 'SELECT COUNT(*) as count FROM "user_status_types"' },
    { name: 'enrollment_status_types', query: 'SELECT COUNT(*) as count FROM "enrollment_status_types"' }
  ];
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRaw`${table.query}`;
      console.log(`  ${table.name}: ${result[0].count} records`);
    } catch (error) {
      console.log(`  ${table.name}: Error - ${error.message}`);
    }
  }

  // Show some sample data
  console.log('\n📋 Sample data:');
  try {
    const users = await prisma.$queryRaw`SELECT email, "displayName" FROM users ORDER BY id LIMIT 3`;
    console.log('  Users:');
    users.forEach(user => console.log(`    - ${user.displayName} (${user.email})`));
  } catch (error) {
    console.log(`  Users: Error - ${error.message}`);
  }

  try {
    const participations = await prisma.$queryRaw`
      SELECT p.points, pt.code as type_code, u."displayName", c.code as class_code 
      FROM participations p 
      JOIN participation_types pt ON p."typeId" = pt.id 
      JOIN users u ON p."userId" = u.id 
      JOIN classes c ON p."classId" = c.id 
      LIMIT 5
    `;
    console.log('  Participations:');
    participations.forEach(p => console.log(`    - ${p.displayName} in ${p.class_code}: ${p.type_code} (${p.points} points)`));
  } catch (error) {
    console.log(`  Participations: Error - ${error.message}`);
  }
}

completeSeed();
