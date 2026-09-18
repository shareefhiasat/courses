/**
 * Express middleware for role-based access control.
 * Checks if the authenticated user has at least one of the required roles.
 *
 * Usage:
 *   import { requireRoles } from '../middleware/requireRoles.js';
 *   router.post('/holidays', requireRoles('SUPER_ADMIN', 'ADMIN', 'HR'), createHolidayController);
 *
 * @param {...string} allowedRoles - roles that are permitted access
 * @returns {Function} Express middleware
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);

    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: `Access denied: Requires one of [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}
