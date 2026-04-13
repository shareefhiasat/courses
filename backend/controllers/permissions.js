/**
 * Permissions Controller
 * 
 * PURPOSE: Handle HTTP requests for permission management
 * ARCHITECTURE: Controllers → Services → DB
 */

import { permissionsService } from '../services/permissions.js';

/**
 * Get all permissions (screens, operations, role permissions)
 */
export const getPermissionsController = async (req, res) => {
  try {
    const lang = req.headers['accept-language'] || 'en';
    const permissions = await permissionsService.getPermissions(lang);
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update permissions (batch update)
 */
export const updatePermissionsController = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates format'
      });
    }
    
    const result = await permissionsService.updatePermissions(updates);
    
    res.json({
      success: true,
      data: result,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
