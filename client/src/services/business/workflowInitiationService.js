import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportDailyOfficialForDate,
} from '@services/business/accessScopeExportService.js';
import { createCustomWorkflowDocument } from '@services/api/workflow-documents-api.js';
import { apiService } from '@services/api/apiService.js';

/**
 * Initiate a draft attendance workflow for a class + date.
 *
 * Steps:
 * 1. Export the daily official attendance report as PDF (blob).
 *    - exportDailyOfficialForDate already uploads to Smart Drive and returns fileId.
 * 2. Create a custom workflow document with the file attached, in DRAFT status.
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
    const inProgress = docs.find((d) =>
      !['APPROVED', 'REJECTED'].includes(String(d.status || '').toUpperCase()),
    );
    if (!inProgress) return { success: true, data: null };
    return {
      success: true,
      data: {
        id: inProgress.id,
        status: inProgress.status,
        fileId: inProgress.file?.id || inProgress.fileId || inProgress.attachments?.[0]?.fileId || null,
        fileName: inProgress.file?.name || inProgress.attachments?.[0]?.fileName || null,
        title: inProgress.title,
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
    const exportResult = await exportDailyOfficialForDate({
      cls,
      program,
      subject,
      lang,
      user,
      date,
      format: EXPORT_FORMAT.PDF,
      skipDownload: true,
    });

    const fileId = exportResult?.fileId;
    if (!fileId) {
      return {
        success: false,
        error: 'Failed to upload PDF to Smart Drive. Cannot create workflow without the file.',
      };
    }

    const className = lang === 'ar'
      ? cls.nameAr || cls.nameEn || cls.code
      : cls.nameEn || cls.nameAr || cls.code;

    const workflowResult = await createCustomWorkflowDocument({
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'DAILY',
      title: `Daily Attendance - ${className} - ${date}`,
      description: `Daily attendance workflow for ${className} on ${date}`,
      attachFile: true,
      fileId,
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
