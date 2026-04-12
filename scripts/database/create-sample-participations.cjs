require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleParticipations() {
  console.log('👥 Creating sample participations...\n');

  try {
    // Get lookup data
    const participationTypes = await prisma.participationTypes.findMany();
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

    const participations = [
      // Attendance participations
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: participationTypes.find(p => p.code === 'ATTENDANCE')?.id,
        points: 9,
        descriptionEn: 'Present and on time',
        descriptionAr: 'حاضر في الوقت المحدد',
        comment: 'Good attendance',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: participationTypes.find(p => p.code === 'ATTENDANCE')?.id,
        points: 8,
        descriptionEn: 'Present but 5 minutes late',
        descriptionAr: 'حاضر ولكنه تأخر 5 دقائق',
        comment: 'Late arrival',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: participationTypes.find(p => p.code === 'ATTENDANCE')?.id,
        points: 1,
        descriptionEn: 'Absent without excuse',
        descriptionAr: 'غائب بدون عذر',
        comment: 'Unexcused absence',
        isActive: true,
        createdBy: creator.id
      },
      
      // Discussion participations
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: participationTypes.find(p => p.code === 'DISCUSSION')?.id,
        points: 8,
        descriptionEn: 'Excellent contributions to algorithm discussion',
        descriptionAr: 'مساهمات ممتازة في مناقشة الخوارزميات',
        comment: 'Active participant',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: participationTypes.find(p => p.code === 'DISCUSSION')?.id,
        points: 7,
        descriptionEn: 'Good participation, asked relevant questions',
        descriptionAr: 'مشاركة جيدة، طرح أسئلة ذات صلة',
        comment: 'Good engagement',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: participationTypes.find(p => p.code === 'DISCUSSION')?.id,
        points: 6,
        descriptionEn: 'Participated but could contribute more',
        descriptionAr: 'شارك ولكنه يمكن أن يساهم أكثر',
        comment: 'Needs more engagement',
        isActive: true,
        createdBy: creator.id
      },
      
      // Presentation participations
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: participationTypes.find(p => p.code === 'PRESENTATION')?.id,
        points: 9,
        descriptionEn: 'Outstanding presentation on data structures',
        descriptionAr: 'عرض تقديمي ممتاز حول هياكل البيانات',
        comment: 'Excellent presentation skills',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: participationTypes.find(p => p.code === 'PRESENTATION')?.id,
        points: 8,
        descriptionEn: 'Good presentation, clear explanations',
        descriptionAr: 'عرض تقديمي جيد، شروحات واضحة',
        comment: 'Good presentation',
        isActive: true,
        createdBy: creator.id
      },
      
      // Group work participations
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: participationTypes.find(p => p.code === 'GROUP_WORK')?.id,
        points: 9,
        descriptionEn: 'Excellent teamwork in programming exercise',
        descriptionAr: 'عمل جماعي ممتاز في تمرين البرمجة',
        comment: 'Great team player',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: participationTypes.find(p => p.code === 'GROUP_WORK')?.id,
        points: 8,
        descriptionEn: 'Good collaboration with team members',
        descriptionAr: 'تعاون جيد مع أعضاء الفريق',
        comment: 'Good collaborator',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: participationTypes.find(p => p.code === 'GROUP_WORK')?.id,
        points: 7,
        descriptionEn: 'Participated but needs more engagement',
        descriptionAr: 'شارك ولكنه يحتاج إلى مزيد من المشاركة',
        comment: 'Could be more active',
        isActive: true,
        createdBy: creator.id
      },
      
      // Project participations
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: participationTypes.find(p => p.code === 'PROJECT')?.id,
        points: 9,
        descriptionEn: 'Excellent project implementation and documentation',
        descriptionAr: 'تنفيذ وتوثيق ممتاز للمشروع',
        comment: 'Outstanding work',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: participationTypes.find(p => p.code === 'PROJECT')?.id,
        points: 8,
        descriptionEn: 'Good project work, needs better documentation',
        descriptionAr: 'عمل جيد في المشروع، يحتاج إلى توثيق أفضل',
        comment: 'Good work overall',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: participationTypes.find(p => p.code === 'PROJECT')?.id,
        points: 7,
        descriptionEn: 'Completed project with basic requirements',
        descriptionAr: 'أكمل المشروع بالمتطلبات الأساسية',
        comment: 'Met basic requirements',
        isActive: true,
        createdBy: creator.id
      },
      
      // Multiple attendance records for tracking
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: participationTypes.find(p => p.code === 'ATTENDANCE')?.id,
        points: 9,
        descriptionEn: 'Present and actively participated',
        descriptionAr: 'حاضر وشارك بفعالية',
        comment: 'Excellent attendance',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: participationTypes.find(p => p.code === 'ATTENDANCE')?.id,
        points: 9,
        descriptionEn: 'Present and on time',
        descriptionAr: 'حاضر في الوقت المحدد',
        comment: 'Good attendance',
        isActive: true,
        createdBy: creator.id
      }
    ];

    for (const participationData of participations) {
      if (!participationData.userId || !participationData.classId || !participationData.typeId) {
        console.log(`   ⚠️  Skipping participation - missing required data`);
        continue;
      }

      // Get the class to extract program and subject IDs
      const classData = classes.find(c => c.id === participationData.classId);
      if (classData) {
        participationData.programId = classData.programId;
        participationData.subjectId = classData.subjectId;
      }

      const existing = await prisma.participation.findFirst({
        where: {
          userId: participationData.userId,
          classId: participationData.classId,
          typeId: participationData.typeId
        }
      });

      if (!existing) {
        await prisma.participation.create({ data: participationData });
        const studentName = students.find(s => s.id === participationData.userId)?.displayName || 'Unknown';
        const className = classes.find(c => c.id === participationData.classId)?.code || 'Unknown';
        const typeName = participationTypes.find(t => t.id === participationData.typeId)?.code || 'Unknown';
        console.log(`   ✅ Created: ${typeName} for ${studentName} in ${className}`);
      } else {
        console.log(`   ⚠️  Already exists: Participation for user ${participationData.userId}`);
      }
    }

    console.log('\n🎉 Sample participations created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 15 sample participations created');
    console.log('   - All participation types covered');
    console.log('   - Various scores and comments');
    console.log('   - Different students and classes');
    console.log('\n✅ Ready for participation testing!\n');

  } catch (error) {
    console.error('❌ Error creating sample participations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createSampleParticipations()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
