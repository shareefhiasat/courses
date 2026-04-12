/**
 * Lookup Routes - API Routes
 * 
 * PURPOSE: Unified API routes for all lookup operations
 * ARCHITECTURE: HTTP Requests → Routes → Controllers → Services → DB Services → PostgreSQL
 * 
 * This is the SINGLE SOURCE OF TRUTH for all lookup data
 */

import { Router } from 'express';
import {
  getLookupController,
  getMultipleLookupController,
  getLookupTypesController,
  createLookupController,
  updateLookupController,
  deleteLookupController,
  // Legacy controllers for backward compatibility (deprecated)
  getBehaviorTypesController,
  getParticipationTypesController,
  getPenaltyTypesController
} from '../controllers/lookup.js';
import { requireAuth } from '../middleware/keycloakAuth.js';
import { getLookupData } from '../services/lookup.js';

const router = Router();

// Apply authentication middleware to all routes
// Note: This is redundant since server.js applies auth to /api routes, but kept for clarity
router.use(requireAuth);

/**
 * GET /api/v1/lookup/:type
 * Generic lookup endpoint - SINGLE SOURCE OF TRUTH
 * 
 * Examples:
 * GET /api/v1/lookup/behavior-types
 * GET /api/v1/lookup/subject-types
 * GET /api/v1/lookup/user-roles
 * GET /api/v1/lookup/behavior-types?activeOnly=false
 * GET /api/v1/lookup/subject-types?fields=id,nameEn,nameAr
 * GET /api/v1/lookup/user-roles?orderBy=level:desc
 */
router.get('/:type', getLookupController);

/**
 * GET /api/v1/lookup
 * Get multiple lookup types at once
 * 
 * Examples:
 * GET /api/v1/lookup?types=behavior-types,participation-types,penalty-types
 * GET /api/v1/lookup?types=subject-types,category-types&fields=id,nameEn
 * GET /api/v1/lookup?types=user-roles&activeOnly=false&orderBy=level:desc
 */
router.get('/', getMultipleLookupController);

/**
 * GET /api/v1/lookup/types
 * Get all available lookup types (metadata)
 * 
 * Examples:
 * GET /api/v1/lookup/types
 */
router.get('/types', getLookupTypesController);

// Legacy routes for backward compatibility (deprecated)
// These will be removed in future versions - migrate to the generic endpoints above

/**
 * @deprecated Use GET /api/v1/lookup/behavior-types instead
 */
router.get('/behavior-types', getBehaviorTypesController);

/**
 * @deprecated Use GET /api/v1/lookup/participation-types instead
 */
router.get('/participation-types', getParticipationTypesController);

/**
 * @deprecated Use GET /api/v1/lookup/penalty-types instead
 */
router.get('/penalty-types', getPenaltyTypesController);

/**
 * @deprecated Use GET /api/v1/lookup/subject-types instead
 */
router.get('/subject-types', async (req, res) => {
  const result = await getLookupData('subject-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

/**
 * @deprecated Use GET /api/v1/lookup/requirement-types instead
 */
router.get('/requirement-types', async (req, res) => {
  const result = await getLookupData('requirement-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

/**
 * @deprecated Use GET /api/v1/lookup/category-types instead
 */
router.get('/category-types', async (req, res) => {
  const result = await getLookupData('category-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

/**
 * @deprecated Use GET /api/v1/lookup/resource-types instead
 */
router.get('/resource-types', async (req, res) => {
  const result = await getLookupData('resource-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

/**
 * @deprecated Use GET /api/v1/lookup/priority-types instead
 */
router.get('/priority-types', async (req, res) => {
  const result = await getLookupData('priority-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

/**
 * @deprecated Use GET /api/v1/lookup/participation-types instead
 */
router.get('/participation-types', async (req, res) => {
  const result = await getLookupData('participation-types');
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

/**
 * POST /api/v1/lookup/:type
 * Create lookup data
 * 
 * Examples:
 * POST /api/v1/lookup/category-types
 * POST /api/v1/lookup/behavior-types
 */
router.post('/:type', createLookupController);

/**
 * PUT /api/v1/lookup/:type/:id
 * Update lookup data
 * 
 * Examples:
 * PUT /api/v1/lookup/category-types/123
 * PUT /api/v1/lookup/behavior-types/456
 */
router.put('/:type/:id', updateLookupController);

/**
 * DELETE /api/v1/lookup/:type/:id
 * Delete lookup data (soft delete)
 * 
 * Examples:
 * DELETE /api/v1/lookup/category-types/123
 * DELETE /api/v1/lookup/behavior-types/456
 */
router.delete('/:type/:id', deleteLookupController);

export default router;
