import React from 'react';
import { renderOfficialPdf } from '@services/export/official-reports/renderers/pdfRenderer.js';
import { SemesterCertificateTemplate } from '@services/export/official-reports/templates/semesterCertificate.template.jsx';
import { ClassSubjectMarksTemplate } from '@services/export/official-reports/templates/classSubjectMarks.template.jsx';
import { prepareSemesterCertificateData } from '@services/export/official-reports/engine/prepareSemesterCertificateData.js';
import { prepareClassSubjectMarksData } from '@services/export/official-reports/engine/prepareClassSubjectMarksData.js';
import { persistAndLogExport } from '@services/business/exportDriveService.js';
import { createCustomWorkflowDocument } from '@services/api/workflow-documents-api.js';
import { getAllStudentMarksReport, getSubjectMarksDistribution } from '@services/business/enrollmentMarksService.js';
import { academicTermToYearTerm } from '@utils/academicTermUtils.js';

const DEFAULT_DISTRIBUTION = {
  homework: 5,
  participation: 10,
  quizzes: 5,
  labsProjectResearch: 10,
  attendance: 10,
  midTermExam: 20,
  finalExam: 40,
};

function sanitizeFileName(name) {
  if (!name) return '';
  return String(name).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
}

async function loadMarksReportRows(filters) {
  const result = await getAllStudentMarksReport(filters);
  if (!result.success) {
    throw new Error(result.error || 'Failed to load marks report rows');
  }
  return result.data || [];
}

async function buildClassReportData({ cls, program, subject, academicTerm, lang, user }) {
  if (!cls?.id) throw new Error('Class is required');

  const { year, term } = academicTerm ? academicTermToYearTerm(academicTerm) : { year: '', term: '' };
  const rows = await loadMarksReportRows({
    classId: cls.id,
    subjectId: cls.subjectId,
    year,
    term,
    limit: 10000,
  });

  if (!rows.length) {
    throw new Error('No marks records found for this class and subject');
  }

  const distributionResult = cls.subjectId
    ? await getSubjectMarksDistribution(cls.subjectId)
    : null;
  const distribution = distributionResult?.success ? distributionResult.data : DEFAULT_DISTRIBUTION;

  const metadata = {
    programId: program?.id || cls.programId,
    programName: program?.nameEn || cls.program?.nameEn || '',
    programNameAr: program?.nameAr || cls.program?.nameAr || '',
    subjectId: cls.subjectId,
    subjectName: subject?.nameEn || cls.subject?.nameEn || '',
    subjectNameAr: subject?.nameAr || cls.subject?.nameAr || '',
    classId: cls.id,
    className: cls.nameEn || cls.code || '',
    classNameAr: cls.nameAr || cls.nameEn || cls.code || '',
    year,
    term,
    watermarkUser: user,
  };

  const reportData = prepareClassSubjectMarksData({
    reportRows: rows,
    distribution,
    metadata,
    lang,
  });

  return { reportData, distribution, metadata };
}

async function buildCertificateData({ program, academicTerm, lang, user }) {
  if (!program?.id) throw new Error('Program is required');

  const { year, term } = academicTerm ? academicTermToYearTerm(academicTerm) : { year: '', term: '' };
  const rows = await loadMarksReportRows({
    programId: program.id,
    year,
    term,
    limit: 10000,
  });

  if (!rows.length) {
    throw new Error('No marks records found for this program and term');
  }

  const metadata = {
    programId: program.id,
    programName: program.nameEn || '',
    programNameAr: program.nameAr || program.nameEn || '',
    year,
    term,
    watermarkUser: user,
  };

  const reportData = prepareSemesterCertificateData({
    reportRows: rows,
    metadata,
    lang,
  });

  return { reportData, metadata };
}

export async function exportClassMarksReport({ cls, program, subject, academicTerm, lang = 'ar', user }) {
  const { reportData } = await buildClassReportData({ cls, program, subject, academicTerm, lang, user });

  const blob = await renderOfficialPdf(
    <ClassSubjectMarksTemplate data={reportData} showWatermark />,
    {
      filename: `${sanitizeFileName(reportData.title)}_${reportData.serial}.pdf`,
      download: true,
      serial: reportData.serial,
      lang,
    }
  );

  return { success: true, blob, reportData };
}

async function uploadAndInitiateWorkflow({
  reportData,
  reportType,
  workflowType,
  title,
  description,
  program,
  academicTerm,
  fileNamePrefix,
  exportType,
  user,
}) {
  const { year, term } = academicTerm ? academicTermToYearTerm(academicTerm) : { year: '', term: '' };
  const blob = await renderOfficialPdf(
    reportType === 'CERTIFICATE' ? (
      <SemesterCertificateTemplate data={reportData} showWatermark />
    ) : (
      <ClassSubjectMarksTemplate data={reportData} showWatermark />
    ),
    {
      filename: `${sanitizeFileName(fileNamePrefix)}_${reportData.serial}.pdf`,
      download: false,
      serial: reportData.serial,
      lang: reportData.lang || 'ar',
    }
  );

  const persisted = await persistAndLogExport({
    blob,
    filename: `${sanitizeFileName(fileNamePrefix)}_${reportData.serial}`,
    mimeType: 'application/pdf',
    format: 'PDF',
    exportType,
    programId: program?.id,
    classId: reportData.meta?.classId,
  });

  if (!persisted.fileId) {
    throw new Error('Failed to upload report to Smart Drive');
  }

  const workflowResult = await createCustomWorkflowDocument({
    workflowType,
    workflowCategory: 'GENERAL',
    title,
    description,
    attachFile: true,
    fileId: persisted.fileId,
    program: String(program?.id || ''),
    dateFrom: academicTerm?.startDate || null,
    dateTo: academicTerm?.endDate || null,
    metadata: {
      academicTermId: academicTerm?.id,
      programId: program?.id,
      year,
      term,
      marksReportType: reportType,
      fileName: persisted.filename,
    },
  });

  if (!workflowResult.success) {
    const errorKey = workflowResult.code === 409 ? 'workflow_error_exists' : 'workflow_error_create';
    throw new Error(workflowResult.error || `Failed to create ${reportType} workflow`);
  }

  return {
    success: true,
    document: workflowResult.data?.document || workflowResult.data,
    fileId: persisted.fileId,
    reportData,
  };
}

export async function initiateMarksCertificateWorkflow({ program, academicTerm, lang = 'ar', user }) {
  try {
    const { reportData, metadata } = await buildCertificateData({ program, academicTerm, lang, user });

    const periodLabel = reportData.title || `${metadata.year || ''} ${metadata.term || ''}`.trim();
    const title = lang === 'ar'
      ? `شهادة الفصل - ${metadata.programNameAr || metadata.programName} - ${periodLabel}`
      : `Semester Certificate - ${metadata.programName || metadata.programNameAr} - ${periodLabel}`;
    const description = lang === 'ar'
      ? `سير عمل اعتماد شهادة الفصل للبرنامج ${metadata.programNameAr || metadata.programName}`
      : `Semester certificate approval workflow for ${metadata.programName || metadata.programNameAr}`;

    return await uploadAndInitiateWorkflow({
      reportData,
      reportType: 'CERTIFICATE',
      workflowType: 'MARKS_CERTIFICATE',
      title,
      description,
      program,
      academicTerm,
      fileNamePrefix: `semester_certificate_${reportData.serial}`,
      exportType: 'marks_semester_certificate',
      user,
    });
  } catch (err) {
    console.error('[marksWorkflowService] certificate workflow error:', err);
    return { success: false, error: err.message, errorKey: 'workflow_initiation_error' };
  }
}

export async function initiateMarksSheetWorkflow({ cls, program, subject, academicTerm, lang = 'ar', user }) {
  try {
    const { reportData, metadata } = await buildClassReportData({ cls, program, subject, academicTerm, lang, user });

    const title = lang === 'ar'
      ? `كشف درجات المادة - ${metadata.subjectNameAr || metadata.subjectName} - ${metadata.classNameAr || metadata.className}`
      : `Subject Marks Sheet - ${metadata.subjectName || metadata.subjectNameAr} - ${metadata.className || metadata.classNameAr}`;
    const description = lang === 'ar'
      ? `سير عمل اعتماد كشف درجات المادة ${metadata.subjectNameAr || metadata.subjectName} للحلقة ${metadata.classNameAr || metadata.className}`
      : `Marks sheet approval workflow for ${metadata.subjectName || metadata.subjectNameAr} - ${metadata.className || metadata.classNameAr}`;

    return await uploadAndInitiateWorkflow({
      reportData,
      reportType: 'MARKS_SHEET',
      workflowType: 'MARKS_SHEET',
      title,
      description,
      program,
      academicTerm,
      fileNamePrefix: `subject_marks_sheet_${reportData.serial}`,
      exportType: 'marks_subject_sheet',
      user,
    });
  } catch (err) {
    console.error('[marksWorkflowService] marks sheet workflow error:', err);
    return { success: false, error: err.message, errorKey: 'workflow_initiation_error' };
  }
}
