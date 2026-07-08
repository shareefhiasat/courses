import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportDailyOfficialForDate,
} from '@services/business/accessScopeExportService.js';
import { createCustomWorkflowDocument } from '@services/api/workflow-documents-api.js';

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
      dateFrom: date,
      program: program?.code || String(cls.programId || ''),
      subject: subject?.code || String(cls.subjectId || ''),
    }).catch((err) => {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 409) {
        return {
          success: false,
          code: 409,
          error: data?.error || 'A workflow already exists for this scope',
          existingDraft: data?.existingDraft || null,
          existingDocument: data?.existingWorkflow || null,
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
