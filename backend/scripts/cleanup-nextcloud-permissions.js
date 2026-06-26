import prisma from '../db/prismaClient.js';


async function cleanupNextcloudPermissions() {
  console.log('🧹 Cleaning up Nextcloud-related permissions...');

  try {
    // Find Nextcloud-related screens
    const nextcloudScreens = await prisma.screen.findMany({
      where: {
        OR: [
          { screenId: { contains: 'nextcloud' } },
          { screenId: 'workspace' }, // Old Nextcloud workspace
          { screenId: 'workflow' }   // Old Nextcloud workflow (we'll recreate this for MinIO)
        ]
      },
      include: {
        operations: true,
        rolePermissions: true
      }
    });

    console.log(`\n📋 Found ${nextcloudScreens.length} Nextcloud-related screens:`);
    nextcloudScreens.forEach(screen => {
      console.log(`   - ${screen.screenId}: ${screen.nameEn} (${screen.operations.length} operations, ${screen.rolePermissions.length} permissions)`);
    });

    if (nextcloudScreens.length === 0) {
      console.log('\n✅ No Nextcloud screens found - already clean!');
      return;
    }

    // Delete role permissions for these screens
    let deletedPermissions = 0;
    for (const screen of nextcloudScreens) {
      const result = await prisma.rolePermission.deleteMany({
        where: { screenId: screen.id }
      });
      deletedPermissions += result.count;
    }
    console.log(`\n🗑️  Deleted ${deletedPermissions} role permissions`);

    // Delete operations for these screens
    let deletedOperations = 0;
    for (const screen of nextcloudScreens) {
      const result = await prisma.operation.deleteMany({
        where: { screenId: screen.id }
      });
      deletedOperations += result.count;
    }
    console.log(`🗑️  Deleted ${deletedOperations} operations`);

    // Delete the screens themselves (except workflow which we'll keep for MinIO)
    const screensToDelete = nextcloudScreens.filter(s => s.screenId !== 'workflow');
    for (const screen of screensToDelete) {
      await prisma.screen.delete({
        where: { id: screen.id }
      });
    }
    console.log(`🗑️  Deleted ${screensToDelete.length} screens`);

    // Update workflow screen for MinIO if it exists
    const workflowScreen = nextcloudScreens.find(s => s.screenId === 'workflow');
    if (workflowScreen) {
      await prisma.screen.update({
        where: { id: workflowScreen.id },
        data: {
          nameEn: 'Workflow Documents',
          nameAr: 'مستندات سير العمل',
          descriptionEn: 'MinIO-based workflow document management',
          descriptionAr: 'إدارة مستندات سير العمل المستندة إلى MinIO',
          category: 'storage'
        }
      });
      console.log(`\n✅ Updated workflow screen for MinIO compatibility`);
    }

    console.log('\n✅ Nextcloud permissions cleanup completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Deleted ${deletedPermissions} permissions`);
    console.log(`   - Deleted ${deletedOperations} operations`);
    console.log(`   - Deleted ${screensToDelete.length} screens`);
    console.log(`   - Updated workflow screen for MinIO`);

  } catch (error) {
    console.error('❌ Error cleaning up Nextcloud permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupNextcloudPermissions()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
