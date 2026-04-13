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

    // Create screens
    console.log('📱 Creating screens...');
    const screensData = [
      {
        screenId: 'home',
        nameEn: 'Home',
        nameAr: 'الرئيسية',
        descriptionEn: 'Main dashboard and activities',
        descriptionAr: 'لوحة التحكم الرئيسية والأنشطة',
        category: 'general',
        isActive: true
      },
      {
        screenId: 'dashboard',
        nameEn: 'Dashboard',
        nameAr: 'لوحة التحكم',
        descriptionEn: 'Admin dashboard overview',
        descriptionAr: 'نظرة عامة على لوحة تحكم المسؤول',
        category: 'admin',
        isActive: true
      },
      {
        screenId: 'categories',
        nameEn: 'Categories',
        nameAr: 'الفئات',
        descriptionEn: 'Manage activity categories',
        descriptionAr: 'إدارة فئات الأنشطة',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'student-dashboard',
        nameEn: 'Student Dashboard',
        nameAr: 'لوحة تحكم الطالب',
        descriptionEn: 'Student personal dashboard',
        descriptionAr: 'لوحة التحكم الشخصية للطالب',
        category: 'student',
        isActive: true
      },
      {
        screenId: 'student-profile',
        nameEn: 'Student Profile',
        nameAr: 'ملف الطالب',
        descriptionEn: 'View and manage student profile',
        descriptionAr: 'عرض وإدارة ملف الطالب',
        category: 'student',
        isActive: true
      },
      {
        screenId: 'activities',
        nameEn: 'Activities',
        nameAr: 'الأنشطة',
        descriptionEn: 'View activity details',
        descriptionAr: 'عرض تفاصيل النشاط',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'quizzes',
        nameEn: 'Quizzes',
        nameAr: 'الاختبارات',
        descriptionEn: 'Create and manage quizzes',
        descriptionAr: 'إنشاء وإدارة الاختبارات',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'attendance',
        nameEn: 'Attendance',
        nameAr: 'الحضور',
        descriptionEn: 'View and manage attendance records',
        descriptionAr: 'عرض وإدارة سجلات الحضور',
        category: 'operations',
        isActive: true
      },
      {
        screenId: 'hr-attendance',
        nameEn: 'HR Attendance',
        nameAr: 'حضور الموارد البشرية',
        descriptionEn: 'HR attendance management',
        descriptionAr: 'إدارة حضور الموارد البشرية',
        category: 'operations',
        isActive: true
      },
      {
        screenId: 'penalty',
        nameEn: 'Penalty',
        nameAr: 'العقوبات',
        descriptionEn: 'Manage student penalties',
        descriptionAr: 'إدارة عقوبات الطلاب',
        category: 'operations',
        isActive: true
      },
      {
        screenId: 'participation',
        nameEn: 'Participation',
        nameAr: 'المشاركة',
        descriptionEn: 'Track student participation',
        descriptionAr: 'تتبع مشاركة الطلاب',
        category: 'operations',
        isActive: true
      },
      {
        screenId: 'behavior',
        nameEn: 'Behavior',
        nameAr: 'السلوك',
        descriptionEn: 'Track student behavior',
        descriptionAr: 'تتبع سلوك الطلاب',
        category: 'operations',
        isActive: true
      },
      {
        screenId: 'qr-scanner',
        nameEn: 'QR Scanner',
        nameAr: 'ماسح QR',
        descriptionEn: 'Daily attendance scanning via QR codes',
        descriptionAr: 'مسح الحضور اليومي عبر رموز QR',
        category: 'operations',
        isActive: true
      },
      {
        screenId: 'enrollments',
        nameEn: 'Enrollments',
        nameAr: 'التسجيلات',
        descriptionEn: 'View student enrollments',
        descriptionAr: 'عرض تسجيلات الطلاب',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'manage-enrollments',
        nameEn: 'Manage Enrollments',
        nameAr: 'إدارة التسجيلات',
        descriptionEn: 'Manage student enrollments',
        descriptionAr: 'إدارة تسجيلات الطلاب',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'programs',
        nameEn: 'Programs',
        nameAr: 'البرامج',
        descriptionEn: 'Manage academic programs',
        descriptionAr: 'إدارة البرامج الأكاديمية',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'subjects',
        nameEn: 'Subjects',
        nameAr: 'المواد',
        descriptionEn: 'Manage subjects and curriculum',
        descriptionAr: 'إدارة المواد والمنهج الدراسي',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'marks-entry',
        nameEn: 'Marks Entry',
        nameAr: 'إدخال الدرجات',
        descriptionEn: 'Enter student marks',
        descriptionAr: 'إدخال درجات الطلاب',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'class-schedules',
        nameEn: 'Class Schedules',
        nameAr: 'جداول الفصول',
        descriptionEn: 'View class schedules',
        descriptionAr: 'عرض جداول الفصول',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'schedule-overview',
        nameEn: 'Schedule Overview',
        nameAr: 'نظرة عامة على الجدول',
        descriptionEn: 'View schedule overview',
        descriptionAr: 'عرض نظرة عامة على الجدول',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'analytics',
        nameEn: 'Analytics',
        nameAr: 'التحليلات',
        descriptionEn: 'View analytics reports',
        descriptionAr: 'عرض تقارير التحليلات',
        category: 'reports',
        isActive: true
      },
      {
        screenId: 'advanced-analytics',
        nameEn: 'Advanced Analytics',
        nameAr: 'التحليلات المتقدمة',
        descriptionEn: 'Advanced analytics dashboard',
        descriptionAr: 'لوحة تحكم التحليلات المتقدمة',
        category: 'reports',
        isActive: true
      },
      {
        screenId: 'chat',
        nameEn: 'Chat',
        nameAr: 'المحادثة',
        descriptionEn: 'Communication chat',
        descriptionAr: 'محادثة الاتصال',
        category: 'communication',
        isActive: true
      },
      {
        screenId: 'notifications',
        nameEn: 'Notifications',
        nameAr: 'الإشعارات',
        descriptionEn: 'View notifications',
        descriptionAr: 'عرض الإشعارات',
        category: 'communication',
        isActive: true
      },
      {
        screenId: 'scheduled-reports',
        nameEn: 'Scheduled Reports',
        nameAr: 'التقارير المجدولة',
        descriptionEn: 'Manage scheduled reports',
        descriptionAr: 'إدارة التقارير المجدولة',
        category: 'reports',
        isActive: true
      },
      {
        screenId: 'workflow',
        nameEn: 'Workflow',
        nameAr: 'سير العمل',
        descriptionEn: 'Document workflow management',
        descriptionAr: 'إدارة سير العمل للمستندات',
        category: 'workflow',
        isActive: true
      },
      {
        screenId: 'profile',
        nameEn: 'Profile',
        nameAr: 'الملف الشخصي',
        descriptionEn: 'User profile settings',
        descriptionAr: 'إعدادات الملف الشخصي',
        category: 'user',
        isActive: true
      },
      {
        screenId: 'permission-matrix',
        nameEn: 'Permission Matrix',
        nameAr: 'مصفوفة الصلاحيات',
        descriptionEn: 'Manage role permissions',
        descriptionAr: 'إدارة صلاحيات الأدوار',
        category: 'admin',
        isActive: true
      },
      {
        screenId: 'quiz-results',
        nameEn: 'Quiz Results',
        nameAr: 'نتائج الاختبارات',
        descriptionEn: 'View quiz results',
        descriptionAr: 'عرض نتائج الاختبارات',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'homework-results',
        nameEn: 'Homework Results',
        nameAr: 'نتائج الواجبات المنزلية',
        descriptionEn: 'View homework results',
        descriptionAr: 'عرض نتائج الواجبات المنزلية',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'training-results',
        nameEn: 'Training Results',
        nameAr: 'نتائج التدريب',
        descriptionEn: 'View training results',
        descriptionAr: 'عرض نتائج التدريب',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'lab-results',
        nameEn: 'Lab Results',
        nameAr: 'نتائج المعمل',
        descriptionEn: 'View lab results',
        descriptionAr: 'عرض نتائج المعمل',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'timer',
        nameEn: 'Timer',
        nameAr: 'مؤقت',
        descriptionEn: 'Timer widget',
        descriptionAr: 'أداة المؤقت',
        category: 'tools',
        isActive: true
      },
      {
        screenId: 'resources',
        nameEn: 'Resources',
        nameAr: 'الموارد',
        descriptionEn: 'View resources',
        descriptionAr: 'عرض الموارد',
        category: 'academic',
        isActive: true
      },
      {
        screenId: 'scheduling',
        nameEn: 'Scheduling',
        nameAr: 'جدولة',
        descriptionEn: 'Schedule management',
        descriptionAr: 'إدارة الجدولة',
        category: 'communication',
        isActive: true
      },
      {
        screenId: 'dashboards',
        nameEn: 'Dashboards',
        nameAr: 'لوحات التحكم',
        descriptionEn: 'View dashboards',
        descriptionAr: 'عرض لوحات التحكم',
        category: 'reports',
        isActive: true
      },
      {
        screenId: 'performance',
        nameEn: 'Performance',
        nameAr: 'الأداء',
        descriptionEn: 'View performance metrics',
        descriptionAr: 'عرض مقاييس الأداء',
        category: 'reports',
        isActive: true
      },
      {
        screenId: 'settings',
        nameEn: 'Settings',
        nameAr: 'الإعدادات',
        descriptionEn: 'System settings',
        descriptionAr: 'إعدادات النظام',
        category: 'admin',
        isActive: true
      }
    ];

    const createdScreens = [];
    for (const screenData of screensData) {
      const screen = await prisma.screen.create({
        data: screenData
      });
      createdScreens.push(screen);
      console.log(`✅ Created screen: ${screen.screenId}`);
    }

    // Create QR Scanner operations
    console.log('⚙️ Creating QR Scanner operations...');
    const qrScannerScreen = createdScreens.find(s => s.screenId === 'qr-scanner');
    const operationsData = [
      {
        operationKey: 'qr-scanner.canDeleteAttendance',
        nameEn: 'Delete Attendance',
        nameAr: 'حذف الحضور',
        descriptionEn: 'Ability to delete attendance records',
        descriptionAr: 'القدرة على حذف سجلات الحضور',
        category: 'delete'
      },
      {
        operationKey: 'qr-scanner.canClearToday',
        nameEn: 'Clear Today',
        nameAr: 'مسح اليوم',
        descriptionEn: 'Clear all attendance for today',
        descriptionAr: 'مسح جميع الحضور لليوم',
        category: 'delete'
      },
      {
        operationKey: 'qr-scanner.canEditAttendance',
        nameEn: 'Edit Attendance',
        nameAr: 'تعديل الحضور',
        descriptionEn: 'Ability to edit attendance records',
        descriptionAr: 'القدرة على تعديل سجلات الحضور',
        category: 'update'
      },
      {
        operationKey: 'qr-scanner.canBulkScan',
        nameEn: 'Bulk Scan',
        nameAr: 'مسح جماعي',
        descriptionEn: 'Scan multiple students at once',
        descriptionAr: 'مسح عدة طلاب في وقت واحد',
        category: 'update'
      },
      {
        operationKey: 'qr-scanner.canManualInput',
        nameEn: 'Manual Input',
        nameAr: 'إدخال يدوي',
        descriptionEn: 'Manually enter attendance',
        descriptionAr: 'إدخال الحضور يدوياً',
        category: 'create'
      },
      {
        operationKey: 'qr-scanner.canUseStatsPanel',
        nameEn: 'Use Stats Panel',
        nameAr: 'استخدام لوحة الإحصائيات',
        descriptionEn: 'Access statistics panel',
        descriptionAr: 'الوصول إلى لوحة الإحصائيات',
        category: 'view'
      },
      {
        operationKey: 'qr-scanner.canUseZapPanel',
        nameEn: 'Use Zap Panel',
        nameAr: 'استخدام لوحة Zap',
        descriptionEn: 'Access zap panel',
        descriptionAr: 'الوصول إلى لوحة Zap',
        category: 'view'
      },
      {
        operationKey: 'qr-scanner.canMarkAttendance',
        nameEn: 'Mark Attendance',
        nameAr: 'تسجيل الحضور',
        descriptionEn: 'Mark student attendance',
        descriptionAr: 'تسجيل حضور الطالب',
        category: 'create'
      },
      {
        operationKey: 'qr-scanner.canUseQRScanner',
        nameEn: 'Use QR Scanner',
        nameAr: 'استخدام ماسح QR',
        descriptionEn: 'Use QR scanner for attendance',
        descriptionAr: 'استخدام ماسح QR للحضور',
        category: 'create'
      },
      {
        operationKey: 'qr-scanner.canSeeStandupMode',
        nameEn: 'See Standup Mode',
        nameAr: 'رؤية وضع الوقوف',
        descriptionEn: 'View standup mode',
        descriptionAr: 'عرض وضع الوقوف',
        category: 'view'
      },
      {
        operationKey: 'qr-scanner.canExport',
        nameEn: 'Export Data',
        nameAr: 'تصدير البيانات',
        descriptionEn: 'Export attendance data',
        descriptionAr: 'تصدير بيانات الحضور',
        category: 'view'
      },
      {
        operationKey: 'qr-scanner.canSeeQuickButtons',
        nameEn: 'See Quick Buttons',
        nameAr: 'رؤية الأزرار السريعة',
        descriptionEn: 'View quick action buttons',
        descriptionAr: 'عرض أزرار الإجراءات السريعة',
        category: 'view'
      },
      {
        operationKey: 'qr-scanner.canExportSummary',
        nameEn: 'Export Summary',
        nameAr: 'تصدير الملخص',
        descriptionEn: 'Export daily summary and summary reports',
        descriptionAr: 'تصدير ملخص يومي وتقارير ملخص',
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

    // Create generic operations for other screens
    console.log('⚙️ Creating generic operations for other screens...');
    const genericOperations = ['view', 'create', 'update', 'delete'];
    const genericOpData = {
      view: { nameEn: 'View', nameAr: 'عرض', descriptionEn: 'View content', descriptionAr: 'عرض المحتوى', category: 'view' },
      create: { nameEn: 'Create', nameAr: 'إنشاء', descriptionEn: 'Create new items', descriptionAr: 'إنشاء عناصر جديدة', category: 'create' },
      update: { nameEn: 'Update', nameAr: 'تحديث', descriptionEn: 'Update existing items', descriptionAr: 'تحديث العناصر الموجودة', category: 'update' },
      delete: { nameEn: 'Delete', nameAr: 'حذف', descriptionEn: 'Delete items', descriptionAr: 'حذف العناصر', category: 'delete' }
    };

    for (const screen of createdScreens) {
      if (screen.screenId === 'qr-scanner') continue; // Skip QR Scanner, already handled
      
      for (const op of genericOperations) {
        const opData = genericOpData[op];
        const operation = await prisma.operation.create({
          data: {
            operationKey: `${screen.screenId}.can${op.charAt(0).toUpperCase() + op.slice(1)}`,
            ...opData,
            screenId: screen.id
          }
        });
        createdOperations.push(operation);
        console.log(`✅ Created operation: ${operation.operationKey} for ${screen.screenId}`);
      }
    }

    // Create role permissions based on permissionConfig.js
    console.log('🔐 Creating role permissions...');
    const roles = ['super_admin', 'hr', 'admin', 'instructor', 'student'];
    
    // Super Admin - all permissions on all screens
    for (const operation of createdOperations) {
      await prisma.rolePermission.create({
        data: {
          role: 'super_admin',
          screenId: operation.screenId,
          operationId: operation.id,
          allowed: true
        }
      });
    }
    console.log('✅ Super Admin permissions created');

    // HR - view permissions on most screens, no delete on admin screens
    for (const operation of createdOperations) {
      const screen = createdScreens.find(s => s.id === operation.screenId);
      let allowed = false;
      
      // Extract operation type from operationKey (e.g., "attendance.canView" -> "canView")
      const operationType = operation.operationKey.split('.').pop();
      
      if (screen.category === 'operations' || screen.category === 'reports') {
        // Operations and reports - allow view, create, update
        allowed = ['canView', 'canCreate', 'canUpdate'].includes(operationType);
      } else if (screen.category === 'users' || screen.category === 'admin') {
        // Admin screens - only view
        allowed = operationType === 'canView';
      } else if (screen.category === 'academic' || screen.category === 'general' || screen.category === 'student' || screen.category === 'communication' || screen.category === 'workflow' || screen.category === 'tools') {
        // Academic and general screens - view and create
        allowed = ['canView', 'canCreate'].includes(operationType);
      }
      
      await prisma.rolePermission.create({
        data: {
          role: 'hr',
          screenId: operation.screenId,
          operationId: operation.id,
          allowed
        }
      });
    }
    console.log('✅ HR permissions created');

    // Admin - limited permissions
    for (const operation of createdOperations) {
      const screen = createdScreens.find(s => s.id === operation.screenId);
      let allowed = false;
      
      // Extract operation type from operationKey
      const operationType = operation.operationKey.split('.').pop();
      
      if (screen.category === 'operations') {
        // Operations - limited permissions
        allowed = ['canView', 'canCreate', 'canUpdate'].includes(operationType);
      } else if (screen.category === 'academic' || screen.category === 'general' || screen.category === 'reports') {
        // Academic and reports - view and create
        allowed = ['canView', 'canCreate'].includes(operationType);
      } else if (screen.category === 'users' || screen.category === 'admin') {
        // Admin screens - view only
        allowed = operationType === 'canView';
      }
      
      await prisma.rolePermission.create({
        data: {
          role: 'admin',
          screenId: operation.screenId,
          operationId: operation.id,
          allowed
        }
      });
    }
    console.log('✅ Admin permissions created');

    // Instructor - view and create on academic screens
    for (const operation of createdOperations) {
      const screen = createdScreens.find(s => s.id === operation.screenId);
      let allowed = false;
      
      // Extract operation type from operationKey
      const operationType = operation.operationKey.split('.').pop();
      
      if (screen.category === 'academic' || screen.category === 'general') {
        allowed = ['canView', 'canCreate', 'canUpdate'].includes(operationType);
      } else if (screen.category === 'operations') {
        allowed = ['canView', 'canCreate', 'canUpdate'].includes(operationType);
      } else if (screen.category === 'reports') {
        allowed = operationType === 'canView';
      }
      
      await prisma.rolePermission.create({
        data: {
          role: 'instructor',
          screenId: operation.screenId,
          operationId: operation.id,
          allowed
        }
      });
    }
    console.log('✅ Instructor permissions created');

    // Student - no permissions
    for (const operation of createdOperations) {
      await prisma.rolePermission.create({
        data: {
          role: 'student',
          screenId: operation.screenId,
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
