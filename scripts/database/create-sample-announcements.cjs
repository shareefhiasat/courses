require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleAnnouncements() {
  console.log('📢 Creating sample announcements...\n');

  try {
    // Get lookup data
    const priorityTypes = await prisma.priorityTypes.findMany();
    const targetAudienceTypes = await prisma.targetAudienceTypes.findMany();
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

    const cs101Id = cs101?.id;

    const announcements = [
      // System-wide announcements
      {
        titleEn: 'System Maintenance Scheduled',
        titleAr: 'صيانة النظام المجدولة',
        descriptionEn: 'The LMS system will undergo maintenance on Saturday, April 5th from 2:00 AM to 6:00 AM. Please save your work and log out before the maintenance window.',
        descriptionAr: 'سيخضع نظام إدارة التعلم للصيانة يوم السبت 5 أبريل من الساعة 2:00 ص إلى 6:00 ص. يرجى حفظ عملك وتسجيل الخروج قبل فترة الصيانة.',
        priorityId: priorityTypes.find(p => p.code === 'HIGH')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'ALL')?.id,
        classId: null,
        programId: null,
        subjectId: null,
        isActive: true,
        publishAt: new Date('2025-04-01T09:00:00Z'),
        createdBy: creator.id
      },
      {
        titleEn: 'New Features Released',
        titleAr: 'ميزات جديدة تم إطلاقها',
        descriptionEn: 'We are excited to announce new features including enhanced video playback, improved mobile experience, and real-time collaboration tools.',
        descriptionAr: 'يسعدنا أن نعلن عن ميزات جديدة تشمل تشغيل الفيديو المحسن، وتجربة محمولة محسنة، وأدوات التعاون في الوقت الفعلي.',
        priorityId: priorityTypes.find(p => p.code === 'NORMAL')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'ALL')?.id,
        classId: null,
        programId: null,
        subjectId: null,
        isActive: true,
        publishAt: new Date('2025-03-30T10:00:00Z'),
        createdBy: creator.id
      },
      
      // Program-specific announcements
      {
        titleEn: 'CS Program - Guest Lecture Series',
        titleAr: 'برنامج علوم الحاسوب - سلسلة محاضرات ضيوف',
        descriptionEn: 'Join us for an exciting guest lecture series featuring industry experts from leading tech companies. First session: "AI in Software Development" on April 10th.',
        descriptionAr: 'انضم إلينا في سلسلة محاضرات ضيوف مثيرة تضم خبراء من الصناعة من شركات التكنولوجيا الرائدة. الجلسة الأولى: "الذكاء الاصطناعي في تطوير البرمجيات" في 10 أبريل.',
        priorityId: priorityTypes.find(p => p.code === 'NORMAL')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'PROGRAM')?.id,
        classId: null,
        programId: csProgramId,
        subjectId: null,
        isActive: true,
        publishAt: new Date('2025-04-02T14:00:00Z'),
        createdBy: creator.id
      },
      
      // Class-specific announcements
      {
        titleEn: 'CS101-001 - Midterm Exam Schedule',
        titleAr: 'CS101-001 - جدول امتحان منتصف الفصل',
        descriptionEn: 'Midterm exam for CS101-001 will be held on April 15th at 10:00 AM in Building A, Room 101. The exam will cover chapters 1-5. Please review the study materials.',
        descriptionAr: 'سيتم عقد امتحان منتصف الفصل لـ CS101-001 في 15 أبريل الساعة 10:00 ص في المبنى أ، غرفة 101. سيغطي الامتحان الفصول 1-5. يرجى مراجعة مواد الدراسة.',
        priorityId: priorityTypes.find(p => p.code === 'HIGH')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'CLASS')?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        programId: null,
        subjectId: null,
        isActive: true,
        publishAt: new Date('2025-04-01T11:00:00Z'),
        createdBy: creator.id
      },
      {
        titleEn: 'CS102-001 - Lab Assignment Due',
        titleAr: 'CS102-001 - موعد تسليم واجب المعمل',
        descriptionEn: 'Lab Assignment 3 is due on April 8th by 11:59 PM. Please submit your work through the LMS portal. Late submissions will incur a 10% penalty per day.',
        descriptionAr: 'واجب المعمل 3 مستحق في 8 أبريل الساعة 11:59 م. يرجى تقديم عملك عبر بوابة إدارة التعلم. التسليمات المتأخرة ستتعرض لخصم 10% يومياً.',
        priorityId: priorityTypes.find(p => p.code === 'NORMAL')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'CLASS')?.id,
        classId: classes.find(c => c.code === 'CS102-001')?.id,
        programId: null,
        subjectId: null,
        isActive: true,
        publishAt: new Date('2025-04-01T09:00:00Z'),
        createdBy: creator.id
      },
      {
        titleEn: 'CS101-002 - Extra Session Added',
        titleAr: 'CS101-002 - تمت إضافة جلسة إضافية',
        descriptionEn: 'An extra tutorial session has been added for CS101-002 on Friday, April 5th at 2:00 PM in Building A, Room 102. This session will cover problem-solving techniques.',
        descriptionAr: 'تمت إضافة جلسة دراسية إضافية لـ CS101-002 يوم الجمعة 5 أبريل الساعة 2:00 م في المبنى أ، غرفة 102. ستغطي هذه الجلسة تقنيات حل المشكلات.',
        priorityId: priorityTypes.find(p => p.code === 'NORMAL')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'CLASS')?.id,
        classId: classes.find(c => c.code === 'CS101-002')?.id,
        programId: null,
        subjectId: null,
        isActive: true,
        publishAt: new Date('2025-04-01T13:00:00Z'),
        createdBy: creator.id
      },
      
      // Instructor announcements
      {
        titleEn: 'Office Hours Update - Dr. Sarah Johnson',
        titleAr: 'تحديث الساعات المكتبية - د. سارة جونسون',
        descriptionEn: 'Dr. Sarah Johnson will have extended office hours this week: Monday 3-5 PM, Wednesday 2-4 PM, and Friday 1-3 PM. No appointment necessary.',
        descriptionAr: 'سيكون لدى د. سارة جونسون ساعات مكتبية موسعة هذا الأسبوع: الاثنين 3-5 م، الأربعاء 2-4 م، والجمعة 1-3 م. لا حاجة لموعد.',
        priorityId: priorityTypes.find(p => p.code === 'NORMAL')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'STUDENTS')?.id,
        classId: null,
        programId: csProgramId,
        subjectId: cs101Id,
        isActive: true,
        publishAt: new Date('2025-03-30T15:00:00Z'),
        createdBy: creator.id
      },
      
      // Urgent announcement
      {
        titleEn: 'URGENT: Class Room Change',
        titleAr: 'عاجل: تغيير قاعة الدراسة',
        descriptionEn: 'CS101-001 class location has been temporarily changed to Building C, Room 305 for today (March 30) due to facility maintenance. Normal location resumes tomorrow.',
        descriptionAr: 'تم تغيير موقع فصل CS101-001 مؤقتاً إلى المبنى ج، غرفة 305 ليوم اليوم (30 مارس) بسبب صيانة المرافق. يستأنف الموقع الطبيعي غداً.',
        priorityId: priorityTypes.find(p => p.code === 'URGENT')?.id,
        targetAudienceId: targetAudienceTypes.find(t => t.code === 'CLASS')?.id,
        classId: classes.find(c => c.code === 'CS101-001')?.id,
        programId: null,
        subjectId: null,
        isActive: true,
        publishAt: new Date('2025-03-30T08:00:00Z'),
        createdBy: creator.id
      }
    ];

    for (const announcementData of announcements) {
      const existing = await prisma.announcement.findFirst({
        where: {
          titleEn: announcementData.titleEn,
          priorityId: announcementData.priorityId
        }
      });

      if (!existing) {
        await prisma.announcement.create({ data: announcementData });
        console.log(`   ✅ Created: ${announcementData.titleEn}`);
      } else {
        console.log(`   ⚠️  Already exists: ${announcementData.titleEn}`);
      }
    }

    console.log('\n🎉 Sample announcements created successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 9 sample announcements created');
    console.log('   - Multiple priority levels covered');
    console.log('   - Different target audiences addressed');
    console.log('   - Scheduled announcements for testing');
    console.log('\n✅ Ready for announcement testing!\n');

  } catch (error) {
    console.error('❌ Error creating sample announcements:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createSampleAnnouncements()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
