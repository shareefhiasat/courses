import ExcelJS from 'exceljs';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatDateTime } from '@utils/date-formatter.js';

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
  const lastCol = String.fromCharCode(64 + Math.min(colCount, 26));

  const enEndCol = colCount >= 12 ? 'D' : colCount === 8 ? 'C' : 'B';
  const logoStart = colCount >= 12 ? 'E' : colCount === 8 ? 'D' : 'C';
  const logoEnd = colCount >= 12 ? 'F' : colCount === 8 ? 'E' : 'D';
  const arStart = colCount >= 12 ? 'G' : colCount === 8 ? 'F' : 'E';
  const arEnd = lastCol;

  const enCell = ws.getCell(`A${headerStartRow}`);
  enCell.value = `${OFFICIAL_HEADER.ministryEn}\n${OFFICIAL_HEADER.corpsEn}`;
  enCell.font = { size: 10 };
  enCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
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
      colCount >= 12
        ? 4.35
        : colCount === 8
          ? 3.35
          : 2.35;

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

  const genDateTime = formatDateTime(new Date(), isAr ? 'ar' : 'en');
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
  ws.getCell(`A${row}`).value = `${metaLabels.generated}: ${formatDateTime(new Date(), isAr ? 'ar' : 'en')}`;

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

function writeMarksHeader(ws, data, colCount, rowStart = 1) {
  const headerEnd = writeBilingualHeaderBlock(ws, rowStart, colCount);
  return headerEnd + 1;
}

export async function exportSemesterCertificateExcel(data) {
  const isAr = data.isAr;
  const colCount = 4 + (data.subjects?.length || 0) + 1;
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Semester Certificate', { views: [{ rightToLeft: isAr }] });
  setupA4Worksheet(ws, isAr);
  ws.pageSetup.orientation = 'landscape';

  let row = 1;
  ws.getCell(`A${row}`).value = `${isAr ? 'الرقم التسلسلي' : 'Serial'}: ${data.serial}`;
  row += 1;
  row = writeMarksHeader(ws, data, Math.min(colCount, 12), row) + 1;

  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = `${data.subtitle}\n${data.title}`;
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: 'center', wrapText: true };
  ws.mergeCells(row, 1, row, Math.min(colCount, 12));
  row += 2;

  const headers = [
    isAr ? 'م' : '#',
    isAr ? 'الرقم' : 'ID',
    isAr ? 'الرتبة' : 'Rank',
    isAr ? 'الاسم' : 'Name',
    ...(data.subjects || []).map((s) => s.name),
    isAr ? 'المعدل الفصلي' : 'GPA',
  ];
  const hRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0C4DE' } };
    applyThinBorders(cell);
  });
  row += 1;

  (data.rows || []).forEach((student) => {
    const dr = ws.getRow(row);
    let col = 1;
    dr.getCell(col++).value = student.serial;
    dr.getCell(col++).value = student.studentNumber;
    dr.getCell(col++).value = student.rank;
    dr.getCell(col++).value = student.studentName;
    (data.subjects || []).forEach((s) => {
      const m = student.subjectMarks?.[s.id];
      const cell = dr.getCell(col++);
      if (m) {
        cell.value = `${m.totalMarks}${m.letterGrade ? ` (${m.letterGrade})` : ''}`;
        if (m.failed) cell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
      applyThinBorders(cell);
    });
    const gpaCell = dr.getCell(col++);
    gpaCell.value = student.semesterGpa;
    gpaCell.font = { bold: true };
    for (let c = 1; c < col; c++) applyThinBorders(dr.getCell(c));
    row += 1;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportClassSubjectMarksExcel(data) {
  const isAr = data.isAr;
  const d = data.distribution || {};
  const LIGHT_TINT = 'FFFFFAF5';
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(isAr ? 'كشف درجات المادة' : 'Class Marks', { views: [{ rightToLeft: isAr }] });
  setupA4Worksheet(ws, isAr);
  ws.pageSetup.orientation = 'landscape';

  let row = 1;
  ws.getCell(isAr ? `L${row}` : `A${row}`).value = `${isAr ? 'الرقم التسلسلي' : 'Serial'}: ${data.serial}`;
  row += 1;

  const headerEnd = writeBilingualHeaderBlock(ws, row, 12);
  await tryAddLogo(workbook, ws, row, 12);
  row = headerEnd + 1;

  ws.getCell(`A${row}`).value = `${isAr ? 'البرنامج' : 'Program'}: ${data.meta?.program}`;
  row += 1;
  ws.getCell(`A${row}`).value = `${isAr ? 'المادة' : 'Subject'}: ${data.meta?.subject}`;
  row += 2;

  const continuousWeight =
    (d.homework || 0) + (d.participation || 0) + (d.quizzes || 0) +
    (d.labsProjectResearch || 0) + (d.attendance || 0) + (d.midTermExam || 0);

  const headers = [
    isAr ? 'م' : '#',
    isAr ? 'اسم الطالب' : 'Student',
    isAr ? 'السنة' : 'Year',
    isAr ? 'الفصل' : 'Term',
    `${isAr ? 'واجبات' : 'HW'} (${d.homework}%)`,
    `${isAr ? 'مشاركة' : 'Part.'} (${d.participation}%)`,
    `${isAr ? 'قصيرة' : 'Quiz'} (${d.quizzes}%)`,
    `${isAr ? 'بحث' : 'Research'} (${d.labsProjectResearch}%)`,
    `${isAr ? 'حضور' : 'Att.'} (${d.attendance}%)`,
    `${isAr ? 'فصلي' : 'Mid'} (${d.midTermExam}%)`,
    `${isAr ? 'مجموع' : 'Sub'} (${continuousWeight}%)`,
    `${isAr ? 'نهائي' : 'Final'} (${d.finalExam}%)`,
    isAr ? 'المجموع الكلي' : 'Total',
  ];

  const hRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    applyThinBorders(cell);
  });
  hRow.height = 28;
  row += 1;

  (data.rows || []).forEach((student) => {
    const dr = ws.getRow(row);
    const values = [
      student.serial,
      student.studentName,
      student.year,
      student.term,
      student.homework,
      student.participation,
      student.quizzes,
      student.labsProjectResearch,
      student.attendance,
      student.midTermExam,
      student.continuousTotal,
      student.finalExam,
      student.grandTotal,
    ];
    values.forEach((v, i) => {
      const cell = dr.getCell(i + 1);
      cell.value = v;
      cell.alignment = { horizontal: i === 1 ? (isAr ? 'right' : 'left') : 'center', vertical: 'middle' };
      if (i === 10 || i === 12) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_TINT } };
      }
      if (i === 12 && student.failed) {
        cell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
      applyThinBorders(cell);
    });
    dr.height = 18;
    row += 1;
  });

  row += 1;
  ws.getCell(`A${row}`).value = `${isAr ? 'الرقم التسلسلي' : 'Serial'}: ${data.serial}`;
  row += 1;
  ws.getCell(`A${row}`).value = `${isAr ? 'تاريخ الإصدار' : 'Generated'}: ${formatDateTime(new Date(), isAr ? 'ar' : 'en')}`;

  const colWidths = [5, 28, 10, 10, 11, 11, 11, 12, 11, 11, 12, 11, 12];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportQualitativeCardExcel(data) {
  const isAr = data.isAr;
  const workbook = new ExcelJS.Workbook();

  for (let sIdx = 0; sIdx < data.students.length; sIdx += 1) {
    const student = data.students[sIdx];
    const sheetName = `${student.studentNumber || student.studentId}`.slice(0, 31);
    const ws = workbook.addWorksheet(sheetName || `Student${sIdx + 1}`, { views: [{ rightToLeft: isAr }] });
    setupA4Worksheet(ws, isAr);
    let row = 1;
    const headerStart = row;
    row = writeBilingualHeaderBlock(ws, row, 8) + 1;
    await tryAddLogo(workbook, ws, headerStart, 8);
    ws.getCell(`A${row}`).value = data.title;
    ws.getCell(`A${row}`).font = { bold: true, size: 14 };
    ws.mergeCells(`A${row}:H${row}`);
    row += 2;
    ws.getCell(`A${row}`).value = `${isAr ? 'الاسم' : 'Name'}: ${student.studentName}`;
    row += 1;
    ws.getCell(`A${row}`).value = `${isAr ? 'الرقم' : 'ID'}: ${student.studentNumber}`;
    row += 1;
    ws.getCell(`A${row}`).value = `${isAr ? 'التخصص' : 'Major'}: ${student.programName}`;
    row += 2;

    student.semesters.forEach((sem) => {
      ws.getCell(`A${row}`).value = sem.label;
      ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      ws.mergeCells(`A${row}:F${row}`);
      row += 1;
      const hdr = isAr
        ? ['رمز المقرر', 'اسم المقرر', 'الساعات', 'التقدير', 'النقاط', 'الساعات المكتسبة']
        : ['Code', 'Course', 'Credits', 'Grade', 'Points', 'Hours'];
      hdr.forEach((h, i) => {
        const c = ws.getRow(row).getCell(i + 1);
        c.value = h;
        c.font = { bold: true };
        applyThinBorders(c);
      });
      row += 1;
      sem.courses.forEach((c) => {
        [c.code, c.name, c.credits, c.letterGrade, c.pointsEarned, c.hoursEarned].forEach((v, i) => {
          const cell = ws.getRow(row).getCell(i + 1);
          cell.value = v;
          cell.alignment = { vertical: 'middle', horizontal: i === 1 ? (isAr ? 'right' : 'left') : 'center' };
          applyThinBorders(cell);
        });
        row += 1;
      });
      ws.getCell(`A${row}`).value = `${isAr ? 'المعدل الفصلي' : 'Semester GPA'}: ${sem.semesterGpa?.toFixed?.(2)}`;
      ws.getCell(`D${row}`).value = `${isAr ? 'المعدل العام' : 'Cumulative GPA'}: ${sem.cumulativeGpa?.toFixed?.(2)}`;
      row += 2;
    });

    ws.columns = [{ width: 12 }, { width: 32 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 14 }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportAttendanceWarningExcel(data) {
  const isAr = data.isAr;
  const workbook = new ExcelJS.Workbook();

  data.pages.forEach((page, idx) => {
    const ws = workbook.addWorksheet(`${page.studentNumber || idx + 1}`.slice(0, 31), { views: [{ rightToLeft: isAr }] });
    setupA4Worksheet(ws, isAr);
    let row = 1;
    ws.getCell(`A${row}`).value = page.title;
    ws.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FFB91C1C' } };
    ws.mergeCells(`A${row}:F${row}`);
    row += 2;
    [
      [isAr ? 'الرقم' : 'Number', page.studentNumber],
      [isAr ? 'الرتبة' : 'Rank', page.rank],
      [isAr ? 'الإسم' : 'Name', page.studentName],
      [isAr ? 'الدورة' : 'Program', page.programName],
      [isAr ? 'المادة' : 'Subject', page.subjectName],
    ].forEach(([label, value]) => {
      ws.getCell(`A${row}`).value = { richText: [{ text: `${label}: `, font: { bold: true, color: { argb: 'FFB91C1C' } } }, { text: String(value) }] };
      ws.mergeCells(`A${row}:F${row}`);
      row += 1;
    });
    row += 1;
    ws.getCell(`A${row}`).value = page.body;
    ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
    ws.mergeCells(`A${row}:F${row + 4}`);
    row += 6;
    ws.getCell(`A${row}`).value = page.signerTitle;
    ws.getCell(`A${row}`).font = { bold: true };
    row += 1;
    ws.getCell(`A${row}`).value = `(${page.signerName})`;
    ws.columns = [{ width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

