// Grading standards — official military LMS academic regulations
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

export function calculateLetterGrade(totalMarks, isRepeated = false) {
  if (typeof totalMarks === 'string' && MANUAL_GRADES.some((g) => g.letter === totalMarks)) {
    const manualGrade = MANUAL_GRADES.find((g) => g.letter === totalMarks);
    return {
      letter: manualGrade.letter,
      range: manualGrade.letter,
      points: manualGrade.points ?? 0,
      description: manualGrade.description,
      descriptionAr: manualGrade.descriptionAr,
      descriptionEn: manualGrade.description,
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
      descriptionEn: 'Fail',
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
        descriptionEn: grade.description,
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
    descriptionEn: 'Fail',
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
      descriptionEn: COMPLEMENTARY_GRADE.description,
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
    descriptionEn: 'Fail',
    passed: false,
  };
}

export function getGradeDescription(letter, isRepeated = false, lang = 'en') {
  const isAr = lang === 'ar';
  const standard = isRepeated ? GRADING_STANDARDS.REPEATED_ATTEMPT : GRADING_STANDARDS.FIRST_ATTEMPT;
  const match = standard.grades.find((g) => g.letter === letter);
  if (match) return isAr ? match.descriptionAr : match.description;
  const manual = MANUAL_GRADES.find((g) => g.letter === letter);
  if (manual) return isAr ? manual.descriptionAr : manual.description;
  return letter || '';
}

export function resolveMarkGrade({ totalMarks, letterGrade, gradeType, isRepeated, complementaryScore, lang = 'en' }) {
  if (gradeType === GRADE_TYPE.COMPLEMENTARY) {
    const result = resolveComplementaryGrade(complementaryScore ?? totalMarks);
    const letter = letterGrade || result.letter;
    const description = getGradeDescription(letter, false, lang);
    return {
      letter,
      points: getGradePoints(letter) ?? result.points,
      totalMarks: result.totalMarks,
      gradeRange: result.passed ? `${COMPLEMENTARY_GRADE.passMin}-100` : `0-${COMPLEMENTARY_GRADE.passMin - 1}`,
      gradeDescriptionEn: description,
      gradeDescriptionAr: getGradeDescription(letter, false, 'ar'),
      gradingStandard: 'Complementary Exam',
    };
  }

  if (gradeType && gradeType !== GRADE_TYPE.CALCULATED) {
    const manualGrade = MANUAL_GRADES.find((g) => g.letter === gradeType);
    if (manualGrade) {
      return {
        letter: manualGrade.letter,
        points: manualGrade.points ?? 0,
        totalMarks: 0,
        gradeRange: 'Manual',
        gradeDescriptionEn: getGradeDescription(manualGrade.letter, isRepeated, 'en'),
        gradeDescriptionAr: getGradeDescription(manualGrade.letter, isRepeated, 'ar'),
        gradingStandard: 'Manual',
      };
    }
  }

  const gradeResult = calculateLetterGrade(totalMarks, isRepeated);
  const letter = letterGrade || gradeResult.letter;
  const description = getGradeDescription(letter, isRepeated, lang);

  return {
    letter,
    points: getGradePoints(letter) ?? gradeResult.points,
    totalMarks,
    gradeRange: gradeResult.range,
    gradeDescriptionEn: lang === 'ar' ? getGradeDescription(letter, isRepeated, 'en') : description,
    gradeDescriptionAr: getGradeDescription(letter, isRepeated, 'ar'),
    gradingStandard: isRepeated ? 'Repeated' : 'First Attempt',
  };
}

function getGradePoints(letter) {
  if (!letter) return 0;
  for (const standard of Object.values(GRADING_STANDARDS)) {
    const match = standard.grades.find((g) => g.letter === letter);
    if (match) return match.points;
  }
  const manual = MANUAL_GRADES.find((g) => g.letter === letter);
  if (manual) return manual.points ?? 0;
  return 0;
}

export function getAllGradingStandards() {
  return GRADING_STANDARDS;
}

export function getManualGrades() {
  return MANUAL_GRADES;
}
