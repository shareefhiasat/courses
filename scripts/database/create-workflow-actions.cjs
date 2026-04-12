/**
 * Create Workflow Actions Lookup Data
 * 
 * This script seeds the workflow action types for the lookup tables
 */

const { PrismaClient } = require('@prisma/client');

// Simple logger for database scripts
const info = (message, ...args) => console.log(`[INFO] ${message}`, ...args);
const error = (message, ...args) => console.error(`[ERROR] ${message}`, ...args);
const warn = (message, ...args) => console.warn(`[WARN] ${message}`, ...args);
const debug = (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args);

const prisma = new PrismaClient();

async function createWorkflowActions() {
  try {
    info('Creating workflow actions lookup data...');

    // Define workflow actions
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
        nameAr: 'م Approved',
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

    // Create or update workflow actions
    for (const action of workflowActions) {
      await prisma.categoryType.upsert({
        where: { code: action.code },
        update: {
          nameEn: action.nameEn,
          nameAr: action.nameAr,
          descriptionEn: action.descriptionEn,
          descriptionAr: action.descriptionAr,
          isActive: action.isActive,
          sortOrder: action.sortOrder
        },
        create: {
          code: action.code,
          nameEn: action.nameEn,
          nameAr: action.nameAr,
          descriptionEn: action.descriptionEn,
          descriptionAr: action.descriptionAr,
          isActive: action.isActive,
          sortOrder: action.sortOrder
        }
      });
    }

    info('✅ Workflow actions lookup data created successfully!');
    
    // Display created actions
    const createdActions = await prisma.categoryType.findMany({
      where: { code: { in: workflowActions.map(a => a.code) } },
      orderBy: { sortOrder: 'asc' }
    });

    console.log('\n📋 Created Workflow Actions:');
    createdActions.forEach(action => {
      console.log(`  - ${action.nameEn} (${action.code}) - ${action.nameAr}`);
    });

  } catch (err) {
    error('❌ Error creating workflow actions:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createWorkflowActions()
  .then(() => {
    info('🎉 Workflow actions seeding completed!');
    process.exit(0);
  })
  .catch((err) => {
    error('💥 Workflow actions seeding failed:', err);
    process.exit(1);
  });
