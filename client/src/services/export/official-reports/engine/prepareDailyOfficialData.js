import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildDailyOfficialSerial } from './serialNumber.js';
import { formatOfficialReportDate } from '../shared/officialDateFormat.js';

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

function formatReportDate(dateStr) {
  return formatOfficialReportDate(dateStr);
}

function normalizeInstructorName(raw, lang) {
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object') return getLocalizedUserName(raw, lang, '');
  return '';
}

function resolveStudentUser(student) {
  return student?.user || student;
}

/** Minimum body rows so blank daily official templates fill an A4 page for printing. */
export const DAILY_OFFICIAL_TEMPLATE_MIN_ROWS = 36;

/**
 * Build normalized payload for Daily Official report templates/renderers.
 */
export function prepareDailyOfficialData({
  roster = [],
  attendanceByUserId = {},
  metadata = {},
  lang = 'ar',
  isStandup = false,
  isTemplate = false,
  minTemplateRows = DAILY_OFFICIAL_TEMPLATE_MIN_ROWS,
}) {
  const scopeId = isStandup ? metadata.programId : metadata.classId;
  const serial = buildDailyOfficialSerial(scopeId, isStandup);
  const mapStatus = isStandup ? mapStandupStatus : mapRegularStatus;

  const rows = roster
    .slice()
    .sort((a, b) => {
      const seqA = a.sequence ?? a.studentOrder ?? null;
      const seqB = b.sequence ?? b.studentOrder ?? null;
      if (seqA != null && seqB != null) return seqA - seqB;
      if (seqA != null) return -1;
      if (seqB != null) return 1;
      const userA = resolveStudentUser(a);
      const userB = resolveStudentUser(b);
      const nameA = getLocalizedUserName(userA, lang, a.displayName || a.name || '');
      const nameB = getLocalizedUserName(userB, lang, b.displayName || b.name || '');
      return nameA.localeCompare(nameB, lang === 'ar' ? 'ar' : 'en');
    })
    .map((student, index) => {
      const studentUser = resolveStudentUser(student);
      const userId = String(student.id ?? student.userId ?? student.studentId ?? studentUser?.id);
      const att = attendanceByUserId[userId] || {};
      const statusCode = att.status?.code || att.status || student.attendance || student.standupStatus;
      const marks = mapStatus(statusCode);
      const name = getLocalizedUserName(
        studentUser,
        lang,
        student.displayName || studentUser?.displayName || student.name || '',
      );
      const studentNumber = student.studentNumber || studentUser?.studentNumber || student.uid || '';

    return {
      serial: index + 1,
      studentNumber,
      studentName: name,
      notes: att.notes || student.notes || '',
      ...marks,
    };
  });

  let finalRows = rows;
  if (isTemplate) {
    const padCount = Math.max(0, minTemplateRows - rows.length);
    finalRows = [
      ...rows,
      ...Array.from({ length: padCount }, (_, i) => ({
        serial: rows.length + i + 1,
        studentNumber: '',
        studentName: '',
        notes: '',
        present: false,
        absent: false,
        humanCase: false,
        late: false,
        isPlaceholder: true,
      })),
    ];
  }

  const isAr = lang === 'ar';
  const generatedAt = new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    serial,
    title: lang === 'ar' ? 'كشف الحضور اليومي الرسمي' : 'Official Daily Attendance Report',
    isStandup,
    isTemplate,
    lang,
    statusKeys: OFFICIAL_STATUS_KEYS,
    generatedAt,
    header: {
      serial,
      date: formatReportDate(metadata.date),
      program: metadata.programName || '',
      subject: metadata.subjectName || '',
      className: metadata.className || '',
      year: metadata.year || '',
      term: metadata.term || '',
      instructor: normalizeInstructorName(metadata.instructorName, lang),
    },
    rows: finalRows,
    watermarkUser: metadata.watermarkUser,
  };
}

export { OFFICIAL_STATUS_KEYS };
