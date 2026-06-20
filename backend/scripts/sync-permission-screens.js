/**
 * Upsert permission matrix screens/operations from navigationRegistry (non-destructive).
 * Run: node backend/scripts/sync-permission-screens.js
 */

import { PrismaClient } from '@prisma/client';
import {
  getAllSyncScreenDefinitions,
  getOperationDefsForScreen,
  QR_SCANNER_OPERATION_DEFINITIONS,
} from '../../client/src/config/navigationRegistry.js';

const prisma = new PrismaClient();

const INSTRUCTOR_QR_OPS = new Set([
  'canMarkAttendance',
  'canManualInput',
  'canUseQRScanner',
  'canEditAttendance',
  'canSeeStandupMode',
  'canSeeQuickButtons',
  'canUseStatsPanel',
  'canUseZapPanel',
  'canExport',
  'canExportSummary',
]);

const DEFAULT_ROLE_PRESETS = {
  super_admin: () => true,
  hr: (screen, opType) => {
    if (screen.category === 'admin' && screen.screenId === 'permission-matrix') return false;
    if (screen.category === 'admin' && screen.screenId === 'user-category-access') return opType === 'canView';
    if (['canView', 'canCreate', 'canUpdate', 'canExport'].includes(opType)) return true;
    return opType === 'canView';
  },
  admin: (screen, opType) => {
    if (['permission-matrix', 'user-category-access'].includes(screen.screenId)) return false;
    if (screen.category === 'settings') return opType === 'canView';
    return ['canView', 'canCreate', 'canUpdate', 'canExport'].includes(opType);
  },
  instructor: (screen, opType) => {
    const allowed = new Set([
      'home', 'dashboard', 'activities', 'resources', 'quizzes', 'attendance', 'qr-scanner',
      'penalty', 'participation', 'behavior', 'enrollments', 'manage-enrollments', 'programs',
      'subjects', 'classes', 'marks-entry', 'quiz-results', 'homework-results', 'training-results',
      'lab-results', 'scheduling-calendar', 'classes-availability', 'instructor-availability-view',
      'room-availability-view', 'student-profile', 'profile', 'drive', 'chat', 'notifications',
      'my-attendance',
    ]);
    if (!allowed.has(screen.screenId)) return false;
    return ['canView', 'canCreate', 'canUpdate'].includes(opType);
  },
  student: (screen, opType) => {
    const allowed = new Set([
      'home', 'student-dashboard', 'student-profile', 'activities', 'resources', 'quizzes',
      'my-attendance', 'enrollments', 'quiz-results', 'homework-results', 'training-results',
      'lab-results', 'scheduling-calendar', 'classes-availability', 'profile', 'chat', 'notifications',
    ]);
    return allowed.has(screen.screenId) && opType === 'canView';
  },
};

function qrScannerRoleAllowed(role, opType) {
  if (role === 'super_admin') return true;
  if (role === 'hr' || role === 'admin') {
    return !['canClearToday'].includes(opType) || role === 'hr';
  }
  if (role === 'instructor') return INSTRUCTOR_QR_OPS.has(opType);
  return false;
}

async function upsertScreen(def) {
  return prisma.screen.upsert({
    where: { screenId: def.screenId },
    create: {
      screenId: def.screenId,
      nameEn: def.nameEn,
      nameAr: def.nameAr,
      descriptionEn: def.descriptionEn || def.nameEn,
      descriptionAr: def.descriptionAr || def.nameAr,
      category: def.category,
      isActive: true,
    },
    update: {
      nameEn: def.nameEn,
      nameAr: def.nameAr,
      category: def.category,
      isActive: true,
    },
  });
}

async function upsertOperation(screenDbId, opDef) {
  const existing = await prisma.operation.findFirst({
    where: { operationKey: opDef.operationKey },
  });
  if (existing) {
    return prisma.operation.update({
      where: { id: existing.id },
      data: {
        nameEn: opDef.nameEn,
        nameAr: opDef.nameAr,
        descriptionEn: opDef.descriptionEn || opDef.nameEn,
        descriptionAr: opDef.descriptionAr || opDef.nameAr,
        category: opDef.category,
        isActive: true,
        screenId: screenDbId,
      },
    });
  }
  return prisma.operation.create({
    data: {
      ...opDef,
      descriptionEn: opDef.descriptionEn || opDef.nameEn,
      descriptionAr: opDef.descriptionAr || opDef.nameAr,
      screenId: screenDbId,
      isActive: true,
    },
  });
}

async function upsertRolePermission(role, screenDbId, operationDbId, allowed) {
  const existing = await prisma.rolePermission.findFirst({
    where: { role, screenId: screenDbId, operationId: operationDbId },
  });
  if (existing) {
    return prisma.rolePermission.update({
      where: { id: existing.id },
      data: { allowed },
    });
  }
  return prisma.rolePermission.create({
    data: { role, screenId: screenDbId, operationId: operationDbId, allowed },
  });
}

async function main() {
  console.log('🔄 Syncing permission screens from navigationRegistry...');
  const roles = Object.keys(DEFAULT_ROLE_PRESETS);
  const allScreens = getAllSyncScreenDefinitions();
  console.log(`  ${allScreens.length} screens to sync`);

  for (const def of allScreens) {
    const screen = await upsertScreen(def);
    console.log(`  ✓ screen: ${screen.screenId}`);

    const opDefs = (def.operations?.length
      ? getOperationDefsForScreen(def.screenId, def.operations)
      : []);

    for (const opDef of opDefs) {
      const operation = await upsertOperation(screen.id, opDef);
      const opType = opDef.operationKey.split('.').pop();

      for (const role of roles) {
        const allowed = DEFAULT_ROLE_PRESETS[role](def, opType);
        await upsertRolePermission(role, screen.id, operation.id, allowed);
      }
    }
  }

  // QR scanner granular operations
  const qrScreen = await prisma.screen.findUnique({ where: { screenId: 'qr-scanner' } });
  if (qrScreen) {
    console.log('  ✓ syncing QR scanner granular operations...');
    for (const opDef of QR_SCANNER_OPERATION_DEFINITIONS) {
      const operation = await upsertOperation(qrScreen.id, opDef);
      const opType = opDef.operationKey.split('.').pop();
      for (const role of roles) {
        const allowed = qrScannerRoleAllowed(role, opType);
        await upsertRolePermission(role, qrScreen.id, operation.id, allowed);
      }
    }
  }

  console.log('✅ Permission screen sync complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
