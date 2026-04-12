require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSamplePenalties() {
  console.log('⚠️ Creating sample penalties...\n');

  try {
    // Get lookup data
    const penaltyTypes = await prisma.penaltyTypes.findMany();
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

    const penalties = [
      // Late submission penalties
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'LATE_SUBMISSION')?.id,
        descriptionEn: 'Assignment submitted 2 days late',
        descriptionAr: 'تم تقديم الواجب متأخراً يومين',
        points: -5,
        comment: 'Late submission penalty',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'LATE_SUBMISSION')?.id,
        descriptionEn: 'Lab report submitted 1 day late',
        descriptionAr: 'تم تقديم تقرير المعمل متأخراً يوماً واحداً',
        points: -3,
        comment: 'Late submission penalty',
        isActive: true,
        createdBy: creator.id
      },
      
      // Absence penalties
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: penaltyTypes.find(p => p.code === 'ABSENCE')?.id,
        descriptionEn: 'Unexcused absence from lecture',
        descriptionAr: 'غياب بدون عذر من المحاضرة',
        points: -10,
        comment: 'Unexcused absence',
        isActive: true,
        createdBy: creator.id
      },
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'ABSENCE')?.id,
        descriptionEn: 'Missed lab session without notification',
        descriptionAr: 'فوت جلسة المعمل بدون إشعار',
        points: -8,
        comment: 'Unexcused absence from lab',
        isActive: true,
        createdBy: creator.id
      },
      
      // Misconduct penalties
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'MISCONDUCT')?.id,
        descriptionEn: 'Disruptive behavior during lecture',
        descriptionAr: 'سلوك مزعج أثناء المحاضرة',
        points: -15,
        comment: 'Disruptive behavior warning',
        isActive: true,
        createdBy: creator.id
      },
      
      // Cheating penalties
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'CHEATING')?.id,
        descriptionEn: 'Caught using unauthorized materials during quiz',
        descriptionAr: 'تم ضبطه يستخدم مواد غير مصرح بها خلال الاختبار',
        points: -25,
        comment: 'Academic dishonesty',
        isActive: true,
        createdBy: creator.id
      },
      
      // Plagiarism penalties
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'PLAGIARISM')?.id,
        descriptionEn: 'Significant plagiarism detected in programming assignment',
        descriptionAr: 'تم اكتشاف سرقة أدبية كبيرة في واجب البرمجة',
        points: -30,
        comment: 'Plagiarism violation',
        isActive: true,
        createdBy: creator.id
      },
      
      // Disruption penalties
      {
        userId: students[1]?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        typeId: penaltyTypes.find(p => p.code === 'DISRUPTION')?.id,
        descriptionEn: 'Repeated use of mobile phone during class',
        descriptionAr: 'استخدام متكرر للهاتف المحمول أثناء الفصل',
        points: -12,
        comment: 'Class disruption',
        isActive: true,
        createdBy: creator.id
      },
      
      // Dress code violations
      {
        userId: students[2]?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'DRESS_CODE')?.id,
        descriptionEn: 'Violation of lab dress code requirements',
        descriptionAr: 'مخالفة متطلبات زي المعمل',
        points: -5,
        comment: 'Dress code violation',
        isActive: true,
        createdBy: creator.id
      },
      
      // Multiple penalties for one student
      {
        userId: students[0]?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        typeId: penaltyTypes.find(p => p.code === 'LATE_SUBMISSION')?.id,
        descriptionEn: 'Final project submitted 3 days late',
        descriptionAr: 'تم تقديم المشروع النهائي متأخراً 3 أيام',
        points: -10,
        comment: 'Late final project submission',
        isActive: true,
        createdBy: creator.id
      }
    ];

    for (const penaltyData of penalties) {
      if (!penaltyData.userId || !penaltyData.classId || !penaltyData.typeId) {
        console.log(`   ⚠️  Skipping penalty - missing required data`);
        continue;
      }

      // Get the class to extract program and subject IDs
      const classData = classes.find(c => c.id === penaltyData.classId);
      if (classData) {
        penaltyData.programId = classData.programId;
        penaltyData.subjectId = classData.subjectId;
      }

      const existing = await prisma.penalty.findFirst({
        where: {
          userId: penaltyData.userId,
          classId: penaltyData.classId,
          typeId: penaltyData.typeId
        }
      });

      if (!existing) {
        await prisma.penalty.create({ data: penaltyData });
        const studentName = students.find(s => s.id === penaltyData.userId)?.displayName || 'Unknown';
        const className = classes.find(c => c.id === penaltyData.classId)?.code || 'Unknown';
        console.log(`   ✅ Created: Penalty for ${studentName} in ${className}`);
      } else {
        console.log(`   ⚠️  Already exists: Penalty for user ${penaltyData.userId}`);
      }
    }

    console.log('\n🎉 Sample penalties created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 10 sample penalties created');
    console.log('   - All penalty types covered');
    console.log('   - Various severity levels');
    console.log('   - Different students and classes affected');
    console.log('\n✅ Ready for penalty testing!\n');

  } catch (error) {
    console.error('❌ Error creating sample penalties:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createSamplePenalties()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
