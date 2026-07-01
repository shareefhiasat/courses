import ExcelJS from 'exceljs';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';

const STATUS_LABELS = {
  ar: { present: 'متواجد', absent: 'غائب', humanCase: 'حالة إنسانية', late: 'متأخر' },
  en: { present: 'Present', absent: 'Absent', humanCase: 'Human case', late: 'Late' },
};

const COLUMN_LABELS = {
  ar: { serial: 'ت', name: 'اسم الطالب', number: 'الرقم العسكري', notes: 'ملاحظات' },
  en: { serial: '#', name: 'Student Name', number: 'Military No.', notes: 'Notes' },
};

const META_LABELS = {
  ar: {
    date: 'التاريخ',
    serial: 'الرقم التسلسلي',
    program: 'البرنامج',
    subject: 'المادة',
    class: 'الفصل',
    instructor: 'المدرب',
    yearTerm: 'السنة / الفصل الدراسي',
    generated: 'تاريخ الإصدار',
    issue: 'إصدار',
  },
  en: {
    date: 'Date',
    serial: 'Serial',
    program: 'Program',
    subject: 'Subject',
    class: 'Class',
    instructor: 'Instructor',
    yearTerm: 'Year / Term',
    generated: 'Generated',
    issue: 'Issue',
  },
};

const HEADER_BLOCK_ROWS = 3;

function applyThinBorders(cell) {
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
}

function setupA4Worksheet(worksheet, rtl = true) {
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
  worksheet.views = [{ rightToLeft: rtl }];
}

function labelValueRichText(label, value, size = 11) {
  return {
    richText: [
      { text: `${label}: `, font: { bold: true, size } },
      { text: String(value ?? ''), font: { bold: false, size } },
    ],
  };
}

function labelValueRichTextMirrored(label, value, size = 11) {
  return {
    richText: [
      { text: String(value ?? ''), font: { bold: false, size } },
      { text: ' : ', font: { bold: false, size } },
      { text: String(label ?? ''), font: { bold: true, size } },
    ],
  };
}

function writeMetaRow(ws, row, leftLabel, leftValue, rightLabel, rightValue, options = {}) {
  const { mirrorRight = true } = options;
  const leftStart = 'A';
  const leftEnd = 'C';
  const rightStart = 'F';
  const rightEnd = 'H';

  const leftCell = ws.getCell(`${leftStart}${row}`);
  leftCell.value = labelValueRichText(leftLabel, leftValue);
  leftCell.alignment = {
    horizontal: 'left',
    vertical: 'middle',
    wrapText: true,
  };
  ws.mergeCells(`${leftStart}${row}:${leftEnd}${row}`);

  if (rightLabel) {
    const rightCell = ws.getCell(`${rightStart}${row}`);
    rightCell.value = mirrorRight
      ? labelValueRichTextMirrored(rightLabel, rightValue)
      : labelValueRichText(rightLabel, rightValue);
    rightCell.alignment = {
      horizontal: 'right',
      vertical: 'middle',
      wrapText: true,
    };
    ws.mergeCells(`${rightStart}${row}:${rightEnd}${row}`);
  }
}

function writeBilingualHeaderBlock(ws, headerStartRow, colCount = 8) {
  const endRow = headerStartRow + HEADER_BLOCK_ROWS - 1;
  const lastCol = String.fromCharCode(64 + colCount); // H for 8, F for 6

  const enEndCol = colCount === 8 ? 'C' : 'B';
  const logoStart = colCount === 8 ? 'D' : 'C';
  const logoEnd = colCount === 8 ? 'E' : 'D';
  const arStart = colCount === 8 ? 'F' : 'E';
  const arEnd = lastCol;

  const enCell = ws.getCell(`A${headerStartRow}`);
  enCell.value = `${OFFICIAL_HEADER.ministryEn}\n${OFFICIAL_HEADER.corpsEn}`;
  enCell.font = { size: 10 };
  enCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ws.mergeCells(`A${headerStartRow}:${enEndCol}${endRow}`);

  ws.mergeCells(`${logoStart}${headerStartRow}:${logoEnd}${endRow}`);

  const arCell = ws.getCell(`${arStart}${headerStartRow}`);
  arCell.value = `${OFFICIAL_HEADER.ministryAr}\n${OFFICIAL_HEADER.corpsAr}`;
  arCell.font = { size: 10 };
  arCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  ws.mergeCells(`${arStart}${headerStartRow}:${arEnd}${endRow}`);

  for (let r = headerStartRow; r <= endRow; r += 1) {
    ws.getRow(r).height = 24;
  }

  return endRow;
}

async function tryAddLogo(workbook, worksheet, headerStartRow, colCount = 8) {
  try {
    const res = await fetch(OFFICIAL_HEADER.logoUrl);
    if (!res.ok) return;
    const buf = await res.arrayBuffer();
    const imageId = workbook.addImage({ buffer: buf, extension: 'png' });

    const logoCol =
      colCount === 8
        ? 3.35 // center of D–E
        : 2.35; // center of C–D

    worksheet.addImage(imageId, {
      tl: { col: logoCol, row: headerStartRow + 0.35 },
      ext: { width: 50, height: 50 },
    });
  } catch {
    /* logo optional */
  }
}

function addSpacerRows(ws, rowRef, count = 2) {
  let row = rowRef;
  for (let i = 0; i < count; i += 1) {
    ws.getRow(row).height = 10;
    row += 1;
  }
  return row;
}

/**
 * Daily Official Excel export (no watermark).
 */
export async function exportDailyOfficialExcel(data) {
  const lang = data.lang || 'ar';
  const isAr = lang === 'ar';
  const labels = COLUMN_LABELS[lang] || COLUMN_LABELS.ar;
  const statusLabels = STATUS_LABELS[lang] || STATUS_LABELS.ar;
  const metaLabels = META_LABELS[lang] || META_LABELS.ar;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Daily Official', { views: [{ rightToLeft: false }] });
  setupA4Worksheet(ws, false);

  let row = 1;

  ws.getCell(`A${row}`).value = `${metaLabels.serial}: ${data.serial}`;
  ws.getCell(`A${row}`).font = { size: 9, color: { argb: 'FF555555' } };
  ws.mergeCells(`A${row}:H${row}`);
  row += 1;

  const headerStartRow = row;
  const headerEndRow = writeBilingualHeaderBlock(ws, headerStartRow, 8);
  await tryAddLogo(workbook, ws, headerStartRow, 8);

  row = headerEndRow + 1;
  row = addSpacerRows(ws, row, 2);

  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = data.title;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(`A${row}:H${row}`);
  ws.getRow(row).height = 26;
  row += 1;

  const yearTerm = [data.header.year, data.header.term].filter(Boolean).join(' / ');
  const metaOpts = { mirrorRight: true };
  writeMetaRow(ws, row, metaLabels.date, data.header.date, metaLabels.serial, data.serial, metaOpts);
  row += 1;
  writeMetaRow(ws, row, metaLabels.program, data.header.program, metaLabels.subject, data.header.subject || '—', metaOpts);
  row += 1;
  writeMetaRow(ws, row, metaLabels.class, data.header.className || '—', metaLabels.instructor, data.header.instructor || '—', metaOpts);
  row += 1;
  if (yearTerm) {
    writeMetaRow(ws, row, metaLabels.yearTerm, yearTerm, null, null, metaOpts);
    row += 1;
  }
  row += 2;

  const headers = [
    labels.serial,
    labels.name,
    labels.number,
    ...data.statusKeys.map((k) => statusLabels[k]),
    labels.notes,
  ];
  const headerRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
    applyThinBorders(cell);
  });
  row += 1;

  data.rows.forEach((r) => {
    const dataRow = ws.getRow(row);
    const values = [
      r.serial,
      r.studentName,
      r.studentNumber,
      ...data.statusKeys.map((k) => (r[k] ? '✓' : '')),
      r.notes || '',
    ];
    values.forEach((v, i) => {
      const cell = dataRow.getCell(i + 1);
      cell.value = v;
      cell.alignment = {
        horizontal: i === 1 ? (isAr ? 'right' : 'left') : 'center',
        vertical: 'middle',
        wrapText: i === 1,
      };
      applyThinBorders(cell);
    });
    row += 1;
  });

  row += 1;
  const footerSerial = ws.getCell(`A${row}`);
  footerSerial.value = `${metaLabels.serial}: ${data.serial}`;
  footerSerial.font = { size: 9, color: { argb: 'FF555555' } };
  ws.mergeCells(`A${row}:H${row}`);
  row += 1;

  const genDateTime = new Date().toLocaleString(isAr ? 'ar-QA' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const footerGen = ws.getCell(`A${row}`);
  footerGen.value = `${metaLabels.generated}: ${genDateTime}`;
  footerGen.font = { size: 9, color: { argb: 'FF555555' } };
  footerGen.alignment = { horizontal: isAr ? 'right' : 'left' };
  ws.mergeCells(`A${row}:H${row}`);

  ws.columns = [
    { width: 5 },
    { width: 28 },
    { width: 14 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
    { width: 18 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Attendance Official Excel export with merged cells per date/student.
 */
export async function exportAttendanceOfficialExcel(data) {
  const lang = data.lang || 'ar';
  const isAr = lang === 'ar';
  const metaLabels = META_LABELS[lang] || META_LABELS.ar;
  const attLabels = isAr
    ? {
        serial: 'ت',
        name: 'اسم الطالب',
        violation: 'نوع المخالفة',
        subject: 'المادة',
        deduction: 'درجة الحسم',
        sign: 'التوقيع',
        officerSign: 'توقيع الضابط:',
      }
    : {
        serial: '#',
        name: 'Student Name',
        violation: 'Violation Type',
        subject: 'Subject',
        deduction: 'Deduction',
        sign: 'Signature',
        officerSign: "Officer's Signature:",
      };

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Attendance Official', { views: [{ rightToLeft: false }] });
  setupA4Worksheet(ws, false);

  let row = 1;

  ws.getCell(`A${row}`).value = `${metaLabels.serial}: ${data.serial}`;
  ws.getCell(`A${row}`).font = { size: 9, color: { argb: 'FF555555' } };
  ws.mergeCells(`A${row}:F${row}`);
  row += 1;

  const headerStartRow = row;
  const headerEndRow = writeBilingualHeaderBlock(ws, headerStartRow, 6);
  await tryAddLogo(workbook, ws, headerStartRow, 6);

  row = headerEndRow + 1;
  row = addSpacerRows(ws, row, 2);

  const titleCell = ws.getCell(`A${row}`);
  const periodLine =
    data.header.dateFrom && data.header.dateTo
      ? `${data.header.dateFrom} — ${data.header.dateTo}`
      : '';
  titleCell.value = periodLine ? `${data.title}\n${periodLine}` : data.title;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws.mergeCells(`A${row}:F${row}`);
  ws.getRow(row).height = periodLine ? 32 : 26;
  row += 1;

  const metaCell = ws.getCell(`A${row}`);
  metaCell.value = {
    richText: [
      { text: `${metaLabels.issue}: `, font: { bold: true, size: 11 } },
      { text: String(data.header.issueDate ?? ''), font: { bold: true, size: 11 } },
      { text: '   ', font: { size: 11 } },
      { text: String(data.header.program ?? ''), font: { bold: true, size: 11 } },
    ],
  };
  metaCell.alignment = { vertical: 'middle', wrapText: true };
  ws.mergeCells(`A${row}:F${row}`);
  row += 2;

  const headers = [attLabels.serial, attLabels.name, attLabels.violation, attLabels.subject, attLabels.deduction, attLabels.sign];
  const hRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0C4DE' } };
    applyThinBorders(cell);
  });
  row += 1;

  data.dateGroups.forEach((dg) => {
    const dateRow = ws.getRow(row);
    dateRow.getCell(1).value = dg.dateLabel;
    ws.mergeCells(`A${row}:F${row}`);
    dateRow.getCell(1).font = { bold: true, color: { argb: 'FFCC0000' } };
    dateRow.getCell(1).alignment = { horizontal: 'center' };
    applyThinBorders(dateRow.getCell(1));
    row += 1;

    dg.students.forEach((student) => {
      const startRow = row;
      const span = student.subjectRows.length || 1;

      student.subjectRows.forEach((sub, idx) => {
        const dr = ws.getRow(row);
        if (idx === 0) {
          dr.getCell(1).value = student.serial;
          dr.getCell(2).value = student.studentName;
          dr.getCell(3).value = student.violationType;
        }
        dr.getCell(4).value = sub.subjectName;
        dr.getCell(5).value = sub.deduction;
        dr.getCell(6).value = '';
        for (let c = 1; c <= 6; c++) applyThinBorders(dr.getCell(c));
        row += 1;
      });

      if (span > 1) {
        ws.mergeCells(`A${startRow}:A${startRow + span - 1}`);
        ws.mergeCells(`B${startRow}:B${startRow + span - 1}`);
        ws.mergeCells(`C${startRow}:C${startRow + span - 1}`);
      }
    });
  });

  row = addSpacerRows(ws, row, 4);
  const signLabelCell = ws.getCell(isAr ? `F${row}` : `A${row}`);
  signLabelCell.value = attLabels.officerSign;
  signLabelCell.font = { bold: true, size: 12 };
  signLabelCell.alignment = { horizontal: isAr ? 'right' : 'left' };
  row += 1;
  const signLineCell = ws.getCell(isAr ? `D${row}` : `A${row}`);
  signLineCell.value = '';
  signLineCell.border = { bottom: { style: 'medium', color: { argb: 'FF111111' } } };
  ws.mergeCells(isAr ? `D${row}:F${row}` : `A${row}:C${row}`);
  ws.getRow(row).height = 36;
  row += 2;
  ws.getCell(`A${row}`).value = `${metaLabels.serial}: ${data.serial}`;
  row += 1;
  ws.getCell(`A${row}`).value = `${metaLabels.generated}: ${new Date().toLocaleString(isAr ? 'ar-QA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })}`;

  ws.columns = [
    { width: 6 },
    { width: 26 },
    { width: 14 },
    { width: 28 },
    { width: 12 },
    { width: 20 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
