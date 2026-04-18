import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addDrivePermissions() {
  try {
    console.log('Adding Drive screen to database...');
    
    // Add Drive screen
    const screen = await prisma.screen.upsert({
      where: { screenId: 'drive' },
      update: {},
      create: {
        screenId: 'drive',
        nameEn: 'Drive',
        nameAr: 'محرك الأقراص',
        category: 'files',
        isActive: true
      }
    });
    console.log('✅ Drive screen added:', screen);

    // Add Drive operations
    const ops = ['view', 'upload', 'delete', 'share'];
    for (const op of ops) {
      const operation = await prisma.operation.upsert({
        where: { operationKey: `drive.${op}` },
        update: {},
        create: {
          operationKey: `drive.${op}`,
          nameEn: op.charAt(0).toUpperCase() + op.slice(1),
          nameAr: op,
          category: 'drive',
          screenId: 'drive',
          isActive: true
        }
      });
      console.log(`✅ Operation drive.${op} added:`, operation);
    }

    // Add default permissions for admin, hr, and instructor roles
    const roles = ['admin', 'hr', 'instructor'];
    for (const role of roles) {
      for (const op of ops) {
        await prisma.rolePermission.upsert({
          where: {
            role_screenId_operationId: {
              role,
              screenId: 'drive',
              operationId: `drive.${op}`
            }
          },
          update: { allowed: true },
          create: {
            role,
            screenId: 'drive',
            operationId: `drive.${op}`,
            allowed: true
          }
        });
      }
      console.log(`✅ Permissions added for role: ${role}`);
    }

    console.log('🎉 Drive permissions setup complete!');
  } catch (error) {
    console.error('❌ Error adding Drive permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDrivePermissions();
