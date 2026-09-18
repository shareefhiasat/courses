import {
  GRADING_STANDARDS,
  GRADE_TYPE,
  calculateGpaFromMarks,
  getLocalizedTermDisplay,
  mergeComplementaryRecords,
  resolveMarkGrade,
  getOriginalMark,
  calculateLetterGrade,
} from '@constants/gradingStandards';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDate, formatOfficialReportDateTime } from '../shared/officialDateFormat.js';

const FAIL_THRESHOLD = 60;

const round2 = (value) => {
  const num = parseFloat(value);
  return Number.isNaN(num) ? value : Number(num.toFixed(2));
};

function subjectLabel(row, lang) {
  if (lang === 'ar') return row.subjectNameAr || row.subjectName || row.subjectCode || '';
  return row.subjectName || row.subjectNameAr || row.subjectCode || '';
}

function extractYearFromTerm(term) {
  if (!term) return '';
  const termStr = String(term);
  if (termStr.includes('-')) {
    const yearPart = termStr.split('-')[0];
    if (!Number.isNaN(Number(yearPart))) return yearPart;
  }
  if (termStr.includes(' ')) {
    const yearPart = termStr.split(' ').find((p) => !Number.isNaN(Number(p)));
    if (yearPart) return yearPart;
  }
  return '';
}

function buildCertificatePeriodLabel(term, year, lang) {
  const termDisplay = getLocalizedTermDisplay(term, lang);
  const embeddedYear = extractYearFromTerm(term);
  const displayYear = year || embeddedYear || '';
  if (termDisplay && displayYear) return `${termDisplay} ${displayYear}`;
  return termDisplay || displayYear || '';
}

/**
 * Pivot marks report rows into semester certificate layout (all subjects per student).
 */
export function prepareSemesterCertificateData({
  reportRows = [],
  metadata = {},
  lang = 'ar',
  studentIds = null,
  includeRepeated = false,
}) {
  const serial = buildSerialNumber(metadata.programId, { prefix: 'SC' });
  const isAr = lang === 'ar';

  const mergedRows = mergeComplementaryRecords(reportRows || []);
  let filteredRows = mergedRows.filter((row) => includeRepeated || !row.isRepeated);
  if (studentIds?.length) {
    const idSet = new Set(studentIds.map(String));
    filteredRows = filteredRows.filter((row) => idSet.has(String(row.studentId)));
  }

  const subjectMap = new Map();
  filteredRows.forEach((row) => {
    if (!subjectMap.has(row.subjectId)) {
      subjectMap.set(row.subjectId, {
        id: row.subjectId,
        code: row.subjectCode,
        name: subjectLabel(row, lang),
      });
    }
  });
  const subjects = Array.from(subjectMap.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), isAr ? 'ar' : 'en')
  );

  const studentMap = new Map();
  filteredRows.forEach((row) => {
    const key = row.studentId;
    if (!studentMap.has(key)) {
      const user = {
        displayName: row.studentName,
        displayNameAr: row.studentNameAr,
        firstNameAr: row.studentNameAr,
      };
      studentMap.set(key, {
        studentId: row.studentId,
        studentNumber: row.studentNumber || '',
        studentName: getLocalizedUserName(user, lang, row.studentName || ''),
        rank: isAr ? (row.rankAr || row.rankEn || '—') : (row.rankEn || row.rankAr || '—'),
        sequence: row.sequence ?? null,
        subjectMarks: {},
        marksRows: [],
      });
    }
    const entry = studentMap.get(key);
    const resolved = resolveMarkGrade({
      totalMarks: row.totalMarks,
      letterGrade: row.letterGrade,
      gradeType: row.gradeType,
      isRepeated: row.isRepeated,
      complementaryScore: row.finalExam,
      lang,
    });
    const displayMarks = round2(resolved.totalMarks ?? row.totalMarks);
    const marks = parseFloat(displayMarks);
    const isComplementary = row.gradeType === GRADE_TYPE.COMPLEMENTARY;
    const originalMark = getOriginalMark(row);
    entry.subjectMarks[row.subjectId] = {
      totalMarks: displayMarks,
      letterGrade: resolved.letter || row.letterGrade,
      gradeDescription: resolved.gradeDescription || (isAr ? row.gradeDescriptionAr : row.gradeDescriptionEn),
      failed: isComplementary ? !resolved.passed : (!Number.isNaN(marks) && marks < FAIL_THRESHOLD),
      gradeType: row.gradeType,
      complementaryScore: isComplementary ? round2(row.finalExam) : null,
      originalMark: originalMark != null ? round2(originalMark) : null,
      previousAttempt: row.previousAttempt
        ? {
            totalMarks: round2(row.previousAttempt.totalMarks ?? originalMark),
            letterGrade: row.previousAttempt.letterGrade,
            finalExam: row.previousAttempt.finalExam,
          }
        : (originalMark != null && isComplementary
          ? {
              totalMarks: round2(originalMark),
              letterGrade: calculateLetterGrade(originalMark).letter,
            }
          : null),
    };
    entry.marksRows.push(row);
  });

  const rows = Array.from(studentMap.values())
    .sort((a, b) => {
      if (a.sequence != null && b.sequence != null) return a.sequence - b.sequence;
      if (a.sequence != null) return -1;
      if (b.sequence != null) return 1;
      return String(a.studentName).localeCompare(String(b.studentName), isAr ? 'ar' : 'en');
    })
    .map((student, index) => {
      const { gpa } = calculateGpaFromMarks(student.marksRows);
      return {
        serial: index + 1,
        studentId: student.studentId,
        studentNumber: student.studentNumber,
        studentName: student.studentName,
        rank: student.rank,
        subjectMarks: student.subjectMarks,
        semesterGpa: round2(gpa),
      };
    });

  const programName = isAr
    ? (metadata.programNameAr || metadata.programName || '')
    : (metadata.programName || metadata.programNameAr || '');

  const periodLabel = buildCertificatePeriodLabel(metadata.term, metadata.year, lang);
  const examLabel = isAr
    ? (metadata.examLabelAr || 'شهادة الفصل')
    : (metadata.examLabelEn || 'Semester Certificate');
  const title = periodLabel ? `${examLabel} — ${periodLabel}` : examLabel;

  return {
    serial,
    lang,
    isAr,
    title,
    subtitle: programName,
    header: OFFICIAL_HEADER,
    subjects,
    rows,
    gradingScale: GRADING_STANDARDS.FIRST_ATTEMPT.grades,
    signatures: metadata.signatures || [],
    meta: {
      program: programName,
      year: metadata.year || '',
      term: metadata.term || '',
      generatedAt: formatOfficialReportDateTime(new Date(), lang),
      serial,
    },
    failThreshold: FAIL_THRESHOLD,
    watermarkUser: metadata.watermarkUser,
  };
}

export function buildSemesterCertificateSerial(programId) {
  return buildSerialNumber(programId, { prefix: 'SC' });
}
