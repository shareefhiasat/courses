import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportDailyOfficialForDate,
  exportAttendanceOfficialForScope,
} from '@services/business/accessScopeExportService.js';
import { createCustomWorkflowDocument } from '@services/api/workflow-documents-api.js';
import { apiService } from '@services/api/apiService.js';
import { getSubjects } from '@services/business/programService.js';
import { getClasses } from '@services/business/classService.js';
import { getWeekRange } from '@services/business/workflowSnapshotService.js';

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
export async function findExistingAttendanceWorkflow(classId, date, attendanceSubtype = 'DAILY') {
  if (!classId || !date) return { success: true, data: null };
  try {
    const query = new URLSearchParams({
      classId: String(classId),
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype,
      _t: String(Date.now()),
    });

    if (attendanceSubtype === 'WEEKLY_SUMMARY') {
      const { weekFrom, weekTo } = getWeekRange(date);
      query.set('dateFrom', weekFrom);
      query.set('dateTo', weekTo);
    } else {
      query.set('date', String(date).slice(0, 10));
    }

    const result = await apiService.get(`/workflow-documents/board?${query.toString()}`);
    if (!result.success) return { success: false, data: null, error: result.error };
    const docs = result.data || [];
    if (docs.length === 0) return { success: true, data: null };

    // Prefer in-progress workflows, then fall back to approved/rejected
    const inProgress = docs.find((d) =>
      !['APPROVED', 'REJECTED'].includes(String(d.status || '').toUpperCase()),
    );
    const existing = inProgress || docs[0];

    // Extract approver info from statusHistory for APPROVED workflows
    let approvedBy = null;
    let approvedAt = null;
    if (String(existing.status || '').toUpperCase() === 'APPROVED' && Array.isArray(existing.statusHistory)) {
      const approvalEntry = existing.statusHistory.find(
        (h) => String(h.toStatus || '').toUpperCase() === 'APPROVED'
      );
      if (approvalEntry) {
        approvedAt = approvalEntry.createdAt || null;
        approvedBy = approvalEntry.actor || null;
      }
    }

    return {
      success: true,
      data: {
        id: existing.id,
        status: existing.status,
        fileId: existing.file?.id || existing.fileId || existing.attachments?.[0]?.fileId || null,
        fileName: existing.file?.name || existing.attachments?.[0]?.fileName || null,
        title: existing.title,
        approvedBy,
        approvedAt,
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
    const { weekFrom, weekTo } = getWeekRange(date);
    const params = new URLSearchParams({
      classId: String(classId),
      dateFrom: weekFrom,
      dateTo: weekTo,
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
    return { success: false, errorKey: 'workflow_initiation_error_missing_class_date', error: 'Missing class or date' };
  }

  try {
    // Validate that attendance records exist for this class on this date
    const hasAttendance = await checkDailyAttendanceExists(cls.id, date);
    if (!hasAttendance) {
      return { success: false, errorKey: 'workflow_initiation_error_no_attendance_class', error: 'No attendance records found for this class on this date. Cannot initiate a daily workflow without attendance data.' };
    }

    const className = lang === 'ar'
      ? cls.nameAr || cls.nameEn || cls.code
      : cls.nameEn || cls.nameAr || cls.code;

    const dailyAttendanceLabel = lang === 'ar' ? 'حضور يومي' : 'Daily Attendance';
    const descriptionPrefix = lang === 'ar' ? 'سير عمل الحضور اليومي لـ' : 'Daily attendance workflow for';

    // Create DRAFT workflow without a filed PDF.
    // The PDF will be generated and filed only when Admin moves it to HR (UNDER_HR_REVIEW).
    const workflowResult = await createCustomWorkflowDocument({
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'DAILY',
      title: `${dailyAttendanceLabel} - ${className} - ${date}`,
      description: `${descriptionPrefix} ${className} on ${date}`,
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
        const existing = data?.existingDraft || data?.existingApproved || data?.existingWorkflow || null;
        return {
          success: false,
          code: 409,
          errorKey: data?.errorKey || 'workflow_initiation_error_exists',
          error: data?.error || 'A workflow already exists for this scope',
          existingDraft: data?.existingDraft || existing,
          existingApproved: data?.existingApproved || null,
          existingDocument: data?.existingDocument || existing,
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
      errorKey: workflowResult.errorKey || 'workflow_initiation_error_create',
      error: workflowResult.error || 'Failed to create workflow document',
      existingDraft: workflowResult.existingDocument || workflowResult.data?.existingDocument,
      existingApproved: workflowResult.existingApproved || null,
    };
  } catch (err) {
    console.error('[workflowInitiationService] initiateAttendanceWorkflow error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Initiate weekly attendance summary workflows — one per class.
 *
 * Steps per class:
 * 1. Export the weekly attendance violation report as PDF (uploaded to Smart Drive).
 * 2. Create an ATTENDANCE/WEEKLY_SUMMARY workflow document with classId set.
 *
 * @param {{ programId: number, programName: string, classIds: number[], weekFrom: string, weekTo: string, lang: string, user: object }} params
 * @returns {Promise<{ success: boolean, results: array, errors: array, error?: string, errorKey?: string }>}
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
    return { success: false, errorKey: 'workflow_initiation_error_missing_week', error: 'Missing weekFrom or weekTo' };
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
      return { success: false, errorKey: 'workflow_initiation_error_no_subjects', error: 'No subjects found for the program' };
    }

    // Resolve class IDs and keep class details for instructor
    let resolvedClassIds = classIds;
    let allClasses = [];
    if (programId) {
      const classesRes = await getClasses({ programId, isActive: true, limit: 500 });
      if (classesRes?.success) {
        allClasses = classesRes.data || [];
        if (resolvedClassIds.length === 0) {
          resolvedClassIds = allClasses.map((c) => c.id);
        }
      }
    }

    if (resolvedClassIds.length === 0) {
      return { success: false, errorKey: 'workflow_initiation_error_no_classes', error: 'No active classes found for the program' };
    }

    // Validate that attendance records exist for this week
    const hasAttendance = await checkWeeklyAttendanceExists(resolvedClassIds, weekFrom, weekTo);
    if (!hasAttendance) {
      return { success: false, errorKey: 'workflow_initiation_error_no_attendance_week', error: 'No attendance records found for this week. Cannot initiate a weekly workflow without attendance data.' };
    }

    const violationTypes = {
      absentNoExcuse: true,
      absentWithExcuse: true,
      excusedLeave: true,
      late: true,
      humanCase: true,
    };

    const results = [];
    const errors = [];

    for (const classId of resolvedClassIds) {
      const cls = allClasses.find((c) => String(c.id) === String(classId));
      const instructorId = cls?.instructor?.id || cls?.instructorId || null;
      const actorId = user?.id || null;
      const reviewers = [instructorId || actorId];
      if (actorId && !reviewers.includes(actorId)) reviewers.push(actorId);

      try {
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
          download: false,
          classIds: [classId],
          workflowStatus: 'Draft',
        });

        const fileId = exportResult?.fileId;
        if (!fileId) {
          errors.push({ classId, error: 'Failed to upload weekly report PDF to Smart Drive.' });
          continue;
        }

        const title = lang === 'ar'
          ? `الحضور الأسبوعي - ${programName || ''} - ${weekFrom} → ${weekTo}`
          : `Weekly Attendance - ${programName || ''} - ${weekFrom} → ${weekTo}`;

        const weeklyDescription = lang === 'ar'
          ? `سير عمل الحضور الأسبوعي لـ ${programName || ''} من ${weekFrom} إلى ${weekTo}`
          : `Weekly attendance workflow for ${programName || ''} from ${weekFrom} to ${weekTo}`;

        const workflowResult = await createCustomWorkflowDocument({
          workflowCategory: 'ATTENDANCE',
          attendanceSubtype: 'WEEKLY_SUMMARY',
          title,
          description: weeklyDescription,
          attachFile: true,
          fileId,
          dateFrom: weekFrom,
          dateTo: weekTo,
          program: String(programId || ''),
          classId,
          reviewers,
        }).catch((err) => {
          const status = err.response?.status;
          const data = err.response?.data;
          if (status === 409) {
            const existing = data?.existingDraft || data?.existingApproved || data?.existingWorkflow || null;
            return {
              success: false,
              code: 409,
              errorKey: data?.errorKey || 'workflow_initiation_error_weekly_exists',
              error: data?.error || 'A weekly workflow already exists for this scope',
              existingDraft: data?.existingDraft || existing,
              existingApproved: data?.existingApproved || null,
              existingDocument: data?.existingDocument || existing,
            };
          }
          throw err;
        });

        if (workflowResult.success) {
          const document = workflowResult.data?.document || workflowResult.data || {};
          results.push({ classId, data: { ...document, blobUrl: exportResult?.blobUrl || null } });
        } else {
          errors.push({
            classId,
            code: workflowResult.code,
            errorKey: workflowResult.errorKey,
            error: workflowResult.error,
            existingDraft: workflowResult.existingDocument || workflowResult.data?.existingDocument,
            existingApproved: workflowResult.existingApproved || null,
          });
        }
      } catch (err) {
        console.error(`[workflowInitiationService] initiateWeeklyWorkflow classId=${classId} error:`, err);
        errors.push({ classId, error: err.message });
      }
    }

    if (results.length > 0) {
      return { success: true, results, errors };
    }

    // All failed — return first error info
    const firstError = errors[0] || {};
    return {
      success: false,
      results,
      errors,
      code: firstError.code,
      errorKey: firstError.errorKey || 'workflow_initiation_error_create_weekly',
      error: firstError.error || 'Failed to create weekly workflow documents',
      existingDraft: firstError.existingDraft,
      existingApproved: firstError.existingApproved,
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
