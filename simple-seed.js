/**
 * Simple seed script that works without full Prisma client generation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleSeed() {
  try {
    console.log('🚀 Starting simple database seeding...\n');

    // 1. User Roles
    console.log('🌱 Creating user roles...');
    const userRoles = [
      { code: 'SUPER_ADMIN', nameEn: 'Super Administrator', nameAr: 'مدير النظام الأعلى', description: 'Super Administrator with full system access' },
      { code: 'ADMIN', nameEn: 'Administrator', nameAr: 'مدير النظام', description: 'System Administrator' },
      { code: 'HR', nameEn: 'HR Manager', nameAr: 'مدير الموارد البشرية', description: 'Human Resources Manager' },
      { code: 'INSTRUCTOR', nameEn: 'Instructor', nameAr: 'مدرب', description: 'Course Instructor' },
      { code: 'STUDENT', nameEn: 'Student', nameAr: 'طالب', description: 'Student User' }
    ];

    for (const roleData of userRoles) {
      try {
        await prisma.$queryRaw`INSERT INTO "user_roles" (code, "nameEn", "nameAr", description) VALUES (${roleData.code}, ${roleData.nameEn}, ${roleData.nameAr}, ${roleData.description}) ON CONFLICT (code) DO NOTHING`;
        console.log(`  ✅ Created user role: ${roleData.code}`);
      } catch (error) {
        console.log(`  ℹ️  User role ${roleData.code} already exists or error: ${error.message}`);
      }
    }

    // 2. User Status Types
    console.log('\n🌱 Creating user status types...');
    const userStatusTypes = [
      { code: 'ACTIVE', nameEn: 'Active', nameAr: 'نشط', description: 'User is active and can access the system' },
      { code: 'INACTIVE', nameEn: 'Inactive', nameAr: 'غير نشط', description: 'User is inactive and cannot access the system' },
      { code: 'SUSPENDED', nameEn: 'Suspended', nameAr: 'موقوف', description: 'User is temporarily suspended' },
      { code: 'PENDING', nameEn: 'Pending', nameAr: 'في الانتظار', description: 'User account is pending approval' }
    ];

    for (const statusData of userStatusTypes) {
      try {
        await prisma.$queryRaw`INSERT INTO "user_status_types" (code, "nameEn", "nameAr", description) VALUES (${statusData.code}, ${statusData.nameEn}, ${statusData.nameAr}, ${statusData.description}) ON CONFLICT (code) DO NOTHING`;
        console.log(`  ✅ Created user status: ${statusData.code}`);
      } catch (error) {
        console.log(`  ℹ️  User status ${statusData.code} already exists or error: ${error.message}`);
      }
    }

    // 3. Enrollment Status Types
    console.log('\n🌱 Creating enrollment status types...');
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
        await prisma.$queryRaw`INSERT INTO "enrollment_status_types" (code, "nameEn", "nameAr", description) VALUES (${statusData.code}, ${statusData.nameEn}, ${statusData.nameAr}, ${statusData.description}) ON CONFLICT (code) DO NOTHING`;
        console.log(`  ✅ Created enrollment status: ${statusData.code}`);
      } catch (error) {
        console.log(`  ℹ️  Enrollment status ${statusData.code} already exists or error: ${error.message}`);
      }
    }

    // 4. Subject Types
    console.log('\n🌱 Creating subject types...');
    const subjectTypes = [
      { code: 'CORE', nameEn: 'Core Subject', nameAr: 'موضوع أساسي', description: 'Fundamental subject for the program' },
      { code: 'ELECTIVE', nameEn: 'Elective Subject', nameAr: 'موضوع اختياري', description: 'Optional subject students can choose' },
      { code: 'SPECIALIZATION', nameEn: 'Specialization Subject', nameAr: 'موضوع تخصص', description: 'Subject for specific specialization track' }
    ];

    for (const typeData of subjectTypes) {
      try {
        await prisma.$queryRaw`INSERT INTO "subject_types" (code, "nameEn", "nameAr", description) VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}) ON CONFLICT (code) DO NOTHING`;
        console.log(`  ✅ Created subject type: ${typeData.code}`);
      } catch (error) {
        console.log(`  ℹ️  Subject type ${typeData.code} already exists or error: ${error.message}`);
      }
    }

    // 5. Requirement Types
    console.log('\n🌱 Creating requirement types...');
    const requirementTypes = [
      { code: 'MANDATORY', nameEn: 'Mandatory', nameAr: 'إلزامي', description: 'Required subject for graduation' },
      { code: 'OPTIONAL', nameEn: 'Optional', nameAr: 'اختياري', description: 'Not required but recommended' },
      { code: 'PREREQUISITE', nameEn: 'Prerequisite', nameAr: 'مطلب سابق', description: 'Required before taking other subjects' }
    ];

    for (const typeData of requirementTypes) {
      try {
        await prisma.$queryRaw`INSERT INTO "requirement_types" (code, "nameEn", "nameAr", description) VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}) ON CONFLICT (code) DO NOTHING`;
        console.log(`  ✅ Created requirement type: ${typeData.code}`);
      } catch (error) {
        console.log(`  ℹ️  Requirement type ${typeData.code} already exists or error: ${error.message}`);
      }
    }

    // 6. Users with correct super admin email
    console.log('\n🌱 Creating users...');
    const usersData = [
      {
        email: 'shareef.hiasat@gmail.com',
        displayName: 'Shareef Hiasat',
        firstName: 'Shareef',
        lastName: 'Hiasat',
        isActive: true
      },
      {
        email: 'ahmed.mohammed@military-lms.com',
        displayName: 'Ahmed Mohammed',
        firstName: 'Ahmed',
        lastName: 'Mohammed',
        isActive: true
      },
      {
        email: 'khalid.alsaadi@military-lms.com',
        displayName: 'Khalid Alsaadi',
        firstName: 'Khalid',
        lastName: 'Alsaadi',
        isActive: true
      },
      {
        email: 'fatima.alhashmi@military-lms.com',
        displayName: 'Fatima Alhashmi',
        firstName: 'Fatima',
        lastName: 'Alhashmi',
        isActive: true
      },
      {
        email: 'mohammed.alrashid@military-lms.com',
        displayName: 'Mohammed Alrashid',
        firstName: 'Mohammed',
        lastName: 'Alrashid',
        isActive: true
      },
      {
        email: 'nora.khalifa@military-lms.com',
        displayName: 'Nora Khalifa',
        firstName: 'Nora',
        lastName: 'Khalifa',
        isActive: true
      }
    ];

    for (const userData of usersData) {
      try {
        await prisma.$queryRaw`INSERT INTO users (email, "displayName", "firstName", "lastName", "isActive", "createdAt", "updatedAt") VALUES (${userData.email}, ${userData.displayName}, ${userData.firstName}, ${userData.lastName}, ${userData.isActive}, NOW(), NOW()) ON CONFLICT (email) DO NOTHING`;
        console.log(`  ✅ Created user: ${userData.displayName}`);
      } catch (error) {
        console.log(`  ℹ️  User ${userData.displayName} already exists or error: ${error.message}`);
      }
    }

    // 7. Participation Types
    console.log('\n🌱 Creating participation types...');
    const participationTypes = [
      { code: 'POSITIVE', nameEn: 'Positive Participation', nameAr: 'مشاركة إيجابية', description: 'Positive classroom participation', isPositive: true },
      { code: 'LATE', nameEn: 'Late Arrival', nameAr: 'تأخر عن الحضور', description: 'Student arrived late to class', isPositive: false },
      { code: 'HELPFUL', nameEn: 'Helpful Behavior', nameAr: 'سلوك مساعد', description: 'Student helped others', isPositive: true },
      { code: 'DISRUPTIVE', nameEn: 'Disruptive Behavior', nameAr: 'سلوك مزعج', description: 'Student caused disruption in class', isPositive: false },
      { code: 'EXCELLENT', nameEn: 'Excellent Work', nameAr: 'عمل ممتاز', description: 'Student demonstrated excellent understanding', isPositive: true }
    ];

    for (const typeData of participationTypes) {
      try {
        await prisma.$queryRaw`INSERT INTO "participation_types" (code, "nameEn", "nameAr", description, "isPositive", "isActive", "createdAt", "updatedAt") VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.isPositive}, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
        console.log(`  ✅ Created participation type: ${typeData.code}`);
      } catch (error) {
        console.log(`  ℹ️  Participation type ${typeData.code} already exists or error: ${error.message}`);
      }
    }

    console.log('\n🎉 Simple seeding completed successfully!');
    
    // Check final state
    await checkSimpleState();
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkSimpleState() {
  console.log('\n📋 Final database state:');
  
  const tables = [
    { name: 'user_roles', query: 'SELECT COUNT(*) as count FROM "user_roles"' },
    { name: 'user_status_types', query: 'SELECT COUNT(*) as count FROM "user_status_types"' },
    { name: 'enrollment_status_types', query: 'SELECT COUNT(*) as count FROM "enrollment_status_types"' },
    { name: 'subject_types', query: 'SELECT COUNT(*) as count FROM "subject_types"' },
    { name: 'requirement_types', query: 'SELECT COUNT(*) as count FROM "requirement_types"' },
    { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'participation_types', query: 'SELECT COUNT(*) as count FROM "participation_types"' }
  ];
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRaw`${table.query}`;
      console.log(`  ${table.name}: ${result[0].count} records`);
    } catch (error) {
      console.log(`  ${table.name}: Error - ${error.message}`);
    }
  }
}

simpleSeed();
