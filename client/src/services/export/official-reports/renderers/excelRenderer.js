import ExcelJS from 'exceljs';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';

const STATUS_LABELS_AR = {
  present: 'متواجد',
  absent: 'غائب',
  humanCase: 'حالة إنسانية',
  late: 'متأخر',
};

function colLetter(n) {
  let s = '';
  let num = n;
  while (num > 0) {
    const mod = (num - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

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
  if (rtl) {
    worksheet.views = [{ rightToLeft: true }];
  }
}

async function tryAddLogo(workbook, worksheet, row = 1, col = 4) {
  try {
    const res = await fetch(OFFICIAL_HEADER.logoUrl);
    if (!res.ok) return;
    const buf = await res.arrayBuffer();
    const imageId = workbook.addImage({ buffer: buf, extension: 'png' });
    worksheet.addImage(imageId, {
      tl: { col: col - 0.5, row: row - 0.2 },
      ext: { width: 48, height: 48 },
    });
  } catch {
    /* logo optional */
  }
}

/**
 * Daily Official Excel export (no watermark).
 */
export async function exportDailyOfficialExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Daily Official', { views: [{ rightToLeft: true }] });
  setupA4Worksheet(ws, data.lang === 'ar');

  let row = 1;
  ws.getCell(`A${row}`).value = `Serial: ${data.serial}`;
  row += 2;

  await tryAddLogo(workbook, ws, row, 4);

  const meta = [
    [`Date: ${data.header.date}`, `Program: ${data.header.program}`],
    [`Subject: ${data.header.subject || ''}`, `Class: ${data.header.className || ''}`],
    [`Instructor: ${data.header.instructor || ''}`, `Year/Term: ${[data.header.year, data.header.term].filter(Boolean).join('/')}`],
  ];
  meta.forEach((pair) => {
    ws.getCell(`A${row}`).value = pair[0];
    ws.getCell(`D${row}`).value = pair[1];
    row += 1;
  });
  row += 1;

  ws.getCell(`A${row}`).value = data.title;
  ws.getCell(`A${row}`).font = { bold: true, size: 12 };
  ws.mergeCells(`A${row}:H${row}`);
  row += 1;

  const headers = [
    'ت',
    'اسم الطالب',
    'الرقم العسكري',
    ...data.statusKeys.map((k) => STATUS_LABELS_AR[k]),
    'ملاحظات',
  ];
  const headerRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
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
      r.notes,
    ];
    values.forEach((v, i) => {
      const cell = dataRow.getCell(i + 1);
      cell.value = v;
      applyThinBorders(cell);
    });
    row += 1;
  });

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
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Attendance Official', { views: [{ rightToLeft: true }] });
  setupA4Worksheet(ws, data.lang === 'ar');

  let row = 1;
  ws.getCell(`A${row}`).value = `Serial: ${data.serial}`;
  row += 2;

  await tryAddLogo(workbook, ws, row, 4);
  ws.getCell(`A${row + 2}`).value = data.title;
  ws.getCell(`A${row + 2}`).font = { bold: true, size: 12 };
  ws.mergeCells(`A${row + 2}:F${row + 2}`);
  row += 4;

  ws.getCell(`A${row}`).value = `Issue: ${data.header.issueDate}  Program: ${data.header.program}`;
  if (data.header.dateFrom) {
    ws.getCell(`A${row + 1}`).value = `Period: ${data.header.dateFrom} — ${data.header.dateTo}`;
    row += 1;
  }
  row += 2;

  const headers = ['ت', 'اسم الطالب', 'نوع المخالفة', 'المادة', 'درجة الحسم', 'التوقيع'];
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
    dateRow.getCell(1).value = `التاريخ: ${dg.dateLabel}`;
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

  ws.getCell(`A${row + 1}`).value = 'توقيع الضابط: _______________';
  ws.columns = [
    { width: 6 },
    { width: 26 },
    { width: 18 },
    { width: 28 },
    { width: 12 },
    { width: 16 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
