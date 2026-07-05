import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDate } from '../shared/officialDateFormat.js';
import { roundMarks } from '../shared/roundMarks.js';

const DEFAULT_DISTRIBUTION = {
  homework: 5,
  participation: 10,
  quizzes: 5,
  labsProjectResearch: 10,
  attendance: 10,
  midTermExam: 20,
  finalExam: 40,
};

const FAIL_THRESHOLD = 60;

function continuousTotal(row) {
  return (
    (parseFloat(row.homework) || 0) +
    (parseFloat(row.participation) || 0) +
    (parseFloat(row.quizzes) || 0) +
    (parseFloat(row.labsProjectResearch) || 0) +
    (parseFloat(row.attendance) || 0) +
    (parseFloat(row.midTermExam) || 0)
  );
}

/**
 * Build per-subject class marks breakdown (distribution columns).
 */
export function prepareClassSubjectMarksData({
  reportRows = [],
  distribution = null,
  metadata = {},
  lang = 'ar',
  includeRepeated = false,
}) {
  const dist = { ...DEFAULT_DISTRIBUTION, ...(distribution || {}) };
  const serial = buildSerialNumber(metadata.classId, { prefix: 'CS' });
  const isAr = lang === 'ar';

  const filteredRows = (reportRows || []).filter((row) => includeRepeated || !row.isRepeated);

  const rows = filteredRows
    .slice()
    .sort((a, b) => {
      if (a.sequence != null && b.sequence != null) return a.sequence - b.sequence;
      if (a.sequence != null) return -1;
      if (b.sequence != null) return 1;
      const nameA = isAr ? (a.studentNameAr || a.studentName) : a.studentName;
      const nameB = isAr ? (b.studentNameAr || b.studentName) : b.studentName;
      return String(nameA).localeCompare(String(nameB), isAr ? 'ar' : 'en');
    })
    .map((row, index) => {
      const user = {
        displayName: row.studentName,
        displayNameAr: row.studentNameAr,
      };
      const total = parseFloat(row.totalMarks);
      const continuous = roundMarks(continuousTotal(row));
      const grand = roundMarks(row.totalMarks);
      return {
        rowKey: `${row.studentId}-${row.classId}-${row.year}-${row.term}-${row.isRepeated ? 'R' : 'F'}`,
        serial: index + 1,
        studentId: row.studentId,
        studentNumber: row.studentNumber || '',
        studentName: getLocalizedUserName(user, lang, row.studentName || ''),
        year: row.year || '',
        term: row.term || '',
        isRepeated: row.isRepeated || false,
        homework: roundMarks(row.homework ?? 0),
        participation: roundMarks(row.participation ?? 0),
        quizzes: roundMarks(row.quizzes ?? 0),
        labsProjectResearch: roundMarks(row.labsProjectResearch ?? 0),
        attendance: roundMarks(row.attendance ?? 0),
        midTermExam: roundMarks(row.midTermExam ?? 0),
        continuousTotal: continuous,
        finalExam: roundMarks(row.finalExam ?? 0),
        grandTotal: grand,
        letterGrade: row.letterGrade,
        failed: !Number.isNaN(total) && total < FAIL_THRESHOLD,
      };
    });

  const programName = isAr
    ? (metadata.programNameAr || metadata.programName || '')
    : (metadata.programName || metadata.programNameAr || '');
  const subjectName = isAr
    ? (metadata.subjectNameAr || metadata.subjectName || '')
    : (metadata.subjectName || metadata.subjectNameAr || '');

  return {
    serial,
    lang,
    isAr,
    title: isAr ? 'كشف درجات المادة' : 'Subject Marks Report',
    header: OFFICIAL_HEADER,
    distribution: dist,
    rows,
    meta: {
      program: programName,
      subject: subjectName,
      className: metadata.className || '',
      year: metadata.year || '',
      term: metadata.term || '',
      generatedAt: formatOfficialReportDate(new Date()),
      serial,
    },
    failThreshold: FAIL_THRESHOLD,
    watermarkUser: metadata.watermarkUser,
  };
}

export function buildClassSubjectMarksSerial(classId) {
  return buildSerialNumber(classId, { prefix: 'CS' });
}
