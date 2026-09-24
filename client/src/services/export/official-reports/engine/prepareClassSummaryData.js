import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDateTime } from '../shared/officialDateFormat.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { resolveWarningType, WARNING_TYPE } from './prepareAttendanceWarningData.js';

const WARNING_LABELS = {
  en: {
    [WARNING_TYPE.FIRST]: 'First Warning',
    [WARNING_TYPE.FINAL]: 'Final Warning',
    [WARNING_TYPE.DISMISSED]: 'Dismissed',
    none: 'Compliant',
  },
  ar: {
    [WARNING_TYPE.FIRST]: 'إنذار أول',
    [WARNING_TYPE.FINAL]: 'إنذار نهائي',
    [WARNING_TYPE.DISMISSED]: 'مفصول',
    none: 'منتظم',
  },
};

/**
 * Prepare data for the class attendance summary report (semester-level).
 * @param {object} classInfo - { classId, className, classNameAr, subjectName, subjectNameAr, programName, programNameAr, term }
 * @param {Array} students - rows from fetchAbsenceWarningCounts
 */
export function prepareClassSummaryData({ classInfo = {}, students = [], metadata = {}, lang = 'en', colorize = true }) {
  const isAr = lang === 'ar';
  const serial = buildSerialNumber(classInfo.classId, { prefix: 'CS' });
  const warningLabels = WARNING_LABELS[isAr ? 'ar' : 'en'];

  const rows = students.map((s, idx) => {
    const user = { displayName: s.studentName, displayNameAr: s.studentNameAr };
    const warningType = resolveWarningType(s.totalAbsences, s.unexcusedAbsences);
    // Approved vs pending counts per deduction-bearing absence type.
    const split = { absent: { ap: 0, pend: 0 }, excused: { ap: 0, pend: 0 }, human: { ap: 0, pend: 0 } };
    for (const a of s.absences || []) {
      const bucket = a.statusCode === 'ATTENDANCE_ABSENT' ? 'absent'
        : a.statusCode === 'ATTENDANCE_LEAVE' ? 'excused'
        : a.statusCode === 'ATTENDANCE_HUMAN_CASE' ? 'human' : null;
      if (!bucket) continue;
      if (a.excusedViaWorkflow) split[bucket].ap += 1;
      else split[bucket].pend += 1;
    }
    return {
      index: idx + 1,
      studentId: s.studentId,
      studentNumber: s.studentNumber || '',
      studentName: getLocalizedUserName(user, lang, s.studentName || ''),
      present: s.presentCount || 0,
      unexcused: s.unexcusedAbsences || 0,
      excused: s.excusedAbsences || 0,
      late: s.lateCount || 0,
      humanCase: s.humanCaseCount || 0,
      absentApproved: split.absent.ap,
      absentPending: split.absent.pend,
      excusedApproved: split.excused.ap,
      excusedPending: split.excused.pend,
      humanApproved: split.human.ap,
      humanPending: split.human.pend,
      total: s.totalAbsences || 0,
      deduction: s.deductionTotal || 0,
      deductionApproved: s.deductionApproved || 0,
      deductionPending: s.deductionNotApproved || 0,
      warning: warningLabels[warningType || 'none'],
      warningType: warningType || 'none',
    };
  });

  return {
    serial,
    lang,
    isAr,
    header: OFFICIAL_HEADER,
    title: isAr ? 'ملخص حضور الشعبة' : 'Class Attendance Summary',
    programName: isAr
      ? (classInfo.programNameAr || classInfo.programName || '')
      : (classInfo.programName || classInfo.programNameAr || ''),
    colorize,
    className: isAr
      ? (classInfo.classNameAr || classInfo.className || '')
      : (classInfo.className || classInfo.classNameAr || ''),
    subjectName: isAr
      ? (classInfo.subjectNameAr || classInfo.subjectName || '')
      : (classInfo.subjectName || classInfo.subjectNameAr || ''),
    term: classInfo.term || '',
    rows,
    labels: {
      program: isAr ? 'الدورة' : 'Program',
      class: isAr ? 'الشعبة' : 'Class',
      subject: isAr ? 'المادة' : 'Subject',
      term: isAr ? 'الفصل' : 'Term',
      number: isAr ? 'الرقم' : 'Number',
      name: isAr ? 'الإسم' : 'Name',
      present: isAr ? 'حاضر' : 'Present',
      absent: isAr ? 'غائب' : 'Absent',
      excused: isAr ? 'استئذان' : 'Excused',
      late: isAr ? 'متأخر' : 'Late',
      humanCase: isAr ? 'حالة إنسانية' : 'Human',
      total: isAr ? 'الإجمالي' : 'Total',
      deduction: isAr ? 'الخصم' : 'Deduction',
      warning: isAr ? 'الحالة' : 'Status',
      students: isAr ? 'طالب' : 'students',
      approved: isAr ? 'معتمد' : 'Appr.',
      pending: isAr ? 'معلق' : 'Pend.',
    },
    meta: {
      generatedAt: formatOfficialReportDateTime(new Date(), lang),
      serial,
    },
    watermarkUser: metadata.watermarkUser,
  };
}
