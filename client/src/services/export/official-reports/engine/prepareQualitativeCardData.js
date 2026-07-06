import {
  calculateGpaFromMarks,
  getGradePoints,
  getLocalizedTermDisplay,
  groupMarksBySemester,
  mergeComplementaryRecords,
  resolveMarkGrade,
} from '@constants/gradingStandards';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { buildSerialNumber } from './serialNumber.js';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { formatOfficialReportDate } from '../shared/officialDateFormat.js';

const SEMESTERS_PER_PAGE = 2;
const DEFAULT_CREDITS = 3;

function courseName(row, lang) {
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
  return '';
}

function semesterLabel(group, lang) {
  const term = group.semester || group.term || '';
  const year = group.year || extractYearFromTerm(term) || '';
  const termDisplay = getLocalizedTermDisplay(term, lang);
  if (lang === 'ar') return `فصل ${termDisplay} ${year}`.trim();
  return `${termDisplay} ${year}`.trim();
}

function buildSemesterBlock(courses, lang) {
  const gradedCourses = courses.map((row) => {
    const credits = row.credits || DEFAULT_CREDITS;
    const resolved = resolveMarkGrade({
      totalMarks: row.totalMarks,
      letterGrade: row.letterGrade,
      gradeType: row.gradeType,
      isRepeated: row.isRepeated,
      complementaryScore: row.finalExam,
      lang,
    });
    const points = resolved.points ?? getGradePoints(resolved.letter) ?? 0;
    const letter = resolved.letter || row.letterGrade || '—';
    const earnedHours = ['F', 'FB', 'FA'].includes(letter) ? 0 : credits;
    return {
      code: row.subjectCode || '',
      name: courseName(row, lang),
      credits,
      letterGrade: letter,
      pointsEarned: parseFloat((points * credits).toFixed(2)),
      hoursEarned: earnedHours,
    };
  });

  const { gpa, totalCredits } = calculateGpaFromMarks(courses);
  const earnedHours = gradedCourses.reduce((s, c) => s + c.hoursEarned, 0);
  const semesterPointsEarned = gradedCourses.reduce((s, c) => s + c.pointsEarned, 0);

  return {
    courses: gradedCourses,
    courseCount: gradedCourses.length,
    gpaHours: totalCredits,
    earnedHours,
    semesterGpa: gpa,
    semesterPointsEarned: parseFloat(semesterPointsEarned.toFixed(2)),
  };
}

/**
 * Build qualitative card (البطاقة النوعية) — GPA transcript grouped by student & semester.
 */
export function prepareQualitativeCardData({
  reportRows = [],
  metadata = {},
  lang = 'ar',
  studentIds = null,
  includeRepeated = false,
}) {
  const serial = buildSerialNumber(metadata.programId, { prefix: 'QC' });
  const isAr = lang === 'ar';

  const mergedAll = mergeComplementaryRecords(reportRows || []);
  let filtered = mergedAll.filter((row) => includeRepeated || !row.isRepeated);
  if (studentIds?.length) {
    const idSet = new Set(studentIds.map(String));
    filtered = filtered.filter((row) => idSet.has(String(row.studentId)));
  }

  const byStudent = new Map();
  filtered.forEach((row) => {
    if (!byStudent.has(row.studentId)) {
      const user = { displayName: row.studentName, displayNameAr: row.studentNameAr };
      byStudent.set(row.studentId, {
        studentId: row.studentId,
        studentNumber: row.studentNumber || '',
        studentName: getLocalizedUserName(user, lang, row.studentName || ''),
        rank: isAr ? (row.rankAr || row.rankEn || '—') : (row.rankEn || row.rankAr || '—'),
        programName: isAr
          ? (metadata.programNameAr || row.programName || metadata.programName)
          : (metadata.programName || row.programName),
        rows: [],
      });
    }
    byStudent.get(row.studentId).rows.push(row);
  });

  const students = Array.from(byStudent.values())
    .sort((a, b) => {
      const seqA = a.rows[0]?.sequence;
      const seqB = b.rows[0]?.sequence;
      if (seqA != null && seqB != null) return seqA - seqB;
      return String(a.studentName).localeCompare(String(b.studentName), isAr ? 'ar' : 'en');
    })
    .map((student) => {
      const semesterGroups = groupMarksBySemester(student.rows);

      let cumulativeCredits = 0;
      let cumulativeEarned = 0;
      let cumulativePoints = 0;
      let cumulativePointsEarned = 0;

      const semesters = semesterGroups.map((group) => {
        const block = buildSemesterBlock(group.courses, lang);
        cumulativeCredits += block.gpaHours;
        cumulativeEarned += block.earnedHours;
        cumulativePoints += block.semesterGpa * block.gpaHours;
        cumulativePointsEarned += block.semesterPointsEarned;
        const cumulativeGpa = cumulativeCredits > 0
          ? parseFloat((cumulativePoints / cumulativeCredits).toFixed(2))
          : 0;
        return {
          label: semesterLabel(group, lang),
          term: group.semester || group.term,
          year: group.year,
          ...block,
          cumulativeGpaHours: cumulativeCredits,
          cumulativeEarnedHours: cumulativeEarned,
          cumulativePointsEarned: parseFloat(cumulativePointsEarned.toFixed(2)),
          cumulativeGpa,
        };
      });

      const pages = [];
      for (let i = 0; i < semesters.length; i += SEMESTERS_PER_PAGE) {
        pages.push({
          semesters: semesters.slice(i, i + SEMESTERS_PER_PAGE),
          showHeader: i === 0,
          pageIndex: Math.floor(i / SEMESTERS_PER_PAGE),
        });
      }
      if (pages.length === 0) {
        pages.push({ semesters: [], showHeader: true, pageIndex: 0 });
      }

      return {
        ...student,
        semesters,
        pages,
        registrationLabel: isAr ? 'رقم القيد' : 'Registration No.',
        batchLabel: isAr ? 'الدفعة' : 'Batch',
        groupLabel: isAr ? 'المجموعة' : 'Group',
        registrationPlaceholder: '—',
        batchPlaceholder: isAr ? 'الأولى' : 'First',
        groupPlaceholder: isAr ? 'عام' : 'General',
      };
    });

  return {
    serial,
    lang,
    isAr,
    title: isAr ? 'البطاقة النوعية' : 'Qualitative Record Card',
    header: OFFICIAL_HEADER,
    academyNameAr: metadata.academyNameAr || 'أكاديمية الفضاء السيبراني',
    academyNameEn: metadata.academyNameEn || 'Cyber Space Academy',
    students,
    meta: {
      program: metadata.programName || '',
      generatedAt: formatOfficialReportDate(new Date()),
      serial,
    },
    watermarkUser: metadata.watermarkUser,
  };
}
