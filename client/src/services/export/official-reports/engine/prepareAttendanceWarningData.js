import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDate } from '../shared/officialDateFormat.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { getLocalizedTermDisplay } from '@constants/gradingStandards';

export const WARNING_TYPE = {
  FIRST: 'first',
  FINAL: 'final',
};

const FIRST_WARNING_THRESHOLD = 4;
const FINAL_WARNING_THRESHOLD = 9;
const MAX_UNEXCUSED_FOR_FINAL = 4;

const SIGNATURE_BLOCKS = [
  {
    titleAr: 'المقدم (الركن) / رئيس شعبة تقنية المعلومات',
    titleEn: 'Lt. Col. (Staff) / Head of IT Branch',
    nameAr: 'مشعل علي الرويلي',
    nameEn: 'Mashal Ali Al-Ruwaili',
  },
  {
    titleAr: 'العميد (الركن) / كبير المعلمين',
    titleEn: 'Brig. Gen. (Staff) / Chief Instructor',
    nameAr: 'عبدالله محمد مطر الكواري',
    nameEn: 'Abdullah Mohammed Matar Al-Kuwari',
  },
  {
    titleAr: 'العميد (الركن) / قائد مدرسة الإشارة وتقنية المعلومات',
    titleEn: 'Brig. Gen. (Staff) / Commander, Signal & IT School',
    nameAr: 'صلاح عتيق سلمان جمعة',
    nameEn: 'Salah Atiq Salman Juma',
  },
];

function buildBody({ totalAbsences, unexcusedAbsences, term, isFinal, isAr }) {
  const termDisplay = term || (isAr ? 'الفصل الحالي' : 'the current semester');
  if (isAr) {
    return `نحيطك علماً بأنه قد تم تسجيل ${totalAbsences} غيابات عليك خلال فصل ${termDisplay}، منها ${unexcusedAbsences} غيابات غير مبررة. وبناءً على ذلك، فإن إدارة مدرسة الإشارة وتقنية المعلومات تُوجه إليك ${isFinal ? 'إنذاراً نهائياً' : 'إنذاراً أولاً'} بسبب تكرار الغياب. وفي حالة عدم الالتزام بالحضور في الوقت المحدد خلال الفترة القادمة، سوف يتم فصلك من البرنامج.`;
  }
  return `Please be informed that ${totalAbsences} absences have been recorded for you during the ${termDisplay} semester, including ${unexcusedAbsences} unexcused absences. Accordingly, the Signal and Information Technology School administration is issuing you a ${isFinal ? 'final warning' : 'first warning'} due to repeated absences. Failure to comply with attendance requirements on time during the upcoming period will result in dismissal from the program.`;
}

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
      className: isAr
        ? (metadata.classNameAr || metadata.className || student.className)
        : (metadata.className || student.className),
      totalAbsences: student.totalAbsences ?? 0,
      unexcusedAbsences: student.unexcusedAbsences ?? 0,
      title: isFinal
        ? (isAr ? 'إنذار نهائي' : 'Final Warning')
        : (isAr ? 'إنذار أول' : 'First Warning'),
      body: buildBody({
        totalAbsences: student.totalAbsences ?? 0,
        unexcusedAbsences: student.unexcusedAbsences ?? 0,
        term: getLocalizedTermDisplay(metadata.term, lang),
        isFinal,
        isAr,
      }),
      signatures: isFinal ? [SIGNATURE_BLOCKS[2]] : [SIGNATURE_BLOCKS[1]],
      handoverDateLabel: isAr ? 'تاريخ التسليم' : 'Handover Date',
      handoverDateValue: isAr ? ' / / ٢٠٢٥ م' : '___ / ___ / 2025',
      studentSignatureLabel: isAr ? 'توقيع الطالب المستلم' : 'Student Signature',
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
      classNameAr: metadata.classNameAr || '',
      subject: metadata.subjectName || '',
      subjectNameAr: metadata.subjectNameAr || '',
      program: metadata.programName || '',
      programNameAr: metadata.programNameAr || '',
      generatedAt: formatOfficialReportDate(new Date()),
      serial,
    },
    watermarkUser: metadata.watermarkUser,
  };
}

export { FIRST_WARNING_THRESHOLD, FINAL_WARNING_THRESHOLD, MAX_UNEXCUSED_FOR_FINAL };
