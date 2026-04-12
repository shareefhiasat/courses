/**
 * COMPLETE DATABASE SEEDING SCRIPT
 * 
 * This script seeds ALL lookup tables, users, programs, subjects, classes, 
 * enrollments, participations, penalties, and all other required data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeSeed() {
  try {
    console.log('🚀 Starting COMPLETE database seeding...\n');
    
    // Get super admin user ID
    const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    const adminId = superAdmin[0].id;
    console.log(`👑 Using Super Admin ID: ${adminId}`);

    // ==================== USER ROLES & STATUS ====================
    console.log('\n🌱 Seeding User Roles & Status...');
    await seedUserRolesAndStatus(adminId);

    // ==================== ENROLLMENT STATUS TYPES ====================
    console.log('\n🌱 Seeding Enrollment Status Types...');
    await seedEnrollmentStatusTypes(adminId);

    // ==================== SUBJECT & REQUIREMENT TYPES ====================
    console.log('\n🌱 Seeding Subject & Requirement Types...');
    await seedSubjectAndRequirementTypes(adminId);

    // ==================== PARTICIPATION TYPES ====================
    console.log('\n🌱 Seeding Participation Types...');
    await seedParticipationTypes(adminId);

    // ==================== PENALTY TYPES ====================
    console.log('\n🌱 Seeding Penalty Types...');
    await seedPenaltyTypes(adminId);

    // ==================== BEHAVIOR TYPES ====================
    console.log('\n🌱 Seeding Behavior Types...');
    await seedBehaviorTypes(adminId);

    // ==================== ATTENDANCE STATUS TYPES ====================
    console.log('\n🌱 Seeding Attendance Status Types...');
    await seedAttendanceStatusTypes(adminId);

    // ==================== ACTIVITY TYPES ====================
    console.log('\n🌱 Seeding Activity Types...');
    await seedActivityTypes(adminId);

    // ==================== ASSESSMENT TYPES ====================
    console.log('\n🌱 Seeding Assessment Types...');
    await seedAssessmentTypes(adminId);

    // ==================== RESOURCE TYPES ====================
    console.log('\n🌱 Seeding Resource Types...');
    await seedResourceTypes(adminId);

    // ==================== PROGRAMS ====================
    console.log('\n🌱 Seeding Programs...');
    await seedPrograms(adminId);

    // ==================== SUBJECTS ====================
    console.log('\n🌱 Seeding Subjects...');
    await seedSubjects(adminId);

    // ==================== CLASSES ====================
    console.log('\n🌱 Seeding Classes...');
    await seedClasses(adminId);

    // ==================== ENROLLMENTS ====================
    console.log('\n🌱 Seeding Enrollments...');
    await seedEnrollments(adminId);

    // ==================== PARTICIPATIONS ====================
    console.log('\n🌱 Seeding Participations...');
    await seedParticipations(adminId);

    // ==================== PENALTIES ====================
    console.log('\n🌱 Seeding Penalties...');
    await seedPenalties(adminId);

    // ==================== BEHAVIORS ====================
    console.log('\n🌱 Seeding Behaviors...');
    await seedBehaviors(adminId);

    console.log('\n🎉 COMPLETE DATABASE SEEDING FINISHED!');
    
    // Check final state
    await checkFinalState();
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedUserRolesAndStatus(adminId) {
  const userRoles = [
    { code: 'SUPER_ADMIN', nameEn: 'Super Administrator', nameAr: 'مدير النظام الأعلى', description: 'Super Administrator with full system access' },
    { code: 'ADMIN', nameEn: 'Administrator', nameAr: 'مدير النظام', description: 'System Administrator' },
    { code: 'HR', nameEn: 'HR Manager', nameAr: 'مدير الموارد البشرية', description: 'Human Resources Manager' },
    { code: 'INSTRUCTOR', nameEn: 'Instructor', nameAr: 'مدرب', description: 'Course Instructor' },
    { code: 'STUDENT', nameEn: 'Student', nameAr: 'طالب', description: 'Student User' }
  ];

  for (const roleData of userRoles) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "user_roles" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${roleData.code}, ${roleData.nameEn}, ${roleData.nameAr}, ${roleData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ User role: ${roleData.code}`);
    } catch (error) {
      console.log(`  ℹ️  User role ${roleData.code} already exists`);
    }
  }

  const userStatusTypes = [
    { code: 'ACTIVE', nameEn: 'Active', nameAr: 'نشط', description: 'User is active and can access the system' },
    { code: 'INACTIVE', nameEn: 'Inactive', nameAr: 'غير نشط', description: 'User is inactive and cannot access the system' },
    { code: 'SUSPENDED', nameEn: 'Suspended', nameAr: 'موقوف', description: 'User is temporarily suspended' },
    { code: 'PENDING', nameEn: 'Pending', nameAr: 'في الانتظار', description: 'User account is pending approval' }
  ];

  for (const statusData of userStatusTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "user_status_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${statusData.code}, ${statusData.nameEn}, ${statusData.nameAr}, ${statusData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ User status: ${statusData.code}`);
    } catch (error) {
      console.log(`  ℹ️  User status ${statusData.code} already exists`);
    }
  }
}

async function seedEnrollmentStatusTypes(adminId) {
  const enrollmentStatusTypes = [
    { code: 'ENROLLED', nameEn: 'Enrolled', nameAr: 'مسجل', description: 'Student is enrolled in the program' },
    { code: 'PENDING', nameEn: 'Pending', nameAr: 'في الانتظار', description: 'Enrollment is pending approval' },
    { code: 'APPROVED', nameEn: 'Approved', nameAr: 'موافق عليه', description: 'Enrollment has been approved' },
    { code: 'REJECTED', nameEn: 'Rejected', nameAr: 'مرفوض', description: 'Enrollment has been rejected' },
    { code: 'COMPLETED', nameEn: 'Completed', nameAr: 'مكتمل', description: 'Student has completed the program' },
    { code: 'DROPPED', nameEn: 'Dropped', nameAr: 'منسحب', description: 'Student has dropped from the program' },
    { code: 'SUSPENDED', nameEn: 'Suspended', nameAr: 'موقوف', description: 'Student enrollment is suspended' }
  ];

  for (const statusData of enrollmentStatusTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "enrollment_status_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${statusData.code}, ${statusData.nameEn}, ${statusData.nameAr}, ${statusData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Enrollment status: ${statusData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Enrollment status ${statusData.code} already exists`);
    }
  }
}

async function seedSubjectAndRequirementTypes(adminId) {
  const subjectTypes = [
    { code: 'CORE', nameEn: 'Core Subject', nameAr: 'موضوع أساسي', description: 'Fundamental subject for the program' },
    { code: 'ELECTIVE', nameEn: 'Elective Subject', nameAr: 'موضوع اختياري', description: 'Optional subject students can choose' },
    { code: 'SPECIALIZATION', nameEn: 'Specialization Subject', nameAr: 'موضوع تخصص', description: 'Subject for specific specialization track' }
  ];

  for (const typeData of subjectTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "subject_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Subject type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Subject type ${typeData.code} already exists`);
    }
  }

  const requirementTypes = [
    { code: 'MANDATORY', nameEn: 'Mandatory', nameAr: 'إلزامي', description: 'Required subject for graduation' },
    { code: 'OPTIONAL', nameEn: 'Optional', nameAr: 'اختياري', description: 'Not required but recommended' },
    { code: 'PREREQUISITE', nameEn: 'Prerequisite', nameAr: 'مطلب سابق', description: 'Required before taking other subjects' }
  ];

  for (const typeData of requirementTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "requirement_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Requirement type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Requirement type ${typeData.code} already exists`);
    }
  }
}

async function seedParticipationTypes(adminId) {
  const participationTypes = [
    { code: 'POSITIVE', nameEn: 'Positive Participation', nameAr: 'مشاركة إيجابية', description: 'Positive classroom participation', isPositive: true },
    { code: 'LATE', nameEn: 'Late Arrival', nameAr: 'تأخر عن الحضور', description: 'Student arrived late to class', isPositive: false },
    { code: 'HELPFUL', nameEn: 'Helpful Behavior', nameAr: 'سلوك مساعد', description: 'Student helped others', isPositive: true },
    { code: 'DISRUPTIVE', nameEn: 'Disruptive Behavior', nameAr: 'سلوك مزعج', description: 'Student caused disruption in class', isPositive: false },
    { code: 'EXCELLENT', nameEn: 'Excellent Work', nameAr: 'عمل ممتاز', description: 'Student demonstrated excellent understanding', isPositive: true },
    { code: 'ABSENT', nameEn: 'Absent', nameAr: 'غائب', description: 'Student was absent from class', isPositive: false },
    { code: 'PARTICIPATED', nameEn: 'Participated', nameAr: 'شارك', description: 'Student participated in activity', isPositive: true }
  ];

  for (const typeData of participationTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "participation_types" (code, "nameEn", "nameAr", description, "isPositive", "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.isPositive}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Participation type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Participation type ${typeData.code} already exists`);
    }
  }
}

async function seedPenaltyTypes(adminId) {
  const penaltyTypes = [
    { code: 'MINOR', nameEn: 'Minor Offense', nameAr: 'مخالفة طفيفة', description: 'Minor rule violation', points: -1 },
    { code: 'MODERATE', nameEn: 'Moderate Offense', nameAr: 'مخالفة متوسطة', description: 'Moderate rule violation', points: -3 },
    { code: 'MAJOR', nameEn: 'Major Offense', nameAr: 'مخالفة رئيسية', description: 'Major rule violation', points: -5 },
    { code: 'SEVERE', nameEn: 'Severe Offense', nameAr: 'مخالفة شديدة', description: 'Severe rule violation', points: -10 },
    { code: 'TARDINESS', nameEn: 'Tardiness', nameAr: 'تأخر', description: 'Late arrival to class', points: -2 },
    { code: 'ABSENCE', nameEn: 'Unexcused Absence', nameAr: 'غياب بدون عذر', description: 'Missing class without permission', points: -4 },
    { code: 'MISCONDUCT', nameEn: 'Misconduct', nameAr: 'سوء سلوك', description: 'Inappropriate behavior', points: -3 }
  ];

  for (const typeData of penaltyTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "penalty_types" (code, "nameEn", "nameAr", description, points, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.points}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Penalty type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Penalty type ${typeData.code} already exists`);
    }
  }
}

async function seedBehaviorTypes(adminId) {
  const behaviorTypes = [
    { code: 'POSITIVE', nameEn: 'Positive Behavior', nameAr: 'سلوك إيجابي', description: 'Desirable behavior', points: 2 },
    { code: 'NEGATIVE', nameEn: 'Negative Behavior', nameAr: 'سلوك سلبي', description: 'Undesirable behavior', points: -2 },
    { code: 'NEUTRAL', nameEn: 'Neutral Behavior', nameAr: 'سلوك محايد', description: 'Neutral observation', points: 0 },
    { code: 'EXCELLENT', nameEn: 'Excellent Behavior', nameAr: 'سلوك ممتاز', description: 'Outstanding behavior', points: 5 },
    { code: 'CONCERNING', nameEn: 'Concerning Behavior', nameAr: 'سلوك مقلق', description: 'Behavior requiring attention', points: -3 }
  ];

  for (const typeData of behaviorTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "behavior_types" (code, "nameEn", "nameAr", description, points, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.points}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Behavior type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Behavior type ${typeData.code} already exists`);
    }
  }
}

async function seedAttendanceStatusTypes(adminId) {
  const attendanceStatusTypes = [
    { code: 'PRESENT', nameEn: 'Present', nameAr: 'حاضر', description: 'Student attended class' },
    { code: 'ABSENT', nameEn: 'Absent', nameAr: 'غائب', description: 'Student missed class' },
    { code: 'LATE', nameEn: 'Late', nameAr: 'متأخر', description: 'Student arrived late' },
    { code: 'EXCUSED', nameEn: 'Excused', nameAr: 'معذور', description: 'Student has valid excuse' },
    { code: 'EARLY_DEPARTURE', nameEn: 'Early Departure', nameAr: 'مغادرة مبكرة', description: 'Student left early' }
  ];

  for (const statusData of attendanceStatusTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "attendance_status_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${statusData.code}, ${statusData.nameEn}, ${statusData.nameAr}, ${statusData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Attendance status: ${statusData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Attendance status ${statusData.code} already exists`);
    }
  }
}

async function seedActivityTypes(adminId) {
  const activityTypes = [
    { code: 'LECTURE', nameEn: 'Lecture', nameAr: 'محاضرة', description: 'Traditional lecture session' },
    { code: 'LAB', nameEn: 'Laboratory', nameAr: 'معمل', description: 'Hands-on laboratory session' },
    { code: 'SEMINAR', nameEn: 'Seminar', nameAr: 'ندوة', description: 'Interactive seminar session' },
    { code: 'WORKSHOP', nameEn: 'Workshop', nameAr: 'ورشة عمل', description: 'Practical workshop session' },
    { code: 'TUTORIAL', nameEn: 'Tutorial', nameAr: 'درس تعليمي', description: 'Small group tutorial' },
    { code: 'EXAM', nameEn: 'Examination', nameAr: 'امتحان', description: 'Formal examination' },
    { code: 'PROJECT', nameEn: 'Project', nameAr: 'مشروع', description: 'Project work session' }
  ];

  for (const typeData of activityTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "activity_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Activity type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Activity type ${typeData.code} already exists`);
    }
  }
}

async function seedAssessmentTypes(adminId) {
  const assessmentTypes = [
    { code: 'QUIZ', nameEn: 'Quiz', nameAr: 'اختبار قصير', description: 'Short knowledge check' },
    { code: 'MIDTERM', nameEn: 'Midterm Exam', nameAr: 'امتحان منتصف الفصل', description: 'Mid-term examination' },
    { code: 'FINAL', nameEn: 'Final Exam', nameAr: 'امتحان نهائي', description: 'Final examination' },
    { code: 'ASSIGNMENT', nameEn: 'Assignment', nameAr: 'واجب', description: 'Home assignment' },
    { code: 'PROJECT', nameEn: 'Project', nameAr: 'مشروع', description: 'Course project' },
    { code: 'PRESENTATION', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Oral presentation' },
    { code: 'LAB_REPORT', nameEn: 'Lab Report', nameAr: 'تقرير معمل', description: 'Laboratory report' }
  ];

  for (const typeData of assessmentTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "assessment_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Assessment type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Assessment type ${typeData.code} already exists`);
    }
  }
}

async function seedResourceTypes(adminId) {
  const resourceTypes = [
    { code: 'DOCUMENT', nameEn: 'Document', nameAr: 'وثيقة', description: 'Text document' },
    { code: 'PDF', nameEn: 'PDF File', nameAr: 'ملف PDF', description: 'PDF document' },
    { code: 'PRESENTATION', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Presentation slides' },
    { code: 'VIDEO', nameEn: 'Video', nameAr: 'فيديو', description: 'Video file' },
    { code: 'AUDIO', nameEn: 'Audio', nameAr: 'صوت', description: 'Audio file' },
    { code: 'IMAGE', nameEn: 'Image', nameAr: 'صورة', description: 'Image file' },
    { code: 'LINK', nameEn: 'External Link', nameAr: 'رابط خارجي', description: 'External website link' },
    { code: 'SPREADSHEET', nameEn: 'Spreadsheet', nameAr: 'جدول بيانات', description: 'Excel/Spreadsheet file' }
  ];

  for (const typeData of resourceTypes) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "resource_types" (code, "nameEn", "nameAr", description, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Resource type: ${typeData.code}`);
    } catch (error) {
      console.log(`  ℹ️  Resource type ${typeData.code} already exists`);
    }
  }
}

async function seedPrograms(adminId) {
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
        INSERT INTO programs (code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours", "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${programData.code}, ${programData.nameEn}, ${programData.nameAr}, ${programData.descriptionEn}, ${programData.descriptionAr}, ${programData.durationYears}, ${programData.minGPA}, ${programData.totalCreditHours}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Program: ${programData.nameEn}`);
    } catch (error) {
      console.log(`  ℹ️  Program ${programData.nameEn} already exists`);
    }
  }
}

async function seedSubjects(adminId) {
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
        INSERT INTO subjects (code, "nameEn", "nameAr", credits, "programId", "typeId", "requirementTypeId", "descriptionEn", "descriptionAr", "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${subjectData.code}, ${subjectData.nameEn}, ${subjectData.nameAr}, ${subjectData.credits}, 
                (SELECT id FROM programs WHERE code = ${subjectData.programCode}), 
                (SELECT id FROM subject_types WHERE code = ${subjectData.subjectTypeCode}), 
                (SELECT id FROM requirement_types WHERE code = ${subjectData.requirementTypeCode}), 
                ${subjectData.descriptionEn}, ${subjectData.descriptionAr}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Subject: ${subjectData.nameEn}`);
    } catch (error) {
      console.log(`  ℹ️  Subject ${subjectData.nameEn} already exists or error: ${error.message}`);
    }
  }
}

async function seedClasses(adminId) {
  const classesData = [
    {
      code: 'CS101-SEC1',
      nameEn: 'Programming Fundamentals - Section 1',
      nameAr: 'أساسيات البرمجة - شعبة 1',
      maxCapacity: 30,
      subjectCode: 'CS101',
      instructorEmail: 'ahmed.mohammed@military-lms.com',
      term: '2024-FALL',
      year: '2024'
    },
    {
      code: 'CS101-SEC2',
      nameEn: 'Programming Fundamentals - Section 2',
      nameAr: 'أساسيات البرمجة - شعبة 2',
      maxCapacity: 30,
      subjectCode: 'CS101',
      instructorEmail: 'ahmed.mohammed@military-lms.com',
      term: '2024-FALL',
      year: '2024'
    },
    {
      code: 'CS102-SEC1',
      nameEn: 'Data Structures - Section 1',
      nameAr: 'هياكل البيانات - شعبة 1',
      maxCapacity: 25,
      subjectCode: 'CS102',
      instructorEmail: 'khalid.alsaadi@military-lms.com',
      term: '2024-FALL',
      year: '2024'
    },
    {
      code: 'ME101-SEC1',
      nameEn: 'Engineering Mathematics - Section 1',
      nameAr: 'الرياضيات الهندسية - شعبة 1',
      maxCapacity: 35,
      subjectCode: 'ME101',
      instructorEmail: 'khalid.alsaadi@military-lms.com',
      term: '2024-FALL',
      year: '2024'
    },
    {
      code: 'EE101-SEC1',
      nameEn: 'Circuit Analysis - Section 1',
      nameAr: 'تحليل الدوائر - شعبة 1',
      maxCapacity: 30,
      subjectCode: 'EE101',
      instructorEmail: 'ahmed.mohammed@military-lms.com',
      term: '2024-FALL',
      year: '2024'
    }
  ];

  for (const classData of classesData) {
    try {
      await prisma.$queryRaw`
        INSERT INTO classes (code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", "instructorId", term, year, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES (${classData.code}, ${classData.nameEn}, ${classData.nameAr}, ${classData.maxCapacity}, 
                (SELECT p.id FROM programs p JOIN subjects s ON p.id = s."programId" WHERE s.code = ${classData.subjectCode}), 
                (SELECT id FROM subjects WHERE code = ${classData.subjectCode}), 
                (SELECT id FROM users WHERE email = ${classData.instructorEmail}), 
                ${classData.term}, ${classData.year}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✅ Class: ${classData.nameEn}`);
    } catch (error) {
      console.log(`  ℹ️  Class ${classData.nameEn} already exists or error: ${error.message}`);
    }
  }
}

async function seedEnrollments(adminId) {
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
        INSERT INTO enrollments ("userId", "programId", "subjectId", "classId", "statusId", "createdBy", "createdAt", "updatedAt") 
        VALUES ((SELECT id FROM users WHERE email = ${enrollmentData.studentEmail}), 
                (SELECT "programId" FROM classes WHERE code = ${enrollmentData.classCode}), 
                (SELECT "subjectId" FROM classes WHERE code = ${enrollmentData.classCode}), 
                (SELECT id FROM classes WHERE code = ${enrollmentData.classCode}), 
                (SELECT id FROM enrollment_status_types WHERE code = 'ENROLLED'), 
                ${adminId}, NOW(), NOW()) 
        ON CONFLICT ("userId", "classId") DO NOTHING
      `;
      console.log(`  ✅ Enrollment for ${enrollmentData.studentEmail} in ${enrollmentData.classCode}`);
    } catch (error) {
      console.log(`  ℹ️  Enrollment for ${enrollmentData.studentEmail} in ${enrollmentData.classCode} already exists or error: ${error.message}`);
    }
  }
}

async function seedParticipations(adminId) {
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
        INSERT INTO participations ("userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES ((SELECT id FROM users WHERE email = ${participationData.studentEmail}), 
                (SELECT id FROM classes WHERE code = ${participationData.classCode}), 
                (SELECT "programId" FROM classes WHERE code = ${participationData.classCode}), 
                (SELECT "subjectId" FROM classes WHERE code = ${participationData.classCode}), 
                (SELECT id FROM participation_types WHERE code = ${participationData.participationTypeCode}), 
                ${participationData.points}, ${participationData.descriptionEn}, ${participationData.descriptionAr}, ${participationData.comment}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT DO NOTHING
      `;
      console.log(`  ✅ Participation for ${participationData.studentEmail} in ${participationData.classCode}`);
    } catch (error) {
      console.log(`  ℹ️  Participation for ${participationData.studentEmail} in ${participationData.classCode} already exists or error: ${error.message}`);
    }
  }
}

async function seedPenalties(adminId) {
  const penaltiesData = [
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1', penaltyTypeCode: 'TARDINESS', descriptionEn: 'Late to class on Monday', descriptionAr: 'متأخر عن الفصل يوم الاثنين', comment: 'Student arrived 10 minutes late without valid reason' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2', penaltyTypeCode: 'MINOR', descriptionEn: 'Used phone during lecture', descriptionAr: 'استخدام الهاتف خلال المحاضرة', comment: 'Warning issued for phone usage during class' },
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'EE101-SEC1', penaltyTypeCode: 'ABSENCE', descriptionEn: 'Unexcused absence from lab', descriptionAr: 'غياب بدون عذر من المعمل', comment: 'Student missed laboratory session without prior notification' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1', penaltyTypeCode: 'MODERATE', descriptionEn: 'Late assignment submission', descriptionAr: 'تأخر في تسليم الواجب', comment: 'Assignment submitted 2 days past deadline' },
    { studentEmail: 'shareef.hiasat@gmail.com', classCode: 'ME101-SEC1', penaltyTypeCode: 'MINOR', descriptionEn: 'Missing textbook', descriptionAr: 'غياب الكتاب المقرر', comment: 'Student came to class without required textbook' }
  ];

  for (const penaltyData of penaltiesData) {
    try {
      await prisma.$queryRaw`
        INSERT INTO penalties ("userId", "classId", "programId", "subjectId", "typeId", "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES ((SELECT id FROM users WHERE email = ${penaltyData.studentEmail}), 
                (SELECT id FROM classes WHERE code = ${penaltyData.classCode}), 
                (SELECT "programId" FROM classes WHERE code = ${penaltyData.classCode}), 
                (SELECT "subjectId" FROM classes WHERE code = ${penaltyData.classCode}), 
                (SELECT id FROM penalty_types WHERE code = ${penaltyData.penaltyTypeCode}), 
                ${penaltyData.descriptionEn}, ${penaltyData.descriptionAr}, ${penaltyData.comment}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT DO NOTHING
      `;
      console.log(`  ✅ Penalty for ${penaltyData.studentEmail} in ${penaltyData.classCode}`);
    } catch (error) {
      console.log(`  ℹ️  Penalty for ${penaltyData.studentEmail} in ${penaltyData.classCode} already exists or error: ${error.message}`);
    }
  }
}

async function seedBehaviors(adminId) {
  const behaviorsData = [
    { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'CS101-SEC1', behaviorTypeCode: 'POSITIVE', descriptionEn: 'Helped classmates with debugging', descriptionAr: 'ساعد الزملاء في تصحيح الأخطاء', comment: 'Student voluntarily assisted peers with coding issues' },
    { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2', behaviorTypeCode: 'EXCELLENT', descriptionEn: 'Leadership in group project', descriptionAr: 'قيادة في المشروع الجماعي', comment: 'Student demonstrated exceptional leadership skills' },
    { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1', behaviorTypeCode: 'POSITIVE', descriptionEn: 'Active participation in discussions', descriptionAr: 'مشاركة نشطة في المناقشات', comment: 'Student consistently contributes valuable insights' },
    { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1', behaviorTypeCode: 'POSITIVE', descriptionEn: 'Mentoring junior students', descriptionAr: 'توجيه الطلاب الجدد', comment: 'Student took initiative to help junior students' },
    { studentEmail: 'shareef.hiasat@gmail.com', classCode: 'ME101-SEC1', behaviorTypeCode: 'EXCELLENT', descriptionEn: 'Outstanding problem-solving skills', descriptionAr: 'مهارات حل مشكلات ممتازة', comment: 'Student demonstrated advanced analytical abilities' }
  ];

  for (const behaviorData of behaviorsData) {
    try {
      await prisma.$queryRaw`
        INSERT INTO behaviors ("userId", "classId", "programId", "subjectId", "typeId", "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "createdAt", "updatedAt") 
        VALUES ((SELECT id FROM users WHERE email = ${behaviorData.studentEmail}), 
                (SELECT id FROM classes WHERE code = ${behaviorData.classCode}), 
                (SELECT "programId" FROM classes WHERE code = ${behaviorData.classCode}), 
                (SELECT "subjectId" FROM classes WHERE code = ${behaviorData.classCode}), 
                (SELECT id FROM behavior_types WHERE code = ${behaviorData.behaviorTypeCode}), 
                ${behaviorData.descriptionEn}, ${behaviorData.descriptionAr}, ${behaviorData.comment}, true, ${adminId}, NOW(), NOW()) 
        ON CONFLICT DO NOTHING
      `;
      console.log(`  ✅ Behavior for ${behaviorData.studentEmail} in ${behaviorData.classCode}`);
    } catch (error) {
      console.log(`  ℹ️  Behavior for ${behaviorData.studentEmail} in ${behaviorData.classCode} already exists or error: ${error.message}`);
    }
  }
}

async function checkFinalState() {
  console.log('\n📋 FINAL DATABASE STATE:');
  
  try {
    // Check key tables
    const users = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    const programs = await prisma.$queryRaw`SELECT COUNT(*) as count FROM programs`;
    const subjects = await prisma.$queryRaw`SELECT COUNT(*) as count FROM subjects`;
    const classes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM classes`;
    const enrollments = await prisma.$queryRaw`SELECT COUNT(*) as count FROM enrollments`;
    const participations = await prisma.$queryRaw`SELECT COUNT(*) as count FROM participations`;
    const penalties = await prisma.$queryRaw`SELECT COUNT(*) as count FROM penalties`;
    const behaviors = await prisma.$queryRaw`SELECT COUNT(*) as count FROM behaviors`;
    
    console.log(`  Users: ${users[0].count}`);
    console.log(`  Programs: ${programs[0].count}`);
    console.log(`  Subjects: ${subjects[0].count}`);
    console.log(`  Classes: ${classes[0].count}`);
    console.log(`  Enrollments: ${enrollments[0].count}`);
    console.log(`  Participations: ${participations[0].count}`);
    console.log(`  Penalties: ${penalties[0].count}`);
    console.log(`  Behaviors: ${behaviors[0].count}`);
    
    // Check type tables
    const typeTables = [
      { name: 'User Roles', table: 'user_roles' },
      { name: 'User Status Types', table: 'user_status_types' },
      { name: 'Enrollment Status Types', table: 'enrollment_status_types' },
      { name: 'Subject Types', table: 'subject_types' },
      { name: 'Requirement Types', table: 'requirement_types' },
      { name: 'Participation Types', table: 'participation_types' },
      { name: 'Penalty Types', table: 'penalty_types' },
      { name: 'Behavior Types', table: 'behavior_types' },
      { name: 'Attendance Status Types', table: 'attendance_status_types' },
      { name: 'Activity Types', table: 'activity_types' },
      { name: 'Assessment Types', table: 'assessment_types' },
      { name: 'Resource Types', table: 'resource_types' }
    ];
    
    console.log('\n📋 Type Tables:');
    for (const typeTable of typeTables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(typeTable.table)}`;
        console.log(`  ${typeTable.name}: ${result[0].count} records`);
      } catch (error) {
        console.log(`  ${typeTable.name}: Error - ${error.message}`);
      }
    }
    
    // Show super admin
    const superAdmin = await prisma.$queryRaw`SELECT email, "displayName" FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    console.log(`\n👑 Super Admin: ${superAdmin[0].displayName} (${superAdmin[0].email})`);
    
    // Show sample data
    console.log('\n📊 Sample Data:');
    try {
      const sampleParticipations = await prisma.$queryRaw`
        SELECT p.points, pt.code as type_code, u."displayName", c.code as class_code 
        FROM participations p 
        JOIN participation_types pt ON p.typeId = pt.id 
        JOIN users u ON p.userId = u.id 
        JOIN classes c ON p.classId = c.id 
        LIMIT 3
      `;
      console.log('  Participations:');
      sampleParticipations.forEach(p => {
        console.log(`    - ${p.displayName} in ${p.class_code}: ${p.type_code} (${p.points} points)`);
      });
    } catch (error) {
      console.log('  Participations: No data found');
    }
    
    try {
      const samplePenalties = await prisma.$queryRaw`
        SELECT pt.code as type_code, u."displayName", c.code as class_code 
        FROM penalties p 
        JOIN penalty_types pt ON p.typeId = pt.id 
        JOIN users u ON p.userId = u.id 
        JOIN classes c ON p.classId = c.id 
        LIMIT 3
      `;
      console.log('  Penalties:');
      samplePenalties.forEach(p => {
        console.log(`    - ${p.displayName} in ${p.class_code}: ${p.type_code}`);
      });
    } catch (error) {
      console.log('  Penalties: No data found');
    }
    
  } catch (error) {
    console.error('Error checking final state:', error);
  }
}

completeSeed();
