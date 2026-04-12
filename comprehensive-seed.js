/**
 * Comprehensive Database Seeding Script
 * 
 * This script creates all necessary data with proper relationships
 * ensuring classId, programId, and subjectId are not null where required
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAll() {
  try {
    console.log('🚀 Starting comprehensive database seeding...\n');

    // 1. Create Users
    console.log('🌱 Creating users...');
    const users = await createUsers();
    
    // 2. Create Programs
    console.log('🌱 Creating programs...');
    const programs = await createPrograms(users[0]);
    
    // 3. Create Subjects
    console.log('🌱 Creating subjects...');
    const subjects = await createSubjects(programs, users[0]);
    
    // 4. Create Classes
    console.log('🌱 Creating classes...');
    const classes = await createClasses(programs, subjects, users[0]);
    
    // 5. Create Enrollments
    console.log('🌱 Creating enrollments...');
    await createEnrollments(users, classes, users[0]);
    
    // 6. Create Participations
    console.log('🌱 Creating participations...');
    await createParticipations(users, classes, users[0]);
    
    console.log('\n🎉 Comprehensive seeding completed successfully!');
    
    // Final state check
    await checkFinalState();
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createUsers() {
  const usersData = [
    {
      email: 'admin@military-lms.com',
      displayName: 'System Administrator',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    },
    {
      email: 'instructor1@military-lms.com',
      displayName: 'Ahmed Hassan',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      isActive: true
    },
    {
      email: 'instructor2@military-lms.com',
      displayName: 'Mohammed Ali',
      firstName: 'Mohammed',
      lastName: 'Ali',
      isActive: true
    },
    {
      email: 'student1@military-lms.com',
      displayName: 'Shareef Hiasat',
      firstName: 'Shareef',
      lastName: 'Hiasat',
      studentNumber: 'STU001',
      isActive: true
    },
    {
      email: 'student2@military-lms.com',
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: 'STU002',
      isActive: true
    },
    {
      email: 'student3@military-lms.com',
      displayName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      studentNumber: 'STU003',
      isActive: true
    }
  ];

  const users = [];
  for (const userData of usersData) {
    const existing = await prisma.user.findFirst({
      where: { email: userData.email }
    });
    
    if (!existing) {
      const user = await prisma.user.create({ data: userData });
      users.push(user);
      console.log(`  ✅ Created user: ${user.displayName}`);
    } else {
      users.push(existing);
      console.log(`  ℹ️  User already exists: ${existing.displayName}`);
    }
  }
  
  console.log(`✅ Users complete. Total: ${users.length}\n`);
  return users;
}

async function createPrograms(adminUser) {
  const programsData = [
    {
      code: 'CS101',
      nameEn: 'Computer Science Fundamentals',
      nameAr: 'أساسيات علوم الحاسب',
      descriptionEn: 'Introduction to computer science and programming',
      descriptionAr: 'مقدمة في علوم الحاسب والبرمجة',
      durationYears: 4,
      minGPA: 2.0,
      totalCreditHours: 120,
      createdBy: adminUser.id
    },
    {
      code: 'ENG101',
      nameEn: 'English Language',
      nameAr: 'اللغة الإنجليزية',
      descriptionEn: 'English language and communication skills',
      descriptionAr: 'مهارات اللغة الإنجليزية والتواصل',
      durationYears: 4,
      minGPA: 2.0,
      totalCreditHours: 120,
      createdBy: adminUser.id
    },
    {
      code: 'MATH101',
      nameEn: 'Mathematics',
      nameAr: 'الرياضيات',
      descriptionEn: 'Mathematical foundations and applications',
      descriptionAr: 'الأساس الرياضيات وتطبيقاتها',
      durationYears: 4,
      minGPA: 2.0,
      totalCreditHours: 120,
      createdBy: adminUser.id
    }
  ];

  const programs = [];
  for (const programData of programsData) {
    const existing = await prisma.program.findFirst({
      where: { code: programData.code }
    });
    
    if (!existing) {
      const program = await prisma.program.create({ data: programData });
      programs.push(program);
      console.log(`  ✅ Created program: ${program.nameEn}`);
    } else {
      programs.push(existing);
      console.log(`  ℹ️  Program already exists: ${existing.nameEn}`);
    }
  }
  
  console.log(`✅ Programs complete. Total: ${programs.length}\n`);
  return programs;
}

async function createSubjects(programs, adminUser) {
  // Get required type IDs
  const subjectType = await prisma.subjectTypes.findFirst({
    where: { code: 'CORE' }
  });
  const requirementType = await prisma.requirementTypes.findFirst({
    where: { code: 'MANDATORY' }
  });

  const subjectsData = [
    // Computer Science Subjects
    {
      code: 'CS101-01',
      nameEn: 'Introduction to Programming',
      nameAr: 'مقدمة في البرمجة',
      credits: 3,
      programId: programs[0].id,
      typeId: subjectType.id,
      requirementTypeId: requirementType.id,
      createdBy: adminUser.id
    },
    {
      code: 'CS101-02',
      nameEn: 'Data Structures',
      nameAr: 'هياكل البيانات',
      credits: 4,
      programId: programs[0].id,
      typeId: subjectType.id,
      requirementTypeId: requirementType.id,
      createdBy: adminUser.id
    },
    {
      code: 'CS101-03',
      nameEn: 'Algorithms',
      nameAr: 'الخوارزميات',
      credits: 3,
      programId: programs[0].id,
      typeId: subjectType.id,
      requirementTypeId: requirementType.id,
      createdBy: adminUser.id
    },
    // English Subjects
    {
      code: 'ENG101-01',
      nameEn: 'English Grammar',
      nameAr: 'قواعد اللغة الإنجليزية',
      credits: 3,
      programId: programs[1].id,
      typeId: subjectType.id,
      requirementTypeId: requirementType.id,
      createdBy: adminUser.id
    },
    {
      code: 'ENG101-02',
      nameEn: 'English Literature',
      nameAr: 'الأدب الإنجليزي',
      credits: 3,
      programId: programs[1].id,
      typeId: subjectType.id,
      requirementTypeId: requirementType.id,
      createdBy: adminUser.id
    },
    // Mathematics Subjects
    {
      code: 'MATH101-01',
      nameEn: 'Calculus I',
      nameAr: 'حساب التفاضل والتكامل 1',
      credits: 4,
      programId: programs[2].id,
      typeId: subjectType.id,
      requirementTypeId: requirementType.id,
      createdBy: adminUser.id
    },
    {
      code: 'MATH101-02',
      nameEn: 'Linear Algebra',
      nameAr: 'الجبر الخطي',
      credits: 3,
      programId: programs[2].id,
      typeId: subjectType.id,
      requirementTypeId: requirementType.id,
      createdBy: adminUser.id
    }
  ];

  const subjects = [];
  for (const subjectData of subjectsData) {
    const existing = await prisma.subject.findFirst({
      where: { code: subjectData.code }
    });
    
    if (!existing) {
      const subject = await prisma.subject.create({ data: subjectData });
      subjects.push(subject);
      console.log(`  ✅ Created subject: ${subject.nameEn}`);
    } else {
      subjects.push(existing);
      console.log(`  ℹ️  Subject already exists: ${existing.nameEn}`);
    }
  }
  
  console.log(`✅ Subjects complete. Total: ${subjects.length}\n`);
  return subjects;
}

async function createClasses(programs, subjects, adminUser) {
  const classesData = [
    // Computer Science Classes
    {
      code: 'CS101-01-CLASS-A',
      nameEn: 'Programming Class A',
      nameAr: 'فصل البرمجة أ',
      maxCapacity: 30,
      programId: programs[0].id,
      subjectId: subjects[0].id,
      instructorId: 1, // Ahmed Hassan
      createdBy: adminUser.id,
      term: '2024-Fall',
      year: '2024'
    },
    {
      code: 'CS101-02-CLASS-B',
      nameEn: 'Data Structures Class B',
      nameAr: 'فصل هياكل البيانات ب',
      maxCapacity: 25,
      programId: programs[0].id,
      subjectId: subjects[1].id,
      instructorId: 1, // Ahmed Hassan
      createdBy: adminUser.id,
      term: '2024-Fall',
      year: '2024'
    },
    // English Classes
    {
      code: 'ENG101-01-CLASS-A',
      nameEn: 'English Grammar Class A',
      nameAr: 'فصل قواعد اللغة الإنجليزية أ',
      maxCapacity: 35,
      programId: programs[1].id,
      subjectId: subjects[3].id,
      instructorId: 2, // Mohammed Ali
      createdBy: adminUser.id,
      term: '2024-Fall',
      year: '2024'
    },
    // Mathematics Classes
    {
      code: 'MATH101-01-CLASS-A',
      nameEn: 'Calculus I Class A',
      nameAr: 'فصل حساب التفاضل والتكامل 1 أ',
      maxCapacity: 40,
      programId: programs[2].id,
      subjectId: subjects[5].id,
      instructorId: 2, // Mohammed Ali
      createdBy: adminUser.id,
      term: '2024-Fall',
      year: '2024'
    }
  ];

  const classes = [];
  for (const classData of classesData) {
    const existing = await prisma.class.findFirst({
      where: { code: classData.code }
    });
    
    if (!existing) {
      const cls = await prisma.class.create({ data: classData });
      classes.push(cls);
      console.log(`  ✅ Created class: ${cls.nameEn}`);
    } else {
      classes.push(existing);
      console.log(`  ℹ️  Class already exists: ${existing.nameEn}`);
    }
  }
  
  console.log(`✅ Classes complete. Total: ${classes.length}\n`);
  return classes;
}

async function createEnrollments(users, classes, adminUser) {
  // Get enrollment status
  const enrolledStatus = await prisma.enrollmentStatusTypes.findFirst({
    where: { code: 'ENROLLED' }
  });

  const enrollmentsData = [
    // Student enrollments
    {
      userId: users[3].id, // Shareef Hiasat
      programId: classes[0].programId,
      subjectId: classes[0].subjectId,
      classId: classes[0].id,
      statusId: enrolledStatus.id,
      createdBy: adminUser.id
    },
    {
      userId: users[3].id, // Shareef Hiasat
      programId: classes[1].programId,
      subjectId: classes[1].subjectId,
      classId: classes[1].id,
      statusId: enrolledStatus.id,
      createdBy: adminUser.id
    },
    {
      userId: users[4].id, // John Doe
      programId: classes[0].programId,
      subjectId: classes[0].subjectId,
      classId: classes[0].id,
      statusId: enrolledStatus.id,
      createdBy: adminUser.id
    },
    {
      userId: users[5].id, // Jane Smith
      programId: classes[2].programId,
      subjectId: classes[2].subjectId,
      classId: classes[2].id,
      statusId: enrolledStatus.id,
      createdBy: adminUser.id
    }
  ];

  for (const enrollmentData of enrollmentsData) {
    const existing = await prisma.enrollment.findFirst({
      where: {
        userId: enrollmentData.userId,
        classId: enrollmentData.classId
      }
    });
    
    if (!existing) {
      await prisma.enrollment.create({ data: enrollmentData });
      console.log(`  ✅ Created enrollment for user ${enrollmentData.userId} in class ${enrollmentData.classId}`);
    } else {
      console.log(`  ℹ️  Enrollment already exists for user ${enrollmentData.userId} in class ${enrollmentData.classId}`);
    }
  }
  
  console.log(`✅ Enrollments complete.\n`);
}

async function createParticipations(users, classes, adminUser) {
  // Get participation types
  const positiveType = await prisma.participationTypes.findFirst({
    where: { code: 'POSITIVE' }
  });
  const lateType = await prisma.participationTypes.findFirst({
    where: { code: 'LATE' }
  });
  const helpfulType = await prisma.participationTypes.findFirst({
    where: { code: 'HELPFUL' }
  });

  const participationsData = [
    {
      userId: users[3].id, // Shareef Hiasat
      classId: classes[0].id,
      programId: classes[0].programId,
      subjectId: classes[0].subjectId,
      typeId: positiveType.id,
      points: 5,
      descriptionEn: 'Great participation in class discussion',
      descriptionAr: 'مشاركة ممتازة في المناقشة الصفية',
      comment: 'Student actively participated in the debate',
      createdBy: adminUser.id,
      updatedBy: adminUser.id
    },
    {
      userId: users[3].id, // Shareef Hiasat
      classId: classes[0].id,
      programId: classes[0].programId,
      subjectId: classes[0].subjectId,
      typeId: lateType.id,
      points: -2,
      descriptionEn: 'Late to class',
      descriptionAr: 'متأخر عن الفصل',
      comment: 'Student arrived 15 minutes late',
      createdBy: adminUser.id,
      updatedBy: adminUser.id
    },
    {
      userId: users[4].id, // John Doe
      classId: classes[0].id,
      programId: classes[0].programId,
      subjectId: classes[0].subjectId,
      typeId: helpfulType.id,
      points: 3,
      descriptionEn: 'Helped another student',
      descriptionAr: 'ساعد طالبًا آخر',
      comment: 'Assisted peer with understanding the concept',
      createdBy: adminUser.id,
      updatedBy: adminUser.id
    },
    {
      userId: users[3].id, // Shareef Hiasat
      classId: classes[1].id,
      programId: classes[1].programId,
      subjectId: classes[1].subjectId,
      typeId: positiveType.id,
      points: 4,
      descriptionEn: 'Excellent problem solving',
      descriptionAr: 'حل مشاكل ممتاز',
      comment: 'Successfully solved complex algorithm problem',
      createdBy: adminUser.id,
      updatedBy: adminUser.id
    },
    {
      userId: users[5].id, // Jane Smith
      classId: classes[2].id,
      programId: classes[2].programId,
      subjectId: classes[2].subjectId,
      typeId: positiveType.id,
      points: 5,
      descriptionEn: 'Perfect grammar exercise',
      descriptionAr: 'تمرين قواعد مثالي',
      comment: 'All answers were correct',
      createdBy: adminUser.id,
      updatedBy: adminUser.id
    }
  ];

  for (const participationData of participationsData) {
    await prisma.participation.create({ data: participationData });
    console.log(`  ✅ Created participation for user ${participationData.userId}`);
  }
  
  console.log(`✅ Participations complete.\n`);
}

async function checkFinalState() {
  console.log('\n📋 Final database state:');
  
  const tables = [
    { name: 'users', model: 'user' },
    { name: 'programs', model: 'program' },
    { name: 'subjects', model: 'subject' },
    { name: 'classes', model: 'class' },
    { name: 'enrollments', model: 'enrollment' },
    { name: 'participations', model: 'participation' },
    { name: 'participationTypes', model: 'participationTypes' }
  ];
  
  for (const table of tables) {
    try {
      const count = await prisma[table.model].count();
      console.log(`  ${table.name}: ${count} records`);
    } catch (error) {
      console.log(`  ${table.name}: Error - ${error.message}`);
    }
  }
}

seedAll();
