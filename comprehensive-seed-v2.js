/**
 * Comprehensive Database Seeding Script v2
 * Ready for fresh start with 5 users of each role
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// Keycloak configuration
const KEYCLOAK_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'military-lms';
const KEYCLOAK_ADMIN_USER = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = 'admin123';

// Function to create a user in Keycloak
async function createKeycloakUser(userData, role) {
  const { email, firstName, lastName } = userData;
  const username = email;
  
  try {
    // Check if user already exists
    const checkCmd = `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh get users -r ${KEYCLOAK_REALM} --fields username | grep -c "${username}" || echo "0"`;
    const exists = execSync(checkCmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
    
    if (parseInt(exists) > 0) {
      console.log(`  ⏭️  Keycloak user already exists: ${email}`);
      return;
    }
    
    // Create user in Keycloak
    const createCmd = `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh create users -r ${KEYCLOAK_REALM} -s username=${username} -s email=${email} -s firstName=${firstName} -s lastName=${lastName} -s enabled=true -s emailVerified=true`;
    execSync(createCmd, { stdio: 'pipe' });
    
    // Get the user ID
    const userCmd = `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh get users -r ${KEYCLOAK_REALM} --fields id,username | grep "${username}" | cut -d' ' -f2`;
    const userId = execSync(userCmd, { encoding: 'utf8', stdio: 'pipe' }).trim().replace(/"/g, '').replace(/,/g, '');
    
    // Set password using reset-password endpoint
    const passwordCmd = `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh update users/${userId}/reset-password -r ${KEYCLOAK_REALM} -s type=password -s value=Password123! -s temporary=false`;
    execSync(passwordCmd, { stdio: 'pipe' });
    
    // Assign role
    const roleCmd = `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh add-roles --rolename ${role} --uid ${userId} -r ${KEYCLOAK_REALM}`;
    execSync(roleCmd, { stdio: 'pipe' });
    
    console.log(`  ✅ Keycloak user created: ${email} (${role})`);
    return userId;
  } catch (error) {
    console.log(`  ⚠️  Failed to create Keycloak user ${email}: ${error.message}`);
    return null;
  }
}

async function seedComprehensiveDatabase() {
  try {
    console.log('🚀 Starting comprehensive database seeding...\n');

    // 1. Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await createAdminUser();
    
    // 2. Create core academic data
    console.log('📚 Creating programs...');
    const programs = await createPrograms(adminUser);
    
    console.log('📖 Creating subjects...');
    const subjects = await createSubjects(programs, adminUser);
    
    console.log('🏫 Creating classes...');
    const classes = await createClasses(programs, subjects, adminUser);
    
    // 3. Create users with 5 of each role
    console.log('👥 Creating users (5 of each role)...');
    const users = await createUsers();
    
    // 4. Create enrollments
    console.log('📝 Creating enrollments...');
    await createEnrollments(users, classes, adminUser);
    
    // 5. Create resources
    console.log('📁 Creating resources...');
    await createResources(users, classes, subjects, adminUser);
    
    // 6. Create announcements
    console.log('📢 Creating announcements...');
    await createAnnouncements(users, programs, classes, adminUser);
    
    // 7. Create participations
    console.log('🎯 Creating participations...');
    await createParticipations(users, classes, adminUser);
    
    // 8. Create behaviors
    console.log('🏆 Creating behaviors...');
    await createBehaviors(users, classes, adminUser);
    
    // 9. Create penalties
    console.log('⚠️ Creating penalties...');
    await createPenalties(users, classes, adminUser);
    
    // 10. Create activities
    console.log('📋 Creating activities...');
    await createActivities(classes, adminUser);

    console.log('\n🎉 Comprehensive database seeding finished successfully!');
    console.log('\n📊 Summary of created data:');
    console.log('  ✅ Programs: 4');
    console.log('  ✅ Subjects: 8');
    console.log('  ✅ Classes: 8');
    console.log('  ✅ Users: 26 (1 Super Admin + 5 HR + 5 Admin + 5 Instructors + 10 Students)');
    console.log('  ✅ Enrollments: 16');
    console.log('  ✅ Resources: 15');
    console.log('  ✅ Announcements: 10');
    console.log('  ✅ Participations: 15');
    console.log('  ✅ Behaviors: 10');
    console.log('  ✅ Penalties: 8');
    console.log('  ✅ Activities: 10');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdminUser() {
  const adminUser = await prisma.user.upsert({
    where: { email: 'shareef.hiasat@gmail.com' },
    update: {},
    create: {
      email: 'shareef.hiasat@gmail.com',
      firstName: 'Shareef',
      lastName: 'Hiasat',
      displayName: 'Shareef Hiasat',
      isActive: true,
      keycloakId: '9ce4e52c-4d26-4eb7-a5b7-81c37374c187' // Keycloak ID in military-lms realm
    }
  });
  console.log(`✅ Super Admin user: ${adminUser.email}`);
  return adminUser;
}

async function createPrograms(adminUser) {
  const programsData = [
    {
      code: 'CS-ENG',
      nameEn: 'Computer Science Engineering',
      nameAr: 'هندسة علوم الحاسوب',
      descriptionEn: 'Bachelor degree in Computer Science Engineering',
      descriptionAr: 'بكالوريوس في هندسة علوم الحاسوب',
      durationYears: 4,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      code: 'ME-ENG',
      nameEn: 'Mechanical Engineering',
      nameAr: 'الهندسة الميكانيكية',
      descriptionEn: 'Bachelor degree in Mechanical Engineering',
      descriptionAr: 'بكالوريوس في الهندسة الميكانيكية',
      durationYears: 4,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      code: 'EE-ENG',
      nameEn: 'Electrical Engineering',
      nameAr: 'الهندسة الكهربائية',
      descriptionEn: 'Bachelor degree in Electrical Engineering',
      descriptionAr: 'بكالوريوس في الهندسة الكهربائية',
      durationYears: 4,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      code: 'CE-ENG',
      nameEn: 'Civil Engineering',
      nameAr: 'الهندسة المدنية',
      descriptionEn: 'Bachelor degree in Civil Engineering',
      descriptionAr: 'بكالوريوس في الهندسة المدنية',
      durationYears: 4,
      isActive: true,
      createdBy: adminUser.id
    }
  ];

  const programs = [];
  for (const programData of programsData) {
    const program = await prisma.program.upsert({
      where: { code: programData.code },
      update: programData,
      create: programData
    });
    programs.push(program);
    console.log(`  ✅ Program: ${program.nameEn}`);
  }
  
  console.log(`✅ Programs complete: ${programs.length}`);
  return programs;
}

async function createSubjects(programs, adminUser) {
  const subjectType = await prisma.subjectTypes.findFirst({ where: { code: 'CORE' } });
  const electiveType = await prisma.subjectTypes.findFirst({ where: { code: 'ELECTIVE' } });
  const requirementType = await prisma.requirementTypes.findFirst({ where: { code: 'MANDATORY' } });

  const subjectsData = [
    // Computer Science Subjects
    { code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 4, programId: programs[0].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Fundamentals of programming using Python' },
    { code: 'CS102', nameEn: 'Data Structures and Algorithms', nameAr: 'هياكل البيانات والخوارزميات', credits: 4, programId: programs[0].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Data structures and algorithm analysis' },
    { code: 'CS201', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, programId: programs[0].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Relational database design and SQL' },
    { code: 'CS202', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 3, programId: programs[0].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Software development methodologies' },
    
    // Mechanical Engineering Subjects
    { code: 'ME101', nameEn: 'Engineering Mathematics', nameAr: 'الرياضيات الهندسية', credits: 4, programId: programs[1].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Mathematical foundations for engineering' },
    { code: 'ME102', nameEn: 'Thermodynamics', nameAr: 'الديناميكا الحرارية', credits: 3, programId: programs[1].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Principles of thermodynamics and heat transfer' },
    
    // Electrical Engineering Subjects
    { code: 'EE101', nameEn: 'Circuit Analysis', nameAr: 'تحليل الدوائر', credits: 4, programId: programs[2].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Basic circuit theory and analysis' },
    { code: 'EE102', nameEn: 'Digital Logic Design', nameAr: 'تصيم المنطق الرقمي', credits: 3, programId: programs[2].id, typeId: subjectType.id, requirementTypeId: requirementType.id, descriptionEn: 'Digital systems and logic design' }
  ];

  const subjects = [];
  for (const subjectData of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: subjectData.code },
      update: subjectData,
      create: { ...subjectData, createdBy: adminUser.id }
    });
    subjects.push(subject);
    console.log(`  ✅ Subject: ${subject.nameEn}`);
  }
  
  console.log(`✅ Subjects complete: ${subjects.length}`);
  return subjects;
}

async function createClasses(programs, subjects, adminUser) {
  const academicTerm = await prisma.academicTerms.findFirst({ where: { code: '2025-SPRING' } });

  const classesData = [
    // Computer Science Classes
    { code: 'CS101-A', nameEn: 'CS101 Section A', nameAr: 'شريحة أ من مادة CS101', programId: programs[0].id, subjectId: subjects[0].id, term: academicTerm.code, year: '2025', maxCapacity: 30, isActive: true, createdBy: adminUser.id },
    { code: 'CS101-B', nameEn: 'CS101 Section B', nameAr: 'شريحة ب من مادة CS101', programId: programs[0].id, subjectId: subjects[0].id, term: academicTerm.code, year: '2025', maxCapacity: 30, isActive: true, createdBy: adminUser.id },
    { code: 'CS102-A', nameEn: 'CS102 Section A', nameAr: 'شريحة أ من مادة CS102', programId: programs[0].id, subjectId: subjects[1].id, term: academicTerm.code, year: '2025', maxCapacity: 25, isActive: true, createdBy: adminUser.id },
    { code: 'CS201-A', nameEn: 'CS201 Section A', nameAr: 'شريحة أ من مادة CS201', programId: programs[0].id, subjectId: subjects[2].id, term: academicTerm.code, year: '2025', maxCapacity: 20, isActive: true, createdBy: adminUser.id },
    
    // Mechanical Engineering Classes
    { code: 'ME101-A', nameEn: 'ME101 Section A', nameAr: 'شريحة أ من مادة ME101', programId: programs[1].id, subjectId: subjects[4].id, term: academicTerm.code, year: '2025', maxCapacity: 25, isActive: true, createdBy: adminUser.id },
    { code: 'ME102-A', nameEn: 'ME102 Section A', nameAr: 'شريحة أ من مادة ME102', programId: programs[1].id, subjectId: subjects[5].id, term: academicTerm.code, year: '2025', maxCapacity: 20, isActive: true, createdBy: adminUser.id },
    
    // Electrical Engineering Classes
    { code: 'EE101-A', nameEn: 'EE101 Section A', nameAr: 'شريحة أ من مادة EE101', programId: programs[2].id, subjectId: subjects[6].id, term: academicTerm.code, year: '2025', maxCapacity: 25, isActive: true, createdBy: adminUser.id },
    { code: 'EE102-A', nameEn: 'EE102 Section A', nameAr: 'شريحة أ من مادة EE102', programId: programs[2].id, subjectId: subjects[7].id, term: academicTerm.code, year: '2025', maxCapacity: 20, isActive: true, createdBy: adminUser.id }
  ];

  const classes = [];
  for (const classData of classesData) {
    const classItem = await prisma.class.upsert({
      where: { code: classData.code },
      update: classData,
      create: classData
    });
    classes.push(classItem);
    console.log(`  ✅ Class: ${classItem.nameEn}`);
  }
  
  console.log(`✅ Classes complete: ${classes.length}`);
  return classes;
}

async function createUsers() {
  // 5 HR Users
  const hrUsers = [
    { email: 'hr1@example.com', firstName: 'Emily', lastName: 'Brown', displayName: 'Emily Brown' },
    { email: 'hr2@example.com', firstName: 'David', lastName: 'Miller', displayName: 'David Miller' },
    { email: 'hr3@example.com', firstName: 'Sarah', lastName: 'Wilson', displayName: 'Sarah Wilson' },
    { email: 'hr4@example.com', firstName: 'James', lastName: 'Taylor', displayName: 'James Taylor' },
    { email: 'hr5@example.com', firstName: 'Lisa', lastName: 'Anderson', displayName: 'Lisa Anderson' }
  ];

  // 5 Admin Users
  const adminUsers = [
    { email: 'admin1@example.com', firstName: 'Robert', lastName: 'Johnson', displayName: 'Robert Johnson' },
    { email: 'admin2@example.com', firstName: 'Michael', lastName: 'Davis', displayName: 'Michael Davis' },
    { email: 'admin3@example.com', firstName: 'Jennifer', lastName: 'Garcia', displayName: 'Jennifer Garcia' },
    { email: 'admin4@example.com', firstName: 'William', lastName: 'Martinez', displayName: 'William Martinez' },
    { email: 'admin5@example.com', firstName: 'Patricia', lastName: 'Rodriguez', displayName: 'Patricia Rodriguez' }
  ];

  // 5 Instructors
  const instructorUsers = [
    { email: 'instructor1@example.com', firstName: 'Dr. Sarah', lastName: 'Johnson', displayName: 'Dr. Sarah Johnson' },
    { email: 'instructor2@example.com', firstName: 'Prof. Michael', lastName: 'Chen', displayName: 'Prof. Michael Chen' },
    { email: 'instructor3@example.com', firstName: 'Dr. James', lastName: 'Wilson', displayName: 'Dr. James Wilson' },
    { email: 'instructor4@example.com', firstName: 'Dr. Maria', lastName: 'Gonzalez', displayName: 'Dr. Maria Gonzalez' },
    { email: 'instructor5@example.com', firstName: 'Prof. Ahmed', lastName: 'Khalid', displayName: 'Prof. Ahmed Khalid' }
  ];

  // 10 Students
  const studentUsers = [
    { email: 'student1@example.com', firstName: 'Ahmed', lastName: 'Mohammed', displayName: 'Ahmed Mohammed', studentNumber: 'STU001' },
    { email: 'student2@example.com', firstName: 'Fatima', lastName: 'Ali', displayName: 'Fatima Ali', studentNumber: 'STU002' },
    { email: 'student3@example.com', firstName: 'Mohammed', lastName: 'Khalid', displayName: 'Mohammed Khalid', studentNumber: 'STU003' },
    { email: 'student4@example.com', firstName: 'Aisha', lastName: 'Hassan', displayName: 'Aisha Hassan', studentNumber: 'STU004' },
    { email: 'student5@example.com', firstName: 'Omar', lastName: 'Ibrahim', displayName: 'Omar Ibrahim', studentNumber: 'STU005' },
    { email: 'student6@example.com', firstName: 'Layla', lastName: 'Ahmad', displayName: 'Layla Ahmad', studentNumber: 'STU006' },
    { email: 'student7@example.com', firstName: 'Youssef', lastName: 'Mahmoud', displayName: 'Youssef Mahmoud', studentNumber: 'STU007' },
    { email: 'student8@example.com', firstName: 'Mariam', lastName: 'Saeed', displayName: 'Mariam Saeed', studentNumber: 'STU008' },
    { email: 'student9@example.com', firstName: 'Abdullah', lastName: 'Khalifa', displayName: 'Abdullah Khalifa', studentNumber: 'STU009' },
    { email: 'student10@example.com', firstName: 'Noura', lastName: 'Al-Fahad', displayName: 'Noura Al-Fahad', studentNumber: 'STU010' }
  ];

  const allUsers = [...hrUsers, ...adminUsers, ...instructorUsers, ...studentUsers];
  
  console.log('🔐 Creating Keycloak users in military-lms realm...');
  
  const users = [];
  for (const userData of allUsers) {
    // Determine role for Keycloak
    let keycloakRole = 'student';
    if (userData.email.startsWith('hr')) keycloakRole = 'admin'; // HR uses admin role
    else if (userData.email.startsWith('admin')) keycloakRole = 'admin';
    else if (userData.email.startsWith('instructor')) keycloakRole = 'instructor';
    
    // Create Keycloak user
    const keycloakId = await createKeycloakUser(userData, keycloakRole);
    
    // Create database user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { ...userData, keycloakId: keycloakId || `temp-${userData.email}` },
      create: { ...userData, isActive: true, keycloakId: keycloakId || `temp-${userData.email}` }
    });
    users.push(user);
    
    // Log role type
    let roleType = 'Student';
    if (userData.email.startsWith('hr')) roleType = 'HR';
    else if (userData.email.startsWith('admin')) roleType = 'Admin';
    else if (userData.email.startsWith('instructor')) roleType = 'Instructor';
    
    console.log(`  ✅ ${roleType}: ${user.displayName}`);
  }
  
  console.log(`✅ Users complete: ${users.length} (5 HR + 5 Admin + 5 Instructors + 10 Students)`);
  return users;
}

async function createEnrollments(users, classes, adminUser) {
  const enrolledStatus = await prisma.enrollmentStatusTypes.findFirst({ where: { code: 'ENROLLED' } });

  // Get student users (last 10)
  const students = users.slice(-10);
  
  const enrollments = [
    // Enroll students in various classes
    { userId: students[0].id, classId: classes[0].id }, { userId: students[1].id, classId: classes[0].id },
    { userId: students[2].id, classId: classes[1].id }, { userId: students[3].id, classId: classes[1].id },
    { userId: students[4].id, classId: classes[2].id }, { userId: students[5].id, classId: classes[2].id },
    { userId: students[6].id, classId: classes[3].id }, { userId: students[7].id, classId: classes[3].id },
    { userId: students[8].id, classId: classes[4].id }, { userId: students[9].id, classId: classes[4].id },
    { userId: students[0].id, classId: classes[5].id }, { userId: students[1].id, classId: classes[5].id },
    { userId: students[2].id, classId: classes[6].id }, { userId: students[3].id, classId: classes[6].id },
    { userId: students[4].id, classId: classes[7].id }, { userId: students[5].id, classId: classes[7].id }
  ];

  for (const enrollment of enrollments) {
    const classData = await prisma.class.findUnique({ where: { id: enrollment.classId } });
    await prisma.enrollment.upsert({
      where: { userId_classId: { userId: enrollment.userId, classId: enrollment.classId } },
      update: { statusId: enrolledStatus.id },
      create: {
        ...enrollment,
        programId: classData.programId,
        subjectId: classData.subjectId,
        statusId: enrolledStatus.id,
        createdBy: adminUser.id
      }
    });
    console.log(`  ✅ Enrollment created`);
  }
  
  console.log(`✅ Enrollments complete: ${enrollments.length}`);
}

async function createResources(users, classes, subjects, adminUser) {
  const documentType = await prisma.resourceTypes.findFirst({ where: { code: 'DOCUMENT' } });
  const videoType = await prisma.resourceTypes.findFirst({ where: { code: 'VIDEO' } });
  const lectureCategory = await prisma.categoryTypes.findFirst({ where: { code: 'LECTURE_NOTES' } });
  const assignmentCategory = await prisma.categoryTypes.findFirst({ where: { code: 'ASSIGNMENT' } });
  const referenceCategory = await prisma.categoryTypes.findFirst({ where: { code: 'REFERENCE' } });
  const tutorialCategory = await prisma.categoryTypes.findFirst({ where: { code: 'TUTORIAL' } });

  const resources = [
    {
      titleEn: 'Python Programming Guide',
      titleAr: 'دليل برمجة بايثون',
      descriptionEn: 'Comprehensive guide to Python programming',
      descriptionAr: 'دليل شامل لبرمجة بايثون',
      typeId: documentType.id,
      categoryId: lectureCategory.id,
      subjectId: subjects[0].id,
      classId: classes[0].id,
      url: '/resources/python-guide.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Data Structures Video Tutorial',
      titleAr: 'فيديو تعليمي لهياكل البيانات',
      descriptionEn: 'Video tutorial on data structures',
      descriptionAr: 'فيديو تعليمي لهياكل البيانات',
      typeId: videoType.id,
      categoryId: tutorialCategory.id,
      subjectId: subjects[1].id,
      classId: classes[2].id,
      url: '/resources/data-structures.mp4',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Engineering Mathematics Textbook',
      titleAr: 'كتاب الرياضيات الهندسية',
      descriptionEn: 'Complete textbook for engineering mathematics',
      descriptionAr: 'كتاب كامل للرياضيات الهندسية',
      typeId: documentType.id,
      categoryId: referenceCategory.id,
      subjectId: subjects[4].id,
      classId: classes[4].id,
      url: '/resources/math-textbook.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Python Lab Manual',
      titleAr: 'دليل مختبر بايثون',
      descriptionEn: 'Laboratory manual for Python programming',
      descriptionAr: 'دليل المختبر لبرمجة بايثون',
      typeId: documentType.id,
      categoryId: assignmentCategory.id,
      subjectId: subjects[0].id,
      classId: classes[0].id,
      url: '/resources/lab-manual.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Algorithm Visualization',
      titleAr: 'تصور الخوارزميات',
      descriptionEn: 'Interactive algorithm visualizations',
      descriptionAr: 'تصورات تفاعلية للخوارزميات',
      typeId: videoType.id,
      categoryId: tutorialCategory.id,
      subjectId: subjects[1].id,
      classId: classes[2].id,
      url: '/resources/algorithms-visualization.mp4',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Circuit Analysis Notes',
      titleAr: 'ملاحظات تحليل الدوائر',
      descriptionEn: 'Comprehensive notes on circuit analysis',
      descriptionAr: 'ملاحظات شاملة حول تحليل الدوائر',
      typeId: documentType.id,
      categoryId: lectureCategory.id,
      subjectId: subjects[6].id,
      classId: classes[6].id,
      url: '/resources/circuit-notes.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Database Design Tutorial',
      titleAr: 'دليل تصميم قواعد البيانات',
      descriptionEn: 'Step-by-step database design guide',
      descriptionAr: 'دليل خطوة بخطوة لتصميم قواعد البيانات',
      typeId: videoType.id,
      categoryId: tutorialCategory.id,
      subjectId: subjects[2].id,
      classId: classes[3].id,
      url: '/resources/database-tutorial.mp4',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Thermodynamics Formulas',
      titleAr: 'معادلات الديناميكا الحرارية',
      descriptionEn: 'Essential thermodynamics formulas and equations',
      descriptionAr: 'معادلات الديناميكا الحرارية الأساسية',
      typeId: documentType.id,
      categoryId: referenceCategory.id,
      subjectId: subjects[5].id,
      classId: classes[5].id,
      url: '/resources/thermo-formulas.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Software Engineering Case Studies',
      titleAr: 'دراسات حالة في هندسة البرمجيات',
      descriptionEn: 'Real-world software engineering case studies',
      descriptionAr: 'دراسات حالة واقعية في هندسة البرمجيات',
      typeId: documentType.id,
      categoryId: referenceCategory.id,
      subjectId: subjects[3].id,
      classId: classes[3].id,
      url: '/resources/se-case-studies.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Digital Logic Lab Guide',
      titleAr: 'دليل مختبر المنطق الرقمي',
      descriptionEn: 'Laboratory guide for digital logic experiments',
      descriptionAr: 'دليل المختبر لتجارب المنطق الرقمي',
      typeId: documentType.id,
      categoryId: assignmentCategory.id,
      subjectId: subjects[7].id,
      classId: classes[7].id,
      url: '/resources/digital-lab-guide.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Programming Exercises',
      titleAr: 'تمارين البرمجة',
      descriptionEn: 'Collection of programming exercises and solutions',
      descriptionAr: 'مجموعة من تمارين البرمجة والحلول',
      typeId: documentType.id,
      categoryId: assignmentCategory.id,
      subjectId: subjects[0].id,
      classId: classes[1].id,
      url: '/resources/programming-exercises.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Engineering Mathematics Solutions',
      titleAr: 'حلول الرياضيات الهندسية',
      descriptionEn: 'Step-by-step solutions to engineering math problems',
      descriptionAr: 'حلول خطوة بخطوة لمسائل الرياضيات الهندسية',
      typeId: documentType.id,
      categoryId: referenceCategory.id,
      subjectId: subjects[4].id,
      classId: classes[4].id,
      url: '/resources/math-solutions.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Advanced Python Topics',
      titleAr: 'مواضيع بايثون المتقدمة',
      descriptionEn: 'Advanced Python programming concepts and techniques',
      descriptionAr: 'مفاهيم وتقنيات برمجة بايثون المتقدمة',
      typeId: videoType.id,
      categoryId: tutorialCategory.id,
      subjectId: subjects[0].id,
      classId: classes[1].id,
      url: '/resources/advanced-python.mp4',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Mechanical Engineering Workshop',
      titleAr: 'ورشة هندسة ميكانيكية',
      descriptionEn: 'Practical workshop for mechanical engineering students',
      descriptionAr: 'ورشة عملية لطلاب الهندسة الميكانيكية',
      typeId: documentType.id,
      categoryId: tutorialCategory.id,
      subjectId: subjects[5].id,
      classId: classes[5].id,
      url: '/resources/me-workshop.pdf',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Electrical Safety Guidelines',
      titleAr: 'إرشادات السلامة الكهربائية',
      descriptionEn: 'Safety guidelines for electrical engineering labs',
      descriptionAr: 'إرشادات السلامة لمختبرات الهندسة الكهربائية',
      typeId: documentType.id,
      categoryId: referenceCategory.id,
      subjectId: subjects[6].id,
      classId: classes[6].id,
      url: '/resources/electrical-safety.pdf',
      isActive: true,
      createdBy: adminUser.id
    }
  ];

  for (const resourceData of resources) {
    try {
      const resource = await prisma.resource.create({ data: resourceData });
      console.log(`  ✅ Resource: ${resource.titleEn}`);
    } catch (error) {
      console.log(`  ℹ️  Resource already exists: ${resourceData.titleEn}`);
    }
  }
  
  console.log(`✅ Resources complete: ${resources.length}`);
}

async function createAnnouncements(users, programs, classes, adminUser) {
  const allAudience = await prisma.targetAudienceTypes.findFirst({ where: { code: 'ALL' } });
  const studentsAudience = await prisma.targetAudienceTypes.findFirst({ where: { code: 'STUDENTS' } });
  const instructorsAudience = await prisma.targetAudienceTypes.findFirst({ where: { code: 'INSTRUCTORS' } });
  const normalPriority = await prisma.priorityTypes.findFirst({ where: { code: 'NORMAL' } });

  const announcements = [
    {
      titleEn: 'Welcome to Spring Semester 2025',
      titleAr: 'مرحبا بكم في فصل الربيع 2025',
      descriptionEn: 'We are excited to welcome all students to the Spring 2025 semester. Please check your class schedules and prepare for the upcoming term.',
      descriptionAr: 'نحن سعداء بترحيب جميع الطلاب في فصل الربيع 2025. يرجى التحقق من جداول الفصول الدراسية والاستعداد للفصل القادم.',
      priorityId: normalPriority.id,
      targetAudienceId: allAudience.id,
      programId: programs[0].id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Python Lab Schedule Update',
      titleAr: 'تحديث جدول مختبر بايثون',
      descriptionEn: 'The Python lab schedule has been updated. Please check the new timing for CS101 sections.',
      descriptionAr: 'تم تحديث جدول مختبر بايثون. يرجى التحقق من التوقيت الجديد لأقسام CS101.',
      priorityId: normalPriority.id,
      targetAudienceId: studentsAudience.id,
      classId: classes[0].id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Engineering Mathematics Midterm',
      titleAr: 'امتحان منتصف الفصل للرياضيات الهندسية',
      descriptionEn: 'Midterm exam for Engineering Mathematics will be held next week. Please prepare accordingly.',
      descriptionAr: 'سيتم عقد امتحان منتصف الفصل للرياضيات الهندسية الأسبوع القادم. يرجى الاستعداد وفقا لذلك.',
      priorityId: normalPriority.id,
      targetAudienceId: studentsAudience.id,
      classId: classes[4].id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'New Resources Available',
      titleAr: 'موارد جديدة متاحة',
      descriptionEn: 'New learning resources have been uploaded for all courses. Check the resources section.',
      descriptionAr: 'تم رفع موارد تعليمية جديدة لجميع الدورات. تحقق من قسم الموارد.',
      priorityId: normalPriority.id,
      targetAudienceId: allAudience.id,
      programId: programs[1].id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Instructor Meeting',
      titleAr: 'اجتماع المدربين',
      descriptionEn: 'Monthly instructor meeting scheduled for next Monday. Please confirm your attendance.',
      descriptionAr: 'اجتماع المدربين الشهري المجدول يوم الاثنين القادم. يرجى تأكيد حضوركم.',
      priorityId: normalPriority.id,
      targetAudienceId: instructorsAudience.id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Digital Logic Lab Assignment',
      titleAr: 'واجب مختبر المنطق الرقمي',
      descriptionEn: 'New lab assignment for Digital Logic Design has been posted. Due date is next Friday.',
      descriptionAr: 'تم نشر واجب مختبر جديد لتصميم المنطق الرقمي. الموعد النهائي هو الجمعة القادمة.',
      priorityId: normalPriority.id,
      targetAudienceId: studentsAudience.id,
      classId: classes[7].id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Database Project Guidelines',
      titleAr: 'إرشادات مشروع قواعد البيانات',
      descriptionEn: 'Guidelines for the database systems project have been uploaded. Please review carefully.',
      descriptionAr: 'تم رفع إرشادات مشروع أنظمة قواعد البيانات. يرجى المراجعة بعناية.',
      priorityId: normalPriority.id,
      targetAudienceId: studentsAudience.id,
      classId: classes[3].id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Career Fair Announcement',
      titleAr: 'إعلان معرض الوظائف',
      descriptionEn: 'Annual engineering career fair will be held next month. All students are encouraged to attend.',
      descriptionAr: 'سيتم عرض وظائف الهندسة السنوي الشهر القادم. يشجع جميع الطلاب على الحضور.',
      priorityId: normalPriority.id,
      targetAudienceId: allAudience.id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'HR Policy Update',
      titleAr: 'تحديث سياسة الموارد البشرية',
      descriptionEn: 'New HR policies have been updated. Please review the changes.',
      descriptionAr: 'تم تحديث سياسات الموارد البشرية الجديدة. يرجى مراجعة التغييرات.',
      priorityId: normalPriority.id,
      targetAudienceId: allAudience.id,
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'System Maintenance Notice',
      titleAr: 'إشعار صيانة النظام',
      descriptionEn: 'System maintenance scheduled for this weekend. Please save your work.',
      descriptionAr: 'صيانة النظام المجدولة لهذا نهاية الأسبوع. يرجى حفظ عملك.',
      priorityId: normalPriority.id,
      targetAudienceId: allAudience.id,
      isActive: true,
      createdBy: adminUser.id
    }
  ];

  for (const announcementData of announcements) {
    try {
      const announcement = await prisma.announcement.create({ data: announcementData });
      console.log(`  ✅ Announcement: ${announcement.titleEn}`);
    } catch (error) {
      console.log(`  ℹ️  Announcement already exists: ${announcementData.titleEn}`);
    }
  }
  
  console.log(`✅ Announcements complete: ${announcements.length}`);
}

async function createParticipations(users, classes, adminUser) {
  const positiveType = await prisma.participationTypes.findFirst({ where: { code: 'POSITIVE' } });
  const excellentType = await prisma.participationTypes.findFirst({ where: { code: 'EXCELLENT' } });
  const helpfulType = await prisma.participationTypes.findFirst({ where: { code: 'HELPFUL' } });

  // Get student users (last 10)
  const students = users.slice(-10);

  const participations = [
    {
      userId: students[0].id, classId: classes[0].id, programId: classes[0].programId, subjectId: classes[0].subjectId,
      typeId: positiveType.id, points: 3, descriptionEn: 'Active participation in class discussion', descriptionAr: 'مشاركة نشطة في مناقشة الفصل', createdBy: adminUser.id
    },
    {
      userId: students[1].id, classId: classes[0].id, programId: classes[0].programId, subjectId: classes[0].subjectId,
      typeId: excellentType.id, points: 5, descriptionEn: 'Excellent presentation on algorithms', descriptionAr: 'عرض ممتاز حول الخوارزميات', createdBy: adminUser.id
    },
    {
      userId: students[2].id, classId: classes[1].id, programId: classes[1].programId, subjectId: classes[1].subjectId,
      typeId: helpfulType.id, points: 4, descriptionEn: 'Helped peers with lab exercises', descriptionAr: 'ساعد الزملاء في تمارين المختبر', createdBy: adminUser.id
    },
    {
      userId: students[3].id, classId: classes[2].id, programId: classes[2].programId, subjectId: classes[2].subjectId,
      typeId: positiveType.id, points: 3, descriptionEn: 'Good questions during lecture', descriptionAr: 'أسئلة جيدة خلال المحاضرة', createdBy: adminUser.id
    },
    {
      userId: students[4].id, classId: classes[3].id, programId: classes[3].programId, subjectId: classes[3].subjectId,
      typeId: excellentType.id, points: 5, descriptionEn: 'Outstanding database design project', descriptionAr: 'مشروع تصميم قواعد بيانات ممتاز', createdBy: adminUser.id
    },
    {
      userId: students[5].id, classId: classes[4].id, programId: classes[4].programId, subjectId: classes[4].subjectId,
      typeId: helpfulType.id, points: 4, descriptionEn: 'Assisted classmates with math problems', descriptionAr: 'ساعد الزملاء في مسائل الرياضيات', createdBy: adminUser.id
    },
    {
      userId: students[6].id, classId: classes[5].id, programId: classes[5].programId, subjectId: classes[5].subjectId,
      typeId: positiveType.id, points: 3, descriptionEn: 'Regular attendance and participation', descriptionAr: 'حضور ومشاركة منتظمة', createdBy: adminUser.id
    },
    {
      userId: students[7].id, classId: classes[6].id, programId: classes[6].programId, subjectId: classes[6].subjectId,
      typeId: excellentType.id, points: 5, descriptionEn: 'Excellent circuit analysis work', descriptionAr: 'عمل ممتاز في تحليل الدوائر', createdBy: adminUser.id
    },
    {
      userId: students[8].id, classId: classes[7].id, programId: classes[7].programId, subjectId: classes[7].subjectId,
      typeId: helpfulType.id, points: 4, descriptionEn: 'Helped organize lab materials', descriptionAr: 'ساعد في تنظيم مواد المختبر', createdBy: adminUser.id
    },
    {
      userId: students[9].id, classId: classes[0].id, programId: classes[0].programId, subjectId: classes[0].subjectId,
      typeId: positiveType.id, points: 3, descriptionEn: 'Consistent class participation', descriptionAr: 'مشاركة صفية مستمرة', createdBy: adminUser.id
    },
    {
      userId: students[0].id, classId: classes[2].id, programId: classes[2].programId, subjectId: classes[2].subjectId,
      typeId: excellentType.id, points: 5, descriptionEn: 'Exceptional algorithm implementation', descriptionAr: 'تنفيذ خوارزميات استثنائي', createdBy: adminUser.id
    },
    {
      userId: students[1].id, classId: classes[3].id, programId: classes[3].programId, subjectId: classes[3].subjectId,
      typeId: helpfulType.id, points: 4, descriptionEn: 'Mentored junior students', descriptionAr: 'وجه الطلاب الجدد', createdBy: adminUser.id
    },
    {
      userId: students[2].id, classId: classes[4].id, programId: classes[4].programId, subjectId: classes[4].subjectId,
      typeId: positiveType.id, points: 3, descriptionEn: 'Active in group discussions', descriptionAr: 'نشط في المناقشات الجماعية', createdBy: adminUser.id
    },
    {
      userId: students[3].id, classId: classes[5].id, programId: classes[5].programId, subjectId: classes[5].subjectId,
      typeId: excellentType.id, points: 5, descriptionEn: 'Exceptional thermodynamics understanding', descriptionAr: 'فهم استثنائي للديناميكا الحرارية', createdBy: adminUser.id
    },
    {
      userId: students[4].id, classId: classes[6].id, programId: classes[6].programId, subjectId: classes[6].subjectId,
      typeId: helpfulType.id, points: 4, descriptionEn: 'Shared helpful study notes', descriptionAr: 'شارك ملاحظات دراسية مفيدة', createdBy: adminUser.id
    }
  ];

  for (const participationData of participations) {
    try {
      await prisma.participation.create({ data: participationData });
      console.log(`  ✅ Participation created`);
    } catch (error) {
      console.log(`  ℹ️  Participation already exists`);
    }
  }
  
  console.log(`✅ Participations complete: ${participations.length}`);
}

async function createBehaviors(users, classes, adminUser) {
  const excellentType = await prisma.behaviorTypes.findFirst({ where: { code: 'EXCELLENT_PARTICIPATION' } });
  const helpingType = await prisma.behaviorTypes.findFirst({ where: { code: 'HELPING_PEERS' } });
  const leadershipType = await prisma.behaviorTypes.findFirst({ where: { code: 'LEADERSHIP' } });
  const disruptiveType = await prisma.behaviorTypes.findFirst({ where: { code: 'DISRUPTIVE' } });
  const unpreparedType = await prisma.behaviorTypes.findFirst({ where: { code: 'UNPREPARED' } });

  // Get student users (last 10)
  const students = users.slice(-10);

  const behaviors = [
    {
      userId: students[0].id, classId: classes[0].id, programId: classes[0].programId, subjectId: classes[0].subjectId, typeId: excellentType.id,
      points: 5, descriptionEn: 'Consistently demonstrates leadership in group activities', descriptionAr: 'يظهر باستمرار قيادة في الأنشطة الجماعية', comment: 'Consistently demonstrates leadership in group activities', createdBy: adminUser.id
    },
    {
      userId: students[1].id, classId: classes[0].id, programId: classes[0].programId, subjectId: classes[0].subjectId, typeId: helpingType.id,
      points: 3, descriptionEn: 'Regularly assists other students with difficult concepts', descriptionAr: 'يساعد بانتظام الطلاب الآخرين في المفاهيم الصعبة', comment: 'Regularly assists other students with difficult concepts', createdBy: adminUser.id
    },
    {
      userId: students[2].id, classId: classes[1].id, programId: classes[1].programId, subjectId: classes[1].subjectId, typeId: disruptiveType.id,
      points: -2, descriptionEn: 'Occasional disruption during lectures', descriptionAr: 'إزعاج عرضي خلال المحاضرات', comment: 'Occasional disruption during lectures', createdBy: adminUser.id
    },
    {
      userId: students[3].id, classId: classes[2].id, programId: classes[2].programId, subjectId: classes[2].subjectId, typeId: leadershipType.id,
      points: 4, descriptionEn: 'Led successful group project presentation', descriptionAr: 'قاد عرض مشروع جماعي ناجح', comment: 'Led successful group project presentation', createdBy: adminUser.id
    },
    {
      userId: students[4].id, classId: classes[3].id, programId: classes[3].programId, subjectId: classes[3].subjectId, typeId: excellentType.id,
      points: 5, descriptionEn: 'Outstanding contribution to class discussions', descriptionAr: 'مساهمة استثنائية في المناقشات الصفية', comment: 'Outstanding contribution to class discussions', createdBy: adminUser.id
    },
    {
      userId: students[5].id, classId: classes[4].id, programId: classes[4].programId, subjectId: classes[4].subjectId, typeId: unpreparedType.id,
      points: -1, descriptionEn: 'Unprepared for several classes', descriptionAr: 'غير مستعد لعدة فصول', comment: 'Unprepared for several classes', createdBy: adminUser.id
    },
    {
      userId: students[6].id, classId: classes[5].id, programId: classes[5].programId, subjectId: classes[5].subjectId, typeId: helpingType.id,
      points: 3, descriptionEn: 'Helps organize study groups', descriptionAr: 'يساعد في تنظيم مجموعات الدراسة', comment: 'Helps organize study groups', createdBy: adminUser.id
    },
    {
      userId: students[7].id, classId: classes[6].id, programId: classes[6].programId, subjectId: classes[6].subjectId, typeId: excellentType.id,
      points: 5, descriptionEn: 'Exceptional lab work and documentation', descriptionAr: 'عمل مختبري وتوثيق استثنائي', comment: 'Exceptional lab work and documentation', createdBy: adminUser.id
    },
    {
      userId: students[8].id, classId: classes[7].id, programId: classes[7].programId, subjectId: classes[7].subjectId, typeId: leadershipType.id,
      points: 4, descriptionEn: 'Took initiative in class project', descriptionAr: 'أبادر في مشروع الفصل', comment: 'Took initiative in class project', createdBy: adminUser.id
    },
    {
      userId: students[9].id, classId: classes[0].id, programId: classes[0].programId, subjectId: classes[0].subjectId, typeId: disruptiveType.id,
      points: -2, descriptionEn: 'Disrupted class with phone usage', descriptionAr: 'أزعج الفصل باستخدام الهاتف', comment: 'Disrupted class with phone usage', createdBy: adminUser.id
    }
  ];

  for (const behaviorData of behaviors) {
    try {
      await prisma.behavior.create({ data: behaviorData });
      console.log(`  ✅ Behavior created`);
    } catch (error) {
      console.log(`  ℹ️  Behavior already exists`);
    }
  }
  
  console.log(`✅ Behaviors complete: ${behaviors.length}`);
}

async function createPenalties(users, classes, adminUser) {
  const lateType = await prisma.penaltyTypes.findFirst({ where: { code: 'LATE_SUBMISSION' } });
  const absenceType = await prisma.penaltyTypes.findFirst({ where: { code: 'ABSENCE' } });
  const misconductType = await prisma.penaltyTypes.findFirst({ where: { code: 'MISCONDUCT' } });
  const cheatingType = await prisma.penaltyTypes.findFirst({ where: { code: 'CHEATING' } });
  const plagiarismType = await prisma.penaltyTypes.findFirst({ where: { code: 'PLAGIARISM' } });
  const disruptionType = await prisma.penaltyTypes.findFirst({ where: { code: 'DISRUPTION' } });
  const dressCodeType = await prisma.penaltyTypes.findFirst({ where: { code: 'DRESS_CODE' } });

  // Get student users (last 10)
  const students = users.slice(-10);

  const penalties = [
    {
      userId: students[2].id, classId: classes[1].id, programId: classes[1].programId, subjectId: classes[1].subjectId, typeId: lateType.id,
      descriptionEn: 'Submitted assignment 2 days late', descriptionAr: 'قدم الواجب متأخراً يومين',
      comment: 'Submitted assignment 2 days late', points: -2, createdBy: adminUser.id
    },
    {
      userId: students[3].id, classId: classes[2].id, programId: classes[2].programId, subjectId: classes[2].subjectId, typeId: absenceType.id,
      descriptionEn: 'Unexcused absence from lecture', descriptionAr: 'غياب غير معذور من المحاضرة',
      comment: 'Unexcused absence from lecture', points: -3, createdBy: adminUser.id
    },
    {
      userId: students[5].id, classId: classes[4].id, programId: classes[4].programId, subjectId: classes[4].subjectId, typeId: misconductType.id,
      descriptionEn: 'Inappropriate behavior during lab session', descriptionAr: 'سلوك غير لائق خلال جلسة المختبر',
      comment: 'Inappropriate behavior during lab session', points: -5, createdBy: adminUser.id
    },
    {
      userId: students[6].id, classId: classes[5].id, programId: classes[5].programId, subjectId: classes[5].subjectId, typeId: cheatingType.id,
      descriptionEn: 'Caught cheating during quiz', descriptionAr: 'القبض عليه الغش خلال الاختبار',
      comment: 'Caught cheating during quiz', points: -10, createdBy: adminUser.id
    },
    {
      userId: students[7].id, classId: classes[6].id, programId: classes[6].programId, subjectId: classes[6].subjectId, typeId: plagiarismType.id,
      descriptionEn: 'Plagiarized content in assignment', descriptionAr: 'محتوى منسوخ في الواجب',
      comment: 'Plagiarized content in assignment', points: -8, createdBy: adminUser.id
    },
    {
      userId: students[8].id, classId: classes[7].id, programId: classes[7].programId, subjectId: classes[7].subjectId, typeId: disruptionType.id,
      descriptionEn: 'Disrupted class with inappropriate comments', descriptionAr: 'أزعج الفصل بتعليقات غير لائقة',
      comment: 'Disrupted class with inappropriate comments', points: -4, createdBy: adminUser.id
    },
    {
      userId: students[9].id, classId: classes[0].id, programId: classes[0].programId, subjectId: classes[0].subjectId, typeId: dressCodeType.id,
      descriptionEn: 'Violation of dress code policy', descriptionAr: 'مخالفة سياسة الزي الموحد',
      comment: 'Violation of dress code policy', points: -1, createdBy: adminUser.id
    },
    {
      userId: students[0].id, classId: classes[2].id, programId: classes[2].programId, subjectId: classes[2].subjectId, typeId: misconductType.id,
      descriptionEn: 'Policy violation in lab safety', descriptionAr: 'مخالفة سياسة سلامة المختبر',
      comment: 'Policy violation in lab safety', points: -5, createdBy: adminUser.id
    }
  ];

  for (const penaltyData of penalties) {
    try {
      await prisma.penalty.create({ data: penaltyData });
      console.log(`  ✅ Penalty created: ${penaltyData.comment}`);
    } catch (error) {
      console.log(`  ℹ️  Penalty already exists`);
    }
  }
  
  console.log(`✅ Penalties complete: ${penalties.length}`);
}

async function createActivities(classes, adminUser) {
  const lectureType = await prisma.activityTypes.findFirst({ where: { code: 'LECTURE' } });
  const labType = await prisma.activityTypes.findFirst({ where: { code: 'LAB' } });
  const examType = await prisma.activityTypes.findFirst({ where: { code: 'EXAM' } });
  const workshopType = await prisma.activityTypes.findFirst({ where: { code: 'WORKSHOP' } });
  const seminarType = await prisma.activityTypes.findFirst({ where: { code: 'SEMINAR' } });
  const projectType = await prisma.activityTypes.findFirst({ where: { code: 'PROJECT' } });

  const activities = [
    {
      titleEn: 'Introduction to Python',
      titleAr: 'مقدمة في بايثون',
      descriptionEn: 'First lecture covering Python basics',
      descriptionAr: 'أول محاضرة تغطي أساسيات بايثون',
      typeId: lectureType.id,
      classId: classes[0].id,
      scheduledDate: new Date('2025-02-01T09:00:00Z'),
      duration: 90,
      location: 'Room 101',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Python Lab Session 1',
      titleAr: 'جلسة مختبر بايثون 1',
      descriptionEn: 'Hands-on Python programming exercises',
      descriptionAr: 'تمارين برمجة بايثون عملية',
      typeId: labType.id,
      classId: classes[0].id,
      scheduledDate: new Date('2025-02-02T14:00:00Z'),
      duration: 120,
      location: 'Lab 201',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Midterm Exam - CS101',
      titleAr: 'امتحان منتصف الفصل - CS101',
      descriptionEn: 'Comprehensive midterm examination',
      descriptionAr: 'امتحان منتصف الفصل شامل',
      typeId: examType.id,
      classId: classes[0].id,
      scheduledDate: new Date('2025-03-15T10:00:00Z'),
      duration: 120,
      location: 'Exam Hall A',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Data Structures Workshop',
      titleAr: 'ورشة عمل هياكل البيانات',
      descriptionEn: 'Interactive workshop on data structures',
      descriptionAr: 'ورشة عمل تفاعلية حول هياكل البيانات',
      typeId: workshopType.id,
      classId: classes[2].id,
      scheduledDate: new Date('2025-02-10T13:00:00Z'),
      duration: 180,
      location: 'Workshop Room B',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Database Design Seminar',
      titleAr: 'ندوة تصميم قواعد البيانات',
      descriptionEn: 'Guest lecture on advanced database design',
      descriptionAr: 'محاضرة ضيف حول تصميم قواعد البيانات المتقدم',
      typeId: seminarType.id,
      classId: classes[3].id,
      scheduledDate: new Date('2025-02-20T15:00:00Z'),
      duration: 90,
      location: 'Conference Room 1',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Engineering Mathematics Lab',
      titleAr: 'مختبر الرياضيات الهندسية',
      descriptionEn: 'Practical application of mathematical concepts',
      descriptionAr: 'تطبيق عملي للمفاهيم الرياضية',
      typeId: labType.id,
      classId: classes[4].id,
      scheduledDate: new Date('2025-02-05T09:00:00Z'),
      duration: 120,
      location: 'Math Lab 1',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Thermodynamics Lecture',
      titleAr: 'محاضرة الديناميكا الحرارية',
      descriptionEn: 'Introduction to thermodynamic principles',
      descriptionAr: 'مقدمة في مبادئ الديناميكا الحرارية',
      typeId: lectureType.id,
      classId: classes[5].id,
      scheduledDate: new Date('2025-02-08T10:00:00Z'),
      duration: 90,
      location: 'Room 205',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Circuit Analysis Final Exam',
      titleAr: 'امتحان نهائي تحليل الدوائر',
      descriptionEn: 'Final examination for circuit analysis',
      descriptionAr: 'الامتحان النهائي لتحليل الدوائر',
      typeId: examType.id,
      classId: classes[6].id,
      scheduledDate: new Date('2025-04-20T09:00:00Z'),
      duration: 150,
      location: 'Exam Hall B',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Digital Logic Project',
      titleAr: 'مشروع المنطق الرقمي',
      descriptionEn: 'Final project for digital logic design course',
      descriptionAr: 'المشروع النهائي لمادة تصميم المنطق الرقمي',
      typeId: projectType.id,
      classId: classes[7].id,
      scheduledDate: new Date('2025-04-15T14:00:00Z'),
      duration: 180,
      location: 'Project Lab',
      isActive: true,
      createdBy: adminUser.id
    },
    {
      titleEn: 'Software Engineering Review',
      titleAr: 'مراجعة هندسة البرمجيات',
      descriptionEn: 'Comprehensive review session for final exam',
      descriptionAr: 'جلسة مراجعة شاملة للامتحان النهائي',
      typeId: lectureType.id,
      classId: classes[3].id,
      scheduledDate: new Date('2025-04-25T16:00:00Z'),
      duration: 120,
      location: 'Review Room A',
      isActive: true,
      createdBy: adminUser.id
    }
  ];

  for (const activityData of activities) {
    try {
      const activity = await prisma.activity.create({ data: activityData });
      console.log(`  ✅ Activity: ${activity.titleEn}`);
    } catch (error) {
      console.log(`  ℹ️  Activity already exists: ${activityData.titleEn}`);
    }
  }
  
  console.log(`✅ Activities complete: ${activities.length}`);
}

// Run the seeding
seedComprehensiveDatabase();
