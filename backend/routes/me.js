/**
 * GET /api/v1/me/data-scope — effective category/program/subject/class scope for current user.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/keycloakAuth.js';
import { getEffectiveDataScope } from '../services/scopeResolver.js';

const router = Router();

router.get('/data-scope', requireAuth, async (req, res) => {
  try {
    const scope = await getEffectiveDataScope(req.user.dbId, req.user.roles || []);
    res.json({ success: true, data: scope });
  } catch (error) {
    console.error('[me/data-scope]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
