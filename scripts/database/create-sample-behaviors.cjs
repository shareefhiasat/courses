require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleBehaviors() {
  console.log('🌟 Creating sample behaviors...\n');

  try {
    // Get lookup data
    const behaviorTypes = await prisma.behaviorTypes.findMany();
    const classes = await prisma.class.findMany({ include: { program: true, subject: true } });
    const students = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: {
            role: {
              code: 'STUDENT'
            }
          }
        }
      }
    });
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

    const behaviors = [
      // Positive behaviors
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'EXCELLENT_PARTICIPATION')?.id,
        points: 5,
        descriptionEn: 'Consistently provides thoughtful insights during discussions',
        descriptionAr: 'يقدم باستمرار رؤى thoughtful خلال المناقشات',
        comment: 'Excellent participation',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'HELPING_PEERS')?.id,
        points: 3,
        descriptionEn: 'Helped classmates understand difficult programming concepts',
        descriptionAr: 'ساعد زملاءه على فهم مفاهيم البرمجة الصعبة',
        comment: 'Peer helper',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'LEADERSHIP')?.id,
        points: 5,
        descriptionEn: 'Led group project effectively, organized team tasks',
        descriptionAr: 'قاد المشروع بفعالية، نظم مهام الفريق',
        comment: 'Natural leader',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: behaviorTypes.find(b => b.code === 'CREATIVITY')?.id,
        points: 4,
        descriptionEn: 'Proposed innovative solution to coding challenge',
        descriptionAr: 'اقترح حلاً مبتكراً لتحدي البرمجة',
        comment: 'Creative thinker',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'IMPROVEMENT')?.id,
        points: 3,
        descriptionEn: 'Showed significant improvement in quiz scores',
        descriptionAr: 'أظهر تحسناً كبيراً درجات الاختبارات',
        comment: 'Great progress',
        isActive: true,
        createdBy: creator.id
      },
      
      // Negative behaviors
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'DISRUPTIVE')?.id,
        points: -3,
        descriptionEn: 'Talking during lecture, disturbing other students',
        descriptionAr: 'التحدث أثناء المحاضرة، إزعاج الطلاب الآخرين',
        comment: 'Disruptive behavior',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: behaviorTypes.find(b => b.code === 'DISRESPECTFUL')?.id,
        points: -4,
        descriptionEn: 'Made disrespectful comment to classmate',
        descriptionAr: 'أدلى بتعليق غير محترم لزميله',
        comment: 'Disrespectful behavior',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'UNPREPARED')?.id,
        points: -2,
        descriptionEn: 'Came to lab without required materials',
        descriptionAr: 'حضر إلى المعمل بدون المواد المطلوبة',
        comment: 'Unprepared for class',
        isActive: true,
        createdBy: creator.id
      },
      
      // Mixed behaviors for different students
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: behaviorTypes.find(b => b.code === 'EXCELLENT_PARTICIPATION')?.id,
        points: 5,
        descriptionEn: 'Exceptional contribution to class discussion',
        descriptionAr: 'مساهمة استثنائية في مناقشة الفصل',
        comment: 'Outstanding participation',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'HELPING_PEERS')?.id,
        points: 3,
        descriptionEn: 'Volunteered to assist struggling students',
        descriptionAr: 'تطوع لمساعدة الطلاب المتعثرين',
        comment: 'Helpful peer',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'IMPROVEMENT')?.id,
        points: 3,
        descriptionEn: 'Demonstrated better focus and engagement',
        descriptionAr: 'أظهر تركيزاً ومشاركة أفضل',
        comment: 'Improved engagement',
        isActive: true,
        createdBy: creator.id
      },
      
      // Leadership and teamwork
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'LEADERSHIP')?.id,
        points: 5,
        descriptionEn: 'Successfully coordinated team presentation',
        descriptionAr: 'نسق بنجاح عرض الفريق',
        comment: 'Strong leadership',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'CREATIVITY')?.id,
        points: 4,
        descriptionEn: 'Developed creative approach to problem-solving',
        descriptionAr: 'طور نهجاً إبداعياً لحل المشكلات',
        comment: 'Creative problem solver',
        isActive: true,
        createdBy: creator.id
      },
      
      // More negative behaviors for realistic mix
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: behaviorTypes.find(b => b.code === 'UNPREPARED')?.id,
        points: -2,
        descriptionEn: 'Forgot homework assignment',
        descriptionAr: 'نسى واجب المنزل',
        comment: 'Unprepared',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: behaviorTypes.find(b => b.code === 'DISRUPTIVE')?.id,
        points: -3,
        descriptionEn: 'Used phone during lab session',
        descriptionAr: 'استخدم الهاتف خلال جلسة المعمل',
        comment: 'Phone use during class',
        isActive: true,
        createdBy: creator.id
      }
    ];

    for (const behaviorData of behaviors) {
      if (!behaviorData.userId || !behaviorData.classId || !behaviorData.typeId) {
        console.log(`   ⚠️  Skipping behavior - missing required data`);
        continue;
      }

      // Get the class to extract program and subject IDs
      const classData = classes.find(c => c.id === behaviorData.classId);
      if (classData) {
        behaviorData.programId = classData.programId;
        behaviorData.subjectId = classData.subjectId;
      }

      const existing = await prisma.behavior.findFirst({
        where: {
          userId: behaviorData.userId,
          classId: behaviorData.classId,
          typeId: behaviorData.typeId
        }
      });

      if (!existing) {
        await prisma.behavior.create({ data: behaviorData });
        const studentName = students.find(s => s.id === behaviorData.userId)?.displayName || 'Unknown';
        const className = classes.find(c => c.id === behaviorData.classId)?.code || 'Unknown';
        const typeName = behaviorTypes.find(t => t.id === behaviorData.typeId)?.code || 'Unknown';
        console.log(`   ✅ Created: ${typeName} for ${studentName} in ${className} (${behaviorData.points} points)`);
      } else {
        console.log(`   ⚠️  Already exists: Behavior for user ${behaviorData.userId}`);
      }
    }

    console.log('\n🎉 Sample behaviors created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 15 sample behaviors created');
    console.log('   - Positive and negative behaviors included');
    console.log('   - Various point values assigned');
    console.log('   - Different students and classes affected');
    console.log('\n✅ Ready for behavior tracking testing!\n');

  } catch (error) {
    console.error('❌ Error creating sample behaviors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createSampleBehaviors()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
