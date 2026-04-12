require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSubjects() {
  try {
    console.log('🌱 Seeding sample subjects...');

    // Get the first program (IT program with ID 1)
    const program = await prisma.program.findFirst({
      where: { id: 1 }
    });

    if (!program) {
      console.error('❌ No program found with ID 1. Please seed programs first.');
      return;
    }

    // Get the admin user (ID 1)
    const adminUser = await prisma.user.findFirst({
      where: { id: 1 }
    });

    if (!adminUser) {
      console.error('❌ No admin user found with ID 1. Please create admin user first.');
      return;
    }

    console.log(`👤 Using admin user: ${adminUser.displayName} (ID: ${adminUser.id})`);

    // Get required lookup types
    const subjectType = await prisma.subjectTypes.findFirst({
      where: { code: 'CORE' }
    });

    const requirementType = await prisma.requirementTypes.findFirst({
      where: { code: 'MANDATORY' }
    });

    if (!subjectType) {
      console.error('❌ No CORE subject type found. Please seed lookup data first.');
      return;
    }

    if (!requirementType) {
      console.error('❌ No MANDATORY requirement type found. Please seed lookup data first.');
      return;
    }

    console.log(`📋 Using subject type: ${subjectType.nameEn} (ID: ${subjectType.id})`);
    console.log(`📋 Using requirement type: ${requirementType.nameEn} (ID: ${requirementType.id})`);

    // Clear existing subjects (optional - comment out if you want to keep existing)
    await prisma.subject.deleteMany();
    console.log('🧹 Cleared existing subjects');

    // Create sample subjects for the IT program
    const sampleSubjects = [
      {
        code: 'CS101',
        nameEn: 'Computer Science Fundamentals',
        nameAr: 'أساسيات علوم الكمبيوتر',
        descriptionEn: 'Introduction to computer science concepts',
        descriptionAr: 'مقدمة في مفاهيم علوم الكمبيوتر',
        credits: 3,
        programId: program.id,
        typeId: subjectType.id,
        requirementTypeId: requirementType.id,
        isActive: true,
        createdBy: adminUser.id
      },
      {
        code: 'WEB101',
        nameEn: 'Web Development Basics',
        nameAr: 'أساسيات تطوير الويب',
        descriptionEn: 'Introduction to HTML, CSS, and JavaScript',
        descriptionAr: 'مقدمة في HTML و CSS و JavaScript',
        credits: 4,
        programId: program.id,
        typeId: subjectType.id,
        requirementTypeId: requirementType.id,
        isActive: true,
        createdBy: adminUser.id
      },
      {
        code: 'DB101',
        nameEn: 'Database Management',
        nameAr: 'إدارة قواعد البيانات',
        descriptionEn: 'Introduction to database design and SQL',
        descriptionAr: 'مقدمة في تصميم قواعد البيانات و SQL',
        credits: 3,
        programId: program.id,
        typeId: subjectType.id,
        requirementTypeId: requirementType.id,
        isActive: true,
        createdBy: adminUser.id
      },
      {
        code: 'NET101',
        nameEn: 'Network Fundamentals',
        nameAr: 'أساسيات الشبكات',
        descriptionEn: 'Introduction to computer networks and protocols',
        descriptionAr: 'مقدمة في شبكات الكمبيوتر والبروتوكولات',
        credits: 3,
        programId: program.id,
        typeId: subjectType.id,
        requirementTypeId: requirementType.id,
        isActive: true,
        createdBy: adminUser.id
      }
    ];

    // Create subjects
    for (const subject of sampleSubjects) {
      const createdSubject = await prisma.subject.create({
        data: subject
      });
      console.log(`✅ Created subject: ${createdSubject.nameEn} (${createdSubject.code})`);
    }

    console.log('🎉 Sample subjects seeded successfully!');
    
    // Display summary
    const totalSubjects = await prisma.subject.count();
    console.log(`📊 Total subjects in database: ${totalSubjects}`);

  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedSubjects()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
