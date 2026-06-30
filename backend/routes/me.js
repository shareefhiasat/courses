/**
 * GET /api/v1/me/data-scope — effective category/program/subject/class scope for current user.
 * GET/PUT/DELETE /api/v1/me/dashboards/:dashboardKey — per-user widget layouts
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/keycloakAuth.js';
import { getEffectiveDataScope } from '../services/scopeResolver.js';
import { getDashboard, saveDashboard, resetDashboard, getTypography, saveTypography } from '../controllers/user-preferences.js';

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

router.get('/dashboards/:dashboardKey', requireAuth, getDashboard);
router.put('/dashboards/:dashboardKey', requireAuth, saveDashboard);
router.delete('/dashboards/:dashboardKey', requireAuth, resetDashboard);

router.get('/preferences/typography', requireAuth, getTypography);
router.put('/preferences/typography', requireAuth, saveTypography);

export default router;
