/**
 * Permission matrix middleware — checks DB role permissions.
 * Super admin bypass lives here only (not in permissionsService).
 */

import { permissionsService } from '../services/permissions.js';
import { isSuperAdmin, getEffectiveRoles } from '../utils/roleUtils.js';
import { buildOperationKey } from '../../client/src/config/navigationRegistry.js';

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

/** QR scanner granular ops used by daily attendance */
export const qrScannerOps = {
  view: requireAnyPermission(
    'qr-scanner.canMarkAttendance',
    'qr-scanner.canUseQRScanner',
    'qr-scanner.canManualInput',
    'attendance.canView',
  ),
  mark: requireAnyPermission(
    'qr-scanner.canMarkAttendance',
    'qr-scanner.canManualInput',
    'qr-scanner.canUseQRScanner',
  ),
  edit: requirePermission('qr-scanner.canEditAttendance'),
  delete: requirePermission('qr-scanner.canDeleteAttendance'),
  export: requireAnyPermission('qr-scanner.canUseQRScanner', 'attendance.canView'),
};

export default requirePermission;
