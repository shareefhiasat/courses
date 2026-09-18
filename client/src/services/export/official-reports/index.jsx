import React from 'react';
import { DailyOfficialTemplate } from './templates/dailyOfficial.template.jsx';
import { AttendanceOfficialTemplate } from './templates/attendanceOfficial.template.jsx';
import { SemesterCertificateTemplate } from './templates/semesterCertificate.template.jsx';
import { ClassSubjectMarksTemplate } from './templates/classSubjectMarks.template.jsx';
import { QualitativeCardTemplate } from './templates/qualitativeCard.template.jsx';
import { AttendanceWarningTemplate } from './templates/attendanceWarning.template.jsx';
import { WeeklyScheduleTemplate } from './templates/weeklySchedule.template.jsx';
import { renderOfficialPdf, downloadBlob } from './renderers/pdfRenderer.js';
import {
  exportDailyOfficialExcel,
  exportAttendanceOfficialExcel,
  exportSemesterCertificateExcel,
  exportClassSubjectMarksExcel,
  exportQualitativeCardExcel,
  exportAttendanceWarningExcel,
  exportWeeklyScheduleExcel,
} from './renderers/excelRenderer.js';
import { EXPORT_FORMAT } from '@constants/exportConfig.js';

export { EXPORT_FORMAT };
export { downloadBlob } from './renderers/pdfRenderer.js';

function startExportLoading(message) {
  let stopped = false;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('export-loading-start', { detail: { message } }));
  }
  return () => {
    if (stopped) return;
    stopped = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('export-loading-end', { detail: { message } }));
    }
  };
}

export async function exportDailyOfficialReport(data, { format = EXPORT_FORMAT.PDF, filename, download = true } = {}) {
  const stopLoading = startExportLoading('Generating daily report...');
  try {
  const baseName = filename || `daily_official_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportDailyOfficialExcel(data);
    if (download) downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <DailyOfficialTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download, serial: data.serial, lang: data.lang }
    );
  } finally {
    stopLoading();
  }
}

export async function exportAttendanceOfficialReport(data, { format = EXPORT_FORMAT.PDF, filename, download = true } = {}) {
  const stopLoading = startExportLoading('Generating attendance report...');
  try {
  const baseName = filename || `attendance_official_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportAttendanceOfficialExcel(data);
    if (download) downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <AttendanceOfficialTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download, serial: data.serial, lang: data.lang }
    );
  } finally {
    stopLoading();
  }
}

export async function exportSemesterCertificateReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const stopLoading = startExportLoading('Generating semester certificate...');
  try {
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
  } finally {
    stopLoading();
  }
}

export async function exportClassSubjectMarksReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const stopLoading = startExportLoading('Generating marks report...');
  try {
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
  } finally {
    stopLoading();
  }
}

export async function exportQualitativeCardReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const stopLoading = startExportLoading('Generating qualitative card...');
  try {
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
  } finally {
    stopLoading();
  }
}

export async function exportAttendanceWarningReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const stopLoading = startExportLoading('Generating attendance warning...');
  try {
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
  } finally {
    stopLoading();
  }
}

export async function exportWeeklyScheduleReport(data, { format = EXPORT_FORMAT.PDF, filename, download = true } = {}) {
  const stopLoading = startExportLoading('Generating weekly schedule...');
  try {
  const baseName = filename || `weekly_schedule_${data.serial}`;
  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportWeeklyScheduleExcel(data);
    if (download) downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }
  return renderOfficialPdf(
    <WeeklyScheduleTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download, serial: data.serial, lang: data.lang }
    );
  } finally {
    stopLoading();
  }
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
export { prepareWeeklyScheduleData } from './engine/prepareWeeklyScheduleData.js';
export { buildDailyOfficialSerial, buildViolationsOfficialSerial } from './engine/serialNumber.js';
