import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportDailyOfficialForDate,
  exportAttendanceOfficialForScope,
} from '@services/business/accessScopeExportService.js';
import { createCustomWorkflowDocument } from '@services/api/workflow-documents-api.js';
import { apiService } from '@services/api/apiService.js';
import { getSubjects } from '@services/business/programService.js';
import { getClasses } from '@services/business/classService.js';

/**
 * Initiate a draft attendance workflow for a class + date.
 *
 * Creates a DRAFT workflow document without a filed PDF.
 * The PDF will be generated and filed only when Admin moves it to HR (UNDER_HR_REVIEW).
 *
 * @param {{ cls: object, program: object, subject: object, date: string, lang: string, user: object }} params
 * @returns {Promise<{ success: boolean, code?: number, error?: string, data?: object }>}
 */
/**
 * Look up an in-progress attendance workflow for class + date (before initiating).
 */
export async function findExistingAttendanceWorkflow(classId, date) {
  if (!classId || !date) return { success: true, data: null };
  try {
    const params = new URLSearchParams({
      classId: String(classId),
      date: String(date).slice(0, 10),
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'DAILY',
    });
    const result = await apiService.get(`/workflow-documents/board?${params.toString()}`);
    if (!result.success) return { success: false, data: null, error: result.error };
    const docs = result.data || [];
    if (docs.length === 0) return { success: true, data: null };

    // Prefer in-progress workflows, then fall back to approved/rejected
    const inProgress = docs.find((d) =>
      !['APPROVED', 'REJECTED'].includes(String(d.status || '').toUpperCase()),
    );
    const existing = inProgress || docs[0];
    return {
      success: true,
      data: {
        id: existing.id,
        status: existing.status,
        fileId: existing.file?.id || existing.fileId || existing.attachments?.[0]?.fileId || null,
        fileName: existing.file?.name || existing.attachments?.[0]?.fileName || null,
        title: existing.title,
      },
    };
  } catch (err) {
    console.error('[workflowInitiationService] findExistingAttendanceWorkflow error:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Look up the approval status of a weekly-summary attendance workflow for a class + date.
 * Returns the most relevant document status, or null if none exists.
 */
export async function findWeeklySummaryWorkflowStatus(classId, date) {
  if (!classId || !date) return { success: true, data: null };
  try {
    const params = new URLSearchParams({
      classId: String(classId),
      date: String(date).slice(0, 10),
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'WEEKLY_SUMMARY',
    });
    const result = await apiService.get(`/workflow-documents/board?${params.toString()}`);
    if (!result.success) return { success: false, data: null, error: result.error };
    const docs = result.data || [];
    const approvedDoc = docs.find((d) => String(d.status || '').toUpperCase() === 'APPROVED');
    if (approvedDoc) {
      return { success: true, data: { status: approvedDoc.status, approved: true, id: approvedDoc.id } };
    }
    const pendingDoc = docs[0];
    if (pendingDoc) {
      return { success: true, data: { status: pendingDoc.status, approved: false, id: pendingDoc.id } };
    }
    return { success: true, data: null };
  } catch (err) {
    console.error('[workflowInitiationService] findWeeklySummaryWorkflowStatus error:', err);
    return { success: false, data: null, error: err.message };
  }
}

export async function initiateAttendanceWorkflow({
  cls,
  program,
  subject,
  date,
  lang,
  user,
}) {
  if (!cls?.id || !date) {
    return { success: false, error: 'Missing class or date' };
  }

  try {
    // Validate that attendance records exist for this class on this date
    const hasAttendance = await checkDailyAttendanceExists(cls.id, date);
    if (!hasAttendance) {
      return { success: false, error: 'No attendance records found for this class on this date. Cannot initiate a daily workflow without attendance data.' };
    }

    const className = lang === 'ar'
      ? cls.nameAr || cls.nameEn || cls.code
      : cls.nameEn || cls.nameAr || cls.code;

    // Create DRAFT workflow without a filed PDF.
    // The PDF will be generated and filed only when Admin moves it to HR (UNDER_HR_REVIEW).
    const workflowResult = await createCustomWorkflowDocument({
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'DAILY',
      title: `Daily Attendance - ${className} - ${date}`,
      description: `Daily attendance workflow for ${className} on ${date}`,
      attachFile: false,
      classId: cls.id,
      date,
      dateFrom: date,
      program: program?.code || String(cls.programId || ''),
      subject: subject?.code || String(cls.subjectId || ''),
    }).catch((err) => {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 409) {
        const existing = data?.existingDraft || data?.existingWorkflow || null;
        return {
          success: false,
          code: 409,
          error: data?.error || 'A workflow already exists for this scope',
          existingDraft: existing,
          existingDocument: existing,
        };
      }
      throw err;
    });

    if (workflowResult.success) {
      return { success: true, data: workflowResult.data };
    }

    return {
      success: false,
      code: workflowResult.code || workflowResult.status,
      error: workflowResult.error || 'Failed to create workflow document',
      existingDraft: workflowResult.existingDocument || workflowResult.data?.existingDocument,
    };
  } catch (err) {
    console.error('[workflowInitiationService] initiateAttendanceWorkflow error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Initiate a weekly attendance summary workflow.
 *
 * Steps:
 * 1. Export the weekly attendance violation report as PDF (uploaded to Smart Drive).
 * 2. Create an ATTENDANCE_WEEKLY workflow document with the file attached.
 *
 * @param {{ programId: number, programName: string, classIds: number[], weekFrom: string, weekTo: string, lang: string, user: object }} params
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function initiateWeeklyWorkflow({
  programId,
  programName,
  classIds = [],
  weekFrom,
  weekTo,
  lang,
  user,
}) {
  if (!weekFrom || !weekTo) {
    return { success: false, error: 'Missing weekFrom or weekTo' };
  }

  try {
    // Fetch subjects for the program
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

    // Resolve class IDs if not provided
    let resolvedClassIds = classIds;
    if (resolvedClassIds.length === 0 && programId) {
      const classesRes = await getClasses({ programId, isActive: true, limit: 500 });
      if (classesRes?.success) {
        resolvedClassIds = classesRes.data.map((c) => c.id);
      }
    }

    if (resolvedClassIds.length === 0) {
      return { success: false, error: 'No active classes found for the program' };
    }

    // Validate that attendance records exist for this week
    const hasAttendance = await checkWeeklyAttendanceExists(resolvedClassIds, weekFrom, weekTo);
    if (!hasAttendance) {
      return { success: false, error: 'No attendance records found for this week. Cannot initiate a weekly workflow without attendance data.' };
    }

    const violationTypes = {
      absentNoExcuse: true,
      absentWithExcuse: true,
      excusedLeave: true,
      late: true,
      humanCase: true,
    };

    const exportResult = await exportAttendanceOfficialForScope({
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

    const fileId = exportResult?.fileId;
    if (!fileId) {
      return {
        success: false,
        error: 'Failed to upload weekly report PDF to Smart Drive.',
      };
    }

    const title = `Weekly Attendance - ${programName || ''} - ${weekFrom} → ${weekTo}`;

    const workflowResult = await createCustomWorkflowDocument({
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'WEEKLY_SUMMARY',
      title,
      description: `Weekly attendance workflow for ${programName || ''} from ${weekFrom} to ${weekTo}`,
      attachFile: true,
      fileId,
      dateFrom: weekFrom,
      dateTo: weekTo,
      program: String(programId || ''),
    }).catch((err) => {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 409) {
        const existing = data?.existingDraft || data?.existingWorkflow || null;
        return {
          success: false,
          code: 409,
          error: data?.error || 'A weekly workflow already exists for this scope',
          existingDraft: existing,
          existingDocument: existing,
        };
      }
      throw err;
    });

    if (workflowResult.success) {
      return { success: true, data: workflowResult.data };
    }

    return {
      success: false,
      code: workflowResult.code || workflowResult.status,
      error: workflowResult.error || 'Failed to create weekly workflow document',
      existingDraft: workflowResult.existingDocument || workflowResult.data?.existingDocument,
    };
  } catch (err) {
    console.error('[workflowInitiationService] initiateWeeklyWorkflow error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if any attendance records exist for the given classes in a date range.
 * @param {number[]} classIds
 * @param {string} weekFrom
 * @param {string} weekTo
 * @returns {Promise<boolean>}
 */
async function checkWeeklyAttendanceExists(classIds, weekFrom, weekTo) {
  if (!classIds.length) return false;
  try {
    for (const classId of classIds) {
      const params = new URLSearchParams({
        classId: String(classId),
        dateFrom: weekFrom,
        dateTo: weekTo,
        limit: '1',
      });
      const result = await apiService.get(`/attendance?${params.toString()}`);
      if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('[workflowInitiationService] checkWeeklyAttendanceExists error:', err);
    return false;
  }
}

/**
 * Check if any attendance records exist for a given class on a specific date.
 * @param {number} classId
 * @param {string} date
 * @returns {Promise<boolean>}
 */
async function checkDailyAttendanceExists(classId, date) {
  if (!classId || !date) return false;
  try {
    const params = new URLSearchParams({
      classId: String(classId),
      date,
      limit: '1',
    });
    const result = await apiService.get(`/attendance?${params.toString()}`);
    if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
      return true;
    }
    return false;
  } catch (err) {
    console.error('[workflowInitiationService] checkDailyAttendanceExists error:', err);
    return false;
  }
}
