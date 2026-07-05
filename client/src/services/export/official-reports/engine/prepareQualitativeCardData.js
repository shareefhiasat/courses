import {
  calculateGpaFromMarks,
  getGradePoints,
  groupMarksBySemester,
  mergeComplementaryRecords,
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

function semesterLabel(group, lang) {
  const term = group.semester || group.term || '';
  const year = group.year || '';
  if (lang === 'ar') return `فصل ${term} ${year}`.trim();
  return `${term} ${year}`.trim();
}

function buildSemesterBlock(courses, lang) {
  const gradedCourses = courses.map((row) => {
    const credits = row.credits || DEFAULT_CREDITS;
    const points = getGradePoints(row.letterGrade) ?? row.gradePoints ?? 0;
    const earnedHours = row.letterGrade === 'F' || row.letterGrade === 'FB' || row.letterGrade === 'FA'
      ? 0
      : credits;
    return {
      code: row.subjectCode || '',
      name: courseName(row, lang),
      credits,
      letterGrade: row.letterGrade || '—',
      pointsEarned: parseFloat((points * credits).toFixed(1)),
      hoursEarned: earnedHours,
    };
  });

  const { gpa, totalCredits } = calculateGpaFromMarks(courses);
  const earnedHours = gradedCourses.reduce((s, c) => s + c.hoursEarned, 0);

  return {
    courses: gradedCourses,
    courseCount: gradedCourses.length,
    gpaHours: totalCredits,
    earnedHours,
    semesterGpa: gpa,
  };
}

/**
 * Build qualitative card (البطاقة النوعية) — GPA transcript grouped by student & semester.
 * PDF: 2 semesters per page per student; each student starts on a new page group.
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

  let filtered = (reportRows || []).filter((row) => includeRepeated || !row.isRepeated);
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
      const merged = mergeComplementaryRecords(student.rows);
      const semesterGroups = groupMarksBySemester(merged);

      let cumulativeCredits = 0;
      let cumulativeEarned = 0;
      let cumulativePoints = 0;

      const semesters = semesterGroups.map((group) => {
        const block = buildSemesterBlock(group.courses, lang);
        cumulativeCredits += block.gpaHours;
        cumulativeEarned += block.earnedHours;
        cumulativePoints += block.semesterGpa * block.gpaHours;
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
