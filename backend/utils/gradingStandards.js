// Grading standards for different attempt types
export const GRADING_STANDARDS = {
  FIRST_ATTEMPT: {
    name: 'First Attempt',
    nameAr: 'المحاولة الأولى',
    grades: [
      { min: 97, max: 100, letter: 'A+', description: 'Excellent', descriptionAr: 'ممتاز' },
      { min: 93, max: 96.99, letter: 'A', description: 'Excellent', descriptionAr: 'ممتاز' },
      { min: 90, max: 92.99, letter: 'A-', description: 'Excellent', descriptionAr: 'ممتاز' },
      { min: 87, max: 89.99, letter: 'B+', description: 'Very Good', descriptionAr: 'جيد جدا مرتفع' },
      { min: 83, max: 86.99, letter: 'B', description: 'Very Good', descriptionAr: 'جيد جدا' },
      { min: 80, max: 82.99, letter: 'B-', description: 'Very Good', descriptionAr: 'جيد جدا' },
      { min: 77, max: 79.99, letter: 'C+', description: 'Good', descriptionAr: 'جيد مرتفع' },
      { min: 73, max: 76.99, letter: 'C', description: 'Good', descriptionAr: 'جيد' },
      { min: 70, max: 72.99, letter: 'C-', description: 'Good', descriptionAr: 'جيد' },
      { min: 67, max: 69.99, letter: 'D+', description: 'Pass', descriptionAr: 'مقبول مرتفع' },
      { min: 63, max: 66.99, letter: 'D', description: 'Pass', descriptionAr: 'مقبول' },
      { min: 60, max: 62.99, letter: 'D-', description: 'Pass', descriptionAr: 'مقبول' },
      { min: 0, max: 59.99, letter: 'F', description: 'Fail', descriptionAr: 'راسب' }
    ]
  },
  REPEATED_ATTEMPT: {
    name: 'Repeated Attempt',
    nameAr: 'محاولة متكررة',
    grades: [
      { min: 99, max: 100, letter: 'A+', description: 'Excellent', descriptionAr: 'ممتاز' },
      { min: 96, max: 98.99, letter: 'A', description: 'Excellent', descriptionAr: 'ممتاز' },
      { min: 93, max: 95.99, letter: 'A-', description: 'Excellent', descriptionAr: 'ممتاز' },
      { min: 89, max: 92.99, letter: 'B+', description: 'Very Good', descriptionAr: 'جيد جدا مرتفع' },
      { min: 86, max: 88.99, letter: 'B', description: 'Very Good', descriptionAr: 'جيد جدا' },
      { min: 83, max: 85.99, letter: 'B-', description: 'Very Good', descriptionAr: 'جيد جدا' },
      { min: 80, max: 82.99, letter: 'C+', description: 'Good', descriptionAr: 'جيد مرتفع' },
      { min: 76, max: 79.99, letter: 'C', description: 'Good', descriptionAr: 'جيد' },
      { min: 73, max: 75.99, letter: 'C-', description: 'Good', descriptionAr: 'جيد' },
      { min: 70, max: 72.99, letter: 'D+', description: 'Pass', descriptionAr: 'مقبول مرتفع' },
      { min: 66, max: 69.99, letter: 'D', description: 'Pass', descriptionAr: 'مقبول' },
      { min: 63, max: 65.99, letter: 'D-', description: 'Pass', descriptionAr: 'مقبول' },
      { min: 0, max: 62.99, letter: 'F', description: 'Fail', descriptionAr: 'راسب' }
    ]
  }
};

// Special grades that are set manually (same for both standards)
export const MANUAL_GRADES = [
  { letter: 'FB', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب الغياب' },
  { letter: 'FA', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب التغيب' },
  { letter: 'WF', description: 'Withdrawal with Grade', descriptionAr: 'انسحاب مع درجة' }
];

/**
 * Calculate letter grade based on total marks and attempt type
 * @param {number} totalMarks - The total marks (0-100)
 * @param {boolean} isRepeated - Whether this is a repeated attempt
 * @returns {Object} Object containing letter, range, and description
 */
export function calculateLetterGrade(totalMarks, isRepeated = false) {
  // Handle manual grades first - these should not be calculated
  if (typeof totalMarks === 'string' && MANUAL_GRADES.some(g => g.letter === totalMarks)) {
    const manualGrade = MANUAL_GRADES.find(g => g.letter === totalMarks);
    return {
      letter: manualGrade.letter,
      range: manualGrade.letter,
      description: manualGrade.description,
      descriptionAr: manualGrade.descriptionAr,
      isManual: true,
      standard: isRepeated ? GRADING_STANDARDS.REPEATED_ATTEMPT.name : GRADING_STANDARDS.FIRST_ATTEMPT.name
    };
  }

  // Convert to number if it's a string
  const marks = parseFloat(totalMarks);
  if (isNaN(marks)) {
    return {
      letter: 'F',
      range: '0-59.99',
      description: 'Fail',
      descriptionAr: 'راسب',
      isManual: false,
      standard: isRepeated ? GRADING_STANDARDS.REPEATED_ATTEMPT.name : GRADING_STANDARDS.FIRST_ATTEMPT.name
    };
  }

  // Select the appropriate grading standard
  const standard = isRepeated ? GRADING_STANDARDS.REPEATED_ATTEMPT : GRADING_STANDARDS.FIRST_ATTEMPT;
  
  // Find the appropriate grade
  for (const grade of standard.grades) {
    if (marks >= grade.min && marks <= grade.max) {
      return {
        letter: grade.letter,
        range: `${grade.min}-${grade.max}`,
        description: grade.description,
        descriptionAr: grade.descriptionAr,
        isManual: false,
        standard: standard.name
      };
    }
  }

  // Default to F if no range matches
  return {
    letter: 'F',
    range: '0-59.99',
    description: 'Fail',
    descriptionAr: 'راسب',
    isManual: false,
    standard: standard.name
  };
}

/**
 * Get all grading standards for reference
 * @returns {Object} All grading standards
 */
export function getAllGradingStandards() {
  return GRADING_STANDARDS;
}

/**
 * Get manual grades for reference
 * @returns {Array} Array of manual grades
 */
export function getManualGrades() {
  return MANUAL_GRADES;
}
