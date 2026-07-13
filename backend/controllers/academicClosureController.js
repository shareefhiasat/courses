/**
 * Academic Closure Controller
 *
 * Manages closure of academic periods (weekly, monthly, semester, custom)
 * with flexible scope (global, program, class).
 */

import prisma from '../db/prismaClient.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';

/**
 * GET /api/v1/academic-closure/status
 * Check if a period is closed for a given scope.
 */
export const getClosureStatusController = async (req, res) => {
  try {
    const { dateFrom, dateTo, scopeType = 'PROGRAM', programId, classId } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, error: 'dateFrom and dateTo are required' });
    }

    const where = {
      closureType: { in: ['WEEKLY', 'MONTHLY', 'SEMESTER', 'CUSTOM'] },
      status: 'CLOSED',
      dateFrom: { lte: new Date(dateFrom) },
      dateTo: { gte: new Date(dateTo) },
    };

    if (scopeType === 'GLOBAL') {
      where.scopeType = 'GLOBAL';
    } else if (scopeType === 'PROGRAM' && programId) {
      where.OR = [
        { scopeType: 'GLOBAL' },
        { scopeType: 'PROGRAM', programId: Number(programId) },
      ];
    } else if (scopeType === 'CLASS' && classId) {
      where.OR = [
        { scopeType: 'GLOBAL' },
        { scopeType: 'PROGRAM', programId: Number(programId) },
        { scopeType: 'CLASS', classId: Number(classId) },
      ];
    }

    const closure = await prisma.academicClosure.findFirst({
      where,
      orderBy: { closedAt: 'desc' },
    });

    return res.json({
      success: true,
      data: closure
        ? { ...closure, isClosed: true, dateFrom: closure.dateFrom.toISOString().slice(0, 10), dateTo: closure.dateTo.toISOString().slice(0, 10) }
        : { isClosed: false },
    });
  } catch (error) {
    console.error('[academicClosure] getClosureStatus error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/v1/academic-closure/close
 * Close a period for a given scope.
 */
export const closePeriodController = async (req, res) => {
  try {
    const { user } = req;
    if (!user || !user.roles || !user.roles.some(role => [LMS_ROLES.HR, LMS_ROLES.ADMIN, LMS_ROLES.SUPER_ADMIN].includes(role))) {
      return res.status(403).json({ success: false, error: 'HR, Admin, or Super Admin role required' });
    }

    const {
      closureType = 'WEEKLY',
      dateFrom,
      dateTo,
      scopeType = 'PROGRAM',
      programId,
      classId,
      workflowDocumentId,
    } = req.body;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, error: 'dateFrom and dateTo are required' });
    }

    // Check if already closed
    const existing = await prisma.academicClosure.findFirst({
      where: {
        closureType,
        status: 'CLOSED',
        dateFrom: { lte: new Date(dateFrom) },
        dateTo: { gte: new Date(dateTo) },
        ...(scopeType === 'GLOBAL'
          ? { scopeType: 'GLOBAL' }
          : scopeType === 'PROGRAM' && programId
            ? { scopeType: 'PROGRAM', programId: Number(programId) }
            : scopeType === 'CLASS' && classId
              ? { scopeType: 'CLASS', classId: Number(classId) }
              : {}),
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: 'Period is already closed', data: existing });
    }

    const closure = await prisma.academicClosure.create({
      data: {
        closureType,
        scopeType,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        programId: programId ? Number(programId) : null,
        classId: classId ? Number(classId) : null,
        workflowDocumentId: workflowDocumentId ? Number(workflowDocumentId) : null,
        status: 'CLOSED',
        closedBy: user.dbId || null,
      },
    });

    return res.json({
      success: true,
      data: { ...closure, isClosed: true, dateFrom: closure.dateFrom.toISOString().slice(0, 10), dateTo: closure.dateTo.toISOString().slice(0, 10) },
    });
  } catch (error) {
    console.error('[academicClosure] closePeriod error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/v1/academic-closure/reopen
 * Reopen a previously closed period.
 */
export const reopenPeriodController = async (req, res) => {
  try {
    const { user } = req;
    if (!user || !user.roles || !user.roles.some(role => [LMS_ROLES.HR, LMS_ROLES.ADMIN, LMS_ROLES.SUPER_ADMIN].includes(role))) {
      return res.status(403).json({ success: false, error: 'HR, Admin, or Super Admin role required' });
    }

    const {
      closureType = 'WEEKLY',
      dateFrom,
      dateTo,
      scopeType = 'PROGRAM',
      programId,
      classId,
    } = req.body;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, error: 'dateFrom and dateTo are required' });
    }

    const where = {
      closureType,
      status: 'CLOSED',
      dateFrom: { lte: new Date(dateFrom) },
      dateTo: { gte: new Date(dateTo) },
      ...(scopeType === 'GLOBAL'
        ? { scopeType: 'GLOBAL' }
        : scopeType === 'PROGRAM' && programId
          ? { scopeType: 'PROGRAM', programId: Number(programId) }
          : scopeType === 'CLASS' && classId
            ? { scopeType: 'CLASS', classId: Number(classId) }
            : {}),
    };

    const updated = await prisma.academicClosure.updateMany({
      where,
      data: {
        status: 'REOPENED',
        reopenedBy: user.dbId || null,
        reopenedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({ success: false, error: 'No closed period found matching the criteria' });
    }

    return res.json({ success: true, data: { isClosed: false, reopenedCount: updated.count } });
  } catch (error) {
    console.error('[academicClosure] reopenPeriod error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export default {
  getClosureStatusController,
  closePeriodController,
  reopenPeriodController,
};
