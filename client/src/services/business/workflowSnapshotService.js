import { exportAttendanceOfficialForScope } from '@services/business/accessScopeExportService.js';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { apiService } from '@services/api/apiService.js';
import { getSubjects } from '@services/business/programService.js';
import { getClasses } from '@services/business/classService.js';

/**
 * Get the Monday–Friday date range for the week containing the given date.
 * @param {Date|string} anchorDate
 * @returns {{ weekFrom: string, weekTo: string }} ISO date strings (YYYY-MM-DD)
 */
export function getWeekRange(anchorDate) {
  const anchor = anchorDate instanceof Date ? anchorDate : new Date(anchorDate);
  const weekStart = new Date(anchor);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4); // Thursday (working week Sun–Thu)
  return {
    weekFrom: toIsoDate(weekStart),
    weekTo: toIsoDate(weekEnd),
  };
}

function toIsoDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a weekly attendance violation report PDF snapshot and upload it to Smart Drive.
 *
 * @param {{ document: object, user: object, lang: string, programId?: number, programName?: string, classIds?: number[] }} params
 * @returns {Promise<{ success: boolean, fileId?: string, filename?: string, weekFrom?: string, weekTo?: string, error?: string }>}
 */
export async function generateWeeklyViolationSnapshot({
  document,
  user,
  lang,
  programId,
  programName,
  classIds = [],
}) {
  if (!document) {
    return { success: false, error: 'Document is required' };
  }

  try {
    // Determine the week range from the document date or current date
    const anchorDate = document.date || document.dateFrom || new Date();
    const { weekFrom, weekTo } = getWeekRange(anchorDate);

    // Fetch all subjects for the program to include all subjects in the report
    let subjectIds = [];
    if (programId) {
      const subjectsRes = await getSubjects({ programId });
      if (subjectsRes?.success) {
        subjectIds = subjectsRes.data.map((s) => s.id);
      }
    }

    if (subjectIds.length === 0) {
      return { success: false, error: 'No subjects found for the program' };
    }

    // Fetch all classes for the program if not provided
    let resolvedClassIds = classIds;
    if (resolvedClassIds.length === 0 && programId) {
      const classesRes = await getClasses({ programId, isActive: true, limit: 500 });
      if (classesRes?.success) {
        resolvedClassIds = classesRes.data.map((c) => c.id);
      }
    }

    // All violation types
    const violationTypes = {
      absentNoExcuse: true,
      absentWithExcuse: true,
      excusedLeave: true,
      late: true,
      humanCase: true,
    };

    const result = await exportAttendanceOfficialForScope({
      subjectIds,
      violationTypes,
      dateFrom: weekFrom,
      dateTo: weekTo,
      programId,
      programName: programName || '',
      lang,
      user,
      format: EXPORT_FORMAT.PDF,
      classIds: resolvedClassIds,
    });

    if (!result?.fileId) {
      return {
        success: false,
        error: 'Failed to upload snapshot PDF to Smart Drive',
        weekFrom,
        weekTo,
      };
    }

    return {
      success: true,
      fileId: result.fileId,
      filename: result.filename,
      weekFrom,
      weekTo,
    };
  } catch (err) {
    console.error('[workflowSnapshotService] generateWeeklyViolationSnapshot error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a daily attendance violation report PDF snapshot and upload it to Smart Drive.
 * Scoped to a single day and a single class.
 *
 * @param {{ document: object, user: object, lang: string, classId?: number, programId?: number, programName?: string }} params
 * @returns {Promise<{ success: boolean, fileId?: string, filename?: string, date?: string, error?: string }>}
 */
export async function generateDailyViolationSnapshot({
  document,
  user,
  lang,
  classId,
  programId,
  programName,
}) {
  if (!document) {
    return { success: false, error: 'Document is required' };
  }

  try {
    const dateStr = toIsoDate(document.date || document.dateFrom || new Date());

    let subjectIds = [];
    if (programId) {
      const subjectsRes = await getSubjects({ programId });
      if (subjectsRes?.success) {
        subjectIds = subjectsRes.data.map((s) => s.id);
      }
    }

    if (subjectIds.length === 0) {
      return { success: false, error: 'No subjects found for the program' };
    }

    const violationTypes = {
      absentNoExcuse: true,
      absentWithExcuse: true,
      excusedLeave: true,
      late: true,
      humanCase: true,
    };

    const result = await exportAttendanceOfficialForScope({
      subjectIds,
      violationTypes,
      dateFrom: dateStr,
      dateTo: dateStr,
      programId,
      programName: programName || '',
      lang,
      user,
      format: EXPORT_FORMAT.PDF,
      classIds: classId ? [classId] : [],
    });

    if (!result?.fileId) {
      return {
        success: false,
        error: 'Failed to upload snapshot PDF to Smart Drive',
        date: dateStr,
      };
    }

    return {
      success: true,
      fileId: result.fileId,
      filename: result.filename,
      date: dateStr,
    };
  } catch (err) {
    console.error('[workflowSnapshotService] generateDailyViolationSnapshot error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch the latest approved attendance violation snapshot for a given week.
 *
 * @param {{ weekFrom: string, weekTo: string, classId?: number }} params
 * @returns {Promise<{ success: boolean, data?: object|null, error?: string }>}
 */
export async function getApprovedSnapshotForWeek({ weekFrom, weekTo, classId, programId }) {
  if (!weekFrom || !weekTo) {
    return { success: false, error: 'weekFrom and weekTo are required' };
  }

  try {
    const params = new URLSearchParams({ weekFrom, weekTo });
    if (classId) params.append('classId', String(classId));
    if (programId) params.append('programId', String(programId));
    const result = await apiService.get(`/workflow-documents/snapshot?${params.toString()}`);
    return result;
  } catch (err) {
    console.error('[workflowSnapshotService] getApprovedSnapshotForWeek error:', err);
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Check if a period is closed for a given scope.
 *
 * @param {{ dateFrom: string, dateTo: string, scopeType?: string, programId?: number, classId?: number }} params
 * @returns {Promise<{ success: boolean, data?: object|null, error?: string }>}
 */
export async function getClosureStatus({ dateFrom, dateTo, scopeType = 'PROGRAM', programId, classId }) {
  if (!dateFrom || !dateTo) {
    return { success: false, error: 'dateFrom and dateTo are required' };
  }

  try {
    const params = new URLSearchParams({ dateFrom, dateTo, scopeType });
    if (programId) params.append('programId', String(programId));
    if (classId) params.append('classId', String(classId));
    const result = await apiService.get(`/academic-closure/status?${params.toString()}`);
    return result;
  } catch (err) {
    console.error('[workflowSnapshotService] getClosureStatus error:', err);
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Close a period for a given scope.
 *
 * @param {{ closureType: string, dateFrom: string, dateTo: string, scopeType: string, programId?: number, classId?: number, workflowDocumentId?: number }} params
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function closePeriod({ closureType, dateFrom, dateTo, scopeType, programId, classId, workflowDocumentId }) {
  try {
    const result = await apiService.post('/academic-closure/close', {
      closureType,
      dateFrom,
      dateTo,
      scopeType,
      programId: programId || null,
      classId: classId || null,
      workflowDocumentId: workflowDocumentId || null,
    });
    return result;
  } catch (err) {
    console.error('[workflowSnapshotService] closePeriod error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Reopen a previously closed period.
 *
 * @param {{ closureType: string, dateFrom: string, dateTo: string, scopeType: string, programId?: number, classId?: number }} params
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function reopenPeriod({ closureType, dateFrom, dateTo, scopeType, programId, classId }) {
  try {
    const result = await apiService.post('/academic-closure/reopen', {
      closureType,
      dateFrom,
      dateTo,
      scopeType,
      programId: programId || null,
      classId: classId || null,
    });
    return result;
  } catch (err) {
    console.error('[workflowSnapshotService] reopenPeriod error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get the weekly workflow (in-progress or approved) for the given week.
 * @param {{ weekFrom: string, weekTo: string, programId?: number }} params
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function getInProgressWeeklyWorkflow({ weekFrom, weekTo, programId }) {
  try {
    const params = new URLSearchParams();
    params.append('dateFrom', weekFrom);
    params.append('dateTo', weekTo);
    params.append('workflowCategory', 'ATTENDANCE');
    params.append('attendanceSubtype', 'WEEKLY_SUMMARY');
    if (programId) params.append('programId', programId);

    const result = await apiService.get(`/workflow-documents/board?${params.toString()}`);
    if (result.success && result.data?.length > 0) {
      const workflow = result.data.find((doc) =>
        ['DRAFT', 'SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED'].includes(doc.status)
      );
      return { success: true, data: workflow || null };
    }
    return { success: true, data: null };
  } catch (err) {
    console.error('[workflowSnapshotService] getInProgressWeeklyWorkflow error:', err);
    return { success: false, error: err.message };
  }
}
