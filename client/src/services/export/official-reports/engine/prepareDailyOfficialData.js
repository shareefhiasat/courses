import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildDailyOfficialSerial } from './serialNumber.js';
import { formatOfficialReportDate, formatOfficialReportDateTime } from '../shared/officialDateFormat.js';

const OFFICIAL_STATUS_KEYS = ['present', 'absent', 'humanCase', 'excusedLeave'];

function getStatusCategory(statusCode, isStandup = false) {
  if (!statusCode || String(statusCode).trim() === '') return 'notTaken';
  const code = String(statusCode).toUpperCase().trim();
  if (isStandup) {
    if (code === ATTENDANCE_STATUS.STANDUP_PRESENT) return 'present';
    if (code === ATTENDANCE_STATUS.STANDUP_ABSENT) return 'absent';
    if (code === ATTENDANCE_STATUS.STANDUP_CLINIC) return 'humanCase';
    if (code === ATTENDANCE_STATUS.STANDUP_LATE) return 'late';
    return 'notTaken';
  }
  if (code === ATTENDANCE_STATUS.PRESENT) return 'present';
  if (code === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE || code === 'ABSENT' || code === 'ABSENT_NO_EXCUSE') return 'absent';
  if (code === ATTENDANCE_STATUS.LATE || code === 'LATE' || code === 'ATTENDANCE_LATE') return 'late';
  if (code === ATTENDANCE_STATUS.EXCUSED_LEAVE || code === 'ATTENDANCE_LEAVE' || code === 'EXCUSED' || code === 'EXCUSED_LEAVE' || code === 'ABSENT_WITH_EXCUSE' || code === 'SICK_LEAVE') return 'excusedLeave';
  if (code === ATTENDANCE_STATUS.HUMAN_CASE || code === 'HUMAN_CASE' || code === 'EARLY_DEPARTURE') return 'humanCase';
  if (code === 'NOT_TAKEN') return 'notTaken';
  return 'notTaken';
}

function marksFromCategory(category) {
  return {
    present: category === 'present',
    absent: category === 'absent',
    humanCase: category === 'humanCase',
    excusedLeave: category === 'excusedLeave',
  };
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
  participationByUserId = {},
  metadata = {},
  lang = 'ar',
  isStandup = false,
  isTemplate = false,
  minTemplateRows = DAILY_OFFICIAL_TEMPLATE_MIN_ROWS,
  includeNotes = true,
  includeParticipation = false,
}) {
  const scopeId = isStandup ? metadata.programId : metadata.classId;
  const serial = buildDailyOfficialSerial(scopeId, isStandup, metadata.date);

  const counts = {
    notTaken: 0,
    present: 0,
    absent: 0,
    humanCase: 0,
    excusedLeave: 0,
    late: 0,
  };

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
      const category = getStatusCategory(statusCode, isStandup);
      counts[category] += 1;
      const marks = marksFromCategory(category);
      const name = getLocalizedUserName(
        studentUser,
        lang,
        student.displayName || studentUser?.displayName || student.name || '',
      );
      const studentNumber = student.studentNumber || studentUser?.studentNumber || student.uid || '';

    const participationItems = participationByUserId[userId] || [];
    const participationText = includeParticipation
      ? (participationItems.length > 0 ? String(participationItems.length) : '')
      : '';
    return {
      serial: index + 1,
      studentNumber,
      studentName: name,
      notes: includeNotes ? (att.notes || student.notes || '') : '',
      participation: participationText,
      ...marks,
    };
  });

  const baseCounts = {
    present: counts.present,
    absent: counts.absent,
    humanCase: counts.humanCase,
    excusedLeave: counts.excusedLeave,
  };
  const extraCounts = {
    notTaken: counts.notTaken,
    late: counts.late,
  };

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
        participation: '',
        present: false,
        absent: false,
        humanCase: false,
        excusedLeave: false,
        isPlaceholder: true,
      })),
    ];
  }

  const isAr = lang === 'ar';
  const generatedAt = formatOfficialReportDateTime(new Date(), lang);

  return {
    serial,
    title: lang === 'ar' ? 'كشف الحضور اليومي الرسمي' : 'Official Daily Attendance Report',
    isStandup,
    isTemplate,
    showNotesColumn: includeNotes,
    showParticipationColumn: includeParticipation,
    lang,
    statusKeys: OFFICIAL_STATUS_KEYS,
    counts: { base: baseCounts, extra: extraCounts },
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
    watermarkStatus: metadata.watermarkStatus || null,
    approvedByUser: metadata.approvedByUser || null,
    approvedAt: metadata.approvedAt || null,
  };
}

export { OFFICIAL_STATUS_KEYS };
