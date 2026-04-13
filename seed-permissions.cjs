const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function seedPermissions() {
  console.log('🌱 Starting permission system seed...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing permission data...');
    await prisma.rolePermission.deleteMany();
    await prisma.operation.deleteMany();
    await prisma.screen.deleteMany();

    // Create QR Scanner screen
    console.log('📱 Creating QR Scanner screen...');
    const qrScannerScreen = await prisma.screen.create({
      data: {
        screenId: 'qr-scanner',
        nameEn: 'QR Scanner',
        nameAr: 'ماسح QR',
        descriptionEn: 'Daily attendance scanning via QR codes',
        descriptionAr: 'مسح الحضور اليومي عبر رموز QR',
        category: 'operations',
        isActive: true
      }
    });
    console.log('✅ QR Scanner screen created:', qrScannerScreen.id);

    // Create QR Scanner operations
    console.log('⚙️ Creating QR Scanner operations...');
    const operationsData = [
      {
        operationKey: 'canDeleteAttendance',
        nameEn: 'Delete Attendance',
        nameAr: 'حذف الحضور',
        descriptionEn: 'Ability to delete attendance records',
        descriptionAr: 'القدرة على حذف سجلات الحضور',
        category: 'delete'
      },
      {
        operationKey: 'canClearToday',
        nameEn: 'Clear Today',
        nameAr: 'مسح اليوم',
        descriptionEn: 'Clear all attendance for today',
        descriptionAr: 'مسح جميع الحضور لليوم',
        category: 'delete'
      },
      {
        operationKey: 'canEditAttendance',
        nameEn: 'Edit Attendance',
        nameAr: 'تعديل الحضور',
        descriptionEn: 'Ability to edit attendance records',
        descriptionAr: 'القدرة على تعديل سجلات الحضور',
        category: 'update'
      },
      {
        operationKey: 'canBulkScan',
        nameEn: 'Bulk Scan',
        nameAr: 'مسح جماعي',
        descriptionEn: 'Scan multiple students at once',
        descriptionAr: 'مسح عدة طلاب في وقت واحد',
        category: 'update'
      },
      {
        operationKey: 'canManualInput',
        nameEn: 'Manual Input',
        nameAr: 'إدخال يدوي',
        descriptionEn: 'Manually enter attendance',
        descriptionAr: 'إدخال الحضور يدوياً',
        category: 'create'
      },
      {
        operationKey: 'canUseStatsPanel',
        nameEn: 'Use Stats Panel',
        nameAr: 'استخدام لوحة الإحصائيات',
        descriptionEn: 'Access statistics panel',
        descriptionAr: 'الوصول إلى لوحة الإحصائيات',
        category: 'view'
      },
      {
        operationKey: 'canUseZapPanel',
        nameEn: 'Use Zap Panel',
        nameAr: 'استخدام لوحة Zap',
        descriptionEn: 'Access zap panel',
        descriptionAr: 'الوصول إلى لوحة Zap',
        category: 'view'
      },
      {
        operationKey: 'canMarkAttendance',
        nameEn: 'Mark Attendance',
        nameAr: 'تسجيل الحضور',
        descriptionEn: 'Mark student attendance',
        descriptionAr: 'تسجيل حضور الطالب',
        category: 'create'
      },
      {
        operationKey: 'canUseQRScanner',
        nameEn: 'Use QR Scanner',
        nameAr: 'استخدام ماسح QR',
        descriptionEn: 'Use QR scanner for attendance',
        descriptionAr: 'استخدام ماسح QR للحضور',
        category: 'create'
      },
      {
        operationKey: 'canSeeStandupMode',
        nameEn: 'See Standup Mode',
        nameAr: 'رؤية وضع الوقوف',
        descriptionEn: 'View standup mode',
        descriptionAr: 'عرض وضع الوقوف',
        category: 'view'
      },
      {
        operationKey: 'canExport',
        nameEn: 'Export Data',
        nameAr: 'تصدير البيانات',
        descriptionEn: 'Export attendance data',
        descriptionAr: 'تصدير بيانات الحضور',
        category: 'view'
      },
      {
        operationKey: 'canSeeQuickButtons',
        nameEn: 'See Quick Buttons',
        nameAr: 'رؤية الأزرار السريعة',
        descriptionEn: 'View quick action buttons',
        descriptionAr: 'عرض أزرار الإجراءات السريعة',
        category: 'view'
      }
    ];

    const createdOperations = [];
    for (const opData of operationsData) {
      const operation = await prisma.operation.create({
        data: {
          ...opData,
          screenId: qrScannerScreen.id
        }
      });
      createdOperations.push(operation);
      console.log(`✅ Created operation: ${operation.operationKey}`);
    }

    // Create role permissions based on permissionConfig.js
    console.log('🔐 Creating role permissions...');
    const roles = ['super_admin', 'hr', 'admin', 'instructor', 'student'];
    
    // Super Admin - all permissions
    for (const operation of createdOperations) {
      await prisma.rolePermission.create({
        data: {
          role: 'super_admin',
          screenId: qrScannerScreen.id,
          operationId: operation.id,
          allowed: true
        }
      });
    }
    console.log('✅ Super Admin permissions created');

    // HR - most permissions (no bulk scan, no manual input, no standup mode)
    const hrAllowedOps = createdOperations.filter(op => 
      !['canBulkScan', 'canManualInput', 'canSeeStandupMode'].includes(op.operationKey)
    );
    for (const operation of createdOperations) {
      await prisma.rolePermission.create({
        data: {
          role: 'hr',
          screenId: qrScannerScreen.id,
          operationId: operation.id,
          allowed: hrAllowedOps.some(op => op.id === operation.id)
        }
      });
    }
    console.log('✅ HR permissions created');

    // Admin - limited permissions (no delete, no clear, no edit, no bulk, no manual, no zap)
    const adminAllowedOps = createdOperations.filter(op => 
      ['canMarkAttendance', 'canUseQRScanner', 'canSeeStandupMode', 'canExport', 'canSeeQuickButtons', 'canUseStatsPanel'].includes(op.operationKey)
    );
    for (const operation of createdOperations) {
      await prisma.rolePermission.create({
        data: {
          role: 'admin',
          screenId: qrScannerScreen.id,
          operationId: operation.id,
          allowed: adminAllowedOps.some(op => op.id === operation.id)
        }
      });
    }
    console.log('✅ Admin permissions created');

    // Instructor - similar to admin (no standup mode)
    const instructorAllowedOps = createdOperations.filter(op => 
      ['canMarkAttendance', 'canUseQRScanner', 'canExport', 'canSeeQuickButtons', 'canUseStatsPanel'].includes(op.operationKey)
    );
    for (const operation of createdOperations) {
      await prisma.rolePermission.create({
        data: {
          role: 'instructor',
          screenId: qrScannerScreen.id,
          operationId: operation.id,
          allowed: instructorAllowedOps.some(op => op.id === operation.id)
        }
      });
    }
    console.log('✅ Instructor permissions created');

    // Student - no permissions
    for (const operation of createdOperations) {
      await prisma.rolePermission.create({
        data: {
          role: 'student',
          screenId: qrScannerScreen.id,
          operationId: operation.id,
          allowed: false
        }
      });
    }
    console.log('✅ Student permissions created');

    console.log('🎉 Permission system seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPermissions()
  .then(() => {
    console.log('✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
