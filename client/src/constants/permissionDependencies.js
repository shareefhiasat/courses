/**
 * Permission dependency rules — granting an operation auto-grants prerequisites.
 * Shared by Permission Matrix UI and backend save validation.
 */

/** @typedef {{ operationKey: string, reasonEn: string, reasonAr: string }} DependencyRule */

/** Extract screen prefix from operationKey (e.g. "penalty.canDelete" → "penalty") */
export function getScreenFromOperationKey(operationKey) {
  if (!operationKey || !operationKey.includes('.')) return null;
  return operationKey.split('.')[0];
}

/** Extract op suffix (e.g. "penalty.canDelete" → "canDelete") */
export function getOpSuffix(operationKey) {
  if (!operationKey || !operationKey.includes('.')) return operationKey;
  return operationKey.split('.').slice(1).join('.');
}

/** QR view/access ops — any one grants screen access */
export const QR_VIEW_OPS = [
  'qr-scanner.canMarkAttendance',
  'qr-scanner.canUseQRScanner',
  'qr-scanner.canManualInput',
  'qr-scanner.canUseStatsPanel',
  'qr-scanner.canUseZapPanel',
  'qr-scanner.canSeeStandupMode',
  'qr-scanner.canSeeQuickButtons',
  'qr-scanner.canExport',
  'qr-scanner.canExportSummary',
];

/** Dashboard tab screenIds that require dashboard.canView */
export const DASHBOARD_TAB_SCREEN_IDS = [
  'activities', 'announcements', 'resources', 'programs', 'subjects', 'classes',
  'enrollments', 'manage-enrollments', 'marks-entry', 'penalty', 'participation',
  'behavior', 'users', 'user-category-access', 'email-templates', 'notification-logs',
  'scheduled-reports', 'categories', 'summary-dashboard', 'scheduling-calendar',
  'instructor-availability-setup', 'room-availability-setup', 'rooms-management',
  'activity-types', 'behavior-types', 'participation-types', 'penalty-types',
  'resource-types', 'priority-types', 'user-roles', 'subject-types', 'assessment-types',
  'question-types', 'attendance-status-types', 'enrollment-status-types',
];

/**
 * Static dependency map: grantedKey → prerequisite keys (all required).
 * @type {Record<string, string[]>}
 */
export const PERMISSION_PREREQUISITES = {
  // Generic CRUD chains per screen (built dynamically below + explicit overrides)
  'qr-scanner.canEditAttendance': ['qr-scanner.canMarkAttendance'],
  'qr-scanner.canBulkScan': ['qr-scanner.canMarkAttendance'],
  'qr-scanner.canDeleteAttendance': ['qr-scanner.canMarkAttendance'],
  'qr-scanner.canClearToday': ['qr-scanner.canMarkAttendance'],
  'workflow.canCreate': ['workflow.canView'],
  'workflow.canUpdate': ['workflow.canView'],
  'workflow.canDelete': ['workflow.canView'],
  'drive.canCreate': ['drive.canView'],
  'drive.canUpdate': ['drive.canView'],
  'drive.canDelete': ['drive.canView'],
  'chat.canCreate': ['chat.canView'],
  'notifications.canUpdate': ['notifications.canView'],
  'user-category-access.canView': ['dashboard.canView'],
};

const CRUD_SUFFIXES = ['canCreate', 'canUpdate', 'canDelete', 'canExport'];

/**
 * Build generic view prerequisite for CRUD ops on a screen.
 */
function genericViewPrereq(operationKey) {
  const screen = getScreenFromOperationKey(operationKey);
  const suffix = getOpSuffix(operationKey);
  if (!screen || screen === 'qr-scanner') return [];
  if (CRUD_SUFFIXES.includes(suffix)) {
    return [`${screen}.canView`];
  }
  return [];
}

/**
 * Resolve all prerequisite operation keys for a granted operation.
 * @param {string} operationKey
 * @returns {string[]}
 */
export function getPrerequisitesFor(operationKey) {
  const explicit = PERMISSION_PREREQUISITES[operationKey] || [];
  const generic = genericViewPrereq(operationKey);
  const screen = getScreenFromOperationKey(operationKey);
  const suffix = getOpSuffix(operationKey);

  const extras = [];
  if (screen && DASHBOARD_TAB_SCREEN_IDS.includes(screen) && suffix === 'canView') {
    extras.push('dashboard.canView');
  }

  // QR export ops need at least one view/mark op
  if (operationKey === 'qr-scanner.canExport' || operationKey === 'qr-scanner.canExportSummary') {
    extras.push('qr-scanner.canMarkAttendance');
  }

  return [...new Set([...explicit, ...generic, ...extras])];
}

/**
 * Expand a set of granted operation keys with all transitive prerequisites.
 * @param {string[]} grantedKeys - operation keys being set to allowed=true
 * @param {Map<string, { operationId: number, screenDbId: number }>} opLookup - operationKey → ids
 * @returns {{ expandedKeys: string[], implied: Array<{ operationKey: string, reasonEn: string, reasonAr: string, triggeredBy: string }> }}
 */
export function expandWithDependencies(grantedKeys, opLookup = new Map()) {
  const expanded = new Set(grantedKeys);
  const implied = [];

  const reasonFor = (prereq, trigger) => {
    if (prereq.endsWith('.canView')) {
      return { reasonEn: 'View required for this action', reasonAr: 'العرض مطلوب لهذا الإجراء', triggeredBy: trigger };
    }
    if (prereq === 'dashboard.canView') {
      return { reasonEn: 'Dashboard access required', reasonAr: 'الوصول للوحة التحكم مطلوب', triggeredBy: trigger };
    }
    if (prereq === 'qr-scanner.canMarkAttendance') {
      return { reasonEn: 'Mark attendance required', reasonAr: 'تسجيل الحضور مطلوب', triggeredBy: trigger };
    }
    return { reasonEn: 'Required prerequisite', reasonAr: 'متطلب أساسي', triggeredBy: trigger };
  };

  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...expanded]) {
      for (const prereq of getPrerequisitesFor(key)) {
        if (!expanded.has(prereq)) {
          expanded.add(prereq);
          implied.push({ operationKey: prereq, ...reasonFor(prereq, key) });
          changed = true;
        }
      }
    }
  }

  return { expandedKeys: [...expanded], implied };
}

/**
 * Check if user has permission including dependency chain (for frontend hooks).
 * @param {Record<string, boolean>} permissionsMap
 * @param {string} operationKey
 */
export function hasPermissionWithDeps(permissionsMap, operationKey) {
  if (!permissionsMap[operationKey]) return false;
  for (const prereq of getPrerequisitesFor(operationKey)) {
    if (!permissionsMap[prereq]) {
      // QR view ops are OR — any one suffices for qr screen access
      if (prereq.startsWith('qr-scanner.') && QR_VIEW_OPS.some((op) => permissionsMap[op])) {
        continue;
      }
      return false;
    }
  }
  return true;
}

/** Super-admin-only operations (never grantable via matrix to other roles) */
export const SUPER_ADMIN_ONLY_OPERATION_KEYS = new Set([
  'permission-matrix.canUpdate',
  'user-category-access.canCreate',
  'user-category-access.canUpdate',
  'user-category-access.canDelete',
]);

export default {
  getPrerequisitesFor,
  expandWithDependencies,
  hasPermissionWithDeps,
  QR_VIEW_OPS,
  DASHBOARD_TAB_SCREEN_IDS,
  SUPER_ADMIN_ONLY_OPERATION_KEYS,
};
