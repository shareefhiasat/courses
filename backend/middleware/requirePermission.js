/**
 * Permission matrix middleware — checks DB role permissions.
 * Super admin bypass lives here only (not in permissionsService).
 */

import { permissionsService } from '../services/permissions.js';
import { isSuperAdmin, getEffectiveRoles, hasRole } from '../utils/roleUtils.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';
import { getPrerequisitesFor } from '../utils/permissionDependencies.js';
import { buildOperationKey } from '../../client/src/config/navigationRegistry.js';

/** Admin/HR can open operations board even when matrix keys are incomplete. */
function canBypassForOperationsBoard(roles = []) {
  return hasRole(roles, LMS_ROLES.ADMIN) || hasRole(roles, LMS_ROLES.HR);
}

function resolveOperationKey(screenId, operation) {
  if (!operation) {
    if (screenId.includes('.')) return screenId;
    return screenId;
  }
  if (screenId.includes('.')) return screenId;
  if (operation.includes('.')) return operation;
  if (operation.startsWith('can')) {
    return `${screenId}.${operation}`;
  }
  return buildOperationKey(screenId, operation);
}

/**
 * Require a matrix permission. Accepts:
 * - requirePermission('qr-scanner.canMarkAttendance')
 * - requirePermission('qr-scanner', 'canMarkAttendance')
 * - requirePermission('penalty', 'delete')  → penalty.canDelete
 */
export function requirePermission(screenId, operation) {
  const operationKey = resolveOperationKey(screenId, operation);

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const roles = getEffectiveRoles(req.user.roles || []);
      if (isSuperAdmin(roles)) {
        return next();
      }

      const allowed = await permissionsService.checkPermissionForRoles(roles, operationKey);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          operationKey,
        });
      }

      // Defense in depth: verify prerequisites unless super admin
      for (const prereq of getPrerequisitesFor(operationKey)) {
        const prereqAllowed = await permissionsService.checkPermissionForRoles(roles, prereq);
        if (!prereqAllowed) {
          return res.status(403).json({
            success: false,
            error: 'Missing prerequisite permission',
            operationKey,
            missingPrerequisite: prereq,
          });
        }
      }

      return next();
    } catch (err) {
      console.error('[requirePermission]', operationKey, err);
      return res.status(500).json({ success: false, error: 'Permission check failed' });
    }
  };
}

/**
 * Allowed if the user has any of the listed operation keys.
 */
export function requireAnyPermission(...operationKeys) {
  const keys = operationKeys.flat();
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const roles = getEffectiveRoles(req.user.roles || []);
      if (isSuperAdmin(roles)) {
        return next();
      }

      for (const key of keys) {
        const resolved = key.includes('.') ? key : resolveOperationKey(key, null);
        const allowed = await permissionsService.checkPermissionForRoles(roles, resolved);
        if (allowed) return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        operationKeys: keys,
      });
    } catch (err) {
      console.error('[requireAnyPermission]', keys, err);
      return res.status(500).json({ success: false, error: 'Permission check failed' });
    }
  };
}

/** Standard CRUD operation keys for a screen */
export function screenOps(screenId) {
  return {
    view: requirePermission(screenId, 'view'),
    create: requirePermission(screenId, 'create'),
    update: requirePermission(screenId, 'update'),
    delete: requirePermission(screenId, 'delete'),
    export: requirePermission(screenId, 'export'),
  };
}

/** Allow Admin/HR through for operations-board attendance reads. */
function requireOperationsBoardRead(...operationKeys) {
  const keys = operationKeys.flat();
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const roles = getEffectiveRoles(req.user.roles || []);
      if (isSuperAdmin(roles) || canBypassForOperationsBoard(roles)) {
        return next();
      }
      for (const key of keys) {
        const resolved = key.includes('.') ? key : resolveOperationKey(key, null);
        const allowed = await permissionsService.checkPermissionForRoles(roles, resolved);
        if (allowed) return next();
      }
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        operationKeys: keys,
      });
    } catch (err) {
      console.error('[requireOperationsBoardRead]', keys, err);
      return res.status(500).json({ success: false, error: 'Permission check failed' });
    }
  };
}

/**
 * Attendance create/update:
 * - Super admin and admin always allowed
 * - HR allowed if they hold canEditAttendance / canMarkAttendance / canManualInput
 * - Instructor/others allowed if they hold canEditAttendance / canMarkAttendance / canManualInput
 */
export function requireAttendanceEdit(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const roles = getEffectiveRoles(req.user.roles || []);
  if (isSuperAdmin(roles) || hasRole(roles, LMS_ROLES.ADMIN)) {
    return next();
  }
  const keys = [
    'qr-scanner.canEditAttendance',
    'qr-scanner.canMarkAttendance',
    'qr-scanner.canManualInput',
  ];
  (async () => {
    for (const key of keys) {
      const allowed = await permissionsService.checkPermissionForRoles(roles, key);
      if (allowed) return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      operationKeys: keys,
    });
  })().catch((err) => {
    console.error('[requireAttendanceEdit]', err);
    return res.status(500).json({ success: false, error: 'Permission check failed' });
  });
}

/**
 * Attendance delete: super admin only.
 */
export function requireAttendanceDelete(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const roles = getEffectiveRoles(req.user.roles || []);
  if (isSuperAdmin(roles)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Only super admin can delete attendance records',
  });
}

/** QR scanner granular ops used by daily attendance */
export const qrScannerOps = {
  view: requireOperationsBoardRead(
    'qr-scanner.canMarkAttendance',
    'qr-scanner.canUseQRScanner',
    'qr-scanner.canManualInput',
    'attendance.canView',
    'operations.canView',
    'hr-attendance.canView',
  ),
  mark: requireAnyPermission(
    'qr-scanner.canMarkAttendance',
    'qr-scanner.canManualInput',
    'qr-scanner.canUseQRScanner',
  ),
  edit: requirePermission('qr-scanner.canEditAttendance'),
  delete: requirePermission('qr-scanner.canDeleteAttendance'),
  export: requireAnyPermission('qr-scanner.canUseQRScanner', 'attendance.canView', 'operations.canView', 'hr-attendance.canView'),
};

/** Read programs/subjects/classes for attendance, scheduling, or academic screens. */
export const scopedAcademicRead = requireAnyPermission(
  'programs.canView',
  'subjects.canView',
  'classes.canView',
  'scheduling-calendar.canView',
  'classes-availability.canView',
  'summary-dashboard.canView',
  'qr-scanner.canMarkAttendance',
  'qr-scanner.canUseQRScanner',
  'qr-scanner.canManualInput',
  'attendance.canView',
);

/** Read enrollments for attendance workflow without enrollments screen access. */
export const enrollmentRead = requireOperationsBoardRead(
  'enrollments.canView',
  'manage-enrollments.canView',
  'qr-scanner.canMarkAttendance',
  'qr-scanner.canManualInput',
  'qr-scanner.canUseQRScanner',
  'attendance.canView',
  'operations.canView',
  'hr-attendance.canView',
);

export default requirePermission;
