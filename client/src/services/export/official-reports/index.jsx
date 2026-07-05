import React from 'react';
import { DailyOfficialTemplate } from './templates/dailyOfficial.template.jsx';
import { AttendanceOfficialTemplate } from './templates/attendanceOfficial.template.jsx';
import { SemesterCertificateTemplate } from './templates/semesterCertificate.template.jsx';
import { ClassSubjectMarksTemplate } from './templates/classSubjectMarks.template.jsx';
import { QualitativeCardTemplate } from './templates/qualitativeCard.template.jsx';
import { AttendanceWarningTemplate } from './templates/attendanceWarning.template.jsx';
import { renderOfficialPdf, downloadBlob } from './renderers/pdfRenderer.js';
import {
  exportDailyOfficialExcel,
  exportAttendanceOfficialExcel,
  exportSemesterCertificateExcel,
  exportClassSubjectMarksExcel,
  exportQualitativeCardExcel,
  exportAttendanceWarningExcel,
} from './renderers/excelRenderer.js';

export const EXPORT_FORMAT = {
  PDF: 'pdf',
  EXCEL: 'excel',
};

export async function exportDailyOfficialReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const baseName = filename || `daily_official_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportDailyOfficialExcel(data);
    downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <DailyOfficialTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
}

export async function exportAttendanceOfficialReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const baseName = filename || `attendance_official_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportAttendanceOfficialExcel(data);
    downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <AttendanceOfficialTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
}

export async function exportSemesterCertificateReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const baseName = filename || `semester_certificate_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportSemesterCertificateExcel(data);
    downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <SemesterCertificateTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
}

export async function exportClassSubjectMarksReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const baseName = filename || `class_subject_marks_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportClassSubjectMarksExcel(data);
    downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <ClassSubjectMarksTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
}

export async function exportQualitativeCardReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const baseName = filename || `qualitative_card_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportQualitativeCardExcel(data);
    downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <QualitativeCardTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
}

export async function exportAttendanceWarningReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const baseName = filename || `attendance_warning_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportAttendanceWarningExcel(data);
    downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <AttendanceWarningTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
}

export { prepareDailyOfficialData } from './engine/prepareDailyOfficialData.js';
export { prepareAttendanceOfficialData } from './engine/prepareAttendanceOfficialData.js';
export { prepareSemesterCertificateData } from './engine/prepareSemesterCertificateData.js';
export { prepareClassSubjectMarksData } from './engine/prepareClassSubjectMarksData.js';
export { prepareQualitativeCardData } from './engine/prepareQualitativeCardData.js';
export {
  prepareAttendanceWarningData,
  resolveWarningType,
  WARNING_TYPE,
} from './engine/prepareAttendanceWarningData.js';
export { buildDailyOfficialSerial, buildViolationsOfficialSerial } from './engine/serialNumber.js';
