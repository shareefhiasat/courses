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

async function enrichScopeDetails(scope, userId) {
  const classSelect = {
    id: true,
    code: true,
    nameEn: true,
    nameAr: true,
    programId: true,
    subjectId: true,
    term: true,
    year: true,
    instructorId: true,
    instructor: { select: { displayName: true, displayNameAr: true } },
    subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  };

  if (scope.unrestricted) {
    const [programs, subjects, classes] = await Promise.all([
      prisma.program.findMany({
        where: { isActive: true },
        select: { id: true, code: true, nameEn: true, nameAr: true },
        orderBy: { nameEn: 'asc' },
      }),
      prisma.subject.findMany({
        where: { isActive: true },
        select: { id: true, code: true, nameEn: true, nameAr: true, programId: true },
        orderBy: { code: 'asc' },
      }),
      prisma.class.findMany({
        where: { isActive: true },
        select: classSelect,
        orderBy: { code: 'asc' },
      }),
    ]);

    const instructorClassIds = userId
      ? classes.filter((c) => c.instructorId === userId).map((c) => c.id)
      : [];
    const instructorSubjectIds = userId
      ? [...new Set(classes.filter((c) => c.instructorId === userId).map((c) => c.subjectId).filter(Boolean))]
      : [];

    return {
      ...scope,
      unlimited: true,
      programs,
      subjects: subjects.map((s) => ({
        ...s,
        isInstructor: instructorSubjectIds.includes(s.id),
      })),
      classes: classes.map((c) => ({
        ...c,
        isInstructor: userId ? c.instructorId === userId : false,
      })),
      instructorClassIds,
      instructorSubjectIds,
    };
  }

  const programIds = (scope.programIds || []).map(Number).filter(Boolean);
  const subjectIds = (scope.subjectIds || []).map(Number).filter(Boolean);
  const classIds = (scope.classIds || []).map(Number).filter(Boolean);

  // For admin/HR with category-level UCA (programs resolved from categories, but no explicit subjects/classes),
  // fetch all subjects and classes belonging to those programs so the UI shows full data.
  const isAdminOrHr = scope.source === 'admin_restricted' || scope.source === 'hr_restricted';
  const needAllSubjectsForPrograms = isAdminOrHr && programIds.length > 0 && subjectIds.length === 0;
  const needAllClassesForPrograms = isAdminOrHr && programIds.length > 0 && classIds.length === 0;

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
      : needAllSubjectsForPrograms
        ? prisma.subject.findMany({
            where: { programId: { in: programIds }, isActive: true },
            select: { id: true, code: true, nameEn: true, nameAr: true, programId: true },
            orderBy: { code: 'asc' },
          })
        : [],
    classIds.length
      ? prisma.class.findMany({
          where: { id: { in: classIds }, isActive: true },
          select: classSelect,
          orderBy: { code: 'asc' },
        })
      : needAllClassesForPrograms
        ? prisma.class.findMany({
            where: { programId: { in: programIds }, isActive: true },
            select: classSelect,
            orderBy: { code: 'asc' },
          })
        : [],
  ]);

  const instructorClassIds = userId
    ? classes.filter((c) => c.instructorId === userId).map((c) => c.id)
    : [];
  const instructorSubjectIds = userId
    ? [...new Set(classes.filter((c) => c.instructorId === userId).map((c) => c.subjectId).filter(Boolean))]
    : [];

  return {
    ...scope,
    unlimited: false,
    programs,
    subjects: subjects.map((s) => ({
      ...s,
      isInstructor: instructorSubjectIds.includes(s.id),
    })),
    classes: classes.map((c) => ({
      ...c,
      isInstructor: userId ? c.instructorId === userId : false,
    })),
    instructorClassIds,
    instructorSubjectIds,
  };
}

router.get('/data-scope', requireAuth, async (req, res) => {
  try {
    const scope = await getEffectiveDataScope(req.user.dbId, req.user.roles || []);
    console.log('[me/data-scope] dbId:', req.user.dbId, '| roles:', req.user.roles, '| unrestricted:', scope.unrestricted, '| source:', scope.source, '| unlimited:', scope.unlimited);
    if (req.query.details === '1') {
      const enriched = await enrichScopeDetails(scope, req.user.dbId);
      console.log('[me/data-scope] enriched.unlimited:', enriched.unlimited, '| programs:', enriched.programs?.length, '| subjects:', enriched.subjects?.length, '| classes:', enriched.classes?.length);
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
