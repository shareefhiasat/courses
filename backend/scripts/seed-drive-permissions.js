import prisma from '../db/prismaClient.js';


async function seedDrivePermissions() {
  console.log('🌱 Seeding MinIO Drive permissions...');

  try {
    // Find or create the Drive screen
    let driveScreen = await prisma.screen.findUnique({
      where: { screenId: 'drive' }
    });

    if (!driveScreen) {
      driveScreen = await prisma.screen.create({
        data: {
          screenId: 'drive',
          nameEn: 'Smart Drive',
          nameAr: 'محرك الأقراص الذكي',
          descriptionEn: 'MinIO-based file storage with private, shared, and workflow spaces',
          descriptionAr: 'تخزين الملفات المستند إلى MinIO مع المساحات الخاصة والمشتركة وسير العمل',
          category: 'storage',
          isActive: true
        }
      });
      console.log('✅ Created Drive screen');
    } else {
      // Update existing drive screen
      driveScreen = await prisma.screen.update({
        where: { screenId: 'drive' },
        data: {
          nameEn: 'Smart Drive',
          nameAr: 'محرك الأقراص الذكي',
          descriptionEn: 'MinIO-based file storage with private, shared, and workflow spaces',
          descriptionAr: 'تخزين الملفات المستند إلى MinIO مع المساحات الخاصة والمشتركة وسير العمل',
          category: 'storage'
        }
      });
      console.log('✅ Updated Drive screen');
    }

    // Define operations for Drive
    const operations = [
      {
        operationKey: 'drive.view',
        nameEn: 'View Drive',
        nameAr: 'عرض محرك الأقراص',
        descriptionEn: 'Access and view drive files',
        descriptionAr: 'الوصول وعرض ملفات محرك الأقراص',
        category: 'read'
      },
      {
        operationKey: 'drive.upload',
        nameEn: 'Upload Files',
        nameAr: 'رفع الملفات',
        descriptionEn: 'Upload files to drive',
        descriptionAr: 'رفع الملفات إلى محرك الأقراص',
        category: 'write'
      },
      {
        operationKey: 'drive.download',
        nameEn: 'Download Files',
        nameAr: 'تنزيل الملفات',
        descriptionEn: 'Download files from drive',
        descriptionAr: 'تنزيل الملفات من محرك الأقراص',
        category: 'read'
      },
      {
        operationKey: 'drive.delete',
        nameEn: 'Delete Files',
        nameAr: 'حذف الملفات',
        descriptionEn: 'Delete files from drive',
        descriptionAr: 'حذف الملفات من محرك الأقراص',
        category: 'delete'
      },
      {
        operationKey: 'drive.share',
        nameEn: 'Share Files',
        nameAr: 'مشاركة الملفات',
        descriptionEn: 'Share files with other users',
        descriptionAr: 'مشاركة الملفات مع مستخدمين آخرين',
        category: 'write'
      },
      {
        operationKey: 'drive.version',
        nameEn: 'Manage Versions',
        nameAr: 'إدارة الإصدارات',
        descriptionEn: 'Create and restore file versions',
        descriptionAr: 'إنشاء واستعادة إصدارات الملفات',
        category: 'write'
      },
      {
        operationKey: 'drive.comment',
        nameEn: 'Comment on Files',
        nameAr: 'التعليق على الملفات',
        descriptionEn: 'Add comments to files',
        descriptionAr: 'إضافة تعليقات على الملفات',
        category: 'write'
      },
      {
        operationKey: 'drive.public-link',
        nameEn: 'Create Public Links',
        nameAr: 'إنشاء روابط عامة',
        descriptionEn: 'Generate public sharing links',
        descriptionAr: 'إنشاء روابط مشاركة عامة',
        category: 'write'
      },
      {
        operationKey: 'drive.private',
        nameEn: 'Access Private Space',
        nameAr: 'الوصول إلى المساحة الخاصة',
        descriptionEn: 'Access personal private storage',
        descriptionAr: 'الوصول إلى التخزين الخاص الشخصي',
        category: 'read'
      },
      {
        operationKey: 'drive.shared',
        nameEn: 'Access Shared Space',
        nameAr: 'الوصول إلى المساحة المشتركة',
        descriptionEn: 'Access shared storage space',
        descriptionAr: 'الوصول إلى مساحة التخزين المشتركة',
        category: 'read'
      },
      {
        operationKey: 'drive.workflow',
        nameEn: 'Access Workflow Space',
        nameAr: 'الوصول إلى مساحة سير العمل',
        descriptionEn: 'Access workflow document space',
        descriptionAr: 'الوصول إلى مساحة مستندات سير العمل',
        category: 'read'
      },
      {
        operationKey: 'drive.admin',
        nameEn: 'Drive Administration',
        nameAr: 'إدارة محرك الأقراص',
        descriptionEn: 'Full administrative access to all drive spaces',
        descriptionAr: 'وصول إداري كامل لجميع مساحات محرك الأقراص',
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
          screenId: driveScreen.id,
          isActive: true
        }
      });
    }
    console.log(`✅ Created/Updated ${operations.length} drive operations`);

    // Get all operations for permission assignment
    const allOperations = await prisma.operation.findMany({
      where: { screenId: driveScreen.id }
    });

    // Define role permissions
    const rolePermissions = {
      SUPER_ADMIN: allOperations.map(op => op.id), // All permissions
      ADMIN: allOperations.filter(op => !op.operationKey.includes('admin')).map(op => op.id),
      HR: allOperations.filter(op => 
        ['drive.view', 'drive.upload', 'drive.download', 'drive.share', 'drive.comment', 'drive.private', 'drive.shared', 'drive.workflow'].includes(op.operationKey)
      ).map(op => op.id),
      INSTRUCTOR: allOperations.filter(op =>
        ['drive.view', 'drive.upload', 'drive.download', 'drive.share', 'drive.comment', 'drive.version', 'drive.private', 'drive.shared', 'drive.workflow'].includes(op.operationKey)
      ).map(op => op.id),
      STUDENT: allOperations.filter(op =>
        ['drive.view', 'drive.download', 'drive.comment', 'drive.private'].includes(op.operationKey)
      ).map(op => op.id)
    };

    // Create role permissions
    for (const [role, operationIds] of Object.entries(rolePermissions)) {
      // Screen-level permission (check if exists first)
      const existingScreenPerm = await prisma.rolePermission.findFirst({
        where: {
          role,
          screenId: driveScreen.id,
          operationId: null
        }
      });

      if (!existingScreenPerm) {
        await prisma.rolePermission.create({
          data: {
            role,
            screenId: driveScreen.id,
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
              screenId: driveScreen.id,
              operationId
            }
          },
          update: { allowed: true },
          create: {
            role,
            screenId: driveScreen.id,
            operationId,
            allowed: true
          }
        });
      }
    }

    console.log('✅ Drive permissions seeded successfully!');
    console.log('\n📊 Permission Summary:');
    console.log('   SUPER_ADMIN: Full access to all drive operations');
    console.log('   ADMIN: All operations except admin functions');
    console.log('   HR: View, upload, download, share, comment (all spaces)');
    console.log('   INSTRUCTOR: View, upload, download, share, comment, version (all spaces)');
    console.log('   STUDENT: View, download, comment (private space only)');

  } catch (error) {
    console.error('❌ Error seeding drive permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDrivePermissions()
  .then(() => {
    console.log('\n✅ Drive permissions seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Drive permissions seed failed:', error);
    process.exit(1);
  });
