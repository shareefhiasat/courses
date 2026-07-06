import ExcelJS from 'exceljs';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatDateTime } from '@utils/date-formatter.js';
import { MIME_TYPES } from '@constants/exportConfig.js';

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
          ? 3.0
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
    type: MIME_TYPES.EXCEL,
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
    type: MIME_TYPES.EXCEL,
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
  return new Blob([buffer], { type: MIME_TYPES.EXCEL });
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
  return new Blob([buffer], { type: MIME_TYPES.EXCEL });
}

export async function exportQualitativeCardExcel(data) {
  const isAr = data.isAr;
  const workbook = new ExcelJS.Workbook();

  const footerLabels = isAr
    ? {
        courseCount: 'مجموع مقررات الفصل الدراسي',
        semGpaHours: 'ساعات المعدل الفصلي',
        semEarnedHours: 'ساعات المعدل الفصلي المكتسبة',
        cumGpaHours: 'ساعات المعدل التراكمي',
        cumEarnedHours: 'ساعات المعدل التراكمي المكتسبة',
        semPoints: 'النقاط المكتسبة للمعدل الفصلي',
        cumPoints: 'النقاط المكتسبة للمعدل التراكمي',
        semGpa: 'المعدل الفصلي',
        cumGpa: 'المعدل العام',
      }
    : {
        courseCount: 'Semester Courses',
        semGpaHours: 'Semester GPA Hours',
        semEarnedHours: 'Semester Earned Hours',
        cumGpaHours: 'Cumulative GPA Hours',
        cumEarnedHours: 'Cumulative Earned Hours',
        semPoints: 'Semester Points Earned',
        cumPoints: 'Cumulative Points Earned',
        semGpa: 'Semester GPA',
        cumGpa: 'Cumulative GPA',
      };

  for (let sIdx = 0; sIdx < data.students.length; sIdx += 1) {
    const student = data.students[sIdx];
    const sheetName = `${student.studentNumber || student.studentId}`.slice(0, 31);
    const ws = workbook.addWorksheet(sheetName || `Student${sIdx + 1}`, { views: [{ rightToLeft: isAr }] });
    setupA4Worksheet(ws, isAr);
    ws.pageSetup.orientation = 'landscape';
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
        ? ['رمز المقرر', 'الساعات المعتمدة', 'اسم المقرر', 'التقدير', 'النقاط المكتسبة', 'الساعات المكتسبة']
        : ['Code', 'Credits', 'Course', 'Grade', 'Points', 'Hours Earned'];
      hdr.forEach((h, i) => {
        const c = ws.getRow(row).getCell(i + 1);
        c.value = h;
        c.font = { bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
        applyThinBorders(c);
      });
      row += 1;
      sem.courses.forEach((c) => {
        [c.code, c.credits, c.name, c.letterGrade, c.pointsEarned, c.hoursEarned].forEach((v, i) => {
          const cell = ws.getRow(row).getCell(i + 1);
          cell.value = v;
          cell.alignment = { vertical: 'middle', horizontal: i === 2 ? (isAr ? 'right' : 'left') : 'center' };
          applyThinBorders(cell);
        });
        row += 1;
      });

      const fmt = (n) => (n != null ? Number(n).toFixed(2) : '—');
      const footerRows = [
        [footerLabels.courseCount, sem.courseCount, footerLabels.semPoints, fmt(sem.semesterPointsEarned), false],
        [footerLabels.semGpaHours, sem.gpaHours, footerLabels.cumPoints, fmt(sem.cumulativePointsEarned), false],
        [footerLabels.semEarnedHours, sem.earnedHours, footerLabels.semGpa, fmt(sem.semesterGpa), true],
        [footerLabels.cumGpaHours, sem.cumulativeGpaHours, footerLabels.cumGpa, fmt(sem.cumulativeGpa), true],
        [footerLabels.cumEarnedHours, sem.cumulativeEarnedHours, '', '', false],
      ];
      footerRows.forEach(([l1, v1, l2, v2, highlightGpa]) => {
        ws.mergeCells(row, 1, row, 2);
        const c1 = ws.getCell(row, 1);
        c1.value = l1;
        c1.font = { size: 8, bold: true };
        c1.alignment = { vertical: 'middle', wrapText: true, horizontal: isAr ? 'right' : 'left' };
        applyThinBorders(c1);
        const c2 = ws.getCell(row, 3);
        c2.value = v1;
        c2.font = { size: 9, bold: true };
        c2.alignment = { vertical: 'middle', horizontal: 'center' };
        applyThinBorders(c2);
        if (l2) {
          ws.mergeCells(row, 4, row, 5);
          const c3 = ws.getCell(row, 4);
          c3.value = l2;
          c3.font = { size: 8, bold: true };
          c3.alignment = { vertical: 'middle', wrapText: true, horizontal: isAr ? 'right' : 'left' };
          applyThinBorders(c3);
          const c4 = ws.getCell(row, 6);
          c4.value = v2;
          c4.font = { size: 9, bold: true };
          c4.alignment = { vertical: 'middle', horizontal: 'center' };
          if (highlightGpa && v2) {
            c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
          }
          applyThinBorders(c4);
        }
        row += 1;
      });
      row += 1;
    });

    ws.columns = [
      { width: 12 },
      { width: 8 },
      { width: 42 },
      { width: 10 },
      { width: 14 },
      { width: 12 },
    ];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: MIME_TYPES.EXCEL });
}

export async function exportAttendanceWarningExcel(data) {
  const isAr = data.isAr;
  const workbook = new ExcelJS.Workbook();
  const genDateTime = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  data.pages.forEach((page, idx) => {
    const ws = workbook.addWorksheet(`${page.studentNumber || idx + 1}`.slice(0, 31), { views: [{ rightToLeft: isAr }] });
    setupA4Worksheet(ws, isAr);
    let row = 1;

    ws.columns = [
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
    ];

    // Bilingual official header: two sides, three lines each
    const [enCorps, enSchool] = OFFICIAL_HEADER.corpsEn.split(' / ').map((s) => s.trim());
    const [arCorps, arSchool] = OFFICIAL_HEADER.corpsAr.split(' / ').map((s) => s.trim());
    if (isAr) {
      ws.getCell(`A${row}`).value = `${OFFICIAL_HEADER.ministryAr}\n${arCorps}\n${arSchool}`;
      ws.getCell(`A${row}`).alignment = { wrapText: true, horizontal: 'right', vertical: 'center' };
      ws.getCell(`F${row}`).value = `${OFFICIAL_HEADER.ministryEn}\n${enCorps}\n${enSchool}`;
      ws.getCell(`F${row}`).alignment = { wrapText: true, horizontal: 'left', vertical: 'center' };
    } else {
      ws.getCell(`A${row}`).value = `${OFFICIAL_HEADER.ministryEn}\n${enCorps}\n${enSchool}`;
      ws.getCell(`A${row}`).alignment = { wrapText: true, horizontal: 'left', vertical: 'center' };
      ws.getCell(`F${row}`).value = `${OFFICIAL_HEADER.ministryAr}\n${arCorps}\n${arSchool}`;
      ws.getCell(`F${row}`).alignment = { wrapText: true, horizontal: 'right', vertical: 'center' };
    }
    ws.getCell(`A${row}`).font = { size: 10 };
    ws.getCell(`F${row}`).font = { size: 10 };
    ws.getRow(row).height = 46;
    row += 2;

    // Serial line
    ws.getCell(`A${row}`).value = { richText: [
      { text: `${isAr ? 'الرقم التسلسلي' : 'Serial'}: `, font: { bold: true, size: 9 } },
      { text: data.serial, font: { size: 9 } },
    ]};
    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).alignment = { horizontal: isAr ? 'right' : 'left', vertical: 'center' };
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: 'FF555555' } };
    row += 2;

    // Title
    ws.getCell(`A${row}`).value = page.title;
    ws.getCell(`A${row}`).font = { bold: true, size: 17, color: { argb: 'FFB91C1C' } };
    ws.getCell(`A${row}`).alignment = { horizontal: 'center', vertical: 'center' };
    ws.mergeCells(`A${row}:F${row}`);
    row += 2;

    // Student info: left side (Number, Rank, Name) and right side (Program, Class, Subject)
    const leftFields = [
      [isAr ? 'الرقم' : 'Number', page.studentNumber],
      [isAr ? 'الرتبة' : 'Rank', page.rank],
      [isAr ? 'الإسم' : 'Name', page.studentName],
    ];
    const rightFields = [
      [isAr ? 'الدورة' : 'Program', page.programName],
      [isAr ? 'الشعبة' : 'Class', page.className],
      [isAr ? 'المادة' : 'Subject', page.subjectName],
    ];
    for (let i = 0; i < 3; i += 1) {
      const [leftLabel, leftValue] = leftFields[i];
      const [rightLabel, rightValue] = rightFields[i];
      ws.getCell(`A${row + i}`).value = { richText: [
        { text: `${leftLabel}: `, font: { bold: true, color: { argb: 'FFB91C1C' }, size: 12 } },
        { text: String(leftValue), font: { size: 12 } },
      ]};
      ws.mergeCells(`A${row + i}:C${row + i}`);
      ws.getCell(`A${row + i}`).alignment = { horizontal: 'left', vertical: 'center' };
      ws.getCell(`D${row + i}`).value = { richText: [
        { text: `${rightLabel}: `, font: { bold: true, color: { argb: 'FFB91C1C' }, size: 12 } },
        { text: String(rightValue), font: { size: 12 } },
      ]};
      ws.mergeCells(`D${row + i}:F${row + i}`);
      ws.getCell(`D${row + i}`).alignment = { horizontal: 'right', vertical: 'center' };
    }
    row += 3;
    row += 1;

    // Warning body (red + underlined + yellow highlight)
    const bodyCell = ws.getCell(`A${row}`);
    bodyCell.value = page.body;
    bodyCell.font = { color: { argb: 'FFB91C1C' }, underline: true, size: 12 };
    bodyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
    bodyCell.alignment = { wrapText: true, vertical: 'top', horizontal: isAr ? 'right' : 'left' };
    ws.mergeCells(`A${row}:F${row + 4}`);
    row += 6;

    // Signatures (single block, left in English / right in Arabic)
    const sig = page.signatures[0];
    if (sig) {
      const titleCell = ws.getCell(`A${row}`);
      titleCell.value = isAr ? sig.titleAr : sig.titleEn;
      titleCell.font = { bold: true, size: 9 };
      titleCell.alignment = { horizontal: isAr ? 'right' : 'left', wrapText: true, vertical: 'bottom' };
      ws.mergeCells(`A${row}:B${row}`);

      const nameCell = ws.getCell(`A${row + 1}`);
      nameCell.value = `(${isAr ? sig.nameAr : sig.nameEn})`;
      nameCell.font = { size: 9 };
      nameCell.alignment = { horizontal: isAr ? 'right' : 'left', vertical: 'top' };
      ws.mergeCells(`A${row + 1}:B${row + 1}`);
    }
    row += 3;

    // Receipt: student signature and handover date
    const receiptRow = row;
    if (isAr) {
      ws.getCell(`A${receiptRow}`).value = { richText: [
        { text: `${page.studentSignatureLabel}: `, font: { bold: true, size: 10 } },
        { text: '..............................................', font: { size: 10 } },
      ]};
      ws.getCell(`A${receiptRow}`).alignment = { horizontal: 'right', vertical: 'center' };
      ws.mergeCells(`A${receiptRow}:C${receiptRow}`);
      ws.getCell(`D${receiptRow}`).value = { richText: [
        { text: `${page.handoverDateLabel}: `, font: { bold: true, size: 10 } },
        { text: page.handoverDateValue, font: { size: 10 } },
      ]};
      ws.getCell(`D${receiptRow}`).alignment = { horizontal: 'left', vertical: 'center' };
      ws.mergeCells(`D${receiptRow}:F${receiptRow}`);
    } else {
      ws.getCell(`A${receiptRow}`).value = { richText: [
        { text: `${page.studentSignatureLabel}: `, font: { bold: true, size: 10 } },
        { text: '..............................................', font: { size: 10 } },
      ]};
      ws.getCell(`A${receiptRow}`).alignment = { horizontal: 'left', vertical: 'center' };
      ws.mergeCells(`A${receiptRow}:C${receiptRow}`);
      ws.getCell(`D${receiptRow}`).value = { richText: [
        { text: `${page.handoverDateLabel}: `, font: { bold: true, size: 10 } },
        { text: page.handoverDateValue, font: { size: 10 } },
      ]};
      ws.getCell(`D${receiptRow}`).alignment = { horizontal: 'right', vertical: 'center' };
      ws.mergeCells(`D${receiptRow}:F${receiptRow}`);
    }
    row += 2;

    // Footer
    ws.getCell(`A${row}`).value = { richText: [
      { text: `${isAr ? 'الرقم التسلسلي' : 'Serial'}: `, font: { bold: true, size: 8 } },
      { text: data.serial, font: { size: 8 } },
      { text: '   ', font: { size: 8 } },
      { text: `${isAr ? 'تاريخ الإصدار' : 'Generated'}: `, font: { bold: true, size: 8 } },
      { text: genDateTime, font: { size: 8 } },
      { text: '   ', font: { size: 8 } },
      { text: `${isAr ? 'صفحة' : 'Page'}: `, font: { bold: true, size: 8 } },
      { text: '1 / 1', font: { size: 8 } },
    ]};
    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).alignment = { horizontal: isAr ? 'right' : 'left', vertical: 'center' };
    ws.getCell(`A${row}`).font = { size: 8, color: { argb: 'FF555555' } };
    ws.getCell(`A${row}`).border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: MIME_TYPES.EXCEL });
}

function fillScheduleCell(cell, value, options = {}) {
  const { bold = false, fillArgb, fontSize = 10, wrap = false, rotation = 0, vertical = 'middle' } = options;
  cell.value = value ?? '';
  cell.font = { size: fontSize, bold };
  cell.alignment = {
    horizontal: 'center',
    vertical,
    wrapText: wrap,
    textRotation: rotation,
  };
  if (fillArgb) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
  }
  applyThinBorders(cell);
}

function scheduleMetaLine(data) {
  const batch = data.batch || '';
  const termLine = [data.year, data.term].filter(Boolean).join(' / ');
  return [batch, termLine].filter(Boolean).join(' — ');
}

export async function exportWeeklyScheduleExcel(data) {
  const isAr = data.lang === 'ar';
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(isAr ? 'الجدول الأسبوعي' : 'Weekly Schedule', {
    views: [{ rightToLeft: isAr }],
  });
  setupA4Worksheet(ws, isAr);
  ws.pageSetup.orientation = 'landscape';

  const colCount = 8;
  let row = 1;
  const headerStartRow = row;

  const headerEndRow = writeBilingualHeaderBlock(ws, headerStartRow, colCount);
  const enCell = ws.getCell(`A${headerStartRow}`);
  enCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  enCell.font = { size: 9 };
  const arCell = ws.getCell(`F${headerStartRow}`);
  arCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  arCell.font = { size: 9 };
  for (let r = headerStartRow; r <= headerEndRow; r += 1) {
    ws.getRow(r).height = 22;
  }
  await tryAddLogo(workbook, ws, headerStartRow, colCount);
  row = headerEndRow + 1;

  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = data.title;
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(row, 1, row, colCount);
  ws.getRow(row).height = 20;
  row += 1;

  const meta = scheduleMetaLine(data);
  const subCell = ws.getCell(`A${row}`);
  subCell.value = meta ? `${data.subtitle}  |  ${meta}` : data.subtitle;
  subCell.font = { bold: true, size: 11 };
  subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws.mergeCells(row, 1, row, colCount);
  ws.getRow(row).height = 18;
  row += 1;

  const headerRow = ws.getRow(row);
  headerRow.height = 52;
  fillScheduleCell(headerRow.getCell(1), isAr ? 'اليوم' : 'Day', { bold: true, fillArgb: 'FFD9E2F0', fontSize: 10 });
  fillScheduleCell(headerRow.getCell(2), '', { bold: true, fillArgb: 'FFD9E2F0', fontSize: 10 });
  data.columns.forEach((col, idx) => {
    fillScheduleCell(
      headerRow.getCell(idx + 3),
      col.label,
      { bold: true, fillArgb: col.isBreak ? 'FFEEF2F7' : 'FFD9E2F0', fontSize: 10, wrap: true }
    );
  });
  row += 1;

  const rowTypes = ['subject', 'time', 'instructor', 'room'];
  (data.days || []).forEach((day) => {
    rowTypes.forEach((rowType, rowIndex) => {
      const dr = ws.getRow(row);
      dr.height = 26;

      if (rowIndex === 0) {
        const dayCell = dr.getCell(1);
        dayCell.value = day.dayLabel;
        dayCell.font = { bold: true, size: 10 };
        dayCell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F0' } };
        applyThinBorders(dayCell);
        ws.mergeCells(row, 1, row + 3, 1);
      }

      fillScheduleCell(
        dr.getCell(2),
        data.rowLabels?.[rowType] || rowType,
        { bold: true, fillArgb: 'FFF3F6FA', fontSize: 9, vertical: 'bottom' }
      );

      data.columns.forEach((col, idx) => {
        const slot = day.slots?.[col.key];
        const cell = dr.getCell(idx + 3);
        if (col.isBreak) {
          if (rowType === 'subject') {
            fillScheduleCell(cell, slot?.time || '—', {
              fillArgb: 'FFF8FAFC',
              fontSize: 8,
              rotation: 90,
            });
            ws.mergeCells(row, idx + 3, row + 3, idx + 3);
          }
          return;
        }
        let value = '';
        if (rowType === 'subject') value = slot?.subjectName || '—';
        else if (rowType === 'time') value = slot?.time || '—';
        else if (rowType === 'instructor') value = slot?.instructor || '';
        else if (rowType === 'room') value = slot?.room || '—';
        fillScheduleCell(
          cell,
          value,
          {
            bold: rowType === 'subject',
            fillArgb: rowType === 'subject' ? 'FFF5E6E8' : undefined,
            fontSize: rowType === 'instructor' ? 9.5 : 9,
            wrap: rowType === 'subject',
            vertical: 'bottom',
          }
        );
      });
      row += 1;
    });
  });

  row += 1;
  ws.getCell(`A${row}`).value = `${isAr ? 'الرقم التسلسلي' : 'Serial'}: ${data.serial}`;
  ws.mergeCells(row, 1, row, colCount);

  ws.columns = [
    { width: 3.5 },
    { width: 10 },
    { width: 22 },
    { width: 4 },
    { width: 22 },
    { width: 4 },
    { width: 22 },
    { width: 16 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: MIME_TYPES.EXCEL });
}

