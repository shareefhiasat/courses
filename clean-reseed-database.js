import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndReseedDatabase() {
  try {
    console.log('🧹 CLEANING AND RESEEDING DATABASE...\n');
    
    // Get super admin user ID
    const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    const adminId = superAdmin[0].id;
    console.log(`👑 Using Super Admin ID: ${adminId}`);

    // Clear existing student-only data (participations, penalties, behaviors)
    console.log('🗑️  Clearing existing student-only data...');
    await prisma.$queryRaw`DELETE FROM participations`;
    await prisma.$queryRaw`DELETE FROM penalties`;
    await prisma.$queryRaw`DELETE FROM behaviors`;
    await prisma.$queryRaw`DELETE FROM enrollments`;
    await prisma.$queryRaw`DELETE FROM classes`;
    await prisma.$queryRaw`DELETE FROM subjects`;
    await prisma.$queryRaw`DELETE FROM programs`;
    
    console.log('✅ Cleared existing data');

    // Seed user roles and status types
    await seedUserRolesAndStatus(adminId);
    
    // Assign roles to users
    await assignUserRoles(adminId);
    
    // Seed subject and requirement types
    await seedSubjectAndRequirementTypes(adminId);
    
    // Seed participation types
    await seedParticipationTypes(adminId);
    
    // Seed penalty types
    await seedPenaltyTypes(adminId);
    
    // Seed behavior types
    await seedBehaviorTypes(adminId);
    
    // Seed enrollment status types
    await seedEnrollmentStatusTypes(adminId);
    
    // Seed attendance status types
    await seedAttendanceStatusTypes(adminId);
    
    // Seed activity types
    await seedActivityTypes(adminId);
    
    // Seed assessment types
    await seedAssessmentTypes(adminId);
    
    // Seed resource types
    await seedResourceTypes(adminId);

    // Seed programs
    await seedPrograms(adminId);
    
    // Seed subjects with more classes
    await seedSubjects(adminId);
    
    // Seed classes
    await seedClasses(adminId);
    
    // Seed enrollments (students only)
    await seedEnrollments(adminId);
    
    // Seed participations (students only)
    await seedParticipations(adminId);
    
    // Seed penalties (students only)
    await seedPenalties(adminId);
    
    // Seed behaviors (students only)
    await seedBehaviors(adminId);

    console.log('\n🎉 CLEAN DATABASE RESEEDING COMPLETED!');
    await checkFinalState();
    
  } catch (error) {
    console.error('❌ Error during reseeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions for seeding
async function seedUserRolesAndStatus(adminId) {
  console.log('🌱 Seeding User Roles and Status Types...');
  
  const userRoles = [
    { code: 'super_admin', nameEn: 'Super Admin', nameAr: 'المسؤول الفائق', description: 'System super administrator' },
    { code: 'admin', nameEn: 'Administrator', nameAr: 'المسؤول', description: 'System administrator' },
    { code: 'hr', nameEn: 'HR Manager', nameAr: 'مدير الموارد البشرية', description: 'Human resources manager' },
    { code: 'instructor', nameEn: 'Instructor', nameAr: 'المدرس', description: 'Course instructor' },
    { code: 'student', nameEn: 'Student', nameAr: 'الطالب', description: 'Regular student' }
  ];

  for (const roleData of userRoles) {
    await prisma.$queryRaw`
      INSERT INTO "user_roles" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${roleData.code}, ${roleData.nameEn}, ${roleData.nameAr}, ${roleData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  const userStatusTypes = [
    { code: 'active', nameEn: 'Active', nameAr: 'نشط', description: 'User is active' },
    { code: 'inactive', nameEn: 'Inactive', nameAr: 'غير نشط', description: 'User is inactive' },
    { code: 'suspended', nameEn: 'Suspended', nameAr: 'معلق', description: 'User is suspended' },
    { code: 'graduated', nameEn: 'Graduated', nameAr: 'خريج', description: 'User has graduated' }
  ];

  for (const statusData of userStatusTypes) {
    await prisma.$queryRaw`
      INSERT INTO "user_status_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${statusData.code}, ${statusData.nameEn}, ${statusData.nameAr}, ${statusData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ User Roles and Status Types seeded');
}

async function assignUserRoles(adminId) {
  console.log('🌱 Assigning roles to users...');
  
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
  }

  console.log('✅ User roles assigned');
}

async function seedSubjectAndRequirementTypes(adminId) {
  console.log('🌱 Seeding Subject and Requirement Types...');
  
  const subjectTypes = [
    { code: 'core', nameEn: 'Core Subject', nameAr: 'مادة أساسية', description: 'Required core subject' },
    { code: 'elective', nameEn: 'Elective Subject', nameAr: 'مادة اختيارية', description: 'Optional elective subject' },
    { code: 'lab', nameEn: 'Laboratory', nameAr: 'معمل', description: 'Laboratory work' }
  ];

  for (const typeData of subjectTypes) {
    await prisma.$queryRaw`
      INSERT INTO "subject_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  const requirementTypes = [
    { code: 'mandatory', nameEn: 'Mandatory', nameAr: 'إلزامي', description: 'Mandatory requirement' },
    { code: 'optional', nameEn: 'Optional', nameAr: 'اختياري', description: 'Optional requirement' },
    { code: 'prerequisite', nameEn: 'Prerequisite', nameAr: 'متطلب سابق', description: 'Prerequisite requirement' }
  ];

  for (const typeData of requirementTypes) {
    await prisma.$queryRaw`
      INSERT INTO "requirement_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Subject and Requirement Types seeded');
}

async function seedParticipationTypes(adminId) {
  console.log('🌱 Seeding Participation Types...');
  
  const participationTypes = [
    { code: 'POSITIVE', nameEn: 'Positive Participation', nameAr: 'مشاركة إيجابية', description: 'Positive classroom participation', isPositive: true },
    { code: 'LATE', nameEn: 'Late Arrival', nameAr: 'تأخر عن الحضور', description: 'Late arrival to class', isPositive: false },
    { code: 'HELPFUL', nameEn: 'Helpful Behavior', nameAr: 'سلوك مساعد', description: 'Helping other students', isPositive: true },
    { code: 'EXCELLENT', nameEn: 'Excellent Work', nameAr: 'عمل ممتاز', description: 'Exceptional work quality', isPositive: true },
    { code: 'ABSENT', nameEn: 'Absence', nameAr: 'غياب', description: 'Unexcused absence', isPositive: false },
    { code: 'NEGATIVE', nameEn: 'Negative Behavior', nameAr: 'سلوك سلبي', description: 'Disruptive behavior', isPositive: false },
    { code: 'PRESENTATION', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Class presentation', isPositive: true }
  ];

  for (const typeData of participationTypes) {
    await prisma.$queryRaw`
      INSERT INTO "participation_types" (code, "nameEn", "nameAr", description, "isPositive", "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.isPositive}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Participation Types seeded');
}

async function seedPenaltyTypes(adminId) {
  console.log('🌱 Seeding Penalty Types...');
  
  const penaltyTypes = [
    { code: 'MINOR', nameEn: 'Minor Offense', nameAr: 'مخالفة طفيفة', description: 'Minor rule violation', severity: 'low', color: '#FFA500' },
    { code: 'MODERATE', nameEn: 'Moderate Offense', nameAr: 'مخالفة متوسطة', description: 'Moderate rule violation', severity: 'medium', color: '#FF8C00' },
    { code: 'MAJOR', nameEn: 'Major Offense', nameAr: 'مخالفة رئيسية', description: 'Major rule violation', severity: 'high', color: '#FF6347' },
    { code: 'SEVERE', nameEn: 'Severe Offense', nameAr: 'مخالفة شديدة', description: 'Severe rule violation', severity: 'critical', color: '#DC143C' },
    { code: 'TARDINESS', nameEn: 'Tardiness', nameAr: 'تأخر', description: 'Late arrival to class', severity: 'low', color: '#FFD700' },
    { code: 'ABSENCE', nameEn: 'Unexcused Absence', nameAr: 'غياب بدون عذر', description: 'Missing class without permission', severity: 'medium', color: '#FF8C00' },
    { code: 'MISCONDUCT', nameEn: 'Misconduct', nameAr: 'سوء سلوك', description: 'Inappropriate behavior', severity: 'medium', color: '#FF8C00' }
  ];

  for (const typeData of penaltyTypes) {
    await prisma.$queryRaw`
      INSERT INTO "penalty_types" (code, "nameEn", "nameAr", description, severity, color, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.severity}, ${typeData.color}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Penalty Types seeded');
}

async function seedBehaviorTypes(adminId) {
  console.log('🌱 Seeding Behavior Types...');
  
  const behaviorTypes = [
    { code: 'POSITIVE', nameEn: 'Positive Behavior', nameAr: 'سلوك إيجابي', description: 'Desirable behavior', category: 'positive', points: 2, color: '#4CAF50' },
    { code: 'NEGATIVE', nameEn: 'Negative Behavior', nameAr: 'سلوك سلبي', description: 'Undesirable behavior', category: 'negative', points: -2, color: '#F44336' },
    { code: 'NEUTRAL', nameEn: 'Neutral Behavior', nameAr: 'سلوك محايد', description: 'Neutral observation', category: 'neutral', points: 0, color: '#9E9E9E' },
    { code: 'EXCELLENT', nameEn: 'Excellent Behavior', nameAr: 'سلوك ممتاز', description: 'Outstanding behavior', category: 'positive', points: 5, color: '#2196F3' },
    { code: 'CONCERNING', nameEn: 'Concerning Behavior', nameAr: 'سلوك مقلق', description: 'Behavior requiring attention', category: 'negative', points: -3, color: '#FF9800' }
  ];

  for (const typeData of behaviorTypes) {
    await prisma.$queryRaw`
      INSERT INTO "behavior_types" (code, "nameEn", "nameAr", description, category, points, color, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.category}, ${typeData.points}, ${typeData.color}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Behavior Types seeded');
}

async function seedEnrollmentStatusTypes(adminId) {
  console.log('🌱 Seeding Enrollment Status Types...');
  
  const enrollmentStatusTypes = [
    { code: 'enrolled', nameEn: 'Enrolled', nameAr: 'مسجل', description: 'Student is enrolled' },
    { code: 'completed', nameEn: 'Completed', nameAr: 'مكتمل', description: 'Course completed' },
    { code: 'dropped', nameEn: 'Dropped', nameAr: 'منسحب', description: 'Student dropped course' },
    { code: 'failed', nameEn: 'Failed', nameAr: 'راسب', description: 'Student failed course' },
    { code: 'withdrawn', nameEn: 'Withdrawn', nameAr: 'منسحب', description: 'Student withdrew' },
    { code: 'suspended', nameEn: 'Suspended', nameAr: 'معلق', description: 'Enrollment suspended' },
    { code: 'transferred', nameEn: 'Transferred', nameAr: 'منقول', description: 'Student transferred' }
  ];

  for (const typeData of enrollmentStatusTypes) {
    await prisma.$queryRaw`
      INSERT INTO "enrollment_status_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Enrollment Status Types seeded');
}

async function seedAttendanceStatusTypes(adminId) {
  console.log('🌱 Seeding Attendance Status Types...');
  
  const attendanceStatusTypes = [
    { code: 'present', nameEn: 'Present', nameAr: 'حاضر', description: 'Student is present' },
    { code: 'absent', nameEn: 'Absent', nameAr: 'غائب', description: 'Student is absent' },
    { code: 'late', nameEn: 'Late', nameAr: 'متأخر', description: 'Student is late' },
    { code: 'excused', nameEn: 'Excused', nameAr: 'معذور', description: 'Absence is excused' },
    { code: 'early_leave', nameEn: 'Early Leave', nameAr: 'مغادرة مبكرة', description: 'Student left early' }
  ];

  for (const typeData of attendanceStatusTypes) {
    await prisma.$queryRaw`
      INSERT INTO "attendance_status_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Attendance Status Types seeded');
}

async function seedActivityTypes(adminId) {
  console.log('🌱 Seeding Activity Types...');
  
  const activityTypes = [
    { code: 'lecture', nameEn: 'Lecture', nameAr: 'محاضرة', description: 'Classroom lecture' },
    { code: 'lab', nameEn: 'Laboratory', nameAr: 'معمل', description: 'Lab session' },
    { code: 'seminar', nameEn: 'Seminar', nameAr: 'ندوة', description: 'Seminar session' },
    { code: 'workshop', nameEn: 'Workshop', nameAr: 'ورشة عمل', description: 'Workshop activity' },
    { code: 'project', nameEn: 'Project', nameAr: 'مشروع', description: 'Project work' },
    { code: 'exam', nameEn: 'Exam', nameAr: 'اختبار', description: 'Examination' },
    { code: 'tutorial', nameEn: 'Tutorial', nameAr: 'درس تعليمي', description: 'Tutorial session' }
  ];

  for (const typeData of activityTypes) {
    await prisma.$queryRaw`
      INSERT INTO "activity_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Activity Types seeded');
}

async function seedAssessmentTypes(adminId) {
  console.log('🌱 Seeding Assessment Types...');
  
  const assessmentTypes = [
    { code: 'quiz', nameEn: 'Quiz', nameAr: 'اختبار قصير', description: 'Short quiz' },
    { code: 'midterm', nameEn: 'Midterm Exam', nameAr: 'اختبار منتصف الفصل', description: 'Midterm examination' },
    { code: 'final', nameEn: 'Final Exam', nameAr: 'الاختبار النهائي', description: 'Final examination' },
    { code: 'assignment', nameEn: 'Assignment', nameAr: 'واجب', description: 'Homework assignment' },
    { code: 'project', nameEn: 'Project', nameAr: 'مشروع', description: 'Course project' },
    { code: 'presentation', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Class presentation' },
    { code: 'lab_report', nameEn: 'Lab Report', nameAr: 'تقرير معمل', description: 'Laboratory report' }
  ];

  for (const typeData of assessmentTypes) {
    await prisma.$queryRaw`
      INSERT INTO "assessment_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Assessment Types seeded');
}

async function seedResourceTypes(adminId) {
  console.log('🌱 Seeding Resource Types...');
  
  const resourceTypes = [
    { code: 'DOCUMENT', nameEn: 'Document', nameAr: 'وثيقة', description: 'Text document' },
    { code: 'PDF', nameEn: 'PDF', nameAr: 'PDF', description: 'PDF document' },
    { code: 'PRESENTATION', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Presentation file' },
    { code: 'VIDEO', nameEn: 'Video', nameAr: 'فيديو', description: 'Video file' },
    { code: 'AUDIO', nameEn: 'Audio', nameAr: 'صوت', description: 'Audio file' },
    { code: 'IMAGE', nameEn: 'Image', nameAr: 'صورة', description: 'Image file' },
    { code: 'LINK', nameEn: 'Link', nameAr: 'رابط', description: 'Web link' },
    { code: 'SPREADSHEET', nameEn: 'Spreadsheet', nameAr: 'جدول بيانات', description: 'Spreadsheet file' }
  ];

  for (const typeData of resourceTypes) {
    await prisma.$queryRaw`
      INSERT INTO "resource_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Resource Types seeded');
}

async function seedPrograms(adminId) {
  console.log('🌱 Seeding Programs...');
  
  const programs = [
    { code: 'CS-ENG', nameEn: 'Computer Science Engineering', nameAr: 'هندسة علوم الحاسب', descriptionEn: 'Bachelor program in Computer Science Engineering with focus on software development, algorithms, and system design', descriptionAr: 'برنامج بكالوريوس في هندسة علوم الحاسب مع التركيز على تطوير البرمجيات والخوارزميات وتصميم الأنظمة', durationYears: 4, minGPA: 2.5, totalCreditHours: 140 },
    { code: 'ME-ENG', nameEn: 'Mechanical Engineering', nameAr: 'الهندسة الميكانيكية', descriptionEn: 'Bachelor program in Mechanical Engineering covering thermodynamics, fluid mechanics, and materials science', descriptionAr: 'برنامج بكالوريوس في الهندسة الميكانيكية يغطي الديناميكا الحرارية وميكانيكا الموائع وعلم المواد', durationYears: 4, minGPA: 2.5, totalCreditHours: 140 },
    { code: 'EE-ENG', nameEn: 'Electrical Engineering', nameAr: 'الهندسة الكهربائية', descriptionEn: 'Bachelor program in Electrical Engineering focusing on circuits, electronics, and power systems', descriptionAr: 'برنامج بكالوريوس في الهندسة الكهربائية يركز على الدوائر والإلكترونيات وأنظمة الطاقة', durationYears: 4, minGPA: 2.5, totalCreditHours: 140 }
  ];

  for (const programData of programs) {
    await prisma.$queryRaw`
      INSERT INTO programs (code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours", "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (${programData.code}, ${programData.nameEn}, ${programData.nameAr}, ${programData.descriptionEn}, ${programData.descriptionAr}, ${programData.durationYears}, ${programData.minGPA}, ${programData.totalCreditHours}, true, ${adminId}, NOW(), NOW()) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Programs seeded');
}

async function seedSubjects(adminId) {
  console.log('🌱 Seeding Subjects with more classes...');
  
  const subjects = [
    // Computer Science Engineering Subjects
    { code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', descriptionEn: 'Fundamentals of programming using Python', descriptionAr: 'أساسيات البرمجة باستخدام بايثون', programCode: 'CS-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'CS102', nameEn: 'Data Structures and Algorithms', nameAr: 'هياكل البيانات والخوارزميات', descriptionEn: 'Advanced data structures and algorithm analysis', descriptionAr: 'هياكل البيانات المتقدمة وتحليل الخوارزميات', programCode: 'CS-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'CS103', nameEn: 'Database Systems', nameAr: 'أنظمة قواعد البيانات', descriptionEn: 'Relational database design and SQL', descriptionAr: 'تصميم قواعد البيانات العلائقية و SQL', programCode: 'CS-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'CS104', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', descriptionEn: 'Software development methodologies', descriptionAr: 'منهجيات تطوير البرمجيات', programCode: 'CS-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'CS105', nameEn: 'Computer Networks', nameAr: 'شبكات الحاسوب', descriptionEn: 'Network protocols and architectures', descriptionAr: 'بروتوكولات وهياكل الشبكات', programCode: 'CS-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    
    // Mechanical Engineering Subjects
    { code: 'ME101', nameEn: 'Engineering Mathematics', nameAr: 'الرياضيات الهندسية', descriptionEn: 'Advanced mathematical methods for engineering', descriptionAr: 'طرق رياضية متقدمة للهندسة', programCode: 'ME-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'ME102', nameEn: 'Thermodynamics', nameAr: 'الديناميكا الحرارية', descriptionEn: 'Principles of thermodynamics and heat transfer', descriptionAr: 'مبادئ الديناميكا الحرارية وانتقال الحرارة', programCode: 'ME-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'ME103', nameEn: 'Fluid Mechanics', nameAr: 'ميكانيكا الموائع', descriptionEn: 'Fluid statics and dynamics', descriptionAr: 'استاتيكا وديناميكا الموائع', programCode: 'ME-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'ME104', nameEn: 'Machine Design', nameAr: 'تصميم الآلات', descriptionEn: 'Mechanical design principles', descriptionAr: 'مبادئ التصميم الميكانيكي', programCode: 'ME-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'ME105', nameEn: 'Manufacturing Processes', nameAr: 'عمليات التصنيع', descriptionEn: 'Modern manufacturing techniques', descriptionAr: 'تقنيات التصنيع الحديثة', programCode: 'ME-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    
    // Electrical Engineering Subjects
    { code: 'EE101', nameEn: 'Circuit Analysis', nameAr: 'تحليل الدوائر', descriptionEn: 'Analysis of electrical circuits', descriptionAr: 'تحليل الدوائر الكهربائية', programCode: 'EE-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'EE102', nameEn: 'Electronics', nameAr: 'الإلكترونيات', descriptionEn: 'Electronic devices and circuits', descriptionAr: 'الأجهزة والدوائر الإلكترونية', programCode: 'EE-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'EE103', nameEn: 'Digital Logic', nameAr: 'المنطق الرقمي', descriptionEn: 'Digital systems and logic design', descriptionAr: 'الأنظمة الرقمية وتصميم المنطق', programCode: 'EE-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'EE104', nameEn: 'Power Systems', nameAr: 'أنظمة الطاقة', descriptionEn: 'Electrical power generation and distribution', descriptionAr: 'توليد وتوزيع الطاقة الكهربائية', programCode: 'EE-ENG', typeCode: 'core', requirementCode: 'mandatory' },
    { code: 'EE105', nameEn: 'Control Systems', nameAr: 'أنظمة التحكم', descriptionEn: 'Control theory and applications', descriptionAr: 'نظرية التحكم وتطبيقاتها', programCode: 'EE-ENG', typeCode: 'core', requirementCode: 'mandatory' }
  ];

  for (const subjectData of subjects) {
    await prisma.$queryRaw`
      INSERT INTO subjects (code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "programId", "typeId", "requirementTypeId", "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (
        ${subjectData.code}, 
        ${subjectData.nameEn}, 
        ${subjectData.nameAr}, 
        ${subjectData.descriptionEn}, 
        ${subjectData.descriptionAr}, 
        (SELECT id FROM programs WHERE code = ${subjectData.programCode}), 
        (SELECT id FROM subject_types WHERE code = ${subjectData.typeCode}), 
        (SELECT id FROM requirement_types WHERE code = ${subjectData.requirementCode}), 
        true, 
        ${adminId}, 
        NOW(), 
        NOW()
      ) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Subjects seeded');
}

async function seedClasses(adminId) {
  console.log('🌱 Seeding Classes (more classes per subject)...');
  
  const classes = [
    // Computer Science Classes
    { code: 'CS101-SEC1', nameEn: 'Programming Fundamentals - Section 1', nameAr: 'أساسيات البرمجة - شعبة 1', subjectCode: 'CS101', instructorId: 2 },
    { code: 'CS101-SEC2', nameEn: 'Programming Fundamentals - Section 2', nameAr: 'أساسيات البرمجة - شعبة 2', subjectCode: 'CS101', instructorId: 2 },
    { code: 'CS101-SEC3', nameEn: 'Programming Fundamentals - Section 3', nameAr: 'أساسيات البرمجة - شعبة 3', subjectCode: 'CS101', instructorId: 2 },
    { code: 'CS102-SEC1', nameEn: 'Data Structures - Section 1', nameAr: 'هياكل البيانات - شعبة 1', subjectCode: 'CS102', instructorId: 2 },
    { code: 'CS102-SEC2', nameEn: 'Data Structures - Section 2', nameAr: 'هياكل البيانات - شعبة 2', subjectCode: 'CS102', instructorId: 2 },
    { code: 'CS103-SEC1', nameEn: 'Database Systems - Section 1', nameAr: 'أنظمة قواعد البيانات - شعبة 1', subjectCode: 'CS103', instructorId: 2 },
    { code: 'CS103-SEC2', nameEn: 'Database Systems - Section 2', nameAr: 'أنظمة قواعد البيانات - شعبة 2', subjectCode: 'CS103', instructorId: 2 },
    { code: 'CS104-SEC1', nameEn: 'Software Engineering - Section 1', nameAr: 'هندسة البرمجيات - شعبة 1', subjectCode: 'CS104', instructorId: 2 },
    { code: 'CS105-SEC1', nameEn: 'Computer Networks - Section 1', nameAr: 'شبكات الحاسوب - شعبة 1', subjectCode: 'CS105', instructorId: 2 },
    
    // Mechanical Engineering Classes
    { code: 'ME101-SEC1', nameEn: 'Engineering Mathematics - Section 1', nameAr: 'الرياضيات الهندسية - شعبة 1', subjectCode: 'ME101', instructorId: 2 },
    { code: 'ME101-SEC2', nameEn: 'Engineering Mathematics - Section 2', nameAr: 'الرياضيات الهندسية - شعبة 2', subjectCode: 'ME101', instructorId: 2 },
    { code: 'ME102-SEC1', nameEn: 'Thermodynamics - Section 1', nameAr: 'الديناميكا الحرارية - شعبة 1', subjectCode: 'ME102', instructorId: 2 },
    { code: 'ME103-SEC1', nameEn: 'Fluid Mechanics - Section 1', nameAr: 'ميكانيكا الموائع - شعبة 1', subjectCode: 'ME103', instructorId: 2 },
    { code: 'ME104-SEC1', nameEn: 'Machine Design - Section 1', nameAr: 'تصميم الآلات - شعبة 1', subjectCode: 'ME104', instructorId: 2 },
    { code: 'ME105-SEC1', nameEn: 'Manufacturing Processes - Section 1', nameAr: 'عمليات التصنيع - شعبة 1', subjectCode: 'ME105', instructorId: 2 },
    
    // Electrical Engineering Classes
    { code: 'EE101-SEC1', nameEn: 'Circuit Analysis - Section 1', nameAr: 'تحليل الدوائر - شعبة 1', subjectCode: 'EE101', instructorId: 2 },
    { code: 'EE101-SEC2', nameEn: 'Circuit Analysis - Section 2', nameAr: 'تحليل الدوائر - شعبة 2', subjectCode: 'EE101', instructorId: 2 },
    { code: 'EE102-SEC1', nameEn: 'Electronics - Section 1', nameAr: 'الإلكترونيات - شعبة 1', subjectCode: 'EE102', instructorId: 2 },
    { code: 'EE103-SEC1', nameEn: 'Digital Logic - Section 1', nameAr: 'المنطق الرقمي - شعبة 1', subjectCode: 'EE103', instructorId: 2 },
    { code: 'EE104-SEC1', nameEn: 'Power Systems - Section 1', nameAr: 'أنظمة الطاقة - شعبة 1', subjectCode: 'EE104', instructorId: 2 },
    { code: 'EE105-SEC1', nameEn: 'Control Systems - Section 1', nameAr: 'أنظمة التحكم - شعبة 1', subjectCode: 'EE105', instructorId: 2 }
  ];

  for (const classData of classes) {
    await prisma.$queryRaw`
      INSERT INTO classes (code, "nameEn", "nameAr", "subjectId", "programId", "instructorId", "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (
        ${classData.code}, 
        ${classData.nameEn}, 
        ${classData.nameAr}, 
        (SELECT id FROM subjects WHERE code = ${classData.subjectCode}), 
        (SELECT "programId" FROM subjects WHERE code = ${classData.subjectCode}), 
        ${classData.instructorId}, 
        true, 
        ${adminId}, 
        NOW(), 
        NOW()
      ) 
      ON CONFLICT (code) DO NOTHING
    `;
  }

  console.log('✅ Classes seeded');
}

async function seedEnrollments(adminId) {
  console.log('🌱 Seeding Enrollments (students only)...');
  
  // Only enroll students (not instructors or super admin)
  const enrollments = [
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC3' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS102-SEC1' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS103-SEC1' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS103-SEC2' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS104-SEC1' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS105-SEC1' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'ME101-SEC1' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'ME101-SEC2' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'EE101-SEC1' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'EE101-SEC2' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'EE102-SEC1' }
  ];

  for (const enrollmentData of enrollments) {
    await prisma.$queryRaw`
      INSERT INTO enrollments ("userId", "classId", "programId", "subjectId", "statusId", "createdBy", "createdAt", "updatedAt") 
      VALUES (
        (SELECT id FROM users WHERE email = ${enrollmentData.studentEmail}), 
        (SELECT id FROM classes WHERE code = ${enrollmentData.classCode}), 
        (SELECT "programId" FROM classes WHERE code = ${enrollmentData.classCode}), 
        (SELECT "subjectId" FROM classes WHERE code = ${enrollmentData.classCode}), 
        (SELECT id FROM enrollment_status_types WHERE code = 'enrolled'), 
        ${adminId}, 
        NOW(), 
        NOW()
      ) 
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('✅ Enrollments seeded');
}

async function seedParticipations(adminId) {
  console.log('🌱 Seeding Participations (students only)...');
  
  // Only for students (not instructors or super admin)
  const participations = [
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1', typeCode: 'POSITIVE', descriptionEn: 'Excellent participation in class discussion about algorithms', descriptionAr: 'مشاركة ممتازة في مناقشة الفصل حول الخوارزميات', points: 8, comment: 'Student provided insightful contributions to the algorithm discussion' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1', typeCode: 'LATE', descriptionEn: 'Arrived 15 minutes late to programming lab', descriptionAr: 'وصلت متأخرة 15 دقيقة إلى معمل البرمجة', points: 0, comment: 'Student missed important lab setup instructions' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1', typeCode: 'HELPFUL', descriptionEn: 'Helped fellow students understand Python syntax', descriptionAr: 'ساعد الزملاء في فهم بناء جملة بايثون', points: 6, comment: 'Student volunteered to assist peers during coding exercise' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2', typeCode: 'EXCELLENT', descriptionEn: 'Perfect score on programming assignment', descriptionAr: 'درجة كاملة في واجب البرمجة', points: 10, comment: 'Student submitted exceptional work with advanced features' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1', typeCode: 'POSITIVE', descriptionEn: 'Active participation in data structures discussion', descriptionAr: 'مشاركة نشطة في مناقشة هياكل البيانات', points: 5, comment: 'Student contributed valuable insights on linked lists' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC3', typeCode: 'PRESENTATION', descriptionEn: 'Excellent presentation on recursion', descriptionAr: 'عرض تقديمي ممتاز عن التكرار', points: 7, comment: 'Clear explanation with good examples' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS103-SEC1', typeCode: 'POSITIVE', descriptionEn: 'Helped classmates with SQL queries', descriptionAr: 'ساعد الزملاء في استعلامات SQL', points: 4, comment: 'Student demonstrated strong database knowledge' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS103-SEC2', typeCode: 'EXCELLENT', descriptionEn: 'Outstanding database project', descriptionAr: 'مشروع قاعدة بيانات ممتاز', points: 9, comment: 'Complex database design with proper normalization' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS104-SEC1', typeCode: 'NEGATIVE', descriptionEn: 'Missed group meeting', descriptionAr: 'فقد اجتماع المجموعة', points: 0, comment: 'Student did not attend scheduled team meeting' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS105-SEC1', typeCode: 'POSITIVE', descriptionEn: 'Excellent network troubleshooting', descriptionAr: 'استكشاف أخطاء الشبكة ممتاز', points: 6, comment: 'Quickly identified and resolved network issues' }
  ];

  for (const participationData of participations) {
    await prisma.$queryRaw`
      INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (
        (SELECT id FROM users WHERE email = ${participationData.studentEmail}), 
        (SELECT id FROM classes WHERE code = ${participationData.classCode}), 
        (SELECT "programId" FROM classes WHERE code = ${participationData.classCode}), 
        (SELECT "subjectId" FROM classes WHERE code = ${participationData.classCode}), 
        (SELECT id FROM participation_types WHERE code = ${participationData.typeCode}), 
        ${participationData.points}, 
        ${participationData.descriptionEn}, 
        ${participationData.descriptionAr}, 
        ${participationData.comment}, 
        true, 
        ${adminId}, 
        NOW(), 
        NOW()
      ) 
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('✅ Participations seeded');
}

async function seedPenalties(adminId) {
  console.log('🌱 Seeding Penalties (students only)...');
  
  // Only for students (not instructors or super admin)
  const penalties = [
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1', typeCode: 'TARDINESS', descriptionEn: 'Late to class on Monday', descriptionAr: 'متأخر عن الفصل يوم الاثنين', points: -3, comment: 'Student arrived 10 minutes late without valid reason' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2', typeCode: 'MINOR', descriptionEn: 'Used phone during lecture', descriptionAr: 'استخدام الهاتف خلال المحاضرة', points: -2, comment: 'Warning issued for phone usage during class' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'EE101-SEC1', typeCode: 'ABSENCE', descriptionEn: 'Unexcused absence from lab', descriptionAr: 'غياب بدون عذر من المعمل', points: -8, comment: 'Student missed laboratory session without prior notification' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1', typeCode: 'MODERATE', descriptionEn: 'Late assignment submission', descriptionAr: 'تأخر في تسليم الواجب', points: -5, comment: 'Assignment submitted 2 days past deadline' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC3', typeCode: 'MINOR', descriptionEn: 'Missing textbook', descriptionAr: 'غياب الكتاب المقرر', points: 0, comment: 'Student came to class without required textbook' }
  ];

  for (const penaltyData of penalties) {
    await prisma.$queryRaw`
      INSERT INTO penalties ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (
        (SELECT id FROM users WHERE email = ${penaltyData.studentEmail}), 
        (SELECT id FROM classes WHERE code = ${penaltyData.classCode}), 
        (SELECT "programId" FROM classes WHERE code = ${penaltyData.classCode}), 
        (SELECT "subjectId" FROM classes WHERE code = ${penaltyData.classCode}), 
        (SELECT id FROM penalty_types WHERE code = ${penaltyData.typeCode}), 
        ${penaltyData.points}, 
        ${penaltyData.descriptionEn}, 
        ${penaltyData.descriptionAr}, 
        ${penaltyData.comment}, 
        true, 
        ${adminId}, 
        NOW(), 
        NOW()
      ) 
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('✅ Penalties seeded');
}

async function seedBehaviors(adminId) {
  console.log('🌱 Seeding Behaviors (students only)...');
  
  // Only for students (not instructors or super admin)
  const behaviors = [
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1', typeCode: 'POSITIVE', descriptionEn: 'Helped classmates with debugging', descriptionAr: 'ساعد الزملاء في تصحيح الأخطاء', points: 5, comment: 'Student voluntarily assisted peers with coding issues' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2', typeCode: 'EXCELLENT', descriptionEn: 'Leadership in group project', descriptionAr: 'قيادة في المشروع الجماعي', points: 8, comment: 'Student demonstrated exceptional leadership skills' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1', typeCode: 'POSITIVE', descriptionEn: 'Active participation in discussions', descriptionAr: 'مشاركة نشطة في المناقشات', points: 4, comment: 'Student consistently contributes valuable insights' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1', typeCode: 'EXCELLENT', descriptionEn: 'Mentoring junior students', descriptionAr: 'توجيه الطلاب الجدد', points: 7, comment: 'Student took initiative to help junior students' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC3', typeCode: 'CONCERNING', descriptionEn: 'Frequent distractions during class', descriptionAr: 'انحرافات متكررة خلال الفصل', points: -4, comment: 'Student needs to focus better during lectures' }
  ];

  for (const behaviorData of behaviors) {
    await prisma.$queryRaw`
      INSERT INTO behaviors ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "createdAt", "updatedAt") 
      VALUES (
        (SELECT id FROM users WHERE email = ${behaviorData.studentEmail}), 
        (SELECT id FROM classes WHERE code = ${behaviorData.classCode}), 
        (SELECT "programId" FROM classes WHERE code = ${behaviorData.classCode}), 
        (SELECT "subjectId" FROM classes WHERE code = ${behaviorData.classCode}), 
        (SELECT id FROM behavior_types WHERE code = ${behaviorData.typeCode}), 
        ${behaviorData.points}, 
        ${behaviorData.descriptionEn}, 
        ${behaviorData.descriptionAr}, 
        ${behaviorData.comment}, 
        true, 
        ${adminId}, 
        NOW(), 
        NOW()
      ) 
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('✅ Behaviors seeded');
}

async function checkFinalState() {
  console.log('\n📋 FINAL DATABASE STATE:');
  
  const counts = await Promise.all([
    prisma.$queryRaw`SELECT COUNT(*) as count FROM users`,
    prisma.$queryRaw`SELECT COUNT(*) as count FROM programs`,
    prisma.$queryRaw`SELECT COUNT(*) as count FROM subjects`,
    prisma.$queryRaw`SELECT COUNT(*) as count FROM classes`,
    prisma.$queryRaw`SELECT COUNT(*) as count FROM enrollments`,
    prisma.$queryRaw`SELECT COUNT(*) as count FROM participations`,
    prisma.$queryRaw`SELECT COUNT(*) as count FROM penalties`,
    prisma.$queryRaw`SELECT COUNT(*) as count FROM behaviors`
  ]);

  console.log(`  Users: ${counts[0][0].count}`);
  console.log(`  Programs: ${counts[1][0].count}`);
  console.log(`  Subjects: ${counts[2][0].count}`);
  console.log(`  Classes: ${counts[3][0].count}`);
  console.log(`  Enrollments: ${counts[4][0].count}`);
  console.log(`  Participations: ${counts[5][0].count}`);
  console.log(`  Penalties: ${counts[6][0].count}`);
  console.log(`  Behaviors: ${counts[7][0].count}`);

  // Show sample data
  const sampleParticipations = await prisma.$queryRaw`
    SELECT p.points, pt.code as type_code, u."displayName", c.code as class_code 
    FROM participations p 
    JOIN participation_types pt ON p."typeId" = pt.id 
    JOIN users u ON p."userId" = u.id 
    JOIN classes c ON p."classId" = c.id 
    LIMIT 3
  `;
  
  console.log('\n📊 Sample Participations:');
  sampleParticipations.forEach(p => {
    console.log(`  - ${p.displayName} in ${p.class_code}: ${p.type_code} (${p.points} points)`);
  });

  const samplePenalties = await prisma.$queryRaw`
    SELECT p."descriptionEn", u."displayName", c.code as class_code, pt.code as penalty_type, pt.severity
    FROM penalties p 
    JOIN users u ON p."userId" = u.id 
    JOIN classes c ON p."classId" = c.id 
    JOIN penalty_types pt ON p."typeId" = pt.id 
    LIMIT 3
  `;
  
  console.log('\n📊 Sample Penalties:');
  samplePenalties.forEach(p => {
    console.log(`  - ${p.displayName} in ${p.class_code}: ${p.penalty_type} (${p.severity}) - ${p.descriptionEn}`);
  });

  const sampleBehaviors = await prisma.$queryRaw`
    SELECT b."descriptionEn", u."displayName", c.code as class_code, bt.code as behavior_type, bt.category
    FROM behaviors b 
    JOIN users u ON b."userId" = u.id 
    JOIN classes c ON b."classId" = c.id 
    JOIN behavior_types bt ON b."typeId" = bt.id 
    LIMIT 3
  `;
  
  console.log('\n📊 Sample Behaviors:');
  sampleBehaviors.forEach(b => {
    console.log(`  - ${b.displayName} in ${b.class_code}: ${b.behavior_type} (${b.category}) - ${b.descriptionEn}`);
  });

  const superAdmin = await prisma.$queryRaw`SELECT email, "displayName" FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
  console.log(`\n👑 Super Admin: ${superAdmin[0].displayName} (${superAdmin[0].email})`);
}

cleanAndReseedDatabase();
