import { ATTENDANCE_STATUS, getStatusCodeFromRecord } from '@constants/attendanceTypes';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildViolationsOfficialSerial } from './serialNumber.js';
import { formatDeduction, getDeductionForStatus } from '../shared/deductionDisplay.js';
import { formatOfficialReportDate } from '../shared/officialDateFormat.js';

const VIOLATION_LABELS = {
  ar: {
    [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'غياب بدون عذر',
    [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'غياب معذور',
    [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'استئذان',
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

function formatGroupDate(dateKey) {
  return formatOfficialReportDate(dateKey);
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
  const issueDate = formatOfficialReportDate(new Date());

  const filtered = records.filter((record) => {
    const code = getStatusCode(record);
    if (violationTypes.absentNoExcuse && code === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) return true;
    if (violationTypes.absentWithExcuse && code === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) return true;
    if (violationTypes.excusedLeave && code === ATTENDANCE_STATUS.EXCUSED_LEAVE) return true;
    if (violationTypes.late && code === ATTENDANCE_STATUS.LATE) return true;
    if (violationTypes.humanCase && code === ATTENDANCE_STATUS.HUMAN_CASE) return true;
    return false;
  });

  // Group by student first, then by date, then by subject within each date
  const byStudent = new Map();
  filtered.forEach((record) => {
    const sid = String(record.userId ?? record.studentId ?? record.uid);
    if (!byStudent.has(sid)) byStudent.set(sid, []);
    byStudent.get(sid).push(record);
  });

  const dateGroups = [];
  let runningSerial = 0;

  Array.from(byStudent.entries())
    .map(([sid, recs]) => {
      const first = recs[0];
      const studentName = getLocalizedUserName(
        first.user || first,
        lang,
        first.studentName || first.user?.displayName || ''
      );
      const studentNumber = first.user?.studentNumber || first.studentNumber || '';
      return { sid, recs, studentName, studentNumber };
    })
    .sort((a, b) => {
      // Sort by student name
      return a.studentName.localeCompare(b.studentName, lang === 'ar' ? 'ar' : 'en');
    })
    .forEach(({ sid, recs, studentName, studentNumber }) => {
      // Group this student's records by date
      const byDate = new Map();
      recs.forEach((record) => {
        const raw = record.date || record.at || record.createdAt;
        const dateKey =
          typeof raw === 'string'
            ? raw.split('T')[0]
            : new Date(raw).toISOString().split('T')[0];
        if (!byDate.has(dateKey)) byDate.set(dateKey, []);
        byDate.get(dateKey).push(record);
      });

      // Sort dates descending (most recent first)
      Array.from(byDate.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .forEach(([dateKey, dateRecs]) => {
          // Group by violation type within this date
          const byViolation = new Map();
          dateRecs.forEach((record) => {
            const code = getStatusCode(record);
            const groupKey = `${sid}::${code}`;
            if (!byViolation.has(groupKey)) byViolation.set(groupKey, []);
            byViolation.get(groupKey).push(record);
          });

          const students = Array.from(byViolation.entries())
            .map(([, vRecs]) => {
              const first = vRecs[0];
              const statusCode = getStatusCode(first);
              const violationType = getViolationLabel(statusCode, lang);
              const subjectRows = vRecs.map((r) => {
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
              }).sort((a, b) => a.subjectName.localeCompare(b.subjectName, lang === 'ar' ? 'ar' : 'en'));
              return {
                studentName,
                studentNumber,
                violationType,
                subjectRows,
                serial: ++runningSerial,
              };
            });

          dateGroups.push({
            dateKey,
            dateLabel: formatGroupDate(dateKey),
            students,
          });
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
      dateFrom: formatOfficialReportDate(metadata.dateFrom) || metadata.dateFrom || '',
      dateTo: formatOfficialReportDate(metadata.dateTo) || metadata.dateTo || '',
    },
    dateGroups,
    watermarkUser: metadata.watermarkUser,
  };
}
