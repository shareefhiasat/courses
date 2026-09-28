import React from 'react';
import { fetchAttendanceDeductionSuggestion, fetchAbsenceWarningCounts } from './attendanceDeductionService.js';
import { getEnrollmentsByStudent } from './enrollmentService.js';
import { prepareStudentSummaryData } from '../export/official-reports/engine/prepareStudentSummaryData.js';
import { prepareClassSummaryData } from '../export/official-reports/engine/prepareClassSummaryData.js';
import { StudentSummaryTemplate } from '../export/official-reports/templates/studentSummary.template.jsx';
import { ClassSummaryTemplate } from '../export/official-reports/templates/classSummary.template.jsx';
import { renderOfficialPdf, downloadBlob } from '../export/official-reports/renderers/pdfRenderer.js';
import { exportStudentSummaryExcel, exportClassSummaryExcel, exportProgramSummaryExcel, exportClassDeductionExcel } from '../export/official-reports/renderers/excelRenderer.js';
import { getLocalizedTermDisplay } from '@constants/gradingStandards';
import { getAcademicTermDisplayName } from '@utils/academicTermUtils';
import { buildReportFilename } from '../export/official-reports/engine/reportFilename.js';
import { notifyExportSuccess, withExportLoading } from '../export/official-reports/engine/exportToast.js';
import { persistAndLogExport, mimeTypeForFormat } from './exportDriveService.js';

/**
 * Term may be a string ('fall') or an academicTerm object — resolve to a label.
 */
function resolveTermLabel(term, lang) {
  if (!term) return '';
  if (typeof term === 'object') return getAcademicTermDisplayName(term, lang);
  return getLocalizedTermDisplay(term, lang);
}

/**
 * Persist an exported report blob to Smart Drive and log it to export history
 * so it shows up in the class "Documents" tab. Best-effort — never throws.
 */
async function persistReport({ blob, filename, format, exportType, classId, subjectId, programId, reportDate }) {
  try {
    const result = await persistAndLogExport({
      blob,
      filename,
      mimeType: mimeTypeForFormat(format === 'excel' ? 'excel' : 'pdf'),
      format,
      exportType,
      classId: classId || undefined,
      subjectId: subjectId || undefined,
      programId: programId || undefined,
      reportDate: reportDate || new Date().toISOString().slice(0, 10),
    });
    return result?.fileId || null;
  } catch (err) {
    console.warn('[studentSummaryReportService] export history log failed:', err);
    return null;
  }
}

function resolveEnrollmentClass(enrollment) {
  const cls = enrollment?.class || enrollment?.classInfo || {};
  return {
    classId: enrollment?.classId || cls.id,
    className: cls.nameEn || cls.name || enrollment?.className || '',
    classNameAr: cls.nameAr || '',
    subjectName: cls.subject?.nameEn || cls.subjectName || '',
    subjectNameAr: cls.subject?.nameAr || '',
    programName: cls.program?.nameEn || enrollment?.programName || '',
    programNameAr: cls.program?.nameAr || '',
  };
}

/**
 * Export the student attendance summary report.
 * scope 'class' → absences for one class; scope 'all' → all enrolled classes.
 */
export function exportStudentSummaryReport(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء تقرير ملخص الطالب...' : 'Generating student summary report...',
    () => exportStudentSummaryReportImpl(params),
  );
}

async function exportStudentSummaryReportImpl({
  student,
  classId,
  scope = 'class',
  format = 'pdf',
  lang = 'en',
  user = null,
  metadata = {},
  download = false,
  notify = true,
}) {
  const studentId = student?.studentId || student?.userId || student?.id;
  if (!studentId) throw new Error('Missing student id');

  let sections = [];
  if (scope === 'all') {
    const enrollmentsRes = await getEnrollmentsByStudent(studentId);
    const enrollments = enrollmentsRes?.data || enrollmentsRes?.enrollments || [];
    const results = await Promise.all(
      enrollments
        .map((e) => resolveEnrollmentClass(e))
        .filter((c) => c.classId)
        .map(async (cls) => {
          try {
            const res = await fetchAttendanceDeductionSuggestion({ userId: studentId, classId: cls.classId });
            return { ...cls, rows: res?.data?.rows || res?.rows || [] };
          } catch {
            return { ...cls, rows: [] };
          }
        }),
    );
    sections = results;
  } else {
    const res = await fetchAttendanceDeductionSuggestion({ userId: studentId, classId });
    sections = [{
      classId,
      className: metadata.className || '',
      classNameAr: metadata.classNameAr || '',
      subjectName: metadata.subjectName || '',
      subjectNameAr: metadata.subjectNameAr || '',
      programName: metadata.programName || '',
      programNameAr: metadata.programNameAr || '',
      rows: res?.data?.rows || res?.rows || [],
    }];
  }

  // Enrich the student record with rank/number when the caller didn't provide them.
  let enrichedStudent = student;
  if (!student?.rankEn && !student?.rankAr) {
    const lookupClassId = scope === 'all' ? sections[0]?.classId : classId;
    if (lookupClassId) {
      try {
        const countsRes = await fetchAbsenceWarningCounts({ classId: lookupClassId, userId: studentId });
        const row = (countsRes?.data || countsRes || [])?.[0];
        if (row) {
          enrichedStudent = {
            ...student,
            rankEn: row.rankEn || '',
            rankAr: row.rankAr || '',
            studentNumber: student?.studentNumber || row.studentNumber || '',
          };
        }
      } catch { /* rank stays blank */ }
    }
  }

  const data = prepareStudentSummaryData({
    student: enrichedStudent,
    sections,
    metadata: { scope, watermarkUser: user },
    lang,
  });

  const isAr = lang === 'ar';
  const firstSection = sections[0] || {};
  const filename = buildReportFilename({
    type: 'student-attendance',
    programName: isAr ? firstSection.programNameAr || firstSection.programName : firstSection.programName,
    className: scope === 'all' ? '' : (isAr ? firstSection.classNameAr || firstSection.className : firstSection.className),
    subjectName: scope === 'all' ? '' : (isAr ? firstSection.subjectNameAr || firstSection.subjectName : firstSection.subjectName),
    studentName: isAr
      ? enrichedStudent?.studentNameAr || enrichedStudent?.displayNameAr || enrichedStudent?.studentName
      : enrichedStudent?.studentName || enrichedStudent?.displayName || enrichedStudent?.nameEn,
    studentNumber: enrichedStudent?.studentNumber,
    scope,
    ext: format === 'excel' ? 'xlsx' : 'pdf',
    lang,
  });

  if (format === 'excel') {
    const blob = await exportStudentSummaryExcel(data);
    if (download) downloadBlob(blob, filename);
    if (notify) notifyExportSuccess('student', format, lang, blob, filename);
    return { blob, filename };
  }
  const blob = await renderOfficialPdf(
    React.createElement(StudentSummaryTemplate, { data }),
    { filename, lang, download },
  );
  if (notify) notifyExportSuccess('student', format, lang, blob, filename);
  return { blob, filename };
}

/**
 * Export the class attendance summary report (semester-level, all students).
 */
export function exportClassSummaryReport(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء تقرير ملخص الشعبة...' : 'Generating class summary report...',
    () => exportClassSummaryReportImpl(params),
  );
}

async function exportClassSummaryReportImpl({
  classId,
  classInfo = {},
  format = 'pdf',
  lang = 'en',
  user = null,
  download = false,
  notify = true,
  colorize = true,
  reportDate,
}) {
  if (!classId) throw new Error('Missing class id');
  const res = await fetchAbsenceWarningCounts({ classId });
  const students = res?.data?.students || res?.students || res?.data || [];

  const data = prepareClassSummaryData({
    classInfo: {
      classId,
      ...classInfo,
      term: resolveTermLabel(classInfo.term, lang),
    },
    students: Array.isArray(students) ? students : [],
    metadata: { watermarkUser: user },
    lang,
    colorize,
  });

  const filename = buildReportFilename({
    type: 'class-summary',
    programName: lang === 'ar' ? classInfo.programNameAr || classInfo.programName : classInfo.programName,
    className: lang === 'ar' ? classInfo.classNameAr || classInfo.className : classInfo.className,
    subjectName: lang === 'ar' ? classInfo.subjectNameAr || classInfo.subjectName : classInfo.subjectName,
    ext: format === 'excel' ? 'xlsx' : 'pdf',
    lang,
  });

  const persistFields = {
    format,
    exportType: 'class_summary_report',
    classId,
    subjectId: classInfo.subjectId || classInfo.subject?.id,
    programId: classInfo.programId || classInfo.program?.id,
    reportDate,
  };

  if (format === 'excel') {
    const blob = await exportClassSummaryExcel(data);
    if (download) downloadBlob(blob, filename);
    const fileId = await persistReport({ ...persistFields, blob, filename });
    if (notify) notifyExportSuccess('class', format, lang, blob, filename, fileId);
    return { blob, filename, fileId };
  }
  const blob = await renderOfficialPdf(
    React.createElement(ClassSummaryTemplate, { data }),
    { filename, lang, download },
  );
  const fileId = await persistReport({ ...persistFields, blob, filename });
  if (notify) notifyExportSuccess('class', format, lang, blob, filename, fileId);
  return { blob, filename, fileId };
}

/**
 * Export a class-level deduction report: one student attendance summary
 * (absence dates + deductions) per enrolled student.
 * PDF → one page per student; Excel → one worksheet per student.
 */
export function exportClassDeductionReport(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء تقرير خصومات الشعبة...' : 'Generating class deduction report...',
    () => exportClassDeductionReportImpl(params),
  );
}

async function exportClassDeductionReportImpl({
  classId,
  classInfo = {},
  format = 'pdf',
  lang = 'en',
  user = null,
  download = false,
  notify = true,
  reportDate,
}) {
  if (!classId) throw new Error('Missing class id');
  const res = await fetchAbsenceWarningCounts({ classId });
  const students = res?.data?.students || res?.students || res?.data || [];
  const list = Array.isArray(students) ? students : [];

  const dataList = await Promise.all(
    list.map(async (s) => {
      const studentId = s.studentId || s.userId || s.id;
      let rows = [];
      try {
        const r = await fetchAttendanceDeductionSuggestion({ userId: studentId, classId });
        rows = r?.data?.rows || r?.rows || [];
      } catch { /* keep empty */ }
      return prepareStudentSummaryData({
        student: {
          studentId,
          studentNumber: s.studentNumber,
          studentName: s.studentName,
          studentNameAr: s.studentNameAr,
          rankEn: s.rankEn,
          rankAr: s.rankAr,
        },
        sections: [{
          classId,
          className: classInfo.className || '',
          classNameAr: classInfo.classNameAr || '',
          subjectName: classInfo.subjectName || s.subjectName || '',
          subjectNameAr: classInfo.subjectNameAr || s.subjectNameAr || '',
          programName: classInfo.programName || s.programName || '',
          programNameAr: classInfo.programNameAr || s.programNameAr || '',
          rows,
        }],
        metadata: { scope: 'class', watermarkUser: user },
        lang,
      });
    }),
  );

  const filename = buildReportFilename({
    type: 'deduction-report',
    programName: lang === 'ar'
      ? classInfo.programNameAr || list[0]?.programNameAr || classInfo.programName
      : classInfo.programName || list[0]?.programName,
    className: lang === 'ar' ? classInfo.classNameAr || classInfo.className : classInfo.className,
    subjectName: lang === 'ar'
      ? classInfo.subjectNameAr || list[0]?.subjectNameAr || classInfo.subjectName
      : classInfo.subjectName || list[0]?.subjectName,
    ext: format === 'excel' ? 'xlsx' : 'pdf',
    lang,
  });

  const persistFields = {
    format,
    exportType: 'class_deduction_report',
    classId,
    subjectId: classInfo.subjectId || classInfo.subject?.id,
    programId: classInfo.programId || classInfo.program?.id,
    reportDate,
  };

  if (format === 'excel') {
    const blob = await exportClassDeductionExcel(dataList);
    if (download) downloadBlob(blob, filename);
    const fileId = await persistReport({ ...persistFields, blob, filename });
    if (notify) notifyExportSuccess('deduction', format, lang, blob, filename, fileId);
    return { blob, filename, fileId };
  }
  const blob = await renderOfficialPdf(
    React.createElement(React.Fragment, null,
      dataList.map((data) => React.createElement(StudentSummaryTemplate, { key: data.serial, data })),
    ),
    { filename, lang, download },
  );
  const fileId = await persistReport({ ...persistFields, blob, filename });
  if (notify) notifyExportSuccess('deduction', format, lang, blob, filename, fileId);
  return { blob, filename, fileId };
}

/**
 * Export a program-level attendance summary: one class summary section per class.
 * PDF → each class on its own page; Excel → one worksheet per class.
 * @param {Array} classes - class objects (id, nameEn, nameAr, subject, program, term)
 */
export function exportProgramSummaryReport(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء تقرير ملخص البرنامج...' : 'Generating program summary report...',
    () => exportProgramSummaryReportImpl(params),
  );
}

async function exportProgramSummaryReportImpl({
  programId,
  programName = '',
  programNameAr = '',
  classes = [],
  format = 'pdf',
  lang = 'en',
  user = null,
  academicTerm = null,
  download = false,
  notify = true,
  reportDate,
}) {
  const dataList = await Promise.all(
    classes.map(async (cls, idx) => {
      const classId = cls.id || cls.classId;
      let students = [];
      try {
        const res = await fetchAbsenceWarningCounts({ classId });
        students = res?.data || res || [];
      } catch { /* keep empty */ }
      return prepareClassSummaryData({
        classInfo: {
          classId,
          className: `${idx + 1}. ${cls.nameEn || cls.name || ''}`,
          classNameAr: cls.nameAr || '',
          subjectName: cls.subject?.nameEn || cls.subjectName || '',
          subjectNameAr: cls.subject?.nameAr || cls.subjectNameAr || '',
          programName: cls.program?.nameEn || programName || '',
          programNameAr: cls.program?.nameAr || '',
          term: resolveTermLabel(academicTerm || cls.term, lang),
        },
        students: Array.isArray(students) ? students : [],
        metadata: { watermarkUser: user },
        lang,
      });
    }),
  );

  const filename = buildReportFilename({
    type: 'program-summary',
    programName: lang === 'ar'
      ? programNameAr || classes[0]?.program?.nameAr || programName
      : programName,
    ext: format === 'excel' ? 'xlsx' : 'pdf',
    lang,
  });

  const persistFields = {
    format,
    exportType: 'program_summary_report',
    programId,
    reportDate,
  };

  if (format === 'excel') {
    const blob = await exportProgramSummaryExcel(dataList);
    if (download) downloadBlob(blob, filename);
    const fileId = await persistReport({ ...persistFields, blob, filename });
    if (notify) notifyExportSuccess('program', format, lang, blob, filename, fileId);
    return { blob, filename, fileId };
  }
  const blob = await renderOfficialPdf(
    React.createElement(React.Fragment, null,
      dataList.map((data) => React.createElement(ClassSummaryTemplate, { key: data.classId || data.serial, data })),
    ),
    { filename, lang, download },
  );
  const fileId = await persistReport({ ...persistFields, blob, filename });
  if (notify) notifyExportSuccess('program', format, lang, blob, filename, fileId);
  return { blob, filename, fileId };
}
