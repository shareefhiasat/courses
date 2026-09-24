import React from 'react';
import { prepareAttendanceWarningData } from '../export/official-reports/engine/prepareAttendanceWarningData.js';
import { AttendanceWarningTemplate } from '../export/official-reports/templates/attendanceWarning.template.jsx';
import { renderOfficialPdf } from '../export/official-reports/renderers/pdfRenderer.js';
import { exportAttendanceOfficialForScope } from '@services/business/accessScopeExportService.js';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { apiService } from '@services/api/apiService.js';
import { getSubjects } from '@services/business/programService.js';
import { getClasses } from '@services/business/classService.js';
import { fetchAbsenceWarningCounts } from '@services/business/attendanceDeductionService.js';
import { buildReportFilename } from '@services/export/official-reports/engine/reportFilename.js';

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
  classId = null,
  workflowStatus = null,
  approvedBy = null,
  approvedAt = null,
  skipPersist = false,
  download = false,
  preview = false,
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
      download,
      classIds: resolvedClassIds,
      classId: classId || resolvedClassIds[0] || null,
      workflowStatus,
      approvedBy,
      approvedAt,
      skipPersist,
      preview,
    });

    if (!skipPersist && !result?.fileId) {
      return {
        success: false,
        error: 'Failed to upload snapshot PDF to Smart Drive',
        weekFrom,
        weekTo,
      };
    }

    return {
      success: true,
      fileId: result?.fileId || null,
      filename: result?.filename || `weekly_official_${weekFrom}_${weekTo}.pdf`,
      blob: result?.blob || null,
      blobUrl: result?.blobUrl || null,
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
  workflowStatus = null,
  approvedBy = null,
  approvedAt = null,
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
      download: false,
      classIds: classId ? [classId] : [],
      classId,
      workflowStatus,
      approvedBy,
      approvedAt,
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

/**
 * Get all workflow documents for the weekly summary scope (including REJECTED).
 * @param {{ weekFrom: string, weekTo: string, classId?: number, programId?: number }} params
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getWeeklyWorkflowHistory({ weekFrom, weekTo, classId, programId }) {
  try {
    const params = new URLSearchParams();
    params.append('dateFrom', weekFrom);
    params.append('dateTo', weekTo);
    params.append('workflowCategory', 'ATTENDANCE');
    params.append('attendanceSubtype', 'WEEKLY_SUMMARY');
    if (classId) params.append('classId', String(classId));
    if (programId) params.append('programId', String(programId));

    const result = await apiService.get(`/workflow-documents/board?${params.toString()}`);
    return { success: result.success, data: result.data || [], error: result.error };
  } catch (err) {
    console.error('[workflowSnapshotService] getWeeklyWorkflowHistory error:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Get all workflow documents for the daily attendance scope for a class + date (including REJECTED).
 * @param {{ date: string, classId?: number, programId?: number }} params
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getDailyWorkflowHistory({ date, classId, programId }) {
  try {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (classId) params.append('classId', String(classId));
    if (programId) params.append('programId', String(programId));
    params.append('workflowCategory', 'ATTENDANCE');
    params.append('attendanceSubtype', 'DAILY');

    const result = await apiService.get(`/workflow-documents/board?${params.toString()}`);
    return { success: result.success, data: result.data || [], error: result.error };
  } catch (err) {
    console.error('[workflowSnapshotService] getDailyWorkflowHistory error:', err);
    return { success: false, data: [], error: err.message };
  }
}



/**
 * Generate a warning snapshot PDF for a single student in a class.
 * Used for preview before initiating a warning workflow.
 *
 * @param {{ student: object, metadata: object, warningType: 'first'|'final', lang: 'ar'|'en', user: object, workflowStatus?: string }} params
 */
export async function generateWarningSnapshot({ student, metadata, warningType = 'first', lang = 'ar', user = null, workflowStatus = 'DRAFT' }) {
  try {
    let classAbsences = student?.classAbsences ?? student?.absences ?? [];
    if (classAbsences.length === 0 && metadata?.classId && student?.studentId) {
      try {
        const res = await fetchAbsenceWarningCounts({ classId: metadata.classId, userId: student.studentId });
        const rows = res?.data || res?.payload || [];
        classAbsences = rows.find((r) => String(r.studentId) === String(student.studentId))?.absences || [];
      } catch {
        classAbsences = [];
      }
    }
    const reportData = prepareAttendanceWarningData({
      students: [{ ...student, classAbsences }],
      metadata,
      lang,
      warningType,
    });

    if (workflowStatus) {
      reportData.watermarkStatus = workflowStatus;
      reportData.approvedByUser = user || null;
      reportData.approvedAt = new Date().toISOString();
    }

    const filename = buildReportFilename({
      type: 'attendance-warning',
      extra: warningType,
      programName: lang === 'ar' ? metadata?.programNameAr || metadata?.programName : metadata?.programName,
      className: lang === 'ar' ? metadata?.classNameAr || metadata?.className || metadata?.classCode : metadata?.className || metadata?.classCode,
      studentName: lang === 'ar' ? student?.studentNameAr || student?.displayNameAr || student?.studentName : student?.studentName || student?.displayName,
      studentNumber: student?.studentNumber,
      serial: reportData.serial,
      ext: 'pdf',
      lang,
    });
    const blob = await renderOfficialPdf(
      React.createElement(AttendanceWarningTemplate, { data: reportData, showWatermark: true }),
      {
        filename,
        download: false,
        serial: reportData.serial,
        lang,
      }
    );

    return { success: true, blob, filename };
  } catch (err) {
    console.error('[workflowSnapshotService] generateWarningSnapshot error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all attendance warning workflows for a class + optional date range.
 * @param {{ classId?: number, programId?: number, dateFrom?: string, dateTo?: string }} params
 */
export async function getWarningWorkflowHistory({ classId, programId, dateFrom, dateTo } = {}) {
  try {
    const baseParams = new URLSearchParams();
    baseParams.append('workflowCategory', 'ATTENDANCE');
    if (classId) baseParams.append('classId', String(classId));
    if (programId) baseParams.append('programId', String(programId));
    if (dateFrom) baseParams.append('dateFrom', dateFrom);
    if (dateTo) baseParams.append('dateTo', dateTo);

    const firstParams = new URLSearchParams(baseParams);
    firstParams.append('attendanceSubtype', 'WARNING_FIRST');
    const firstRes = await apiService.get(`/workflow-documents/board?${firstParams.toString()}`);

    const finalParams = new URLSearchParams(baseParams);
    finalParams.append('attendanceSubtype', 'WARNING_FINAL');
    const finalRes = await apiService.get(`/workflow-documents/board?${finalParams.toString()}`);

    const firstList = Array.isArray(firstRes?.data) ? firstRes.data : [];
    const finalList = Array.isArray(finalRes?.data) ? finalRes.data : [];
    const merged = [...firstList, ...finalList].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    return { success: true, data: merged };
  } catch (err) {
    console.error('[workflowSnapshotService] getWarningWorkflowHistory error:', err);
    return { success: false, data: [], error: err.message };
  }
}

export default {
  generateWeeklyViolationSnapshot,
  generateDailyViolationSnapshot,
  getApprovedSnapshotForWeek,
  getClosureStatus,
  closePeriod,
  reopenPeriod,
  getInProgressWeeklyWorkflow,
  getWeeklyWorkflowHistory,
  getDailyWorkflowHistory,
};
