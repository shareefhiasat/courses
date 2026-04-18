import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWorkflowPermissions() {
  console.log('🌱 Seeding MinIO Workflow permissions...');

  try {
    // Find or create the Workflow screen
    let workflowScreen = await prisma.screen.findUnique({
      where: { screenId: 'workflow' }
    });

    if (!workflowScreen) {
      workflowScreen = await prisma.screen.create({
        data: {
          screenId: 'workflow',
          nameEn: 'Workflow Documents',
          nameAr: 'مستندات سير العمل',
          descriptionEn: 'MinIO-based workflow document management with approval processes',
          descriptionAr: 'إدارة مستندات سير العمل المستندة إلى MinIO مع عمليات الموافقة',
          category: 'storage',
          isActive: true
        }
      });
      console.log('✅ Created Workflow screen');
    }

    // Define operations for Workflow
    const operations = [
      {
        operationKey: 'workflow.view',
        nameEn: 'View Workflow Documents',
        nameAr: 'عرض مستندات سير العمل',
        descriptionEn: 'Access and view workflow documents',
        descriptionAr: 'الوصول وعرض مستندات سير العمل',
        category: 'read'
      },
      {
        operationKey: 'workflow.upload',
        nameEn: 'Upload Documents',
        nameAr: 'رفع المستندات',
        descriptionEn: 'Upload documents to workflow',
        descriptionAr: 'رفع المستندات إلى سير العمل',
        category: 'write'
      },
      {
        operationKey: 'workflow.approve',
        nameEn: 'Approve Documents',
        nameAr: 'الموافقة على المستندات',
        descriptionEn: 'Approve workflow documents',
        descriptionAr: 'الموافقة على مستندات سير العمل',
        category: 'write'
      },
      {
        operationKey: 'workflow.reject',
        nameEn: 'Reject Documents',
        nameAr: 'رفض المستندات',
        descriptionEn: 'Reject workflow documents',
        descriptionAr: 'رفض مستندات سير العمل',
        category: 'write'
      },
      {
        operationKey: 'workflow.review',
        nameEn: 'Review Documents',
        nameAr: 'مراجعة المستندات',
        descriptionEn: 'Review and comment on workflow documents',
        descriptionAr: 'مراجعة والتعليق على مستندات سير العمل',
        category: 'write'
      },
      {
        operationKey: 'workflow.download',
        nameEn: 'Download Documents',
        nameAr: 'تنزيل المستندات',
        descriptionEn: 'Download workflow documents',
        descriptionAr: 'تنزيل مستندات سير العمل',
        category: 'read'
      },
      {
        operationKey: 'workflow.status-change',
        nameEn: 'Change Document Status',
        nameAr: 'تغيير حالة المستند',
        descriptionEn: 'Change workflow document status',
        descriptionAr: 'تغيير حالة مستند سير العمل',
        category: 'write'
      },
      {
        operationKey: 'workflow.admin',
        nameEn: 'Workflow Administration',
        nameAr: 'إدارة سير العمل',
        descriptionEn: 'Full administrative access to workflow',
        descriptionAr: 'وصول إداري كامل لسير العمل',
        category: 'admin'
      }
    ];

    // Create or update operations
    for (const op of operations) {
      await prisma.operation.upsert({
        where: { operationKey: op.operationKey },
        update: {
          nameEn: op.nameEn,
          nameAr: op.nameAr,
          descriptionEn: op.descriptionEn,
          descriptionAr: op.descriptionAr,
          category: op.category
        },
        create: {
          ...op,
          screenId: workflowScreen.id,
          isActive: true
        }
      });
    }
    console.log(`✅ Created/Updated ${operations.length} workflow operations`);

    // Get all operations for permission assignment
    const allOperations = await prisma.operation.findMany({
      where: { screenId: workflowScreen.id }
    });

    // Define role permissions
    const rolePermissions = {
      SUPER_ADMIN: allOperations.map(op => op.id), // All permissions
      ADMIN: allOperations.filter(op => !op.operationKey.includes('admin')).map(op => op.id),
      HR: allOperations.filter(op => 
        ['workflow.view', 'workflow.upload', 'workflow.download', 'workflow.review', 'workflow.approve', 'workflow.reject', 'workflow.status-change'].includes(op.operationKey)
      ).map(op => op.id),
      INSTRUCTOR: allOperations.filter(op =>
        ['workflow.view', 'workflow.upload', 'workflow.download', 'workflow.review'].includes(op.operationKey)
      ).map(op => op.id),
      STUDENT: allOperations.filter(op =>
        ['workflow.view', 'workflow.download'].includes(op.operationKey)
      ).map(op => op.id)
    };

    // Create role permissions
    for (const [role, operationIds] of Object.entries(rolePermissions)) {
      // Screen-level permission
      const existingScreenPerm = await prisma.rolePermission.findFirst({
        where: {
          role,
          screenId: workflowScreen.id,
          operationId: null
        }
      });

      if (!existingScreenPerm) {
        await prisma.rolePermission.create({
          data: {
            role,
            screenId: workflowScreen.id,
            operationId: null,
            allowed: true
          }
        });
      }

      // Operation-level permissions
      for (const operationId of operationIds) {
        await prisma.rolePermission.upsert({
          where: {
            role_screenId_operationId: {
              role,
              screenId: workflowScreen.id,
              operationId
            }
          },
          update: { allowed: true },
          create: {
            role,
            screenId: workflowScreen.id,
            operationId,
            allowed: true
          }
        });
      }
    }

    console.log('✅ Workflow permissions seeded successfully!');
    console.log('\n📊 Permission Summary:');
    console.log('   SUPER_ADMIN: Full access to all workflow operations');
    console.log('   ADMIN: All operations except admin functions');
    console.log('   HR: View, upload, download, review, approve, reject, status change');
    console.log('   INSTRUCTOR: View, upload, download, review');
    console.log('   STUDENT: View, download only');

  } catch (error) {
    console.error('❌ Error seeding workflow permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedWorkflowPermissions()
  .then(() => {
    console.log('\n✅ Workflow permissions seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Workflow permissions seed failed:', error);
    process.exit(1);
  });
