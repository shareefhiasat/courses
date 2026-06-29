/**
 * Lookup Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for unified lookup operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 * 
 * This is the SINGLE SOURCE OF TRUTH for all lookup data
 */

import { getLookupData, getMultipleLookupData, getLookupTypes, createLookupData, updateLookupData, deleteLookupData } from '../services/lookup.js';

/**
 * GET /api/v1/lookup/:type
 * Generic lookup endpoint - SINGLE SOURCE OF TRUTH
 * 
 * Examples:
 * GET /api/v1/lookup/behavior-types
 * GET /api/v1/lookup/subject-types
 * GET /api/v1/lookup/user-roles
 * 
 * Query parameters:
 * - activeOnly: boolean (default: true)
 * - fields: string (comma-separated field names)
 * - orderBy: string (field:direction)
 */
export const getLookupController = async (req, res) => {
  try {
    const { type } = req.params;
    const { activeOnly, fields, orderBy } = req.query;

    // Parse query parameters
    const options = {
      activeOnly: activeOnly !== 'false', // Default to true
      fields: fields ? fields.split(',').map(f => f.trim()) : null,
      orderBy: orderBy ? parseOrderBy(orderBy) : { nameEn: 'asc' }
    };

    const result = await getLookupData(type, options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        lookupType: result.lookupType,
        count: result.count,
        metadata: {
          activeOnly: options.activeOnly,
          fields: options.fields,
          orderBy: options.orderBy
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in getLookupController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/lookup
 * Get multiple lookup types at once
 * 
 * Query parameters:
 * - types: string (comma-separated lookup type keys, required)
 * - activeOnly: boolean (default: true)
 * - fields: string (comma-separated field names)
 * - orderBy: string (field:direction)
 */
export const getMultipleLookupController = async (req, res) => {
  try {
    const { types, activeOnly, fields, orderBy } = req.query;

    if (!types) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: types'
      });
    }

    // Parse query parameters
    const lookupTypes = types.split(',').map(t => t.trim());
    const options = {
      activeOnly: activeOnly !== 'false', // Default to true
      fields: fields ? fields.split(',').map(f => f.trim()) : null,
      orderBy: orderBy ? parseOrderBy(orderBy) : { nameEn: 'asc' }
    };

    const result = await getMultipleLookupData(lookupTypes, options);
    
    console.log('📊 [Lookup Controller] Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        count: Object.keys(result.data).length,
        metadata: {
          requestedTypes: lookupTypes,
          activeOnly: options.activeOnly,
          fields: options.fields,
          orderBy: options.orderBy
        }
      });
    } else {
      console.error('❌ [Lookup Controller] Lookup failed:', result.message, result.errors);
      res.status(400).json({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in getMultipleLookupController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/lookup/types
 * Get all available lookup types (metadata)
 */
export const getLookupTypesController = async (req, res) => {
  try {
    const result = await getLookupTypes();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in getLookupTypesController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Helper function to parse orderBy parameter
 * Expected format: "field:direction" (e.g., "nameEn:asc" or "createdAt:desc")
 */
function parseOrderBy(orderByStr) {
  const parts = orderByStr.split(':');
  if (parts.length === 2) {
    const [field, direction] = parts;
    return {
      [field.trim()]: direction.trim().toLowerCase() === 'desc' ? 'desc' : 'asc'
    };
  }
  return { nameEn: 'asc' }; // Default
}

// Legacy controllers for backward compatibility (deprecated)
export const getBehaviorTypesController = async (req, res) => {
  const result = await getLookupData('behavior-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
};

export const getParticipationTypesController = async (req, res) => {
  const result = await getLookupData('participation-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
};

export const getPenaltyTypesController = async (req, res) => {
  const result = await getLookupData('penalty-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
};

/**
 * POST /api/v1/lookup/:type
 * Create lookup data
 * 
 * Examples:
 * POST /api/v1/lookup/category-types
 * POST /api/v1/lookup/behavior-types
 */
export const createLookupController = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id || req.body.createdBy;
    
    const result = await createLookupData(type, req.body, userId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create lookup controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * PUT /api/v1/lookup/:type/:id
 * Update lookup data
 * 
 * Examples:
 * PUT /api/v1/lookup/category-types/123
 * PUT /api/v1/lookup/behavior-types/456
 */
export const updateLookupController = async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id || req.body.updatedBy;
    
    const result = await updateLookupData(type, id, req.body, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update lookup controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * DELETE /api/v1/lookup/:type/:id
 * Delete lookup data (soft delete)
 * 
 * Examples:
 * DELETE /api/v1/lookup/category-types/123
 * DELETE /api/v1/lookup/behavior-types/456
 */
export const deleteLookupController = async (req, res) => {
  try {
    const { type, id } = req.params;
    // Use updatedBy from request body (database ID) instead of req.user?.id (Keycloak UUID)
    const userId = req.body?.updatedBy || req.user?.id;
    const options = { force: req.body?.force || req.query?.force === 'true' };
    
    console.log('🔍 Delete controller:', { type, id, userId, body: req.body, user: req.user?.id });
    
    const result = await deleteLookupData(type, id, userId, options);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete lookup controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
