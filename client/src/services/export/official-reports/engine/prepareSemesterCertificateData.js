import { GRADING_STANDARDS, calculateGpaFromMarks } from '@constants/gradingStandards';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDate } from '../shared/officialDateFormat.js';

const FAIL_THRESHOLD = 60;

function subjectLabel(row, lang) {
  if (lang === 'ar') return row.subjectNameAr || row.subjectName || row.subjectCode || '';
  return row.subjectName || row.subjectNameAr || row.subjectCode || '';
}

/**
 * Pivot marks report rows into semester certificate layout (all subjects per student).
 */
export function prepareSemesterCertificateData({
  reportRows = [],
  metadata = {},
  lang = 'ar',
  includeRepeated = false,
}) {
  const serial = buildSerialNumber(metadata.programId, { prefix: 'SC' });
  const isAr = lang === 'ar';

  const filteredRows = (reportRows || []).filter((row) => includeRepeated || !row.isRepeated);

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
    const marks = parseFloat(row.totalMarks);
    entry.subjectMarks[row.subjectId] = {
      totalMarks: row.totalMarks,
      letterGrade: row.letterGrade,
      gradeDescription: isAr ? row.gradeDescriptionAr : row.gradeDescriptionEn,
      failed: !Number.isNaN(marks) && marks < FAIL_THRESHOLD,
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
        semesterGpa: gpa,
      };
    });

  const programName = isAr
    ? (metadata.programNameAr || metadata.programName || '')
    : (metadata.programName || metadata.programNameAr || '');

  const title = isAr
    ? `نتائج ${metadata.examLabelAr || 'اختبار منتصف الفصل'} — ${metadata.termLabelAr || metadata.term || ''} (${metadata.year || ''})`
    : `${metadata.examLabelEn || 'Mid-term Exam Results'} — ${metadata.term || ''} (${metadata.year || ''})`;

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
      generatedAt: formatOfficialReportDate(new Date()),
      serial,
    },
    failThreshold: FAIL_THRESHOLD,
    watermarkUser: metadata.watermarkUser,
  };
}

export function buildSemesterCertificateSerial(programId) {
  return buildSerialNumber(programId, { prefix: 'SC' });
}
