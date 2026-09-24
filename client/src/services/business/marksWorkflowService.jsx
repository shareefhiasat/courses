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
import { buildReportFilename } from '@services/export/official-reports/engine/reportFilename.js';
import { notifyExportSuccess, withExportLoading } from '@services/export/official-reports/engine/exportToast.js';

const DEFAULT_DISTRIBUTION = {
  homework: 5,
  participation: 10,
  quizzes: 5,
  labsProjectResearch: 10,
  attendance: 10,
  midTermExam: 20,
  finalExam: 40,
};

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

export function exportClassMarksReport(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء كشف الدرجات...' : 'Generating marks sheet...',
    () => exportClassMarksReportImpl(params),
  );
}

async function exportClassMarksReportImpl({ cls, program, subject, academicTerm, lang = 'ar', user }) {
  const { reportData, metadata } = await buildClassReportData({ cls, program, subject, academicTerm, lang, user });

  const isAr = lang === 'ar';
  const filename = buildReportFilename({
    type: 'marks-sheet',
    programName: isAr ? metadata.programNameAr || metadata.programName : metadata.programName,
    className: isAr ? metadata.classNameAr || metadata.className : metadata.className,
    subjectName: isAr ? metadata.subjectNameAr || metadata.subjectName : metadata.subjectName,
    serial: reportData.serial,
    ext: 'pdf',
    lang,
  });

  const blob = await renderOfficialPdf(
    <ClassSubjectMarksTemplate data={reportData} showWatermark />,
    {
      filename,
      download: false,
      serial: reportData.serial,
      lang,
    }
  );

  notifyExportSuccess('marks-sheet', 'pdf', lang, blob, filename);
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
  filename,
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
      filename,
      download: false,
      serial: reportData.serial,
      lang: reportData.lang || 'ar',
    }
  );

  const persisted = await persistAndLogExport({
    blob,
    filename: filename.replace(/\.pdf$/i, ''),
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
      filename: buildReportFilename({
        type: 'semester-certificate',
        programName: lang === 'ar' ? metadata.programNameAr || metadata.programName : metadata.programName,
        serial: reportData.serial,
        ext: 'pdf',
        lang,
      }),
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
      filename: buildReportFilename({
        type: 'marks-sheet',
        programName: lang === 'ar' ? metadata.programNameAr || metadata.programName : metadata.programName,
        className: lang === 'ar' ? metadata.classNameAr || metadata.className : metadata.className,
        subjectName: lang === 'ar' ? metadata.subjectNameAr || metadata.subjectName : metadata.subjectName,
        serial: reportData.serial,
        ext: 'pdf',
        lang,
      }),
      exportType: 'marks_subject_sheet',
      user,
    });
  } catch (err) {
    console.error('[marksWorkflowService] marks sheet workflow error:', err);
    return { success: false, error: err.message, errorKey: 'workflow_initiation_error' };
  }
}
