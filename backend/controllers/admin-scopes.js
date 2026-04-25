/**
 * Admin Scopes Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for admin scope operations
 * ARCHITECTURE: HTTP Requests → Controllers → DB Services → PostgreSQL
 */

import {
  getAdminScopes,
  getAdminScopeById,
  getAdminScopesByUserId,
  createAdminScope,
  updateAdminScope,
  deleteAdminScope,
  checkUserAdminScope,
  getUserEffectiveScope
} from '../db/admin-scopes-postgres.js';

/**
 * GET /api/v1/admin-scopes
 * Get all admin scopes
 */
export const getAllAdminScopesController = async (req, res) => {
  try {
    const result = await getAdminScopes(req.query);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getAllAdminScopesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/admin-scopes/user/:userId
 * Get admin scopes by user ID
 */
export const getAdminScopesByUserIdController = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await getAdminScopesByUserId(userId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getAdminScopesByUserIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/admin-scopes/user/:userId/effective
 * Get user's effective admin scope (union of all scopes)
 */
export const getUserEffectiveScopeController = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await getUserEffectiveScope(userId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getUserEffectiveScopeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/admin-scopes/:id
 * Get admin scope by ID
 */
export const getAdminScopeByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getAdminScopeById(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getAdminScopeByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/admin-scopes
 * Create a new admin scope
 */
export const createAdminScopeController = async (req, res) => {
  try {
    const result = await createAdminScope(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in createAdminScopeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/admin-scopes/:id
 * Update an admin scope
 */
export const updateAdminScopeController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateAdminScope(id, req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in updateAdminScopeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/admin-scopes/:id
 * Delete an admin scope
 */
export const deleteAdminScopeController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteAdminScope(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in deleteAdminScopeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
