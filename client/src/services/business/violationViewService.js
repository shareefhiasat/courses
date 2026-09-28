import {
  fetchAbsenceWarningCounts as fetchClassAbsenceWarningCounts,
  fetchAbsenceDeductionRules,
} from './attendanceDeductionService.js';
import { createWorkflowDocument } from '../api/workflow-documents-api.js';
import { prepareAttendanceWarningData, resolveWarningType } from '../export/official-reports/engine/prepareAttendanceWarningData.js';
import React from 'react';
import { AttendanceWarningTemplate } from '../export/official-reports/templates/attendanceWarning.template.jsx';
import { renderOfficialPdf } from '../export/official-reports/renderers/pdfRenderer.js';
import { exportAttendanceWarningExcel } from '../export/official-reports/renderers/excelRenderer.js';
import { getClassesByProgram } from './classService.js';
import { getClassById } from './classService.js';
import { apiService } from '../api/apiService.js';

export { resolveWarningType };

export async function loadProgramClasses(programId, params = {}) {
  if (!programId) return [];
  const res = await getClassesByProgram(programId, { ...params, limit: 1000 });
  return res?.data || res || [];
}

export async function loadClassDetails(classId) {
  if (!classId) return null;
  const res = await getClassById(classId);
  return res?.data || res || null;
}

export async function loadAbsenceDeductionRules() {
  const res = await fetchAbsenceDeductionRules();
  return res?.data || [];
}

/**
 * Fetch warning-eligible student data for a class/course with optional date range.
 */
export async function fetchClassViolationData({ classId, userId, dateFrom, dateTo }) {
  if (!classId) return { success: true, data: [] };

  const [res, totalsRes] = await Promise.all([
    fetchClassAbsenceWarningCounts({ classId, userId, dateFrom, dateTo }),
    fetchClassAbsenceWarningCounts({ classId, userId }),
  ]);
  const counts = res?.data || res?.payload || [];
  const totals = totalsRes?.data || totalsRes?.payload || [];

  const totalsById = new Map(totals.map((s) => [String(s.studentId), s]));

  const rulesRes = await fetchAbsenceDeductionRules();
  const rules = rulesRes?.data || [];

  const data = counts.map((student) => {
    const deductionApproved = Number(student.deductionApproved || 0);
    const deductionNotApproved = Number(student.deductionNotApproved || 0);
    const deductionTotal = Number(student.deductionTotal || (deductionApproved + deductionNotApproved));

    const totalStudent = totalsById.get(String(student.studentId)) || {};
    const warningType = resolveWarningType(totalStudent.totalAbsences, totalStudent.unexcusedAbsences);
    const classDeductionApproved = Number(totalStudent.deductionApproved || 0);
    const classDeductionNotApproved = Number(totalStudent.deductionNotApproved || 0);
    const classDeductionTotal = Number(totalStudent.deductionTotal || (classDeductionApproved + classDeductionNotApproved));

    return {
      ...student,
      warningType,
      deductionTotal: Number(deductionTotal.toFixed(2)),
      deductionApproved: Number(deductionApproved.toFixed(2)),
      deductionNotApproved: Number(deductionNotApproved.toFixed(2)),
      classTotalAbsences: totalStudent.totalAbsences || 0,
      classUnexcusedAbsences: totalStudent.unexcusedAbsences || 0,
      classExcusedAbsences: totalStudent.excusedAbsences || 0,
      classHumanCaseCount: totalStudent.humanCaseCount || 0,
      classDeductionApproved: Number(classDeductionApproved.toFixed(2)),
      classDeductionNotApproved: Number(classDeductionNotApproved.toFixed(2)),
      classDeductionTotal: Number(classDeductionTotal.toFixed(2)),
      classAbsences: Array.isArray(totalStudent.absences) ? totalStudent.absences : [],
    };
  });

  return { success: true, data };
}

function sanitize(str) {
  return str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '';
}

function buildWarningReportData(student, warningType, lang, metadata, { preview = false, workflowStatus, approvedBy, approvedAt } = {}) {
  const reportData = prepareAttendanceWarningData({
    students: [student],
    metadata,
    lang,
    warningType,
  });

  if (workflowStatus) {
    reportData.watermarkStatus = workflowStatus;
    reportData.approvedByUser = approvedBy || null;
    reportData.approvedAt = approvedAt || null;
  } else if (preview) {
    reportData.watermarkStatus = 'DRAFT';
    reportData.approvedByUser = null;
    reportData.approvedAt = null;
  }
  return reportData;
}

async function buildWarningReportBlob(student, warningType, lang, metadata, opts = {}) {
  const reportData = buildWarningReportData(student, warningType, lang, metadata, opts);

  return renderOfficialPdf(
    React.createElement(AttendanceWarningTemplate, { data: reportData, showWatermark: true }),
    {
      filename: `${reportData.serial}_warning_${sanitize(metadata.className)}.pdf`,
      download: false,
      serial: reportData.serial,
      lang,
    }
  );
}

export async function previewWarningLetter(student, warningType, lang, metadata) {
  const blob = await buildWarningReportBlob(student, warningType, lang, metadata, { preview: true });
  return URL.createObjectURL(blob);
}

/** Same warning letter as the PDF preview, rendered as an .xlsx workbook. */
export async function exportWarningLetterExcel(student, warningType, lang, metadata) {
  const reportData = buildWarningReportData(student, warningType, lang, metadata, { preview: true });
  const blob = await exportAttendanceWarningExcel(reportData);
  return { blob, filename: `${reportData.serial}_warning_${sanitize(metadata.className)}.xlsx` };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function initiateWarningWorkflow({ student, warningType, lang, metadata, user }) {
  const blob = await buildWarningReportBlob(student, warningType, lang, metadata, { preview: false });
  const base64 = await blobToBase64(blob);
  const isFinal = warningType === 'final';
  const isDismissed = warningType === 'dismissed';
  const title = isDismissed
    ? `Class Dismissal — ${student.studentName}`
    : isFinal
    ? `Final Warning — ${student.studentName}`
    : `First Warning — ${student.studentName}`;

  const workflowType = isDismissed
    ? 'ATTENDANCE_WARNING_DISMISSAL'
    : isFinal
    ? 'ATTENDANCE_WARNING_FINAL'
    : 'ATTENDANCE_WARNING_FIRST';

  const payload = {
    workflowType,
    title,
    description: title,
    classId: metadata.classId,
    date: metadata.date || new Date().toISOString().slice(0, 10),
    program: metadata.programName || '',
    subject: metadata.subjectName || '',
    fileData: base64,
    fileName: `${metadata.classCode || metadata.classId}_${isFinal ? 'final' : 'first'}_warning_${student.studentId}.pdf`,
    fileType: 'application/pdf',
    targetStudentId: student.studentId,
    metadata: {
      totalAbsences: student.totalAbsences,
      unexcusedAbsences: student.unexcusedAbsences,
      absences: student.classAbsences || student.absences || [],
      deductionTotal: student.deductionTotal,
      warningType,
      generatedBy: user?.id || null,
      studentName: student.studentName,
      studentNameAr: student.studentNameAr,
      studentNumber: student.studentNumber,
      rankEn: student.rankEn,
      rankAr: student.rankAr,
      programName: metadata.programName,
      programNameAr: metadata.programNameAr,
      subjectName: metadata.subjectName,
      subjectNameAr: metadata.subjectNameAr,
      className: metadata.className,
      classNameAr: metadata.classNameAr,
      classCode: metadata.classCode,
      term: metadata.term,
      date: metadata.date,
      classId: metadata.classId,
      targetStudentId: student.studentId,
    },
  };

  const result = await createWorkflowDocument(payload);
  return result;
}

export async function fetchWarningWorkflows({ classId, targetStudentId, workflowType, status }) {
  const params = new URLSearchParams();
  if (classId) params.append('classId', String(classId));
  if (targetStudentId) params.append('targetStudentId', String(targetStudentId));
  if (workflowType) params.append('workflowType', workflowType);
  if (status) params.append('status', status);
  return apiService.get(`/workflow-documents?${params.toString()}`);
}
