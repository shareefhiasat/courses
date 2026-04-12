/**
 * Category Types Routes
 * 
 * PURPOSE: REST API endpoints for category types management
 */

import express from 'express';
import { 
  getCategoryTypes, 
  getCategoryTypeById, 
  createCategoryType, 
  updateCategoryType, 
  deleteCategoryType,
  hardDeleteCategoryType
} from '../db/categoryTypes-postgres.js';

const router = express.Router();

/**
 * GET /api/category-types
 * Get all category types with pagination and filters
 */
router.get('/', async (req, res) => {
  try {
    const result = await getCategoryTypes(req.query);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('[CategoryTypes Routes] ❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/category-types/:id
 * Get a single category type by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await getCategoryTypeById(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('[CategoryTypes Routes] ❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/category-types
 * Create a new category type
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.createdBy || 1;
    const result = await createCategoryType(req.body, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('[CategoryTypes Routes] ❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * PUT /api/category-types/:id
 * Update an existing category type
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.updatedBy || 1;
    const result = await updateCategoryType(req.params.id, req.body, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('[CategoryTypes Routes] ❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/category-types/:id
 * Soft delete a category type (set isActive to false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteCategoryType(req.params.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('[CategoryTypes Routes] ❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/category-types/:id/hard
 * Hard delete a category type
 */
router.delete('/:id/hard', async (req, res) => {
  try {
    const result = await hardDeleteCategoryType(req.params.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('[CategoryTypes Routes] ❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
