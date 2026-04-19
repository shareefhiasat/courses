import ExcelJS from 'exceljs';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';

/**
 * Excel Export Service
 * Provides reusable functions for exporting data to Excel format with advanced formatting
 */

/**
 * Default export options
 */
const DEFAULT_OPTIONS = {
  format: 'xlsx',
  freezeHeader: true,
  autoFilter: true,
  autoWidth: true,
  boldHeaders: true,
  borders: true,
  conditionalFormatting: true,
  rtl: false // RTL support for Arabic
};

/**
 * Conditional formatting colors for absence counts
 */
const ABSENCE_COLORS = {
  2: { fill: 'FFFF00', name: 'Yellow' },      // 2 absences
  4: { fill: 'FFA500', name: 'Orange' },      // 4 absences
  6: { fill: 'FFC0CB', name: 'Pink' },        // 6 absences
  8: { fill: 'FF6347', name: 'Light Red' },   // 8 absences
  FB: { fill: 'FF0000', name: 'Red' }          // FB status
};

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects containing the data to export
 * @param {Array} headers - Array of header strings
 * @param {Object} options - Export options
 * @returns {Promise<Blob>} Excel file as Blob
 */
export const exportToExcel = async (data, headers, options = {}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(mergedOptions.sheetName || 'Data');
  
  // Add headers
  worksheet.addRow(headers);
  
  // Add data rows
  data.forEach(row => {
    worksheet.addRow(row);
  });
  
  // Apply formatting
  await applyFormatting(worksheet, headers.length, data.length, mergedOptions);
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
};

/**
 * Apply Excel formatting to worksheet
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {number} headerCount - Number of header columns
 * @param {number} rowCount - Number of data rows
 * @param {Object} options - Formatting options
 */
const applyFormatting = async (worksheet, headerCount, rowCount, options) => {
  const totalRows = rowCount + 1; // +1 for header
  
  // Apply header formatting
  if (options.boldHeaders) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  // Freeze header row
  if (options.freezeHeader) {
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }
  
  // Add auto-filter
  if (options.autoFilter) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headerCount }
    };
  }
  
  // Auto-adjust column widths
  if (options.autoWidth) {
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });
  }
  
  // Add borders to all cells
  if (options.borders) {
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Apply RTL alignment if enabled
        if (options.rtl) {
          cell.alignment = {
            horizontal: 'right',
            readingOrder: 'rtl'
          };
        }
      });
    });
  }
  
  // Apply conditional formatting for absence counts
  if (options.conditionalFormatting && options.absenceColumns) {
    await applyConditionalFormatting(worksheet, options.absenceColumns, rowCount);
  }
};

/**
 * Apply conditional formatting based on absence counts
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {Array} absenceColumns - Array of column indices (1-based) for absence counts
 * @param {number} rowCount - Number of data rows
 */
const applyConditionalFormatting = async (worksheet, absenceColumns, rowCount) => {
  // Apply formatting rules for each absence column
  for (const colIndex of absenceColumns) {
    const columnLetter = getColumnLetter(colIndex);
    
    // Apply conditional formatting for each threshold using cell value rules
    // 2 absences: Yellow
    worksheet.addConditionalFormatting({
      ref: `${columnLetter}2:${columnLetter}${rowCount + 1}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'equal',
          formulae: ['2'],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF00' }
            }
          }
        }
      ]
    });
    
    // 4 absences: Orange
    worksheet.addConditionalFormatting({
      ref: `${columnLetter}2:${columnLetter}${rowCount + 1}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'equal',
          formulae: ['4'],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFA500' }
            }
          }
        }
      ]
    });
    
    // 6 absences: Pink
    worksheet.addConditionalFormatting({
      ref: `${columnLetter}2:${columnLetter}${rowCount + 1}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'equal',
          formulae: ['6'],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC0CB' }
            }
          }
        }
      ]
    });
    
    // 8 absences: Light Red
    worksheet.addConditionalFormatting({
      ref: `${columnLetter}2:${columnLetter}${rowCount + 1}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'equal',
          formulae: ['8'],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF6347' }
            }
          }
        }
      ]
    });
    
    // FB status: Red (text match)
    worksheet.addConditionalFormatting({
      ref: `${columnLetter}2:${columnLetter}${rowCount + 1}`,
      rules: [
        {
          type: 'containsText',
          text: 'FB',
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0000' }
            }
          }
        }
      ]
    });
  }
};

/**
 * Convert column index to letter (1 = A, 2 = B, etc.)
 * @param {number} columnIndex - 1-based column index
 * @returns {string} Column letter
 */
const getColumnLetter = (columnIndex) => {
  let letter = '';
  let temp = columnIndex;
  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter;
};

/**
 * Export daily attendance report to Excel
 * @param {Array} data - Daily report data
 * @param {Object} options - Export options
 * @returns {Promise<Blob>} Excel file as Blob
 */
export const exportDailyReport = async (data, options = {}) => {
  const headers = options.headers || [
    '#',
    'Student ID',
    'Student Number',
    'Student Name',
    'Status',
    'Date/Time',
    'Method',
    'Notes'
  ];
  
  const absenceColumns = options.absenceColumns || [5]; // Status column index (1-based)
  
  return exportToExcel(data, headers, {
    ...options,
    sheetName: options.sheetName || 'Daily Attendance',
    absenceColumns
  });
};

/**
 * Export summary attendance report to Excel
 * @param {Array} data - Summary report data
 * @param {Array} programSubjects - Program subjects for per-subject columns
 * @param {Object} options - Export options
 * @returns {Promise<Blob>} Excel file as Blob
 */
export const exportSummaryReport = async (data, programSubjects, options = {}) => {
  const headers = [
    '#',
    'Student Number',
    'Student Name',
    'Present',
    'Late',
    'Absent (No Excuse)',
    'Absent (With Excuse)',
    'Excused Leave',
    'Human Case',
    'Total Sessions',
    'Absent No Excuse Deduction',
    'Late Deduction',
    'Absent With Excuse Deduction',
    'Excused Leave Deduction',
    'Human Case Deduction',
    'Total Mark Deduction',
    'Grade',
    'Attendance Failure'
  ];
  
  // Add per-subject headers
  const subjectColumnStart = headers.length + 1;
  programSubjects.forEach(subject => {
    const subjectName = subject.nameEn || subject.name || 'Unknown Subject';
    headers.push(`${subjectName} - Present`);
    headers.push(`${subjectName} - Absent`);
    headers.push(`${subjectName} - Percentage`);
    headers.push(`${subjectName} - Deduction`);
    headers.push(`${subjectName} - FB`);
    headers.push(`${subjectName} - Grade`);
  });
  
  // Identify absence columns for conditional formatting
  const absenceColumns = [];
  // Overall absence columns (1-based indices)
  absenceColumns.push(6);  // Absent (No Excuse)
  absenceColumns.push(7);  // Absent (With Excuse)
  absenceColumns.push(9);  // Human Case
  
  // Per-subject absence columns
  let currentCol = subjectColumnStart;
  programSubjects.forEach(() => {
    absenceColumns.push(currentCol + 1); // Absent column for each subject
    absenceColumns.push(currentCol + 4); // FB column for each subject
    currentCol += 6;
  });
  
  return exportToExcel(data, headers, {
    ...options,
    sheetName: 'Summary Attendance',
    absenceColumns
  });
};

/**
 * Generic export function for any data with custom headers
 * @param {Array} data - Array of arrays containing the data to export
 * @param {Array} headers - Array of header strings
 * @param {Object} options - Export options
 * @returns {Promise<Blob>} Excel file as Blob
 */
export const exportGeneric = async (data, headers, options = {}) => {
  return exportToExcel(data, headers, {
    ...options,
    sheetName: options.sheetName || 'Export'
  });
};

/**
 * Deduction rules for attendance violations
 */
const DEDUCTION_RULES = {
  absentNoExcuse: 0.5,
  late: 0.5,
  absentWithExcuse: 0.25,
  humanCase: 0.25,
  excusedLeave: 0.25
};

/**
 * Export Attendance Violations Report
 * Groups violations by date and student with cell merging
 * @param {Array} data - Attendance records from getAttendanceRecords
 * @param {Object} options - Export options
 * @returns {Promise<Blob>} Excel file as Blob
 */
export const exportAttendanceViolationsReport = async (data, options = {}) => {
  const { lang = 'en', t } = options;
  
  // Filter for violation statuses - handle both string and object status formats
  const violationStatusCodes = [
    ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
    ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE,
    ATTENDANCE_STATUS.EXCUSED_LEAVE,
    ATTENDANCE_STATUS.LATE,
    ATTENDANCE_STATUS.HUMAN_CASE
  ];
  const filteredData = data.filter(record => {
    const status = record.status;
    const statusCode = status?.code || (typeof status === 'string' ? status : '');
    return violationStatusCodes.includes(statusCode);
  });

  // Sort by Date (DESC), then by Student Name
  filteredData.sort((a, b) => {
    const dateA = new Date(a.at || a.createdAt || a.timestamp);
    const dateB = new Date(b.at || b.createdAt || b.timestamp);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime(); // DESC
    }
    const nameA = (a.studentName || a.displayName || '').toLowerCase();
    const nameB = (b.studentName || b.displayName || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Group by Date, then by Student within each date
  const groupedByDate = {};
  filteredData.forEach(record => {
    const date = new Date(record.at || record.createdAt || record.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    
    groupedByDate[dateKey].push(record);
  });

  // Within each date, group by student
  Object.keys(groupedByDate).forEach(dateKey => {
    const studentGroups = {};
    groupedByDate[dateKey].forEach(record => {
      const studentId = record.studentId || record.uid;
      if (!studentGroups[studentId]) {
        studentGroups[studentId] = [];
      }
      studentGroups[studentId].push(record);
    });
    
    // Convert to array and sort by student name
    groupedByDate[dateKey] = Object.entries(studentGroups)
      .map(([studentId, records]) => ({ studentId, records }))
      .sort((a, b) => {
        const nameA = (a.records[0].studentName || a.records[0].displayName || '').toLowerCase();
        const nameB = (b.records[0].studentName || b.records[0].displayName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
  });

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Violations');

  // Set RTL/LTR based on language
  if (lang === 'ar') {
    worksheet.views = [{ rightToLeft: true }];
  }

  // Define column headers
  const headers = lang === 'ar' 
    ? ['م', 'اسم الطالب', 'نوع المخالفة', 'رقم الطالب', 'الفصل', 'المادة', 'درجة الحسم', 'توقيع الطالب']
    : ['No.', 'Student Name', 'Attendance Type', 'Student Number', 'Class', 'Subject', 'Mark', 'Signature'];

  // Add header row
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Set column widths
  worksheet.columns = [
    { width: 8 },   // No.
    { width: 25 },  // Student Name
    { width: 20 },  // Attendance Type
    { width: 15 },  // Student Number
    { width: 15 },  // Class
    { width: 25 },  // Subject
    { width: 12 },  // Mark
    { width: 30 }   // Signature (extra-wide)
  ];

  let globalSerial = 1;
  let currentRow = 2;

  // Process each date group
  Object.keys(groupedByDate).sort().reverse().forEach(dateKey => {
    const date = new Date(dateKey);
    const dateStr = lang === 'ar' 
      ? date.toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' })
      : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Add date header row (merged across all columns)
    const dateLabel = lang === 'ar' ? 'التاريخ' : 'Date';
    const dateRow = worksheet.addRow([`${dateLabel}: ${dateStr}`]);
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    dateRow.font = { bold: true, size: 11 };
    dateRow.alignment = { horizontal: 'center' };
    dateRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };
    currentRow++;

    // Process each student within the date
    groupedByDate[dateKey].forEach(({ studentId, records }) => {
      const studentNo = globalSerial++;
      const studentName = records[0].studentName || records[0].displayName || '';
      const studentNumber = records[0].studentNumber || '';
      const className = lang === 'ar'
        ? (records[0].class?.nameAr || records[0].className || records[0].classId || '')
        : (records[0].class?.nameEn || records[0].className || records[0].classId || '');
      
      const firstStudentRow = currentRow;
      let studentSerial = 1;

      // Add rows for each violation
      records.forEach(record => {
        const status = record.status;
        const statusCode = status?.code || (typeof status === 'string' ? status : '');
        let attendanceType = '';
        let deduction = 0;

        // Map status code to attendance type and calculate deduction
        if (statusCode === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) {
          attendanceType = lang === 'ar' ? 'غياب معذور' : 'Absent with excuse';
          deduction = DEDUCTION_RULES.absentWithExcuse;
        } else if (statusCode === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) {
          attendanceType = lang === 'ar' ? 'غياب بدون عذر' : 'Absent without excuse';
          deduction = DEDUCTION_RULES.absentNoExcuse;
        } else if (statusCode === ATTENDANCE_STATUS.LATE) {
          attendanceType = lang === 'ar' ? 'تأخير' : 'Late';
          deduction = DEDUCTION_RULES.late;
        } else if (statusCode === ATTENDANCE_STATUS.HUMAN_CASE) {
          attendanceType = lang === 'ar' ? 'حالة إنسانية' : 'Human case';
          deduction = DEDUCTION_RULES.humanCase;
        } else if (statusCode === ATTENDANCE_STATUS.EXCUSED_LEAVE) {
          attendanceType = lang === 'ar' ? 'إجازة' : 'Excused leave';
          deduction = DEDUCTION_RULES.excusedLeave;
        }

        const subjectName = lang === 'ar' 
          ? (record.subject?.nameAr || record.subjectName || record.subjectId || '')
          : (record.subject?.nameEn || record.subjectName || record.subjectId || '');

        // Add row
        const row = worksheet.addRow([
          studentNo,
          studentName,
          attendanceType,
          studentNumber,
          className,
          subjectName,
          deduction.toFixed(2),
          '' // Signature (empty for physical signing)
        ]);

        // Apply alignment
        row.alignment = { 
          horizontal: lang === 'ar' ? 'right' : 'left',
          vertical: 'middle'
        };

        currentRow++;
      });

      // Apply borders to each row
      const row = worksheet.getRow(currentRow - 1);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
};

export default {
  exportToExcel,
  exportDailyReport,
  exportSummaryReport,
  exportGeneric,
  exportAttendanceViolationsReport
};
