const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function updateQRScannerPermissions() {
  console.log('🔧 Updating QR Scanner permissions per new requirements...');

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

    // Define permission matrix for each role
    // Operations: canDeleteAttendance, canClearToday, canEditAttendance, canBulkScan, 
    //             canManualInput, canUseStatsPanel, canUseZapPanel, canMarkAttendance, 
    //             canUseQRScanner, canSeeStandupMode, canExport, canSeeQuickButtons, canExportSummary
    const rolePermissions = {
      super_admin: {
        canDeleteAttendance: true,
        canClearToday: true,
        canEditAttendance: true,
        canBulkScan: true,
        canManualInput: true,
        canUseStatsPanel: false,  // Disabled per requirements
        canUseZapPanel: false,     // Disabled per requirements
        canMarkAttendance: true,
        canUseQRScanner: true,
        canSeeStandupMode: true,   // Sees everything
        canExport: true,           // Daily + Summary
        canSeeQuickButtons: true,
        canExportSummary: true     // Attendance report
      },
      admin: {
        canDeleteAttendance: false,  // Only SuperAdmin can delete
        canClearToday: false,
        canEditAttendance: false,    // Only SuperAdmin and HR can edit
        canBulkScan: true,
        canManualInput: true,
        canUseStatsPanel: false,    // Disabled per requirements
        canUseZapPanel: false,      // Disabled per requirements
        canMarkAttendance: true,
        canUseQRScanner: true,
        canSeeStandupMode: true,    // Only sees stand-up attendants
        canExport: true,            // Daily only
        canSeeQuickButtons: true,
        canExportSummary: false     // No summary/report
      },
      hr: {
        canDeleteAttendance: false,  // Only SuperAdmin can delete
        canClearToday: false,
        canEditAttendance: true,     // HR can edit
        canBulkScan: false,          // HR cannot bulk scan
        canManualInput: false,
        canUseStatsPanel: false,     // Disabled per requirements
        canUseZapPanel: false,       // Disabled per requirements
        canMarkAttendance: true,
        canUseQRScanner: true,
        canSeeStandupMode: false,    // Sees normal attendants (not stand-up)
        canExport: true,             // Daily + Summary
        canSeeQuickButtons: true,
        canExportSummary: true       // Attendance report
      },
      instructor: {
        canDeleteAttendance: false,  // Only SuperAdmin can delete
        canClearToday: false,
        canEditAttendance: false,    // Instructor cannot edit
        canBulkScan: true,
        canManualInput: true,
        canUseStatsPanel: false,     // Disabled per requirements
        canUseZapPanel: false,       // Disabled per requirements
        canMarkAttendance: true,
        canUseQRScanner: true,
        canSeeStandupMode: false,    // Sees normal attendants (not stand-up)
        canExport: true,             // Daily + Summary
        canSeeQuickButtons: true,
        canExportSummary: false      // No summary/report
      },
      student: {
        canDeleteAttendance: false,
        canClearToday: false,
        canEditAttendance: false,
        canBulkScan: false,
        canManualInput: false,
        canUseStatsPanel: false,
        canUseZapPanel: false,
        canMarkAttendance: false,
        canUseQRScanner: false,
        canSeeStandupMode: false,
        canExport: false,
        canSeeQuickButtons: false,
        canExportSummary: false
      }
    };

    // Map operation keys to permission names
    const opKeyToPermName = {
      'qr-scanner.canDeleteAttendance': 'canDeleteAttendance',
      'qr-scanner.canClearToday': 'canClearToday',
      'qr-scanner.canEditAttendance': 'canEditAttendance',
      'qr-scanner.canBulkScan': 'canBulkScan',
      'qr-scanner.canManualInput': 'canManualInput',
      'qr-scanner.canUseStatsPanel': 'canUseStatsPanel',
      'qr-scanner.canUseZapPanel': 'canUseZapPanel',
      'qr-scanner.canMarkAttendance': 'canMarkAttendance',
      'qr-scanner.canUseQRScanner': 'canUseQRScanner',
      'qr-scanner.canSeeStandupMode': 'canSeeStandupMode',
      'qr-scanner.canExport': 'canExport',
      'qr-scanner.canSeeQuickButtons': 'canSeeQuickButtons',
      'qr-scanner.canExportSummary': 'canExportSummary'
    };

    // Update permissions for each role
    let updatedCount = 0;
    const roles = ['super_admin', 'admin', 'hr', 'instructor', 'student'];

    for (const role of roles) {
      console.log(`\n🔐 Updating ${role} permissions:`);
      
      for (const operation of qrScannerScreen.operations) {
        const permName = opKeyToPermName[operation.operationKey];
        if (!permName) {
          console.log(`  ⚠️  Unknown operation: ${operation.operationKey}`);
          continue;
        }

        const shouldAllow = rolePermissions[role][permName];
        
        const existing = await prisma.rolePermission.findUnique({
          where: {
            role_screenId_operationId: {
              role: role,
              screenId: qrScannerScreen.id,
              operationId: operation.id
            }
          }
        });

        if (existing) {
          if (existing.allowed !== shouldAllow) {
            await prisma.rolePermission.update({
              where: {
                role_screenId_operationId: {
                  role: role,
                  screenId: qrScannerScreen.id,
                  operationId: operation.id
                }
              },
              data: { allowed: shouldAllow }
            });
            updatedCount++;
            console.log(`  ${shouldAllow ? '✅' : '❌'} ${permName} -> ${shouldAllow}`);
          } else {
            console.log(`  ➡️  ${permName} -> ${shouldAllow} (no change)`);
          }
        } else {
          await prisma.rolePermission.create({
            data: {
              role: role,
              screenId: qrScannerScreen.id,
              operationId: operation.id,
              allowed: shouldAllow
            }
          });
          updatedCount++;
          console.log(`  ${shouldAllow ? '✅' : '❌'} ${permName} -> ${shouldAllow} (created)`);
        }
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} permissions for QR Scanner`);
    console.log('✅ QR Scanner permissions updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating QR Scanner permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateQRScannerPermissions()
  .then(() => {
    console.log('✅ Update script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update script failed:', error);
    process.exit(1);
  });
