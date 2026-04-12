const express = require('express');
const router = express.Router();
const HelpItemsDbService = require('../db/help-items-postgres');
const { getDatabaseUserId } = require('./users');

const helpItemsDb = new HelpItemsDbService();

// Middleware to verify user is authenticated
const authenticateUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};

// Get all help items
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page, section, isActive } = req.query;
    
    const params = {};
    if (page) params.page = page;
    if (section) params.section = section;
    if (isActive !== undefined) params.isActive = isActive === 'true';

    const result = await helpItemsDb.getAll(params);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[HelpItems Route] Error getting help items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get help items'
    });
  }
});

// Get help items by page
router.get('/page/:page', authenticateUser, async (req, res) => {
  try {
    const { page } = req.params;
    
    const result = await helpItemsDb.getByPage(page);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`[HelpItems Route] Error getting help items for page ${req.params.page}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get help items for page'
    });
  }
});

// Get organized help items (by page and section)
router.get('/organized', authenticateUser, async (req, res) => {
  try {
    const result = await helpItemsDb.getOrganizedHelp();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[HelpItems Route] Error getting organized help items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get organized help items'
    });
  }
});

// Get help item by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await helpItemsDb.getById(parseInt(id));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`[HelpItems Route] Error getting help item ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get help item'
    });
  }
});

// Create help item
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = await getDatabaseUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found in database'
      });
    }

    const result = await helpItemsDb.create(req.body, userId);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[HelpItems Route] Error creating help item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create help item'
    });
  }
});

// Update help item
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getDatabaseUserId(req.user);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not found in database'
      });
    }

    const result = await helpItemsDb.update(parseInt(id), req.body, userId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`[HelpItems Route] Error updating help item ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update help item'
    });
  }
});

// Delete help item
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await helpItemsDb.delete(parseInt(id));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`[HelpItems Route] Error deleting help item ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete help item'
    });
  }
});

module.exports = router;
