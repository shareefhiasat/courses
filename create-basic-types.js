/**
 * Create basic lookup types
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBasicTypes() {
  try {
    console.log('Creating basic lookup types...');
    
    // Subject Types
    const subjectTypesData = [
      { code: 'CORE', nameEn: 'Core Subject', nameAr: 'موضوع أساسي', description: 'Fundamental subject for the program' },
      { code: 'ELECTIVE', nameEn: 'Elective Subject', nameAr: 'موضوع اختياري', description: 'Optional subject students can choose' },
      { code: 'SPECIALIZATION', nameEn: 'Specialization Subject', nameAr: 'موضوع تخصص', description: 'Subject for specific specialization track' }
    ];
    
    for (const typeData of subjectTypesData) {
      const existing = await prisma.subjectTypes.findFirst({
        where: { code: typeData.code }
      });
      
      if (!existing) {
        await prisma.subjectTypes.create({ data: typeData });
        console.log(`✅ Created subject type: ${typeData.code}`);
      } else {
        console.log(`ℹ️  Subject type already exists: ${existing.code}`);
      }
    }
    
    // Requirement Types
    const requirementTypesData = [
      { code: 'MANDATORY', nameEn: 'Mandatory', nameAr: 'إلزامي', description: 'Required subject for graduation' },
      { code: 'OPTIONAL', nameEn: 'Optional', nameAr: 'اختياري', description: 'Not required but recommended' },
      { code: 'PREREQUISITE', nameEn: 'Prerequisite', nameAr: 'مطلب سابق', description: 'Required before taking other subjects' }
    ];
    
    for (const typeData of requirementTypesData) {
      const existing = await prisma.requirementTypes.findFirst({
        where: { code: typeData.code }
      });
      
      if (!existing) {
        await prisma.requirementTypes.create({ data: typeData });
        console.log(`✅ Created requirement type: ${typeData.code}`);
      } else {
        console.log(`ℹ️  Requirement type already exists: ${existing.code}`);
      }
    }
    
    // Enrollment Status Types (if not exists)
    const enrollmentStatusData = [
      { code: 'ENROLLED', nameEn: 'Enrolled', nameAr: 'مسجل', description: 'Student is enrolled in the program' },
      { code: 'PENDING', nameEn: 'Pending', nameAr: 'في الانتظار', description: 'Enrollment is pending approval' }
    ];
    
    for (const statusData of enrollmentStatusData) {
      const existing = await prisma.enrollmentStatusTypes.findFirst({
        where: { code: statusData.code }
      });
      
      if (!existing) {
        await prisma.enrollmentStatusTypes.create({ data: statusData });
        console.log(`✅ Created enrollment status: ${statusData.code}`);
      } else {
        console.log(`ℹ️  Enrollment status already exists: ${existing.code}`);
      }
    }
    
    console.log('✅ Basic types creation complete');
    
  } catch (error) {
    console.error('❌ Error creating basic types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicTypes();
