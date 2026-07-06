/**
 * GET /api/v1/me/data-scope — effective category/program/subject/class scope for current user.
 * GET/PUT/DELETE /api/v1/me/dashboards/:dashboardKey — per-user widget layouts
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/keycloakAuth.js';
import { getEffectiveDataScope } from '../services/scopeResolver.js';
import { getDashboard, saveDashboard, resetDashboard, getTypography, saveTypography } from '../controllers/user-preferences.js';
import prisma from '../db/prismaClient.js';

const router = Router();

async function enrichScopeDetails(scope) {
  if (scope.unrestricted) {
    return { ...scope, unlimited: true, programs: [], subjects: [], classes: [] };
  }

  const programIds = (scope.programIds || []).map(Number).filter(Boolean);
  const subjectIds = (scope.subjectIds || []).map(Number).filter(Boolean);
  const classIds = (scope.classIds || []).map(Number).filter(Boolean);

  const [programs, subjects, classes] = await Promise.all([
    programIds.length
      ? prisma.program.findMany({
          where: { id: { in: programIds }, isActive: true },
          select: { id: true, code: true, nameEn: true, nameAr: true },
          orderBy: { nameEn: 'asc' },
        })
      : [],
    subjectIds.length
      ? prisma.subject.findMany({
          where: { id: { in: subjectIds }, isActive: true },
          select: { id: true, code: true, nameEn: true, nameAr: true, programId: true },
          orderBy: { code: 'asc' },
        })
      : [],
    classIds.length
      ? prisma.class.findMany({
          where: { id: { in: classIds }, isActive: true },
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            programId: true,
            subjectId: true,
            term: true,
            year: true,
            instructor: { select: { displayName: true, displayNameAr: true } },
          },
          orderBy: { code: 'asc' },
        })
      : [],
  ]);

  return { ...scope, unlimited: false, programs, subjects, classes };
}

router.get('/data-scope', requireAuth, async (req, res) => {
  try {
    const scope = await getEffectiveDataScope(req.user.dbId, req.user.roles || []);
    if (req.query.details === '1') {
      const enriched = await enrichScopeDetails(scope);
      return res.json({ success: true, data: enriched });
    }
    res.json({ success: true, data: scope });
  } catch (error) {
    console.error('[me/data-scope]', error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get('/dashboards/:dashboardKey', requireAuth, getDashboard);
router.put('/dashboards/:dashboardKey', requireAuth, saveDashboard);
router.delete('/dashboards/:dashboardKey', requireAuth, resetDashboard);

router.get('/preferences/typography', requireAuth, getTypography);
router.put('/preferences/typography', requireAuth, saveTypography);

export default router;
