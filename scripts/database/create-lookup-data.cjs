require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createLookupData() {
  console.log('📋 Creating essential lookup data...\n');

  try {
    // Create user roles
    console.log('Creating user roles...');
    const roles = [
      { code: 'SUPER_ADMIN', nameEn: 'Super Admin', nameAr: 'مسؤول متميز', level: 100, description: 'Full system access' },
      { code: 'ADMIN', nameEn: 'Admin', nameAr: 'مسؤول', level: 80, description: 'Administrative access' },
      { code: 'HR', nameEn: 'HR', nameAr: 'الموارد البشرية', level: 60, description: 'HR management' },
      { code: 'INSTRUCTOR', nameEn: 'Instructor', nameAr: 'مدرب', level: 40, description: 'Teaching staff' },
      { code: 'STUDENT', nameEn: 'Student', nameAr: 'طالب', level: 20, description: 'Student access' },
    ];

    for (const role of roles) {
      const existing = await prisma.userRoles.findUnique({ where: { code: role.code } });
      if (!existing) {
        await prisma.userRoles.create({
          data: {
            ...role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log(`   ✅ Created role: ${role.nameEn}`);
      } else {
        console.log(`   ⚠️  Role already exists: ${role.nameEn}`);
      }
    }

    // Create enrollment status types
    console.log('\nCreating enrollment status types...');
    const enrollmentStatuses = [
      { code: 'ENROLLED', nameEn: 'Enrolled', nameAr: 'مسجل', description: 'Active enrollment' },
      { code: 'COMPLETED', nameEn: 'Completed', nameAr: 'مكتمل', description: 'Course completed' },
      { code: 'DROPPED', nameEn: 'Dropped', nameAr: 'منسحب', description: 'Student dropped' },
      { code: 'SUSPENDED', nameEn: 'Suspended', nameAr: 'معلق', description: 'Enrollment suspended' },
    ];

    for (const status of enrollmentStatuses) {
      const existing = await prisma.enrollmentStatusTypes.findUnique({ where: { code: status.code } });
      if (!existing) {
        await prisma.enrollmentStatusTypes.create({
          data: {
            ...status,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log(`   ✅ Created enrollment status: ${status.nameEn}`);
      } else {
        console.log(`   ⚠️  Enrollment status already exists: ${status.nameEn}`);
      }
    }

    // Create user status types
    console.log('\nCreating user status types...');
    const userStatuses = [
      { code: 'ACTIVE', nameEn: 'Active', nameAr: 'نشط', description: 'User is active' },
      { code: 'INACTIVE', nameEn: 'Inactive', nameAr: 'غير نشط', description: 'User is inactive' },
      { code: 'DISABLED', nameEn: 'Disabled', nameAr: 'معطل', description: 'User is disabled' },
      { code: 'ARCHIVED', nameEn: 'Archived', nameAr: 'مؤرشف', description: 'User is archived' },
    ];

    for (const status of userStatuses) {
      const existing = await prisma.userStatusTypes.findUnique({ where: { code: status.code } });
      if (!existing) {
        await prisma.userStatusTypes.create({
          data: {
            ...status,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log(`   ✅ Created user status: ${status.nameEn}`);
      } else {
        console.log(`   ⚠️  User status already exists: ${status.nameEn}`);
      }
    }

    // Create attendance status types
    console.log('\nCreating attendance status types...');
    const attendanceStatuses = [
      { code: 'PRESENT', nameEn: 'Present', nameAr: 'حاضر', description: 'Student attended', icon: 'check-circle', color: '#10b981' },
      { code: 'ABSENT', nameEn: 'Absent', nameAr: 'غائب', description: 'Student absent', icon: 'x-circle', color: '#ef4444' },
      { code: 'LATE', nameEn: 'Late', nameAr: 'متأخر', description: 'Student arrived late', icon: 'clock', color: '#f59e0b' },
      { code: 'EXCUSED', nameEn: 'Excused', nameAr: 'معذور', description: 'Excused absence', icon: 'alert-circle', color: '#8b5cf6' },
    ];

    for (const status of attendanceStatuses) {
      const existing = await prisma.attendanceStatusTypes.findUnique({ where: { code: status.code } });
      if (!existing) {
        await prisma.attendanceStatusTypes.create({
          data: {
            ...status,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log(`   ✅ Created attendance status: ${status.nameEn}`);
      } else {
        console.log(`   ⚠️  Attendance status already exists: ${status.nameEn}`);
      }
    }

    console.log('\n✅ Essential lookup data created successfully!');

  } catch (error) {
    console.error('❌ Error creating lookup data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLookupData();
