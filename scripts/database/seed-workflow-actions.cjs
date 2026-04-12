require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedWorkflowActions() {
  try {
    console.log('🌱 Seeding workflow actions...');

    const workflowActions = [
      {
        code: 'review',
        nameEn: 'Review',
        nameAr: 'مراجعة',
        descriptionEn: 'Document pending review',
        descriptionAr: 'المستند في انتظار المراجعة',
        isActive: true,
        sortOrder: 1
      },
      {
        code: 'approve',
        nameEn: 'Approve',
        nameAr: 'موافقة',
        descriptionEn: 'Document approved',
        descriptionAr: 'تمت الموافقة على المستند',
        isActive: true,
        sortOrder: 2
      },
      {
        code: 'revise',
        nameEn: 'Revise',
        nameAr: 'تعديل',
        descriptionEn: 'Document needs revision',
        descriptionAr: 'المستند يحتاج إلى تعديل',
        isActive: true,
        sortOrder: 3
      },
      {
        code: 'approved',
        nameEn: 'Approved',
        nameAr: 'موافق عليه',
        descriptionEn: 'Document fully approved',
        descriptionAr: 'تمت الموافقة النهائية على المستند',
        isActive: true,
        sortOrder: 4
      },
      {
        code: 'return',
        nameEn: 'Return',
        nameAr: 'إرجاع',
        descriptionEn: 'Document returned to sender',
        descriptionAr: 'تم إرجاع المستند إلى المرسل',
        isActive: true,
        sortOrder: 5
      },
      {
        code: 'close',
        nameEn: 'Close',
        nameAr: 'إغلاق',
        descriptionEn: 'Workflow closed',
        descriptionAr: 'تم إغلاق سير العمل',
        isActive: true,
        sortOrder: 6
      },
      {
        code: 'send',
        nameEn: 'Send',
        nameAr: 'إرسال',
        descriptionEn: 'Document sent for processing',
        descriptionAr: 'تم إرسال المستند للمعالجة',
        isActive: true,
        sortOrder: 7
      }
    ];

    for (const action of workflowActions) {
      // Check if action already exists
      const existing = await prisma.categoryType.findFirst({
        where: { code: action.code }
      });

      if (!existing) {
        // Insert new action
        await prisma.categoryType.create({
          data: {
            code: action.code,
            nameEn: action.nameEn,
            nameAr: action.nameAr,
            descriptionEn: action.descriptionEn,
            descriptionAr: action.descriptionAr,
            isActive: action.isActive,
            sortOrder: action.sortOrder
          }
        });
        console.log(`✅ Created: ${action.nameEn} (${action.code})`);
      } else {
        // Update existing action
        await prisma.categoryType.update({
          where: { id: existing.id },
          data: {
            nameEn: action.nameEn,
            nameAr: action.nameAr,
            descriptionEn: action.descriptionEn,
            descriptionAr: action.descriptionAr,
            isActive: action.isActive,
            sortOrder: action.sortOrder
          }
        });
        console.log(`🔄 Updated: ${action.nameEn} (${action.code})`);
      }
    }

    console.log('\n🎉 Workflow actions seeded successfully!');
    
    // Display all actions
    const result = await prisma.categoryType.findMany({
      where: { code: { in: workflowActions.map(a => a.code) } },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, nameEn: true, nameAr: true }
    });

    console.log('\n📋 Current Workflow Actions:');
    result.forEach(action => {
      console.log(`  - ${action.nameEn} (${action.code}) - ${action.nameAr}`);
    });

  } catch (error) {
    console.error('❌ Error seeding workflow actions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedWorkflowActions()
  .then(() => {
    console.log('✅ Workflow actions seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Workflow actions seeding failed:', error);
    process.exit(1);
  });
