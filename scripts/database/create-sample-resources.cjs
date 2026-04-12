require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleResources() {
  console.log('📚 Creating sample resources...\n');

  try {
    // Get lookup data
    const resourceTypes = await prisma.resourceTypes.findMany();
    const categoryTypes = await prisma.categoryTypes.findMany();
    const classes = await prisma.class.findMany({ include: { program: true, subject: true } });
    const creator = await prisma.user.findFirst({
      where: {
        roleAssignments: {
          some: {
            role: {
              code: 'SUPER_ADMIN'
            }
          }
        }
      }
    });

    if (!creator) {
      console.error('❌ Creator user not found!');
      return;
    }

    // Get the CS program ID
    const csProgram = await prisma.program.findFirst({
      where: { code: 'CS-BSC-2024' }
    });

    if (!csProgram) {
      console.error('❌ CS Program not found!');
      return;
    }

    const csProgramId = csProgram.id;

    // Get subject IDs
    const cs101 = await prisma.subject.findFirst({
      where: { code: 'CS101' }
    });
    const cs102 = await prisma.subject.findFirst({
      where: { code: 'CS102' }
    });

    const cs101Id = cs101?.id;
    const cs102Id = cs102?.id;

    const resources = [
      // CS101 Resources
      {
        titleEn: 'Introduction to Computer Science - Lecture 1',
        titleAr: 'مقدمة في علوم الحاسوب - محاضرة 1',
        descriptionEn: 'First lecture covering basic concepts of computer science',
        descriptionAr: 'المحاضرة الأولى تغطي المفاهيم الأساسية لعلوم الحاسوب',
        typeId: resourceTypes.find(t => t.code === 'DOCUMENT')?.id,
        categoryId: categoryTypes.find(c => c.code === 'LECTURE_NOTES')?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        programId: csProgramId,
        subjectId: cs101Id,
        url: '/resources/cs101/lecture1.pdf',
        isActive: true,
        createdBy: creator.id
      },
      {
        titleEn: 'Programming Fundamentals Video Tutorial',
        titleAr: 'فيديو تعليمي لأساسيات البرمجة',
        descriptionEn: 'Comprehensive video tutorial covering programming basics',
        descriptionAr: 'فيديو تعليمي شامل يغطي أساسيات البرمجة',
        typeId: resourceTypes.find(t => t.code === 'VIDEO')?.id,
        categoryId: categoryTypes.find(c => c.code === 'TUTORIAL')?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        programId: csProgramId,
        subjectId: cs102Id,
        url: '/resources/cs102/programming_basics.mp4',
        isActive: true,
        createdBy: creator.id
      },
      {
        titleEn: 'Data Structures Reference Guide',
        titleAr: 'دليل مرجعي لهياكل البيانات',
        descriptionEn: 'Quick reference guide for common data structures',
        descriptionAr: 'دليل مرجعي سريع لهياكل البيانات الشائعة',
        typeId: resourceTypes.find(t => t.code === 'DOCUMENT')?.id,
        categoryId: categoryTypes.find(c => c.code === 'REFERENCE')?.id,
        programId: csProgramId,
        subjectId: null, // Available to all subjects in program
        url: '/resources/cs201/data_structures_guide.pdf',
        isActive: true,
        createdBy: creator.id
      },
      {
        titleEn: 'Database Systems - Lab Manual',
        titleAr: 'أنظمة قواعد البيانات - دليل المعمل',
        descriptionEn: 'Laboratory manual for database systems course',
        descriptionAr: 'دليل المعمل لدورة أنظمة قواعد البيانات',
        typeId: resourceTypes.find(t => t.code === 'DOCUMENT')?.id,
        categoryId: categoryTypes.find(c => c.code === 'ASSIGNMENT')?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        programId: csProgramId,
        subjectId: cs101Id,
        url: '/resources/cs101/db_lab_manual.pdf',
        isActive: true,
        createdBy: creator.id
      },
      {
        titleEn: 'Software Engineering Best Practices',
        titleAr: 'أفضل الممارسات في هندسة البرمجيات',
        descriptionEn: 'Collection of best practices and design patterns',
        descriptionAr: 'مجموعة من أفضل الممارسات وأنماط التصميم',
        typeId: resourceTypes.find(t => t.code === 'PRESENTATION')?.id,
        categoryId: categoryTypes.find(c => c.code === 'REFERENCE')?.id,
        programId: csProgramId,
        subjectId: null,
        url: '/resources/cs301/best_practices.pptx',
        isActive: true,
        createdBy: creator.id
      },
      {
        titleEn: 'Web Development Resources Hub',
        titleAr: 'مركز موارد تطوير الويب',
        descriptionEn: 'External links and resources for web development',
        descriptionAr: 'روابط وموارد خارجية لتطوير الويب',
        typeId: resourceTypes.find(t => t.code === 'LINK')?.id,
        categoryId: categoryTypes.find(c => c.code === 'REFERENCE')?.id,
        programId: csProgramId,
        subjectId: null,
        url: 'https://developer.mozilla.org/en-US/docs/Learn',
        isActive: true,
        createdBy: creator.id
      },
      {
        titleEn: 'Algorithm Analysis Audio Lecture',
        titleAr: 'محاضرة صوتية لتحليل الخوارزميات',
        descriptionEn: 'Audio lecture explaining algorithm complexity analysis',
        descriptionAr: 'محاضرة صوتية تشرح تحليل تعقيد الخوارزميات',
        typeId: resourceTypes.find(t => t.code === 'AUDIO')?.id,
        categoryId: categoryTypes.find(c => c.code === 'LECTURE_NOTES')?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        programId: csProgramId,
        subjectId: cs102Id,
        url: '/resources/cs201/algorithms.mp3',
        isActive: true,
        createdBy: creator.id
      },
      {
        titleEn: 'Exam Preparation Materials Archive',
        titleAr: 'أرشيف مواد تحضير الامتحانات',
        descriptionEn: 'Compressed archive containing past exams and study guides',
        descriptionAr: 'أرشيف مضغوط يحتوي على امتحانات سابقة وأدلة دراسية',
        typeId: resourceTypes.find(t => t.code === 'ARCHIVE')?.id,
        categoryId: categoryTypes.find(c => c.code === 'EXAM_PREP')?.id,
        programId: csProgramId,
        subjectId: null,
        url: '/resources/exam_prep/materials.zip',
        isActive: true,
        createdBy: creator.id
      }
    ];

    for (const resourceData of resources) {
      const existing = await prisma.resource.findFirst({
        where: {
          titleEn: resourceData.titleEn,
          classId: resourceData.classId
        }
      });

      if (!existing) {
        await prisma.resource.create({ data: resourceData });
        console.log(`   ✅ Created: ${resourceData.titleEn}`);
      } else {
        console.log(`   ⚠️  Already exists: ${resourceData.titleEn}`);
      }
    }

    console.log('\n🎉 Sample resources created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 8 sample resources created');
    console.log('   - Multiple resource types covered');
    console.log('   - Different target audiences addressed');
    console.log('\n✅ Ready for resource testing!\n');

  } catch (error) {
    console.error('❌ Error creating sample resources:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createSampleResources()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
