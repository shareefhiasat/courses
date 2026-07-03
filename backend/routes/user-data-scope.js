import express from 'express';
import { requireAuth, requireSuperAdmin } from '../middleware/keycloakAuth.js';
import userDataScopeDb from '../db/user-data-scope-postgres.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const data = await userDataScopeDb.getFullUserDataScope(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[user-data-scope GET]', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const result = await userDataScopeDb.saveUserDataScope(userId, req.body, req.user?.dbId);
    res.json(result);
  } catch (error) {
    console.error('[user-data-scope PUT]', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
