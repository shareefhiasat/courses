/**
 * Academic grading standards — matches official military LMS regulations.
 * Keep in sync with backend/utils/formatting/gradingStandards.js
 */

export const GRADE_TYPE = {
  CALCULATED: 'calculated',
  COMPLEMENTARY: 'complementary',
};

export const GRADING_STANDARDS = {
  FIRST_ATTEMPT: {
    name: 'First Attempt',
    nameAr: 'المحاولة الأولى',
    grades: [
      { min: 90, max: 100, letter: 'A', points: 4, description: 'Excellent', descriptionAr: 'ممتاز' },
      { min: 85, max: 89.99, letter: 'B+', points: 3.5, description: 'Very Good High', descriptionAr: 'جيد جداً مرتفع' },
      { min: 80, max: 84.99, letter: 'B', points: 3, description: 'Very Good', descriptionAr: 'جيد جداً' },
      { min: 75, max: 79.99, letter: 'C+', points: 2.5, description: 'Good High', descriptionAr: 'جيد مرتفع' },
      { min: 70, max: 74.99, letter: 'C', points: 2, description: 'Good', descriptionAr: 'جيد' },
      { min: 65, max: 69.99, letter: 'D+', points: 1.5, description: 'Accepted High', descriptionAr: 'مقبول مرتفع' },
      { min: 60, max: 64.99, letter: 'D', points: 1, description: 'Accepted', descriptionAr: 'مقبول' },
      { min: 0, max: 59.99, letter: 'F', points: 0, description: 'Fail', descriptionAr: 'راسب' },
    ],
  },
  REPEATED_ATTEMPT: {
    name: 'Repeated Attempt',
    nameAr: 'إعادة المقرر',
    grades: [
      { min: 85, max: 100, letter: 'B+', points: 3.5, description: 'Very Good High', descriptionAr: 'جيد جداً مرتفع' },
      { min: 80, max: 84.99, letter: 'B', points: 3, description: 'Very Good', descriptionAr: 'جيد جداً' },
      { min: 75, max: 79.99, letter: 'C+', points: 2.5, description: 'Good High', descriptionAr: 'جيد مرتفع' },
      { min: 70, max: 74.99, letter: 'C', points: 2, description: 'Good', descriptionAr: 'جيد' },
      { min: 65, max: 69.99, letter: 'D+', points: 1.5, description: 'Accepted High', descriptionAr: 'مقبول مرتفع' },
      { min: 60, max: 64.99, letter: 'D', points: 1, description: 'Accepted', descriptionAr: 'مقبول' },
      { min: 0, max: 59.99, letter: 'F', points: 0, description: 'Fail', descriptionAr: 'راسب' },
    ],
  },
};

export const MANUAL_GRADES = [
  { letter: 'WF', description: 'Compulsory Withdrawal', descriptionAr: 'انسحاب إجباري', points: null },
  { letter: 'FA', description: 'Fail — absent from final exam', descriptionAr: 'رسوب بسبب الغياب عن الاختبار النهائي', points: 0 },
  { letter: 'FB', description: 'Fail — absence exceeds 20%', descriptionAr: 'رسوب بسبب تجاوز نسبة الغياب (20%)', points: 0 },
];

export const COMPLEMENTARY_GRADE = {
  passMin: 60,
  passLetter: 'D',
  passPoints: 1,
  passDisplayMarks: 60,
  failLetter: 'F',
  failPoints: 0,
  description: 'Accepted (Complementary Exam)',
  descriptionAr: 'مقبول (اختبار تكميلي)',
};

/** Cumulative GPA standing labels (المعدل العام) */
export const GPA_STANDINGS = [
  { min: 3.6, max: 4.0, letter: 'A', description: 'Excellent', descriptionAr: 'ممتاز' },
  { min: 2.8, max: 3.59, letter: 'B', description: 'Very Good', descriptionAr: 'جيد جداً' },
  { min: 2.0, max: 2.79, letter: 'C', description: 'Good', descriptionAr: 'جيد' },
  { min: 1.5, max: 1.99, letter: 'D', description: 'Accepted', descriptionAr: 'مقبول' },
  { min: 0, max: 1.49, letter: 'F', description: 'Weak', descriptionAr: 'ضعيف' },
];

export function calculateLetterGrade(totalMarks, isRepeated = false) {
  if (typeof totalMarks === 'string' && MANUAL_GRADES.some((g) => g.letter === totalMarks)) {
    const manualGrade = MANUAL_GRADES.find((g) => g.letter === totalMarks);
    return {
      letter: manualGrade.letter,
      range: manualGrade.letter,
      points: manualGrade.points ?? 0,
      description: manualGrade.description,
      descriptionAr: manualGrade.descriptionAr,
      isManual: true,
      standard: isRepeated ? GRADING_STANDARDS.REPEATED_ATTEMPT.name : GRADING_STANDARDS.FIRST_ATTEMPT.name,
    };
  }

  const marks = parseFloat(totalMarks);
  const standard = isRepeated ? GRADING_STANDARDS.REPEATED_ATTEMPT : GRADING_STANDARDS.FIRST_ATTEMPT;

  if (isNaN(marks)) {
    return {
      letter: 'F',
      range: '0-59.99',
      points: 0,
      description: 'Fail',
      descriptionAr: 'راسب',
      isManual: false,
      standard: standard.name,
    };
  }

  for (const grade of standard.grades) {
    if (marks >= grade.min && marks <= grade.max) {
      return {
        letter: grade.letter,
        range: `${grade.min}-${grade.max}`,
        points: grade.points,
        description: grade.description,
        descriptionAr: grade.descriptionAr,
        isManual: false,
        standard: standard.name,
      };
    }
  }

  return {
    letter: 'F',
    range: '0-59.99',
    points: 0,
    description: 'Fail',
    descriptionAr: 'راسب',
    isManual: false,
    standard: standard.name,
  };
}

export function resolveComplementaryGrade(examScore) {
  const score = parseFloat(examScore) || 0;
  if (score >= COMPLEMENTARY_GRADE.passMin) {
    return {
      letter: COMPLEMENTARY_GRADE.passLetter,
      points: COMPLEMENTARY_GRADE.passPoints,
      totalMarks: COMPLEMENTARY_GRADE.passDisplayMarks,
      examScore: score,
      description: COMPLEMENTARY_GRADE.description,
      descriptionAr: COMPLEMENTARY_GRADE.descriptionAr,
      passed: true,
    };
  }
  return {
    letter: COMPLEMENTARY_GRADE.failLetter,
    points: COMPLEMENTARY_GRADE.failPoints,
    totalMarks: score,
    examScore: score,
    description: 'Fail',
    descriptionAr: 'راسب',
    passed: false,
  };
}

export function resolveMarkGrade({ totalMarks, letterGrade, gradeType, isRepeated, complementaryScore, lang = 'en' }) {
  const isAr = lang === 'ar';

  if (gradeType === GRADE_TYPE.COMPLEMENTARY) {
    const result = resolveComplementaryGrade(complementaryScore ?? totalMarks);
    return {
      ...result,
      gradeDescription: isAr ? result.descriptionAr : result.description,
      gradeType: GRADE_TYPE.COMPLEMENTARY,
    };
  }

  if (gradeType && gradeType !== GRADE_TYPE.CALCULATED) {
    const manual = MANUAL_GRADES.find((g) => g.letter === gradeType);
    if (manual) {
      return {
        letter: manual.letter,
        points: manual.points ?? 0,
        totalMarks: 0,
        gradeDescription: isAr ? manual.descriptionAr : manual.description,
        gradeType,
        isManual: true,
      };
    }
  }

  const computed = calculateLetterGrade(totalMarks, isRepeated);
  const letter = letterGrade || computed.letter;

  return {
    letter,
    points: computed.points ?? getGradePoints(letter),
    totalMarks: parseFloat(totalMarks) || 0,
    gradeDescription: isAr ? computed.descriptionAr : computed.description,
    gradeType: GRADE_TYPE.CALCULATED,
    isManual: false,
  };
}

export function getGradePoints(letter) {
  if (!letter) return 0;
  for (const standard of Object.values(GRADING_STANDARDS)) {
    const match = standard.grades.find((g) => g.letter === letter);
    if (match) return match.points;
  }
  const manual = MANUAL_GRADES.find((g) => g.letter === letter);
  if (manual) return manual.points ?? 0;
  return 0;
}

export function getGpaStanding(gpa, lang = 'en') {
  const value = parseFloat(gpa) || 0;
  const isAr = lang === 'ar';
  for (const standing of GPA_STANDINGS) {
    if (value >= standing.min && value <= standing.max) {
      return {
        letter: standing.letter,
        label: isAr ? standing.descriptionAr : standing.description,
      };
    }
  }
  return { letter: 'F', label: isAr ? 'ضعيف' : 'Weak' };
}

export function getGradeDescription(letter, isRepeated, lang = 'en') {
  const isAr = lang === 'ar';
  const standard = isRepeated ? GRADING_STANDARDS.REPEATED_ATTEMPT : GRADING_STANDARDS.FIRST_ATTEMPT;
  const match = standard.grades.find((g) => g.letter === letter);
  if (match) return isAr ? match.descriptionAr : match.description;
  const manual = MANUAL_GRADES.find((g) => g.letter === letter);
  if (manual) return isAr ? manual.descriptionAr : manual.description;
  return letter || '';
}

export function getGradeColor(letter) {
  if (!letter) return '#ef4444';
  if (letter === 'A' || letter.startsWith('A')) return '#10b981';
  if (letter.startsWith('B')) return '#3b82f6';
  if (letter.startsWith('C')) return '#f59e0b';
  if (letter.startsWith('D')) return '#60a5fa';
  if (letter === 'WF') return '#6b7280';
  return '#ef4444';
}

export function calculateGpaFromMarks(marksRows) {
  const graded = (marksRows || []).filter((row) => {
    const gradeType = row.gradeType || GRADE_TYPE.CALCULATED;
    if (gradeType !== GRADE_TYPE.CALCULATED && gradeType !== GRADE_TYPE.COMPLEMENTARY) {
      return MANUAL_GRADES.some((g) => g.letter === gradeType && (g.points ?? 0) > 0);
    }
    return row.totalMarks != null || gradeType === GRADE_TYPE.COMPLEMENTARY;
  });

  if (graded.length === 0) return { gpa: 0, totalCredits: 0, totalPoints: 0 };

  let totalPoints = 0;
  let totalCredits = 0;

  for (const row of graded) {
    const credits = row.credits || 3;
    const resolved = resolveMarkGrade({
      totalMarks: row.totalMarks,
      letterGrade: row.letterGrade,
      gradeType: row.gradeType,
      isRepeated: row.isRepeated,
      complementaryScore: row.finalExam,
    });
    totalPoints += (resolved.points ?? 0) * credits;
    totalCredits += credits;
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  return {
    gpa: parseFloat(gpa.toFixed(2)),
    totalCredits,
    totalPoints: parseFloat(totalPoints.toFixed(2)),
  };
}

export function groupMarksBySemester(marksRows) {
  const groups = new Map();
  for (const row of marksRows || []) {
    const semester = row.semester || row.term || 'Unknown';
    const year = row.year || row.academicYear || new Date().getFullYear();
    const key = `${semester}-${year}`;
    if (!groups.has(key)) {
      groups.set(key, { semester, year, courses: [] });
    }
    groups.get(key).courses.push(row);
  }

  return Array.from(groups.values())
    .map((group) => {
      const { gpa, totalCredits } = calculateGpaFromMarks(group.courses);
      return {
        ...group,
        gpa,
        totalCredits,
        courseCount: group.courses.length,
        repeatedCount: group.courses.filter((c) => c.isRepeated).length,
      };
    })
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return String(b.semester).localeCompare(String(a.semester));
    });
}

export function mergeComplementaryRecords(rows) {
  const groups = new Map();
  for (const row of rows || []) {
    const key = `${row.studentId}-${row.subjectId}-${row.classId}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }

  const result = [];
  for (const [, groupRows] of groups) {
    if (groupRows.length === 1) {
      result.push(groupRows[0]);
      continue;
    }

    const calculated = groupRows.find(
      (r) => (r.gradeType || GRADE_TYPE.CALCULATED) === GRADE_TYPE.CALCULATED
    );
    const complementary = groupRows.find(
      (r) => r.gradeType === GRADE_TYPE.COMPLEMENTARY
    );

    if (calculated && complementary) {
      result.push({
        ...calculated,
        complementaryAttempt: {
          finalExam: complementary.finalExam,
          totalMarks: complementary.totalMarks,
          letterGrade: complementary.letterGrade,
          gradePoints: complementary.gradePoints,
          isRepeated: complementary.isRepeated,
          gradeType: complementary.gradeType,
        },
      });
    } else {
      for (const r of groupRows) result.push(r);
    }
  }
  return result;
}

export function getAllGradingStandards() {
  return GRADING_STANDARDS;
}

export function getManualGrades() {
  return MANUAL_GRADES;
}
