/**
 * AI Tool Permissions & Access Control
 *
 * Enforces per-tool role gates and permission requirements.
 */

import { getEffectiveRoles, hasRole, isSuperAdmin } from '../utils/roleUtils.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';

export const ADMIN_ONLY_TOOLS = ['lateCount', 'notesAndComments'];

/**
 * Check if the current user has permission to run the requested AI tool.
 *
 * @param {object} req - Express request with req.user and req.dataScope
 * @param {string} toolName - Name of the tool to execute
 * @returns {{ allowed: boolean, reason?: string, reasonAr?: string }}
 */
export function checkToolAccess(req, toolName) {
  if (!req?.user) {
    return {
      allowed: false,
      reason: 'Authentication required',
      reasonAr: 'المصادقة مطلوبة للوصول إلى هذه الميزة',
    };
  }

  const roles = getEffectiveRoles(req.user.roles || []);
  const isAdminOrSuper = isSuperAdmin(roles) || hasRole(roles, LMS_ROLES.ADMIN);

  // Admin-only tool gate
  if (ADMIN_ONLY_TOOLS.includes(toolName)) {
    if (!isAdminOrSuper) {
      return {
        allowed: false,
        reason: 'This query (late records / internal notes & comments) is restricted to Administrators only.',
        reasonAr: 'هذا الاستعلام (سجلات التأخير / الملاحظات والتعليقات الداخلية) مقتصر على مسؤولي النظام (Admin) فقط.',
      };
    }
  }

  return { allowed: true };
}

export default {
  ADMIN_ONLY_TOOLS,
  checkToolAccess,
};
