import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Academic terms from 2025 to 2026 (realistic progression)
const ACADEMIC_TERMS = [
  { code: '2025-SPRING', name: 'Spring 2025', startDate: new Date('2025-01-15'), endDate: new Date('2025-05-15'), isActive: false },
  { code: '2025-SUMMER', name: 'Summer 2025', startDate: new Date('2025-06-01'), endDate: new Date('2025-08-31'), isActive: false },
  { code: '2025-FALL', name: 'Fall 2025', startDate: new Date('2025-09-01'), endDate: new Date('2025-12-31'), isActive: true },
  { code: '2026-SPRING', name: 'Spring 2026', startDate: new Date('2026-01-15'), endDate: new Date('2026-05-15'), isActive: false }
];

// Programs (only 2 as requested)
const PROGRAMS = [
  { code: 'CS-ENG', name: 'Computer Engineering', nameAr: 'هندسة الحاسوب' },
  { code: 'ME-ENG', name: 'Mechanical Engineering', nameAr: 'الهندسة الميكانيكية' }
];

// Subjects for each program with realistic progression
const SUBJECTS = {
  'CS-ENG': [
    // Freshman Level - Spring 2025
    { code: 'CS101', name: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 4, level: 100, term: '2025-SPRING', instructor: 'shareef.hiasat@gmail.com' },
    { code: 'CS102', name: 'Python Programming I', nameAr: 'برمجة بايثون الأولى', credits: 4, level: 100, term: '2025-SPRING', instructor: 'shareef.hiasat@gmail.com' },
    { code: 'MATH101', name: 'Discrete Mathematics', nameAr: 'الرياضيات المتقطعة', credits: 3, level: 100, term: '2025-SPRING', instructor: 'instructor1@military-lms.com' },
    { code: 'ENG101', name: 'Technical English', nameAr: 'اللغة الإنجليزية التقنية', credits: 3, level: 100, term: '2025-SPRING', instructor: 'instructor2@military-lms.com' },
    
    // Freshman Level - Summer 2025
    { code: 'CS103', name: 'Web Development Fundamentals', nameAr: 'أساسيات تطوير الويب', credits: 3, level: 100, term: '2025-SUMMER', instructor: 'shareef.hiasat@gmail.com' },
    { code: 'CS104', name: 'Digital Logic', nameAr: 'المنطق الرقمي', credits: 4, level: 100, term: '2025-SUMMER', instructor: 'instructor3@military-lms.com' },
    
    // Sophomore Level - Fall 2025
    { code: 'CS201', name: 'Data Structures and Algorithms', nameAr: 'هياكل البيانات والخوارزميات', credits: 4, level: 200, term: '2025-FALL', instructor: 'shareef.hiasat@gmail.com' },
    { code: 'CS202', name: 'Python Programming II', nameAr: 'برمجة بايثون الثانية', credits: 4, level: 200, term: '2025-FALL', instructor: 'shareef.hiasat@gmail.com' },
    { code: 'CS203', name: 'Computer Architecture', nameAr: 'بنية الحاسوب', credits: 3, level: 200, term: '2025-FALL', instructor: 'instructor4@military-lms.com' },
    { code: 'MATH201', name: 'Calculus I', nameAr: 'التكامل الأول', credits: 4, level: 200, term: '2025-FALL', instructor: 'instructor1@military-lms.com' },
    
    // Sophomore Level - Spring 2026
    { code: 'CS301', name: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', credits: 3, level: 300, term: '2026-SPRING', instructor: 'shareef.hiasat@gmail.com' },
    { code: 'CS302', name: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 4, level: 300, term: '2026-SPRING', instructor: 'instructor5@military-lms.com' },
    { code: 'CS303', name: 'Operating Systems', nameAr: 'أنظمة التشغيل', credits: 4, level: 300, term: '2026-SPRING', instructor: 'instructor6@military-lms.com' },
    { code: 'CS304', name: 'Computer Networks', nameAr: 'شبكات الحاسوب', credits: 3, level: 300, term: '2026-SPRING', instructor: 'instructor7@military-lms.com' }
  ],
  'ME-ENG': [
    // Freshman Level - Spring 2025
    { code: 'ME101', name: 'Engineering Mathematics I', nameAr: 'الرياضيات الهندسية الأولى', credits: 4, level: 100, term: '2025-SPRING', instructor: 'instructor8@military-lms.com' },
    { code: 'ME102', name: 'Engineering Physics', nameAr: 'الفيزياء الهندسية', credits: 4, level: 100, term: '2025-SPRING', instructor: 'instructor9@military-lms.com' },
    { code: 'ME103', name: 'Technical Drawing', nameAr: 'الرسم التقني', credits: 3, level: 100, term: '2025-SPRING', instructor: 'instructor10@military-lms.com' },
    { code: 'ME104', name: 'Workshop Technology', nameAr: 'تقنية الورش', credits: 3, level: 100, term: '2025-SPRING', instructor: 'instructor11@military-lms.com' },
    
    // Freshman Level - Summer 2025
    { code: 'ME105', name: 'Mechanics I', nameAr: 'الميكانيكا الأولى', credits: 4, level: 100, term: '2025-SUMMER', instructor: 'instructor12@military-lms.com' },
    { code: 'ME106', name: 'Materials Science', nameAr: 'علم المواد', credits: 3, level: 100, term: '2025-SUMMER', instructor: 'instructor13@military-lms.com' },
    
    // Sophomore Level - Fall 2025
    { code: 'ME201', name: 'Thermodynamics', nameAr: 'الديناميكا الحرارية', credits: 4, level: 200, term: '2025-FALL', instructor: 'instructor14@military-lms.com' },
    { code: 'ME202', name: 'Fluid Mechanics', nameAr: 'ميكانيكا الموائع', credits: 3, level: 200, term: '2025-FALL', instructor: 'instructor15@military-lms.com' },
    { code: 'ME203', name: 'Engineering Mathematics II', nameAr: 'الرياضيات الهندسية الثانية', credits: 4, level: 200, term: '2025-FALL', instructor: 'instructor16@military-lms.com' },
    { code: 'ME204', name: 'Manufacturing Processes', nameAr: 'عمليات التصنيع', credits: 3, level: 200, term: '2025-FALL', instructor: 'instructor17@military-lms.com' },
    
    // Sophomore Level - Spring 2026
    { code: 'ME301', name: 'Machine Design', nameAr: 'تصميم الآلات', credits: 4, level: 300, term: '2026-SPRING', instructor: 'instructor18@military-lms.com' },
    { code: 'ME302', name: 'Heat Transfer', nameAr: 'انتقال الحرارة', credits: 3, level: 300, term: '2026-SPRING', instructor: 'instructor19@military-lms.com' },
    { code: 'ME303', name: 'Vibrations and Control', nameAr: 'الاهتزازات والتحكم', credits: 4, level: 300, term: '2026-SPRING', instructor: 'instructor20@military-lms.com' }
  ]
};

// Student profiles with realistic academic performance types
const STUDENT_PROFILES = {
  'CS-ENG': [
    // Weak students (20%)
    { email: 'ahmed.weak@military-lms.com', firstName: 'Ahmed', lastName: 'Almulla', performance: 'weak', gpa: 2.1 },
    { email: 'fatima.struggle@military-lms.com', firstName: 'Fatima', lastName: 'Alhashmi', performance: 'weak', gpa: 2.3 },
    { email: 'mohammed.difficult@military-lms.com', firstName: 'Mohammed', lastName: 'Alrashid', performance: 'weak', gpa: 2.0 },
    { email: 'nora.challenged@military-lms.com', firstName: 'Nora', lastName: 'Khalifa', performance: 'weak', gpa: 2.2 },
    { email: 'khalid.struggling@military-lms.com', firstName: 'Khalid', lastName: 'Alsaadi', performance: 'weak', gpa: 2.4 },
    
    // Average students (40%)
    { email: 'sara.average@military-lms.com', firstName: 'Sara', lastName: 'Almehairi', performance: 'average', gpa: 3.0 },
    { email: 'omar.normal@military-lms.com', firstName: 'Omar', lastName: 'Alshammari', performance: 'average', gpa: 3.1 },
    { email: 'layla.typical@military-lms.com', firstName: 'Layla', lastName: 'Ahmad', performance: 'average', gpa: 2.9 },
    { email: 'abdullah.standard@military-lms.com', firstName: 'Abdullah', lastName: 'Khalifa', performance: 'average', gpa: 3.2 },
    { email: 'mariam.regular@military-lms.com', firstName: 'Mariam', lastName: 'Alali', performance: 'average', gpa: 3.0 },
    { email: 'hassan.moderate@military-lms.com', firstName: 'Hassan', lastName: 'Alnuaimi', performance: 'average', gpa: 3.1 },
    { email: 'ameera.normal@military-lms.com', firstName: 'Ameera', lastName: 'Alhammadi', performance: 'average', gpa: 2.8 },
    { email: 'saeed.typical@military-lms.com', firstName: 'Saeed', lastName: 'Albalushi', performance: 'average', gpa: 3.0 },
    { email: 'khawla.standard@military-lms.com', firstName: 'Khawla', lastName: 'Alshamsi', performance: 'average', gpa: 3.2 },
    { email: 'shamma.regular@military-lms.com', firstName: 'Shamma', lastName: 'Alsuwaidi', performance: 'average', gpa: 2.9 },
    
    // Smart students (30%)
    { email: 'yousef.bright@military-lms.com', firstName: 'Yousef', lastName: 'Almarzooqi', performance: 'smart', gpa: 3.6 },
    { email: 'aisha.intelligent@military-lms.com', firstName: 'Aisha', lastName: 'Almansoori', performance: 'smart', gpa: 3.7 },
    { email: 'sultan.clever@military-lms.com', firstName: 'Sultan', lastName: 'Alhammadi', performance: 'smart', gpa: 3.5 },
    { email: 'mansour.sharp@military-lms.com', firstName: 'Mansour', lastName: 'Alqassimi', performance: 'smart', gpa: 3.8 },
    { email: 'noura.bright@military-lms.com', firstName: 'Noura', lastName: 'Alfahad', performance: 'smart', gpa: 3.6 },
    { email: 'khalid.smart@military-lms.com', firstName: 'Khalid', lastName: 'Albalushi', performance: 'smart', gpa: 3.7 },
    
    // Geek students (10%)
    { email: 'ali.genius@military-lms.com', firstName: 'Ali', lastName: 'Alhammadi', performance: 'geek', gpa: 3.9 },
    { email: 'maryam.brilliant@military-lms.com', firstName: 'Maryam', lastName: 'Almehairi', performance: 'geek', gpa: 4.0 },
    { email: 'mohammed.excellent@military-lms.com', firstName: 'Mohammed', lastName: 'Alshammari', performance: 'geek', gpa: 3.9 },
    { email: 'fatima.outstanding@military-lms.com', firstName: 'Fatima', lastName: 'Alhashmi', performance: 'geek', gpa: 4.0 }
  ],
  'ME-ENG': [
    // Similar distribution for Mechanical Engineering
    { email: 'khalid.me.weak@military-lms.com', firstName: 'Khalid', lastName: 'Alsaadi', performance: 'weak', gpa: 2.1 },
    { email: 'layla.me.struggle@military-lms.com', firstName: 'Layla', lastName: 'Ahmad', performance: 'weak', gpa: 2.3 },
    { email: 'abdullah.me.difficult@military-lms.com', firstName: 'Abdullah', lastName: 'Khalifa', performance: 'weak', gpa: 2.0 },
    { email: 'mariam.me.challenged@military-lms.com', firstName: 'Mariam', lastName: 'Alali', performance: 'weak', gpa: 2.2 },
    { email: 'saeed.me.struggling@military-lms.com', firstName: 'Saeed', lastName: 'Albalushi', performance: 'weak', gpa: 2.4 },
    
    { email: 'khawla.me.average@military-lms.com', firstName: 'Khawla', lastName: 'Alshamsi', performance: 'average', gpa: 3.0 },
    { email: 'mansour.me.normal@military-lms.com', firstName: 'Mansour', lastName: 'Alqassimi', performance: 'average', gpa: 3.1 },
    { email: 'shamma.me.typical@military-lms.com', firstName: 'Shamma', lastName: 'Alsuwaidi', performance: 'average', gpa: 2.9 },
    { email: 'omar.me.standard@military-lms.com', firstName: 'Omar', lastName: 'Alshammari', performance: 'average', gpa: 3.2 },
    { email: 'hassan.me.regular@military-lms.com', firstName: 'Hassan', lastName: 'Alnuaimi', performance: 'average', gpa: 3.0 },
    { email: 'ameera.me.moderate@military-lms.com', firstName: 'Ameera', lastName: 'Alhammadi', performance: 'average', gpa: 3.1 },
    { email: 'sultan.me.typical@military-lms.com', firstName: 'Sultan', lastName: 'Alhammadi', performance: 'average', gpa: 2.8 },
    { email: 'noura.me.standard@military-lms.com', firstName: 'Noura', lastName: 'Alfahad', performance: 'average', gpa: 3.0 },
    { email: 'yousef.me.regular@military-lms.com', firstName: 'Yousef', lastName: 'Almarzooqi', performance: 'average', gpa: 3.2 },
    { email: 'aisha.me.normal@military-lms.com', firstName: 'Aisha', lastName: 'Almansoori', performance: 'average', gpa: 2.9 },
    
    { email: 'ali.me.bright@military-lms.com', firstName: 'Ali', lastName: 'Alhammadi', performance: 'smart', gpa: 3.6 },
    { email: 'maryam.me.intelligent@military-lms.com', firstName: 'Maryam', lastName: 'Almehairi', performance: 'smart', gpa: 3.7 },
    { email: 'mohammed.me.clever@military-lms.com', firstName: 'Mohammed', lastName: 'Alshammari', performance: 'smart', gpa: 3.5 },
    { email: 'fatima.me.sharp@military-lms.com', firstName: 'Fatima', lastName: 'Alhashmi', performance: 'smart', gpa: 3.8 },
    { email: 'khalid.me.bright@military-lms.com', firstName: 'Khalid', lastName: 'Albalushi', performance: 'smart', gpa: 3.6 },
    { email: 'layla.me.smart@military-lms.com', firstName: 'Layla', lastName: 'Ahmad', performance: 'smart', gpa: 3.7 },
    
    { email: 'abdullah.me.genius@military-lms.com', firstName: 'Abdullah', lastName: 'Khalifa', performance: 'geek', gpa: 3.9 },
    { email: 'mariam.me.brilliant@military-lms.com', firstName: 'Mariam', lastName: 'Alali', performance: 'geek', gpa: 4.0 },
    { email: 'saeed.me.excellent@military-lms.com', firstName: 'Saeed', lastName: 'Albalushi', performance: 'geek', gpa: 3.9 },
    { email: 'khawla.me.outstanding@military-lms.com', firstName: 'Khawla', lastName: 'Alshamsi', performance: 'geek', gpa: 4.0 }
  ]
};

// Instructors (20 total)
const INSTRUCTORS = [
  { email: 'shareef.hiasat@gmail.com', firstName: 'Shareef', lastName: 'Hiasat', role: 'SUPER_ADMIN' },
  { email: 'instructor1@military-lms.com', firstName: 'Dr. Ahmad', lastName: 'Khalifa', role: 'INSTRUCTOR' },
  { email: 'instructor2@military-lms.com', firstName: 'Prof. Sara', lastName: 'Almehairi', role: 'INSTRUCTOR' },
  { email: 'instructor3@military-lms.com', firstName: 'Dr. Omar', lastName: 'Alshammari', role: 'INSTRUCTOR' },
  { email: 'instructor4@military-lms.com', firstName: 'Prof. Layla', lastName: 'Ahmad', role: 'INSTRUCTOR' },
  { email: 'instructor5@military-lms.com', firstName: 'Dr. Abdullah', lastName: 'Khalifa', role: 'INSTRUCTOR' },
  { email: 'instructor6@military-lms.com', firstName: 'Prof. Mariam', lastName: 'Alali', role: 'INSTRUCTOR' },
  { email: 'instructor7@military-lms.com', firstName: 'Dr. Hassan', lastName: 'Alnuaimi', role: 'INSTRUCTOR' },
  { email: 'instructor8@military-lms.com', firstName: 'Prof. Ameera', lastName: 'Alhammadi', role: 'INSTRUCTOR' },
  { email: 'instructor9@military-lms.com', firstName: 'Dr. Saeed', lastName: 'Albalushi', role: 'INSTRUCTOR' },
  { email: 'instructor10@military-lms.com', firstName: 'Prof. Khawla', lastName: 'Alshamsi', role: 'INSTRUCTOR' },
  { email: 'instructor11@military-lms.com', firstName: 'Dr. Mansour', lastName: 'Alqassimi', role: 'INSTRUCTOR' },
  { email: 'instructor12@military-lms.com', firstName: 'Prof. Shamma', lastName: 'Alsuwaidi', role: 'INSTRUCTOR' },
  { email: 'instructor13@military-lms.com', firstName: 'Dr. Sultan', lastName: 'Alhammadi', role: 'INSTRUCTOR' },
  { email: 'instructor14@military-lms.com', firstName: 'Prof. Noura', lastName: 'Alfahad', role: 'INSTRUCTOR' },
  { email: 'instructor15@military-lms.com', firstName: 'Dr. Yousef', lastName: 'Almarzooqi', role: 'INSTRUCTOR' },
  { email: 'instructor16@military-lms.com', firstName: 'Prof. Aisha', lastName: 'Almansoori', role: 'INSTRUCTOR' },
  { email: 'instructor17@military-lms.com', firstName: 'Dr. Ali', lastName: 'Alhammadi', role: 'INSTRUCTOR' },
  { email: 'instructor18@military-lms.com', firstName: 'Prof. Maryam', lastName: 'Almehairi', role: 'INSTRUCTOR' },
  { email: 'instructor19@military-lms.com', firstName: 'Dr. Mohammed', lastName: 'Alshammari', role: 'INSTRUCTOR' },
  { email: 'instructor20@military-lms.com', firstName: 'Prof. Fatima', lastName: 'Alhashmi', role: 'INSTRUCTOR' }
];

// Admin users (6 total)
const ADMINS = [
  { email: 'admin1@military-lms.com', firstName: 'Admin', lastName: 'One', role: 'ADMIN' },
  { email: 'admin2@military-lms.com', firstName: 'Admin', lastName: 'Two', role: 'ADMIN' },
  { email: 'admin3@military-lms.com', firstName: 'Admin', lastName: 'Three', role: 'ADMIN' },
  { email: 'admin4@military-lms.com', firstName: 'Admin', lastName: 'Four', role: 'ADMIN' },
  { email: 'hr1@military-lms.com', firstName: 'HR', lastName: 'Manager', role: 'HR' },
  { email: 'hr2@military-lms.com', firstName: 'HR', lastName: 'Specialist', role: 'HR' }
];

// Grade generation based on student performance
function generateGrade(performance, credits) {
  const baseGrades = {
    weak: { min: 55, max: 69 },
    average: { min: 70, max: 84 },
    smart: { min: 85, max: 94 },
    geek: { min: 95, max: 100 }
  };
  
  const range = baseGrades[performance];
  const grade = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  // Add some variance
  const variance = Math.random() * 10 - 5; // -5 to +5
  const finalGrade = Math.max(0, Math.min(100, grade + variance));
  
  return Math.round(finalGrade);
}

// Generate grade points based on percentage
function getGradePoints(percentage) {
  if (percentage >= 95) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 85) return 3.3;
  if (percentage >= 80) return 3.0;
  if (percentage >= 75) return 2.7;
  if (percentage >= 70) return 2.3;
  if (percentage >= 65) return 2.0;
  if (percentage >= 60) return 1.7;
  if (percentage >= 55) return 1.3;
  return 1.0;
}

// Random date generator within term
function randomDateInTerm(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Main seeding function
async function seedRealisticData() {
  try {
    console.log('🚀 Starting realistic academic data seeding...\n');
    
    // 1. Update academic terms
    await updateAcademicTerms();
    
    // 2. Create instructors and admins
    await createInstructorsAndAdmins();
    
    // 3. Create programs and subjects
    await createProgramsAndSubjects();
    
    // 4. Create students and enrollments
    await createStudentsAndEnrollments();
    
    // 5. Generate realistic grades
    await generateGrades();
    
    // 6. Generate behavioral records
    await generateBehavioralRecords();
    
    // 7. Check final state
    await checkFinalState();
    
    console.log('\n🎉 Realistic academic data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function updateAcademicTerms() {
  console.log('📅 Updating academic terms...');
  
  for (const term of ACADEMIC_TERMS) {
    await prisma.$queryRaw`
      INSERT INTO academic_terms (code, "nameEn", "nameAr", description, "isActive", "createdAt", "updatedAt")
      VALUES (${term.code}, ${term.name}, ${term.name}, ${term.description || term.name}, ${term.isActive}, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET
        "nameEn" = EXCLUDED."nameEn",
        "nameAr" = EXCLUDED."nameAr",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = NOW()
    `;
  }
  
  console.log(`  ✅ Updated ${ACADEMIC_TERMS.length} academic terms`);
}

async function createInstructorsAndAdmins() {
  console.log('👥 Creating instructors and admins...');
  
  // Get user roles
  const superAdminRole = await prisma.$queryRaw`SELECT id FROM user_roles WHERE code = 'SUPER_ADMIN'`;
  const adminRole = await prisma.$queryRaw`SELECT id FROM user_roles WHERE code = 'ADMIN'`;
  const hrRole = await prisma.$queryRaw`SELECT id FROM user_roles WHERE code = 'HR'`;
  const instructorRole = await prisma.$queryRaw`SELECT id FROM user_roles WHERE code = 'INSTRUCTOR'`;
  const activeStatus = await prisma.$queryRaw`SELECT id FROM user_status_types WHERE code = 'ACTIVE'`;
  
  // Create super admin (Shareef)
  await prisma.$queryRaw`
    INSERT INTO users (email, "displayName", "firstName", "lastName", "roleId", "statusId", "createdAt", "updatedAt")
    VALUES ('shareef.hiasat@gmail.com', 'Shareef Hiasat', 'Shareef', 'Hiasat', ${superAdminRole[0].id}, ${activeStatus[0].id}, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
      "displayName" = EXCLUDED."displayName",
      "updatedAt" = NOW()
  `;
  
  // Create other instructors
  for (const instructor of INSTRUCTORS.slice(1)) {
    const roleId = instructor.role === 'ADMIN' ? adminRole[0].id : 
                  instructor.role === 'HR' ? hrRole[0].id : instructorRole[0].id;
    
    await prisma.$queryRaw`
      INSERT INTO users (email, "displayName", "firstName", "lastName", "roleId", "statusId", "createdAt", "updatedAt")
      VALUES (${instructor.email}, ${instructor.firstName + ' ' + instructor.lastName}, ${instructor.firstName}, ${instructor.lastName}, ${roleId}, ${activeStatus[0].id}, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "updatedAt" = NOW()
    `;
  }
  
  // Create admins
  for (const admin of ADMINS) {
    const roleId = admin.role === 'HR' ? hrRole[0].id : adminRole[0].id;
    
    await prisma.$queryRaw`
      INSERT INTO users (email, "displayName", "firstName", "lastName", "roleId", "statusId", "createdAt", "updatedAt")
      VALUES (${admin.email}, ${admin.firstName + ' ' + admin.lastName}, ${admin.firstName}, ${admin.lastName}, ${roleId}, ${activeStatus[0].id}, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "updatedAt" = NOW()
    `;
  }
  
  console.log(`  ✅ Created 1 super admin, ${INSTRUCTORS.length - 1} instructors, ${ADMINS.length} admins`);
}

async function createProgramsAndSubjects() {
  console.log('📚 Creating programs and subjects...');
  
  // Get subject and requirement types
  const coreType = await prisma.$queryRaw`SELECT id FROM subject_types WHERE code = 'CORE'`;
  const mandatoryType = await prisma.$queryRaw`SELECT id FROM requirement_types WHERE code = 'MANDATORY'`;
  
  for (const program of PROGRAMS) {
    // Create program
    await prisma.$queryRaw`
      INSERT INTO programs (code, "nameEn", "nameAr", description, "isActive", "createdAt", "updatedAt")
      VALUES (${program.code}, ${program.name}, ${program.nameAr}, ${program.name + ' program'}, true, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET
        "nameEn" = EXCLUDED."nameEn",
        "nameAr" = EXCLUDED."nameAr",
        "updatedAt" = NOW()
    `;
    
    const programResult = await prisma.$queryRaw`SELECT id FROM programs WHERE code = ${program.code}`;
    const programId = programResult[0].id;
    
    // Create subjects for this program
    const subjects = SUBJECTS[program.code];
    for (const subject of subjects) {
      await prisma.$queryRaw`
        INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", description, "isActive", "createdAt", "updatedAt")
        VALUES (${subject.code}, ${subject.name}, ${subject.nameAr}, ${subject.credits}, ${programId}, ${coreType[0].id}, ${mandatoryType[0].id}, ${subject.name + ' - ' + subject.level + ' level'}, true, NOW(), NOW())
        ON CONFLICT (code) DO UPDATE SET
          "nameEn" = EXCLUDED."nameEn",
          "nameAr" = EXCLUDED."nameAr",
          "credits" = EXCLUDED.credits,
          "updatedAt" = NOW()
      `;
    }
  }
  
  console.log(`  ✅ Created ${PROGRAMS.length} programs with ${Object.values(SUBJECTS).flat().length} subjects`);
}

async function createStudentsAndEnrollments() {
  console.log('🎓 Creating students and enrollments...');
  
  // Get user roles and status
  const studentRole = await prisma.$queryRaw`SELECT id FROM user_roles WHERE code = 'STUDENT'`;
  const activeStatus = await prisma.$queryRaw`SELECT id FROM user_status_types WHERE code = 'ACTIVE'`;
  const enrolledStatus = await prisma.$queryRaw`SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'`;
  
  // Get super admin user for createdBy
  const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
  const createdBy = superAdmin[0].id;
  
  for (const program of PROGRAMS) {
    const students = STUDENT_PROFILES[program.code];
    const programResult = await prisma.$queryRaw`SELECT id FROM programs WHERE code = ${program.code}`;
    const programId = programResult[0].id;
    
    // Create students
    for (const student of students) {
      await prisma.$queryRaw`
        INSERT INTO users (email, "displayName", "firstName", "lastName", "roleId", "statusId", "createdAt", "updatedAt")
        VALUES (${student.email}, ${student.firstName + ' ' + student.lastName}, ${student.firstName}, ${student.lastName}, ${studentRole[0].id}, ${activeStatus[0].id}, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          "displayName" = EXCLUDED."displayName",
          "updatedAt" = NOW()
      `;
      
      const userResult = await prisma.$queryRaw`SELECT id FROM users WHERE email = ${student.email}`;
      const userId = userResult[0].id;
      
      // Get subjects for this program
      const subjects = SUBJECTS[program.code];
      
      for (const subject of subjects) {
        // Get subject and instructor
        const subjectResult = await prisma.$queryRaw`SELECT id FROM subjects WHERE code = ${subject.code}`;
        const subjectId = subjectResult[0].id;
        
        const instructorResult = await prisma.$queryRaw`SELECT id FROM users WHERE email = ${subject.instructor}`;
        const instructorId = instructorResult[0].id;
        
        // Create class
        const classCode = `${subject.code}-${subject.term.split('-')[0]}-SEC1`;
        await prisma.$queryRaw`
          INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "isActive", "createdAt", "updatedAt")
          VALUES (${classCode}, ${subject.name + ' - Section 1'}, ${subject.nameAr + ' - شعبة 1'}, 25, ${programId}, ${subjectId}, ${instructorId}, ${subject.term}, ${subject.term.split('-')[0]}, true, NOW(), NOW())
          ON CONFLICT (code) DO UPDATE SET
            "instructorId" = EXCLUDED."instructorId",
            "updatedAt" = NOW()
        `;
        
        const classResult = await prisma.$queryRaw`SELECT id FROM classes WHERE code = ${classCode}`;
        const classId = classResult[0].id;
        
        // Create enrollment
        await prisma.$queryRaw`
          INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdBy", "createdAt", "updatedAt")
          VALUES (${userId}, ${programId}, ${subjectId}, ${classId}, ${enrolledStatus[0].id}, ${createdBy}, NOW(), NOW())
          ON CONFLICT ("userId", "classId") DO UPDATE SET
            "statusId" = EXCLUDED."statusId",
            "updatedAt" = NOW()
        `;
      }
    }
  }
  
  const totalStudents = Object.values(STUDENT_PROFILES).flat().length;
  console.log(`  ✅ Created ${totalStudents} students with enrollments`);
}

async function generateGrades() {
  console.log('📊 Generating realistic grades...');
  
  // Get super admin for createdBy
  const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
  const createdBy = superAdmin[0].id;
  
  let totalGrades = 0;
  
  for (const program of PROGRAMS) {
    const students = STUDENT_PROFILES[program.code];
    const subjects = SUBJECTS[program.code];
    
    for (const student of students) {
      const userResult = await prisma.$queryRaw`SELECT id FROM users WHERE email = ${student.email}`;
      const userId = userResult[0].id;
      
      for (const subject of subjects) {
        const classResult = await prisma.$queryRaw`SELECT id FROM classes WHERE code = ${subject.code + '-' + subject.term.split('-')[0] + '-SEC1'}`;
        if (!classResult || classResult.length === 0) continue;
        
        const classId = classResult[0].id;
        
        // Generate realistic grade based on student performance
        const grade = generateGrade(student.performance, subject.credits);
        const gradePoints = getGradePoints(grade);
        
        // Create grade record
        await prisma.$queryRaw`
          INSERT INTO marks ("userId", "classId", "programId", "subjectId", grade, "gradePoints", credits, "createdBy", "createdAt", "updatedAt")
          VALUES (${userId}, ${classId}, (SELECT "programId" FROM classes WHERE id = ${classId}), (SELECT "subjectId" FROM classes WHERE id = ${classId}), ${grade}, ${gradePoints}, ${subject.credits}, ${createdBy}, NOW(), NOW())
          ON CONFLICT ("userId", "classId") DO UPDATE SET
            grade = EXCLUDED.grade,
            "gradePoints" = EXCLUDED."gradePoints",
            "updatedAt" = NOW()
        `;
        
        totalGrades++;
      }
    }
  }
  
  console.log(`  ✅ Generated ${totalGrades} grade records`);
}

async function generateBehavioralRecords() {
  console.log('📋 Generating behavioral records...');
  
  // Get types
  const penaltyTypes = await prisma.$queryRaw`SELECT id, code FROM penalty_types`;
  const behaviorTypes = await prisma.$queryRaw`SELECT id, code FROM behavior_types`;
  const participationTypes = await prisma.$queryRaw`SELECT id, code FROM participation_types`;
  
  // Comment templates
  const penaltyComments = {
    LATE_SUBMISSION: ['Assignment submitted 2 days late', 'Project submitted after deadline', 'Lab report turned in late'],
    ABSENCE: ['Unexcused absence from lecture', 'Missed lab session without excuse', 'Absent from tutorial'],
    MISCONDUCT: ['Talking during lecture', 'Using phone in class', 'Disruptive behavior'],
    CHEATING: ['Caught looking at neighbor\'s paper', 'Unauthorized notes during exam', 'Copying from online sources'],
    SLEEP_MOBILE: ['Sleeping during lecture', 'Using mobile phone in class', 'Not paying attention']
  };
  
  const behaviorComments = {
    EXCELLENT_PARTICIPATION: ['Outstanding contributions to class discussion', 'Exceptional participation in group work'],
    HELPING_PEERS: ['Assisted struggling classmates', 'Volunteered to help with difficult concepts'],
    LEADERSHIP: ['Took initiative in group project', 'Led class discussion effectively'],
    DISRUPTIVE: ['Disrupted class with phone usage', 'Talking while instructor teaching'],
    UNPREPARED: ['Not prepared for class discussion', 'Failed to complete required reading']
  };
  
  const participationComments = {
    POSITIVE: ['Excellent participation in class discussion', 'Active engagement in learning activities'],
    LATE: ['Arrived 15 minutes late to class', 'Late to lab session'],
    HELPFUL: ['Helped fellow students understand concepts', 'Assisted peers with difficult problems'],
    EXCELLENT: ['Exceptional work on assignment', 'Outstanding performance in class']
  };
  
  let totalPenalties = 0;
  let totalBehaviors = 0;
  let totalParticipations = 0;
  
  for (const program of PROGRAMS) {
    const students = STUDENT_PROFILES[program.code];
    const subjects = SUBJECTS[program.code];
    
    for (const student of students) {
      const userResult = await prisma.$queryRaw`SELECT id FROM users WHERE email = ${student.email}`;
      const userId = userResult[0].id;
      
      for (const subject of subjects) {
        const classResult = await prisma.$queryRaw`SELECT id, "programId", "subjectId", term FROM classes WHERE code = ${subject.code + '-' + subject.term.split('-')[0] + '-SEC1'}`;
        if (!classResult || classResult.length === 0) continue;
        
        const classItem = classResult[0];
        const termInfo = ACADEMIC_TERMS.find(t => t.code === classItem.term);
        const recordDate = termInfo ? randomDateInTerm(termInfo.startDate, termInfo.endDate) : new Date();
        
        // Generate 2-5 records per class per student
        const recordsPerClass = Math.floor(Math.random() * 4) + 2;
        
        for (let i = 0; i < recordsPerClass; i++) {
          const randomRecordDate = new Date(recordDate.getTime() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000);
          
          // Penalty (40% chance for weak/average students, 20% for smart/geek)
          const penaltyChance = (student.performance === 'weak' || student.performance === 'average') ? 0.4 : 0.2;
          if (Math.random() < penaltyChance) {
            const penaltyType = penaltyTypes[Math.floor(Math.random() * penaltyTypes.length)];
            const comments = penaltyComments[penaltyType.code] || ['General penalty'];
            const comment = comments[Math.floor(Math.random() * comments.length)];
            
            await prisma.$queryRaw`
              INSERT INTO penalties ("userId", "classId", "programId", "subjectId", "typeId", "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt")
              VALUES (${userId}, ${classItem.id}, ${classItem.programId}, ${classItem.subjectId}, ${penaltyType.id}, 'Penalty for ${penaltyType.code.toLowerCase().replace('_', ' ')}', 'عقوبة ل${penaltyType.code}', ${comment}, true, ${randomRecordDate}, ${randomRecordDate})
              ON CONFLICT DO NOTHING
            `;
            totalPenalties++;
          }
          
          // Behavior (50% chance)
          if (Math.random() < 0.5) {
            const behaviorType = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
            const comments = behaviorComments[behaviorType.code] || ['General behavior'];
            const comment = comments[Math.floor(Math.random() * comments.length)];
            const points = behaviorType.code.includes('EXCELLENT') || behaviorType.code.includes('LEADERSHIP') || 
                          behaviorType.code.includes('HELPING') ? Math.floor(Math.random() * 3) + 3 : 
                          (behaviorType.code.includes('DISRUPTIVE') || behaviorType.code.includes('UNPREPARED') ? 
                           -(Math.floor(Math.random() * 3) + 1) : 0);
            
            await prisma.$queryRaw`
              INSERT INTO behaviors ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt")
              VALUES (${userId}, ${classItem.id}, ${classItem.programId}, ${classItem.subjectId}, ${behaviorType.id}, ${points}, 'Behavior: ${behaviorType.code.toLowerCase().replace('_', ' ')}', 'سلوك: ${behaviorType.code}', ${comment}, true, ${randomRecordDate}, ${randomRecordDate})
              ON CONFLICT DO NOTHING
            `;
            totalBehaviors++;
          }
          
          // Participation (60% chance)
          if (Math.random() < 0.6) {
            const participationType = participationTypes[Math.floor(Math.random() * participationTypes.length)];
            const comments = participationComments[participationType.code] || ['General participation'];
            const comment = comments[Math.floor(Math.random() * comments.length)];
            const points = participationType.code === 'POSITIVE' || participationType.code === 'EXCELLENT' || 
                          participationType.code === 'HELPFUL' ? Math.floor(Math.random() * 3) + 3 : 
                          (participationType.code === 'LATE' ? -(Math.floor(Math.random() * 2) + 1) : 
                           Math.floor(Math.random() * 2) + 1);
            
            await prisma.$queryRaw`
              INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdAt", "updatedAt")
              VALUES (${userId}, ${classItem.id}, ${classItem.programId}, ${classItem.subjectId}, ${participationType.id}, ${points}, 'Participation: ${participationType.code.toLowerCase().replace('_', ' ')}', 'مشاركة: ${participationType.code}', ${comment}, true, ${randomRecordDate}, ${randomRecordDate})
              ON CONFLICT DO NOTHING
            `;
            totalParticipations++;
          }
        }
      }
    }
  }
  
  console.log(`  ✅ Generated ${totalPenalties} penalties, ${totalBehaviors} behaviors, ${totalParticipations} participations`);
}

async function checkFinalState() {
  console.log('\n📋 Final Database State:');
  
  const users = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
  const programs = await prisma.$queryRaw`SELECT COUNT(*) as count FROM programs`;
  const subjects = await prisma.$queryRaw`SELECT COUNT(*) as count FROM subjects`;
  const classes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM classes`;
  const enrollments = await prisma.$queryRaw`SELECT COUNT(*) as count FROM enrollments`;
  const marks = await prisma.$queryRaw`SELECT COUNT(*) as count FROM marks`;
  const penalties = await prisma.$queryRaw`SELECT COUNT(*) as count FROM penalties`;
  const behaviors = await prisma.$queryRaw`SELECT COUNT(*) as count FROM behaviors`;
  const participations = await prisma.$queryRaw`SELECT COUNT(*) as count FROM participations`;
  
  console.log(`  Users: ${users[0].count}`);
  console.log(`  Programs: ${programs[0].count}`);
  console.log(`  Subjects: ${subjects[0].count}`);
  console.log(`  Classes: ${classes[0].count}`);
  console.log(`  Enrollments: ${enrollments[0].count}`);
  console.log(`  Marks: ${marks[0].count}`);
  console.log(`  Penalties: ${penalties[0].count}`);
  console.log(`  Behaviors: ${behaviors[0].count}`);
  console.log(`  Participations: ${participations[0].count}`);
  
  // Show grade distribution
  try {
    const gradeDistribution = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN grade >= 90 THEN 'A (90-100)'
          WHEN grade >= 80 THEN 'B (80-89)'
          WHEN grade >= 70 THEN 'C (70-79)'
          WHEN grade >= 60 THEN 'D (60-69)'
          ELSE 'F (0-59)'
        END as grade_range,
        COUNT(*) as count
      FROM marks 
      GROUP BY grade_range 
      ORDER BY grade_range
    `;
    console.log('\n📊 Grade Distribution:');
    gradeDistribution.forEach(g => {
      console.log(`    ${g.grade_range}: ${g.count} students`);
    });
  } catch (error) {
    console.log('  Grade Distribution: Unable to retrieve');
  }
  
  // Show super admin
  const superAdmin = await prisma.$queryRaw`SELECT email, "displayName" FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
  console.log(`\n👑 Super Admin: ${superAdmin[0].displayName} (${superAdmin[0].email})`);
  
  // Show sample grades
  try {
    const sampleGrades = await prisma.$queryRaw`
      SELECT m.grade, m."gradePoints", u."displayName", s.code as subject_code, s."nameEn" as subject_name
      FROM marks m
      JOIN users u ON m."userId" = u.id
      JOIN classes c ON m."classId" = c.id
      JOIN subjects s ON c."subjectId" = s.id
      ORDER BY m.grade DESC
      LIMIT 5
    `;
    console.log('\n📊 Top Grades:');
    sampleGrades.forEach(g => {
      console.log(`    - ${g.displayName}: ${g.subject_code} (${g.grade}% - ${g.gradePoints} GPA points)`);
    });
  } catch (error) {
    console.log('  Top Grades: No grades found');
  }
}

// Run the seed
seedRealisticData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
