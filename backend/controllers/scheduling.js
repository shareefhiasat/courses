/**
 * Scheduling API Controller — break sessions, summary, teacher effort.
 */

import breakSessionsDb from '../db/break-sessions-postgres.js';
import schedulingSummaryDb from '../db/scheduling-summary-postgres.js';
import teacherEffortDb from '../db/teacher-effort-postgres.js';
import effortReportDb from '../db/effort-report-postgres.js';
import { isSuperAdmin, getEffectiveRoles } from '../utils/roleUtils.js';
import { canAccessTeacherInScope, applySchedulingDataScope } from '../utils/schedulingScope.js';
import { scopeForbidden } from '../utils/scopeAccess.js';

function parseQueryParams(req) {
  const {
    programId, subjectId, classId, term, year, instructorId,
    timeRange, startDate, endDate, breakType, reportFormat,
  } = req.query;
  return {
    programId: programId ? parseInt(programId, 10) : null,
    subjectId: subjectId ? parseInt(subjectId, 10) : null,
    classId: classId ? parseInt(classId, 10) : null,
    term: term || null,
    year: year || null,
    instructorId: instructorId ? parseInt(instructorId, 10) : null,
    timeRange: timeRange || 'week',
    startDate,
    endDate,
    breakType,
    reportFormat: reportFormat || 'summary',
  };
}

function canAccessTeacherData(req, teacherUserId) {
  const roles = getEffectiveRoles(req.user?.roles || []);
  if (isSuperAdmin(roles) || roles.includes('hr')) return true;
  if (req.user?.dbId === parseInt(teacherUserId, 10)) return true;
  return null; // defer to scope check
}

async function assertTeacherAccess(req, res, teacherUserId) {
  const roleBypass = canAccessTeacherData(req, teacherUserId);
  if (roleBypass === true) return true;
  const inScope = await canAccessTeacherInScope(req, teacherUserId);
  if (!inScope) {
    scopeForbidden(res);
    return false;
  }
  return true;
}

async function scopedParams(req, res) {
  let params = resolveInstructorScope(req, parseQueryParams(req));
  const scoped = await applySchedulingDataScope(req, params);
  if (scoped.denied) {
    scopeForbidden(res);
    return null;
  }
  return scoped.params;
}

function resolveInstructorScope(req, params) {
  const roles = getEffectiveRoles(req.user?.roles || []);
  if (roles.includes('instructor') && !isSuperAdmin(roles) && !roles.includes('admin') && !roles.includes('hr')) {
    return { ...params, instructorId: req.user.dbId };
  }
  return params;
}

export const getBreakSessions = async (req, res) => {
  try {
    const params = await scopedParams(req, res);
    if (!params) return;
    const result = await breakSessionsDb.getBreakSessions(params);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBreakSession = async (req, res) => {
  try {
    const result = await breakSessionsDb.createBreakSession(req.body, req.user?.dbId);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBreakSession = async (req, res) => {
  try {
    const result = await breakSessionsDb.updateBreakSession(req.params.id, req.body, req.user?.dbId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBreakSession = async (req, res) => {
  try {
    const result = await breakSessionsDb.deleteBreakSession(req.params.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSchedulingSummary = async (req, res) => {
  try {
    const params = await scopedParams(req, res);
    if (!params) return;
    const result = await schedulingSummaryDb.getSchedulingSummary(params);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBreakSessionSummary = async (req, res) => {
  try {
    const params = await scopedParams(req, res);
    if (!params) return;
    const result = await schedulingSummaryDb.getBreakSessionSummary(params);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getHolidaySummary = async (req, res) => {
  try {
    const params = parseQueryParams(req);
    const result = await schedulingSummaryDb.getHolidaySummary(params);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTeacherWorkloadSummary = async (req, res) => {
  try {
    const params = parseQueryParams(req);
    const result = await schedulingSummaryDb.getTeacherWorkloadSummary(params);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassroomUtilizationSummary = async (req, res) => {
  try {
    const params = parseQueryParams(req);
    const result = await schedulingSummaryDb.getClassroomUtilizationSummary(params);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTeacherEffort = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!(await assertTeacherAccess(req, res, teacherId))) return;
    const params = await scopedParams(req, res);
    if (!params) return;
    const result = await teacherEffortDb.getTeacherEffortSummary(teacherId, params);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportTeacherEffortExcel = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!(await assertTeacherAccess(req, res, teacherId))) return;
    const params = await scopedParams(req, res);
    if (!params) return;
    const result = await teacherEffortDb.exportTeacherEffortCSV(teacherId, params);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportTeacherEffortPDF = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!(await assertTeacherAccess(req, res, teacherId))) return;
    const params = await scopedParams(req, res);
    if (!params) return;
    const result = await teacherEffortDb.getTeacherEffortSummary(teacherId, params);
    if (!result.success) {
      return res.status(500).json(result);
    }
    return res.status(200).json({ success: true, data: result.data, format: 'pdf-ready' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEffortReport = async (req, res) => {
  try {
    const params = await scopedParams(req, res);
    if (!params) return;
    if (params.reportFormat) params.reportFormat = req.query.reportFormat || 'summary';
    const result = await effortReportDb.getEffortReport({
      ...params,
      reportFormat: req.query.reportFormat || 'summary',
      term: req.query.term || null,
      year: req.query.year || null,
      subjectId: req.query.subjectId ? parseInt(req.query.subjectId, 10) : params.subjectId,
      classId: req.query.classId ? parseInt(req.query.classId, 10) : null,
    });
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
