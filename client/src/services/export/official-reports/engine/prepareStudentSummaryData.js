import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDateTime } from '../shared/officialDateFormat.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';

export function studentSummaryStatusLabels(isAr) {
  return {
    ATTENDANCE_PRESENT: isAr ? 'حاضر' : 'Present',
    ATTENDANCE_ABSENT: isAr ? 'غائب' : 'Absent',
    ATTENDANCE_LATE: isAr ? 'متأخر' : 'Late',
    ATTENDANCE_LEAVE: isAr ? 'استئذان' : 'Excused',
    ATTENDANCE_HUMAN_CASE: isAr ? 'حالة إنسانية' : 'Human Case',
    SICK_LEAVE: isAr ? 'إجازة مرضية' : 'Sick Leave',
    EARLY_DEPARTURE: isAr ? 'انصراف مبكر' : 'Early Departure',
    ABSENT_WITH_EXCUSE: isAr ? 'غائب بعذر' : 'Absent Excused',
  };
}

function buildSection(section, isAr, statusLabels) {
  const rows = (section.rows || [])
    .map((r) => ({
      date: r.date ? new Date(r.date) : null,
      statusCode: r.statusCode || '',
      excusedViaWorkflow: Boolean(r.excusedViaWorkflow),
      deduction: r.deduction ?? 0,
      note: r.note || r.notes || r.lastAmendment?.reason || null,
    }))
    .filter((r) => r.date && !Number.isNaN(r.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const totalDeduction = rows.reduce((sum, r) => sum + (Number(r.deduction) || 0), 0);

  return {
    classId: section.classId,
    className: isAr
      ? (section.classNameAr || section.className || '')
      : (section.className || section.classNameAr || ''),
    subjectName: isAr
      ? (section.subjectNameAr || section.subjectName || '')
      : (section.subjectName || section.subjectNameAr || ''),
    programName: isAr
      ? (section.programNameAr || section.programName || '')
      : (section.programName || section.programNameAr || ''),
    rows,
    totalRows: rows.length,
    totalDeduction: Number(totalDeduction.toFixed(2)),
    statusLabels,
  };
}

/**
 * Prepare data for the student attendance summary report.
 * @param {object} student - { studentId, studentNumber, studentName, studentNameAr, rankEn, rankAr }
 * @param {Array} sections - [{ classId, className, subjectName, programName, rows }]
 * @param {object} metadata - { watermarkUser, scope: 'class'|'all' }
 */
export function prepareStudentSummaryData({ student = {}, sections = [], metadata = {}, lang = 'en' }) {
  const isAr = lang === 'ar';
  const statusLabels = studentSummaryStatusLabels(isAr);
  const scope = metadata.scope === 'all' ? 'all' : 'class';
  const serial = buildSerialNumber(student.studentId, { prefix: scope === 'all' ? 'SA' : 'SS' });

  const preparedSections = sections.map((s) => buildSection(s, isAr, statusLabels));
  const grandTotal = preparedSections.reduce((sum, s) => sum + s.totalRows, 0);
  const grandDeduction = Number(
    preparedSections.reduce((sum, s) => sum + s.totalDeduction, 0).toFixed(2),
  );

  const user = {
    displayName: student.studentName,
    displayNameAr: student.studentNameAr,
  };

  return {
    serial,
    lang,
    isAr,
    header: OFFICIAL_HEADER,
    title: isAr ? 'ملخص حضور الطالب' : 'Student Attendance Summary',
    scope,
    studentNumber: student.studentNumber || '',
    studentName: getLocalizedUserName(user, lang, student.studentName || ''),
    rank: isAr ? (student.rankAr || student.rankEn || '—') : (student.rankEn || student.rankAr || '—'),
    sections: preparedSections,
    grandTotal,
    grandDeduction,
    labels: {
      number: isAr ? 'الرقم' : 'Number',
      rank: isAr ? 'الرتبة' : 'Rank',
      name: isAr ? 'الإسم' : 'Name',
      program: isAr ? 'الدورة' : 'Program',
      class: isAr ? 'الشعبة' : 'Class',
      subject: isAr ? 'المادة' : 'Subject',
      date: isAr ? 'التاريخ' : 'Date',
      status: isAr ? 'الحالة' : 'Status',
      approval: isAr ? 'الاعتماد' : 'Approval',
      approved: isAr ? 'معتمد' : 'Approved',
      pending: isAr ? 'قيد الانتظار' : 'Pending',
      deduction: isAr ? 'الخصم' : 'Deduction',
      note: isAr ? 'ملاحظة' : 'Note',
      total: isAr ? 'الإجمالي' : 'Total',
      records: isAr ? 'سجل' : 'records',
      noRecords: isAr ? 'لا توجد سجلات غياب' : 'No absence records',
    },
    meta: {
      generatedAt: formatOfficialReportDateTime(new Date(), lang),
      serial,
    },
    watermarkUser: metadata.watermarkUser,
  };
}
