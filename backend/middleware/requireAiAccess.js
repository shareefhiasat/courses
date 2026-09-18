/**
 * Middleware: requireAiAccess
 *
 * Restricts AI Query Assistant to Admin, HR, and Super Admin roles only.
 * Students and Instructors are blocked with 403 Forbidden.
 */

import { getEffectiveRoles, hasRole, isSuperAdmin } from '../utils/roleUtils.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';

export function requireAiAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const roles = getEffectiveRoles(req.user.roles || []);

  const isAllowed = isSuperAdmin(roles) ||
    hasRole(roles, LMS_ROLES.ADMIN) ||
    hasRole(roles, LMS_ROLES.HR);

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: 'AI Query Assistant is restricted to Admin and HR staff.',
    });
  }

  return next();
}

export default requireAiAccess;
