import express from 'express';
import { requireAuth, requireSuperAdmin } from '../middleware/keycloakAuth.js';
const router = express.Router();
import userCategoryAccessDb from '../db/user-category-access-postgres.js';

/**
 * User Category Access Routes — super admin only
 */
router.use(requireAuth);
router.use(requireSuperAdmin);

// Create user category access
router.post('/', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.createUserCategoryAccess(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get user category access by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.getUserCategoryAccessById(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get programs accessible to a user based on category access
router.get('/user/:userId/programs', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.getAccessibleProgramsForUser(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all category access for a user
router.get('/user/:userId/activity-stats', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.getUcaActivityStats(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all category access for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.getUserCategoryAccessByUserId(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all users with access to a category
router.get('/category/:categoryId/users', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.getUsersByCategoryAccess(req.params.categoryId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all user category accesses
router.get('/', async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      categoryId: req.query.categoryId,
      roleId: req.query.roleId,
      programId: req.query.programId,
      subjectId: req.query.subjectId,
      classId: req.query.classId,
      canView: req.query.canView,
      canManage: req.query.canManage,
    };
    const result = await userCategoryAccessDb.getAllUserCategoryAccesses(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update user category access
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    console.log('📝 User Category Access Update - Request body:', req.body);
    const result = await userCategoryAccessDb.updateUserCategoryAccess(id, req.body);
    console.log('📝 User Category Access Update - Result:', result);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete user category access
router.delete('/:id', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.deleteUserCategoryAccess(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Check if user has access to a category
router.get('/check/:userId/:categoryId', async (req, res) => {
  try {
    const permission = req.query.permission || 'view';
    const result = await userCategoryAccessDb.checkUserCategoryAccess(
      req.params.userId,
      req.params.categoryId,
      permission
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Bulk assign category access to users
router.post('/bulk', async (req, res) => {
  try {
    const result = await userCategoryAccessDb.bulkAssignCategoryAccess(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
