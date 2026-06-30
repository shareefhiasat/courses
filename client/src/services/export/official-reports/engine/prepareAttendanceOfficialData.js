import { ATTENDANCE_STATUS, getStatusCodeFromRecord } from '@constants/attendanceTypes';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildViolationsOfficialSerial } from './serialNumber.js';
import { formatDeduction, getDeductionForStatus } from '../shared/deductionDisplay.js';

const VIOLATION_LABELS = {
  ar: {
    [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'غياب بدون عذر',
    [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'غياب معذور',
    [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'إجازة',
    [ATTENDANCE_STATUS.LATE]: 'تأخير',
    [ATTENDANCE_STATUS.HUMAN_CASE]: 'حالة إنسانية',
  },
  en: {
    [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'Absent without excuse',
    [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'Absent excused',
    [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'Excused leave',
    [ATTENDANCE_STATUS.LATE]: 'Late',
    [ATTENDANCE_STATUS.HUMAN_CASE]: 'Human case',
  },
};

function formatGroupDate(dateKey, lang) {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusCode(record) {
  return getStatusCodeFromRecord(record) || '';
}

function getViolationLabel(statusCode, lang) {
  const labels = VIOLATION_LABELS[lang] || VIOLATION_LABELS.en;
  return labels[statusCode] || statusCode;
}

/**
 * Group violations by date, then student; each student may have multiple subject rows.
 */
export function prepareAttendanceOfficialData({
  records = [],
  violationTypes = {},
  metadata = {},
  lang = 'ar',
}) {
  const serial = buildViolationsOfficialSerial(metadata.programId);
  const issueDate = new Date().toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const filtered = records.filter((record) => {
    const code = getStatusCode(record);
    if (violationTypes.absentNoExcuse && code === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) return true;
    if (violationTypes.absentWithExcuse && code === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) return true;
    if (violationTypes.excusedLeave && code === ATTENDANCE_STATUS.EXCUSED_LEAVE) return true;
    if (violationTypes.late && code === ATTENDANCE_STATUS.LATE) return true;
    if (violationTypes.humanCase && code === ATTENDANCE_STATUS.HUMAN_CASE) return true;
    return false;
  });

  const byDate = {};
  filtered.forEach((record) => {
    const raw = record.date || record.at || record.createdAt;
    const dateKey =
      typeof raw === 'string'
        ? raw.split('T')[0]
        : new Date(raw).toISOString().split('T')[0];
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(record);
  });

  const dateGroups = Object.keys(byDate)
    .sort((a, b) => b.localeCompare(a))
    .map((dateKey) => {
      const studentMap = new Map();
      byDate[dateKey].forEach((record) => {
        const sid = String(record.userId ?? record.studentId ?? record.uid);
        const code = getStatusCode(record);
        const groupKey = `${sid}::${code}`;
        if (!studentMap.has(groupKey)) studentMap.set(groupKey, []);
        studentMap.get(groupKey).push(record);
      });

      const students = Array.from(studentMap.entries())
        .map(([, recs]) => {
          const first = recs[0];
          const studentName =
            first.studentName ||
            getLocalizedUserName(first.user, lang, first.user?.displayName || '');
          const statusCode = getStatusCode(first);
          const violationType = getViolationLabel(statusCode, lang);
          const subjectRows = recs.map((r) => {
            const code = getStatusCode(r);
            const subjectName =
              lang === 'ar'
                ? r.subject?.nameAr || r.subjectName || r.subject?.nameEn || ''
                : r.subject?.nameEn || r.subjectName || r.subject?.nameAr || '';
            const deduction = getDeductionForStatus(code, r.excuseApprovedAt);
            return {
              subjectName,
              deduction: formatDeduction(deduction),
              deductionRaw: deduction,
            };
          });
          return {
            studentName,
            violationType,
            subjectRows,
          };
        })
        .sort((a, b) => a.studentName.localeCompare(b.studentName, lang === 'ar' ? 'ar' : 'en'));

      let globalIndex = 0;
      const numberedStudents = students.map((s) => ({
        ...s,
        serial: ++globalIndex,
      }));

      return {
        dateKey,
        dateLabel: formatGroupDate(dateKey, lang),
        students: numberedStudents,
      };
    });

  // Global serial across all dates for display in first column
  let runningSerial = 0;
  dateGroups.forEach((dg) => {
    dg.students.forEach((s) => {
      s.serial = ++runningSerial;
    });
  });

  return {
    serial,
    lang,
    title:
      lang === 'ar' ? 'نموذج مخالفة سلوك / مواظبة' : 'Behavior / Attendance Violation Form',
    header: {
      serial,
      issueDate,
      program: metadata.programName || '',
      dateFrom: metadata.dateFrom || '',
      dateTo: metadata.dateTo || '',
    },
    dateGroups,
    watermarkUser: metadata.watermarkUser,
  };
}
