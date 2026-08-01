/**
 * Permissions Controller
 * 
 * PURPOSE: Handle HTTP requests for permission management
 * ARCHITECTURE: Controllers → Services → DB
 */

import { permissionsService } from '../services/permissions.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get all permissions (screens, operations, role permissions)
 */
export const getPermissionsController = asyncHandler(async (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  const permissions = await permissionsService.getPermissions(lang);
  res.json({ success: true, data: permissions });
});

/**
 * Update permissions (batch update)
 */
export const updatePermissionsController = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: 'Invalid updates format' });
  }
  const result = await permissionsService.updatePermissions(updates);
  res.json({
    success: true,
    data: result.permissions ?? result,
    impliedGrants: result.impliedGrants ?? [],
    message: 'Permissions updated successfully',
  });
});
