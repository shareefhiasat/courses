import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDate } from '../shared/officialDateFormat.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';

export const WARNING_TYPE = {
  FIRST: 'first',
  FINAL: 'final',
};

const FIRST_WARNING_THRESHOLD = 4;
const FINAL_WARNING_THRESHOLD = 9;
const MAX_UNEXCUSED_FOR_FINAL = 4;

const FIRST_WARNING_BODY_AR =
  'أوجه لك هذا الإنذار وذلك بسبب تكرار الغياب وفي حالة عدم الإلتزام بالحضور في الوقت المحدد خلال الفترة القادمة سوف يتم فصلك من البرنامج.';

const FINAL_WARNING_BODY_AR =
  'أوجه لك هذا الإنذار النهائي وذلك بسبب تكرار الغياب، وفي حالة عدم الإلتزام بالحضور في الوقت المحدد خلال الفترة القادمة سوف يتم فصلك من البرنامج.';

/**
 * Determine warning type from absence counts.
 * @param {number} totalAbsences - all non-present (absent, late, excused, human case)
 * @param {number} unexcusedAbsences - ATTENDANCE_ABSENT only
 */
export function resolveWarningType(totalAbsences, unexcusedAbsences) {
  const total = totalAbsences || 0;
  const unexcused = unexcusedAbsences || 0;
  if (total >= FINAL_WARNING_THRESHOLD) {
    return unexcused <= MAX_UNEXCUSED_FOR_FINAL ? WARNING_TYPE.FINAL : null;
  }
  if (total >= FIRST_WARNING_THRESHOLD) {
    return WARNING_TYPE.FIRST;
  }
  return null;
}

export function prepareAttendanceWarningData({
  students = [],
  metadata = {},
  lang = 'ar',
  warningType = WARNING_TYPE.FIRST,
}) {
  const serial = buildSerialNumber(metadata.classId, { prefix: warningType === WARNING_TYPE.FINAL ? 'FW' : 'W1' });
  const isAr = lang === 'ar';

  const pages = students.map((student, index) => {
    const user = {
      displayName: student.studentName,
      displayNameAr: student.studentNameAr,
    };
    const isFinal = warningType === WARNING_TYPE.FINAL;
    return {
      serial: index + 1,
      studentId: student.studentId,
      studentNumber: student.studentNumber || '',
      studentName: getLocalizedUserName(user, lang, student.studentName || ''),
      rank: isAr ? (student.rankAr || student.rankEn || '—') : (student.rankEn || student.rankAr || '—'),
      programName: isAr
        ? (metadata.programNameAr || metadata.programName || student.programName)
        : (metadata.programName || student.programName),
      subjectName: isAr
        ? (metadata.subjectNameAr || metadata.subjectName || student.subjectName)
        : (metadata.subjectName || student.subjectName),
      totalAbsences: student.totalAbsences ?? 0,
      unexcusedAbsences: student.unexcusedAbsences ?? 0,
      title: isFinal
        ? (isAr ? 'إنذار نهائي' : 'Final Warning')
        : (isAr ? 'إنذار أول' : 'First Warning'),
      body: isFinal ? FINAL_WARNING_BODY_AR : FIRST_WARNING_BODY_AR,
      signerTitle: isFinal
        ? (isAr ? 'العميد (الركن) / قائد مدرسة الإشارة وتقنية المعلومات' : 'Brig. Gen. (Staff) / Commander, Signal & IT School')
        : (isAr ? 'العميد (الركن) / كبير المعلمين' : 'Brig. Gen. (Staff) / Chief Instructor'),
      signerName: isFinal
        ? (isAr ? 'صلاح عتيق سلمان جمعة' : 'Salah Atiq Salman Juma')
        : (isAr ? 'عبدالله محمد مطر الكواري' : 'Abdullah Mohammed Matar Al-Kuwari'),
    };
  });

  return {
    serial,
    lang,
    isAr,
    warningType,
    header: OFFICIAL_HEADER,
    pages,
    meta: {
      className: metadata.className || '',
      subject: metadata.subjectName || '',
      program: metadata.programName || '',
      generatedAt: formatOfficialReportDate(new Date()),
      serial,
    },
    watermarkUser: metadata.watermarkUser,
  };
}

export { FIRST_WARNING_THRESHOLD, FINAL_WARNING_THRESHOLD, MAX_UNEXCUSED_FOR_FINAL };
