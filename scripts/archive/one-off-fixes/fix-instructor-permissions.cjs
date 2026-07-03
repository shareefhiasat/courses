const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function fixInstructorPermissions() {
  console.log('🔧 Fixing instructor role permissions to only allow QR Scanner...');

  try {
    // Get the qr-scanner screen
    const qrScannerScreen = await prisma.screen.findUnique({
      where: { screenId: 'qr-scanner' },
      include: { operations: true }
    });

    if (!qrScannerScreen) {
      console.error('❌ QR Scanner screen not found');
      return;
    }

    console.log(`📱 Found QR Scanner screen with ${qrScannerScreen.operations.length} operations`);

    // Get all screens
    const allScreens = await prisma.screen.findMany({
      where: { isActive: true },
      include: { operations: true }
    });

    // Update all role permissions for instructor
    let updatedCount = 0;
    for (const screen of allScreens) {
      for (const operation of screen.operations) {
        // Only allow QR Scanner operations for instructor
        const shouldAllow = screen.screenId === 'qr-scanner';
        
        const existing = await prisma.rolePermission.findUnique({
          where: {
            role_screenId_operationId: {
              role: 'instructor',
              screenId: screen.id,
              operationId: operation.id
            }
          }
        });

        if (existing) {
          if (existing.allowed !== shouldAllow) {
            await prisma.rolePermission.update({
              where: {
                role_screenId_operationId: {
                  role: 'instructor',
                  screenId: screen.id,
                  operationId: operation.id
                }
              },
              data: { allowed: shouldAllow }
            });
            updatedCount++;
            console.log(`${shouldAllow ? '✅' : '❌'} ${screen.screenId}.${operation.operationKey} -> ${shouldAllow}`);
          }
        } else {
          await prisma.rolePermission.create({
            data: {
              role: 'instructor',
              screenId: screen.id,
              operationId: operation.id,
              allowed: shouldAllow
            }
          });
          updatedCount++;
          console.log(`${shouldAllow ? '✅' : '❌'} ${screen.screenId}.${operation.operationKey} -> ${shouldAllow} (created)`);
        }
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} permissions for instructor role`);
    console.log('✅ Instructor now only has access to QR Scanner screen');
    
  } catch (error) {
    console.error('❌ Error fixing instructor permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixInstructorPermissions()
  .then(() => {
    console.log('✅ Fix script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix script failed:', error);
    process.exit(1);
  });
