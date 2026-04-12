require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBasicData() {
  console.log('🎓 Creating basic academic data...\n');

  try {
    // Get the super admin user
    const superAdmin = await prisma.user.findFirst({
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

    if (!superAdmin) {
      console.error('❌ Super admin user not found! Please run create-super-admin.cjs first.');
      return;
    }

    console.log(`👤 Using super admin: ${superAdmin.displayName} (ID: ${superAdmin.id})`);
    const creatorId = superAdmin.id;
    // Create Programs
    console.log('📚 Creating Programs...');
    const programs = [
      {
        code: 'CS-BSC-2024',
        nameEn: 'Bachelor of Science in Computer Science',
        nameAr: 'بكالوريوس علوم الحاسوب',
        descriptionEn: 'Undergraduate program in Computer Science',
        descriptionAr: 'برنامج بكالوريوس في علوم الحاسوب',
        isActive: true,
        createdBy: creatorId
      },
      {
        code: 'IT-BSC-2024',
        nameEn: 'Bachelor of Science in Information Technology',
        nameAr: 'بكالوريوس علوم تكنولوجيا المعلومات',
        descriptionEn: 'Undergraduate program in Information Technology',
        descriptionAr: 'برنامج بكالوريوس في تكنولوجيا المعلومات',
        isActive: true,
        createdBy: creatorId
      },
      {
        code: 'SE-BSC-2024',
        nameEn: 'Bachelor of Science in Software Engineering',
        nameAr: 'بكالوريوس علوم هندسة البرمجيات',
        descriptionEn: 'Undergraduate program in Software Engineering',
        descriptionAr: 'برنامج بكالوريوس في هندسة البرمجيات',
        isActive: true,
        createdBy: creatorId
      }
    ];

    const createdPrograms = [];
    for (const programData of programs) {
      const existing = await prisma.program.findUnique({
        where: { code: programData.code }
      });

      if (!existing) {
        const program = await prisma.program.create({ data: programData });
        createdPrograms.push(program);
        console.log(`   ✅ Created: ${program.nameEn}`);
      } else {
        createdPrograms.push(existing);
        console.log(`   ⚠️  Already exists: ${existing.nameEn}`);
      }
    }

    // Get the CS program ID (first one)
    const csProgramId = createdPrograms.find(p => p.code === 'CS-BSC-2024')?.id || createdPrograms[0]?.id;

    // Create Subjects
    console.log('\n📖 Creating Subjects...');
    const subjects = [
      {
        code: 'CS101',
        nameEn: 'Introduction to Computer Science',
        nameAr: 'مقدمة في علوم الحاسوب',
        descriptionEn: 'Fundamental concepts of computer science',
        descriptionAr: 'مفاهيم أساسية في علوم الحاسوب',
        credits: 3,
        isActive: true,
        createdBy: creatorId,
        programId: csProgramId, // CS Program
        typeId: 1, // Will get from subjectTypes
        requirementTypeId: 1 // Will get from requirementTypes
      },
      {
        code: 'CS102',
        nameEn: 'Programming Fundamentals',
        nameAr: 'أساسيات البرمجة',
        descriptionEn: 'Introduction to programming concepts',
        descriptionAr: 'مقدمة في مفاهيم البرمجة',
        credits: 4,
        isActive: true,
        createdBy: creatorId,
        programId: csProgramId,
        typeId: 1,
        requirementTypeId: 1
      },
      {
        code: 'CS201',
        nameEn: 'Data Structures and Algorithms',
        nameAr: 'هياكل البيانات والخوارزميات',
        descriptionEn: 'Study of data structures and algorithm analysis',
        descriptionAr: 'دراسة هياكل البيانات وتحليل الخوارزميات',
        credits: 4,
        isActive: true,
        createdBy: creatorId,
        programId: csProgramId,
        typeId: 1,
        requirementTypeId: 1
      },
      {
        code: 'CS202',
        nameEn: 'Database Systems',
        nameAr: 'أنظمة قواعد البيانات',
        descriptionEn: 'Introduction to database design and management',
        descriptionAr: 'مقدمة في تصميم وإدارة قواعد البيانات',
        credits: 3,
        isActive: true,
        createdBy: creatorId,
        programId: csProgramId,
        typeId: 1,
        requirementTypeId: 1
      },
      {
        code: 'CS301',
        nameEn: 'Software Engineering',
        nameAr: 'هندسة البرمجيات',
        descriptionEn: 'Principles and practices of software engineering',
        descriptionAr: 'مبادئ وممارسات هندسة البرمجيات',
        credits: 4,
        isActive: true,
        createdBy: creatorId,
        programId: csProgramId,
        typeId: 1,
        requirementTypeId: 1
      },
      {
        code: 'CS302',
        nameEn: 'Web Development',
        nameAr: 'تطوير الويب',
        descriptionEn: 'Modern web development technologies and practices',
        descriptionAr: 'تقنيات وممارسات تطوير الويب الحديثة',
        credits: 3,
        isActive: true,
        createdBy: creatorId,
        programId: csProgramId,
        typeId: 1,
        requirementTypeId: 1
      }
    ];

    const createdSubjects = [];
    for (const subjectData of subjects) {
      const existing = await prisma.subject.findUnique({
        where: { code: subjectData.code }
      });

      if (!existing) {
        const subject = await prisma.subject.create({ data: subjectData });
        createdSubjects.push(subject);
        console.log(`   ✅ Created: ${subject.nameEn}`);
      } else {
        createdSubjects.push(existing);
        console.log(`   ⚠️  Already exists: ${existing.nameEn}`);
      }
    }

    // Get subject IDs
    const cs101Id = createdSubjects.find(s => s.code === 'CS101')?.id;
    const cs102Id = createdSubjects.find(s => s.code === 'CS102')?.id;

    // Create Classes
    console.log('\n🏫 Creating Classes...');
    
    // Get instructors to assign to classes
    const instructors = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: {
            role: {
              code: 'INSTRUCTOR'
            }
          }
        }
      }
    });

    if (instructors.length === 0) {
      console.log('⚠️  No instructors found. Classes will be created without instructors.');
      console.log('   Run create-test-instructors.cjs first to assign instructors.');
    }

    const classes = [
      {
        code: 'CS101-001',
        nameEn: 'CS101 - Section 001',
        nameAr: 'CS101 - شعبة 001',
        descriptionEn: 'Introduction to Computer Science - Morning Section',
        descriptionAr: 'مقدمة في علوم الحاسوب - شعبة صباحية',
        locationEn: 'Building A, Room 101',
        locationAr: 'المبنى أ, غرفة 101',
        maxCapacity: 30,
        programId: csProgramId, // CS Program
        subjectId: cs101Id, // CS101
        instructorId: instructors.length > 0 ? instructors[0].id : null,
        ownerEmail: instructors.length > 0 ? instructors[0].email : 'shareef.hiasat@gmail.com',
        term: '2025-SPRING',
        year: '2025',
        isActive: true,
        createdBy: creatorId
      },
      {
        code: 'CS101-002',
        nameEn: 'CS101 - Section 002',
        nameAr: 'CS101 - شعبة 002',
        descriptionEn: 'Introduction to Computer Science - Evening Section',
        descriptionAr: 'مقدمة في علوم الحاسوب - شعبة مسائية',
        locationEn: 'Building A, Room 102',
        locationAr: 'المبنى أ, غرفة 102',
        maxCapacity: 25,
        programId: csProgramId, // CS Program
        subjectId: cs101Id, // CS101
        instructorId: instructors.length > 1 ? instructors[1].id : (instructors.length > 0 ? instructors[0].id : null),
        ownerEmail: instructors.length > 1 ? instructors[1].email : (instructors.length > 0 ? instructors[0].email : 'shareef.hiasat@gmail.com'),
        term: '2025-SPRING',
        year: '2025',
        isActive: true,
        createdBy: creatorId
      },
      {
        code: 'CS102-001',
        nameEn: 'CS102 - Section 001',
        nameAr: 'CS102 - شعبة 001',
        descriptionEn: 'Programming Fundamentals - Lab Section',
        descriptionAr: 'أساسيات البرمجة - شعبة معمل',
        locationEn: 'Building B, Lab 201',
        locationAr: 'المبنى ب, معمل 201',
        maxCapacity: 20,
        programId: csProgramId, // CS Program
        subjectId: cs102Id, // CS102
        instructorId: instructors.length > 2 ? instructors[2].id : (instructors.length > 0 ? instructors[0].id : null),
        ownerEmail: instructors.length > 2 ? instructors[2].email : (instructors.length > 0 ? instructors[0].email : 'shareef.hiasat@gmail.com'),
        term: '2025-SPRING',
        year: '2025',
        isActive: true,
        createdBy: creatorId
      }
    ];

    for (const classData of classes) {
      const existing = await prisma.class.findUnique({
        where: { code: classData.code }
      });

      if (!existing) {
        await prisma.class.create({ data: classData });
        const instructorName = classData.instructorId ? 
          (instructors.find(i => i.id === classData.instructorId)?.displayName || 'Unknown') : 
          'None';
        console.log(`   ✅ Created: ${classData.nameEn} (Instructor: ${instructorName})`);
      } else {
        console.log(`   ⚠️  Already exists: ${classData.nameEn}`);
      }
    }

    console.log('\n🎉 Basic academic data created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 3 Programs created');
    console.log('   - 6 Subjects created');
    console.log('   - 3 Classes created');
    console.log('\n✅ System is ready for use!\n');

  } catch (error) {
    console.error('❌ Error creating basic data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createBasicData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
