import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDate, formatOfficialReportDateTime } from '../shared/officialDateFormat.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { getLocalizedTermDisplay } from '@constants/gradingStandards';

export const WARNING_TYPE = {
  FIRST: 'first',
  FINAL: 'final',
  DISMISSED: 'dismissed',
};

const FIRST_WARNING_THRESHOLD = 4;
const FINAL_WARNING_THRESHOLD = 8;
const DISMISSAL_THRESHOLD = 9;
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

function buildBody({ totalAbsences, unexcusedAbsences, term, warningType, isAr }) {
  const termDisplay = term || (isAr ? 'الحالي' : 'current');
  if (warningType === WARNING_TYPE.DISMISSED) {
    if (isAr) {
      return `نحيطك علماً بأنه قد تم تسجيل ${totalAbsences} غيابات عليك خلال فصل ${termDisplay}، منها ${unexcusedAbsences} غيابات غير مبررة. وبناءً على تكرار الغياب وعدم الالتزام بمتطلبات الحضور، فقد تقرر فصلك من البرنامج اعتباراً من تاريخ إصدار هذا القرار.`;
    }
    return `Please be informed that ${totalAbsences} absences have been recorded for you during the ${termDisplay} semester, including ${unexcusedAbsences} unexcused absences. Due to repeated absences and failure to comply with attendance requirements, a decision has been made to dismiss you from the program effective from the date of this decision.`;
  }
  const isFinal = warningType === WARNING_TYPE.FINAL;
  if (isAr) {
    return `نحيطك علماً بأنه قد تم تسجيل ${totalAbsences} غيابات عليك خلال فصل ${termDisplay}، منها ${unexcusedAbsences} غيابات غير مبررة. وبناءً على ذلك، فإن إدارة مدرسة الإشارة وتقنية المعلومات تُوجه إليك ${isFinal ? 'إنذاراً نهائياً' : 'إنذاراً أولاً'} بسبب تكرار الغياب. وفي حالة عدم الالتزام بالحضور في الوقت المحدد خلال الفترة القادمة، سوف يتم فصلك من البرنامج.`;
  }
  return `Please be informed that ${totalAbsences} absences have been recorded for you during the ${termDisplay} semester, including ${unexcusedAbsences} unexcused absences. Accordingly, the Signal and Information Technology School administration is issuing you a ${isFinal ? 'final warning' : 'first warning'} due to repeated absences. Failure to comply with attendance requirements on time during the upcoming period will result in dismissal from the program.`;
}

/**
 * Determine warning / dismissal type from unexcused absence count.
 * @param {number} totalAbsences - all non-present (absent, late, excused, human case)
 * @param {number} unexcusedAbsences - ATTENDANCE_ABSENT only
 */
export function resolveWarningType(totalAbsences, unexcusedAbsences) {
  const unexcused = unexcusedAbsences || 0;
  if (unexcused >= DISMISSAL_THRESHOLD) {
    return WARNING_TYPE.DISMISSED;
  }
  if (unexcused >= FINAL_WARNING_THRESHOLD) {
    return WARNING_TYPE.FINAL;
  }
  if (unexcused >= FIRST_WARNING_THRESHOLD) {
    return WARNING_TYPE.FIRST;
  }
  return null;
}

function buildWarningPage({
  student,
  metadata,
  warningType,
  lang,
  pageIndex,
}) {
  const isAr = lang === 'ar';
  const isFinal = warningType === WARNING_TYPE.FINAL;
  const isDismissed = warningType === WARNING_TYPE.DISMISSED;
  const user = {
    displayName: student.studentName,
    displayNameAr: student.studentNameAr,
  };

  // Official warning is based on the student's total in this class, not the current day/week slice.
  const totalAbsences = student.classTotalAbsences ?? student.totalAbsences ?? 0;
  const unexcusedAbsences = student.classUnexcusedAbsences ?? student.unexcusedAbsences ?? 0;
  const absences = (student.classAbsences ?? student.absences ?? [])
    .map((a) => ({
      date: a.date ? new Date(a.date) : null,
      statusCode: a.statusCode || '',
      excusedViaWorkflow: Boolean(a.excusedViaWorkflow),
      note: a.note || null,
    }))
    .filter((a) => a.date && !Number.isNaN(a.date.getTime()))
    .sort((a, b) => a.date - b.date);

  return {
    lang,
    isAr,
    pageIndex,
    serial: pageIndex + 1,
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
    totalAbsences,
    unexcusedAbsences,
    absences,
    absenceDatesLabel: isAr ? 'تواريخ الغيابات' : 'Absence Dates',
    absenceStatusLabels: {
      ATTENDANCE_ABSENT: isAr ? 'غائب' : 'Absent',
      ATTENDANCE_LEAVE: isAr ? 'استئذان' : 'Excused',
      ATTENDANCE_HUMAN_CASE: isAr ? 'حالة إنسانية' : 'Human Case',
    },
    title: isDismissed
      ? (isAr ? 'قرار فصل' : 'Class Dismissal')
      : isFinal
      ? (isAr ? 'إنذار نهائي' : 'Final Warning')
      : (isAr ? 'إنذار أول' : 'First Warning'),
    body: buildBody({
      totalAbsences,
      unexcusedAbsences,
      term: getLocalizedTermDisplay(metadata.term, lang),
      warningType,
      isAr,
    }),
    signatures: isDismissed
      ? [SIGNATURE_BLOCKS[2]]
      : isFinal
      ? [SIGNATURE_BLOCKS[2]]
      : [SIGNATURE_BLOCKS[1]],
    handoverDateLabel: isAr ? 'تاريخ التسليم' : 'Handover Date',
    handoverDateValue: isAr ? '________ / ________ / ٢٠٢٥ م' : '________ / ________ / 2025',
    studentSignatureLabel: isAr ? 'توقيع الطالب المستلم' : 'Student Signature',
  };
}

export function prepareAttendanceWarningData({
  students = [],
  metadata = {},
  lang = 'ar',
  warningType = WARNING_TYPE.FIRST,
  watermarkStatus = null,
  approvedByUser = null,
  approvedAt = null,
}) {
  const prefix =
    warningType === WARNING_TYPE.DISMISSED ? 'DIS' :
    warningType === WARNING_TYPE.FINAL ? 'FW' : 'W1';
  const serial = buildSerialNumber(metadata.classId, { prefix, date: metadata.date });

  const pages = students.flatMap((student, studentIndex) => {
    const arPage = buildWarningPage({
      student,
      metadata,
      warningType,
      lang: 'ar',
      pageIndex: studentIndex * 2,
    });
    const enPage = buildWarningPage({
      student,
      metadata,
      warningType,
      lang: 'en',
      pageIndex: studentIndex * 2 + 1,
    });
    return lang === 'ar' ? [arPage, enPage] : [enPage, arPage];
  });

  return {
    serial,
    lang,
    isAr: lang === 'ar',
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
      generatedAt: formatOfficialReportDateTime(new Date(), lang),
      serial,
    },
    watermarkUser: metadata.watermarkUser,
    watermarkStatus: watermarkStatus || metadata.watermarkStatus,
    approvedByUser: approvedByUser || metadata.approvedByUser,
    approvedAt: approvedAt || metadata.approvedAt,
  };
}

export { FIRST_WARNING_THRESHOLD, FINAL_WARNING_THRESHOLD, MAX_UNEXCUSED_FOR_FINAL };
