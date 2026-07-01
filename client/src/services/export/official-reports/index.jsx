import React from 'react';
import { DailyOfficialTemplate } from './templates/dailyOfficial.template.jsx';
import { AttendanceOfficialTemplate } from './templates/attendanceOfficial.template.jsx';
import { renderOfficialPdf, downloadBlob } from './renderers/pdfRenderer.js';
import {
  exportDailyOfficialExcel,
  exportAttendanceOfficialExcel,
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

  const blob = await renderOfficialPdf(
    <DailyOfficialTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
  return blob;
}

export async function exportAttendanceOfficialReport(data, { format = EXPORT_FORMAT.PDF, filename } = {}) {
  const baseName = filename || `attendance_official_${data.serial}`;

  if (format === EXPORT_FORMAT.EXCEL) {
    const blob = await exportAttendanceOfficialExcel(data);
    downloadBlob(blob, `${baseName}.xlsx`);
    return blob;
  }

  const blob = await renderOfficialPdf(
    <AttendanceOfficialTemplate data={data} showWatermark />,
    { filename: `${baseName}.pdf`, download: true, serial: data.serial, lang: data.lang }
  );
  return blob;
}

export { prepareDailyOfficialData } from './engine/prepareDailyOfficialData.js';
export { prepareAttendanceOfficialData } from './engine/prepareAttendanceOfficialData.js';
export { buildDailyOfficialSerial, buildViolationsOfficialSerial } from './engine/serialNumber.js';
