/**
 * User list/detail access — full matrix view, instructor scope, or self.
 */

import { permissionsService } from '../services/permissions.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';
import { getEffectiveRoles, hasRole, isSuperAdmin } from '../utils/roleUtils.js';
import { isSelfUserParam } from '../utils/userAccess.js';

export async function allowUserListAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const roles = getEffectiveRoles(req.user.roles || []);
    if (isSuperAdmin(roles)) {
      req.userListAccess = 'full';
      return next();
    }

    const allowed = await permissionsService.checkPermissionForRoles(roles, 'users.canView');
    if (allowed) {
      req.userListAccess = 'full';
      return next();
    }

    if (hasRole(roles, LMS_ROLES.INSTRUCTOR)) {
      req.userListAccess = 'scoped';
      return next();
    }

    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  } catch (err) {
    console.error('[allowUserListAccess]', err);
    return res.status(500).json({ success: false, error: 'Permission check failed' });
  }
}

export async function allowUserDetailAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const roles = getEffectiveRoles(req.user.roles || []);
    if (isSuperAdmin(roles)) {
      req.userListAccess = 'full';
      return next();
    }

    const allowed = await permissionsService.checkPermissionForRoles(roles, 'users.canView');
    if (allowed) {
      req.userListAccess = 'full';
      return next();
    }

    if (isSelfUserParam(req.user, req.params.id)) {
      req.userListAccess = 'self';
      return next();
    }

    if (hasRole(roles, LMS_ROLES.INSTRUCTOR)) {
      req.userListAccess = 'scoped';
      return next();
    }

    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  } catch (err) {
    console.error('[allowUserDetailAccess]', err);
    return res.status(500).json({ success: false, error: 'Permission check failed' });
  }
}

export default { allowUserListAccess, allowUserDetailAccess };
