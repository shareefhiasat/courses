import React from 'react';
import { prepareAttendanceWarningData } from '../export/official-reports/engine/prepareAttendanceWarningData.js';
import { AttendanceWarningTemplate } from '../export/official-reports/templates/attendanceWarning.template.jsx';
import { renderOfficialPdf } from '../export/official-reports/renderers/pdfRenderer.js';
import { fetchAbsenceWarningCounts } from './attendanceDeductionService.js';

function sanitize(str) {
  return str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '';
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function resolveWarningTypeFromSubtype(subtype, metadata) {
  if (metadata?.warningType) return metadata.warningType;
  if (subtype === 'WARNING_FIRST') return 'first';
  if (subtype === 'WARNING_FINAL') return 'final';
  return 'first';
}

/**
 * Generate an APPROVED or REJECTED watermarked warning PDF for a workflow approval action.
 * Returns { fileData, fileName, fileType } to be sent with approve/reject API calls.
 */
export async function buildWarningActionFile(document, user, lang, status) {
  if (!document) throw new Error('Document is required');

  const metadata = document.metadata || {};
  const warningType = resolveWarningTypeFromSubtype(document.attendanceSubtype, metadata);
  const isFinal = warningType === 'final';

  let classAbsences = Array.isArray(metadata.absences) ? metadata.absences : [];
  if (classAbsences.length === 0 && document.classId && document.targetStudentId) {
    try {
      const res = await fetchAbsenceWarningCounts({ classId: document.classId, userId: document.targetStudentId });
      const rows = res?.data || res?.payload || [];
      classAbsences = rows.find((r) => String(r.studentId) === String(document.targetStudentId))?.absences || [];
    } catch {
      classAbsences = [];
    }
  }

  const student = {
    studentId: document.targetStudentId,
    studentNumber: metadata.studentNumber || '',
    studentName: metadata.studentName || '',
    studentNameAr: metadata.studentNameAr || '',
    rankEn: metadata.rankEn || '',
    rankAr: metadata.rankAr || '',
    totalAbsences: metadata.totalAbsences ?? 0,
    unexcusedAbsences: metadata.unexcusedAbsences ?? 0,
    classAbsences,
  };

  const reportMetadata = {
    classId: document.classId,
    className: metadata.className || document.class?.nameEn || '',
    classNameAr: metadata.classNameAr || document.class?.nameAr || document.class?.nameEn || '',
    classCode: metadata.classCode || document.class?.code || '',
    programName: metadata.programName || document.program || '',
    programNameAr: metadata.programNameAr || document.program || '',
    subjectName: metadata.subjectName || document.subject || '',
    subjectNameAr: metadata.subjectNameAr || document.subject || '',
    term: metadata.term,
    date: metadata.date || document.date,
  };

  const reportData = prepareAttendanceWarningData({
    students: [student],
    metadata: reportMetadata,
    lang,
    warningType,
  });

  reportData.watermarkStatus = status;
  reportData.approvedByUser = user || null;
  reportData.approvedAt = new Date().toISOString();

  const statusLabel = String(status).toLowerCase();
  const filename = `${reportData.serial}_${statusLabel}_warning_${sanitize(reportMetadata.classCode)}_${document.targetStudentId || 'all'}.pdf`;

  const blob = await renderOfficialPdf(
    React.createElement(AttendanceWarningTemplate, { data: reportData, showWatermark: true }),
    {
      filename,
      download: false,
      serial: reportData.serial,
      lang,
    }
  );

  const base64 = await blobToBase64(blob);
  return {
    fileData: base64,
    fileName: filename,
    fileType: 'application/pdf',
  };
}
