const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkInstructorPermissions() {
  console.log('🔍 Checking instructor role permissions...');

  try {
    // Get all screens with instructor permissions
    const screens = await prisma.screen.findMany({
      where: { isActive: true },
      include: {
        operations: {
          where: { isActive: true },
          include: {
            rolePermissions: {
              where: { role: 'instructor' }
            }
          }
        }
      },
      orderBy: { category: 'asc' }
    });

    console.log(`\n📱 Found ${screens.length} screens\n`);

    let allowedScreens = [];
    let deniedScreens = [];

    for (const screen of screens) {
      const allowedOps = screen.operations.filter(op => 
        op.rolePermissions.some(rp => rp.role === 'instructor' && rp.allowed)
      );

      if (allowedOps.length > 0) {
        allowedScreens.push({
          screenId: screen.screenId,
          nameEn: screen.nameEn,
          category: screen.category,
          allowedOperations: allowedOps.length,
          operations: allowedOps.map(op => op.operationKey)
        });
      } else {
        deniedScreens.push({
          screenId: screen.screenId,
          nameEn: screen.nameEn,
          category: screen.category
        });
      }
    }

    console.log('✅ Screens instructor CAN access:');
    allowedScreens.forEach(screen => {
      console.log(`  📌 ${screen.screenId} (${screen.category}) - ${screen.allowedOperations} operations`);
      screen.operations.forEach(op => console.log(`     - ${op}`));
    });

    console.log(`\n❌ Screens instructor CANNOT access (${deniedScreens.length}):`);
    deniedScreens.forEach(screen => {
      console.log(`  🚫 ${screen.screenId} (${screen.category})`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`  - Can access: ${allowedScreens.length} screens`);
    console.log(`  - Cannot access: ${deniedScreens.length} screens`);

  } catch (error) {
    console.error('❌ Error checking instructor permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructorPermissions()
  .then(() => {
    console.log('\n✅ Check script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check script failed:', error);
    process.exit(1);
  });
