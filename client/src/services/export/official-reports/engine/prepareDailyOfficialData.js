import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildDailyOfficialSerial } from './serialNumber.js';

const OFFICIAL_STATUS_KEYS = ['present', 'absent', 'humanCase', 'late'];

function mapRegularStatus(statusCode) {
  const marks = { present: false, absent: false, humanCase: false, late: false };
  if (!statusCode) return marks;
  const code = String(statusCode).toUpperCase();
  if (code === ATTENDANCE_STATUS.PRESENT) marks.present = true;
  else if (code === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) marks.absent = true;
  else if (code === ATTENDANCE_STATUS.HUMAN_CASE) marks.humanCase = true;
  else if (code === ATTENDANCE_STATUS.LATE) marks.late = true;
  return marks;
}

function mapStandupStatus(statusCode) {
  const marks = { present: false, absent: false, humanCase: false, late: false };
  if (!statusCode) return marks;
  const code = String(statusCode).toUpperCase();
  if (code === ATTENDANCE_STATUS.STANDUP_PRESENT) marks.present = true;
  else if (code === ATTENDANCE_STATUS.STANDUP_ABSENT) marks.absent = true;
  else if (code === ATTENDANCE_STATUS.STANDUP_CLINIC) marks.humanCase = true;
  else if (code === ATTENDANCE_STATUS.STANDUP_LATE) marks.late = true;
  return marks;
}

function formatReportDate(dateStr, lang) {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Build normalized payload for Daily Official report templates/renderers.
 */
export function prepareDailyOfficialData({
  roster = [],
  attendanceByUserId = {},
  metadata = {},
  lang = 'ar',
  isStandup = false,
}) {
  const scopeId = isStandup ? metadata.programId : metadata.classId;
  const serial = buildDailyOfficialSerial(scopeId, isStandup);
  const mapStatus = isStandup ? mapStandupStatus : mapRegularStatus;

  const rows = roster.map((student, index) => {
    const userId = String(student.id ?? student.userId ?? student.studentId);
    const att = attendanceByUserId[userId] || {};
    const statusCode = att.status?.code || att.status || student.attendance || student.standupStatus;
    const marks = mapStatus(statusCode);
    const name = getLocalizedUserName(student, lang, student.displayName || student.name || '');
    const studentNumber = student.studentNumber || student.uid || '';

    return {
      serial: index + 1,
      studentNumber,
      studentName: name,
      notes: att.notes || student.notes || '',
      ...marks,
    };
  });

  return {
    serial,
    title: lang === 'ar' ? 'كشف الحضور اليومي الرسمي' : 'Official Daily Attendance Report',
    isStandup,
    lang,
    statusKeys: OFFICIAL_STATUS_KEYS,
    header: {
      serial,
      date: formatReportDate(metadata.date, lang),
      program: metadata.programName || '',
      subject: metadata.subjectName || '',
      className: metadata.className || '',
      year: metadata.year || '',
      term: metadata.term || '',
      instructor: metadata.instructorName || '',
    },
    rows,
    watermarkUser: metadata.watermarkUser,
  };
}

export { OFFICIAL_STATUS_KEYS };
