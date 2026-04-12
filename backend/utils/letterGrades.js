// Letter grade mapping with ranges and descriptions
const LETTER_GRADE_MAPPING = [
  { min: 97, max: 100, letter: 'A+', description: 'ممتاز' },
  { min: 93, max: 96.99, letter: 'A', description: 'ممتاز' },
  { min: 90, max: 92.99, letter: 'A-', description: 'ممتاز' },
  { min: 87, max: 89.99, letter: 'B+', description: 'جيد جدا مرتفع' },
  { min: 83, max: 86.99, letter: 'B', description: 'جيد جدا' },
  { min: 80, max: 82.99, letter: 'B-', description: 'جيد جدا' },
  { min: 77, max: 79.99, letter: 'C+', description: 'جيد مرتفع' },
  { min: 73, max: 76.99, letter: 'C', description: 'جيد' },
  { min: 70, max: 72.99, letter: 'C-', description: 'جيد' },
  { min: 67, max: 69.99, letter: 'D+', description: 'مقبول مرتفع' },
  { min: 63, max: 66.99, letter: 'D', description: 'مقبول' },
  { min: 60, max: 62.99, letter: 'D-', description: 'مقبول' },
  { min: 0, max: 59.99, letter: 'F', description: 'راسب' }
];

// Special grades that are set manually
const MANUAL_GRADES = ['FB', 'FA', 'WF'];

/**
 * Calculate letter grade based on total marks
 * @param {number} totalMarks - The total marks (0-100)
 * @returns {Object} Object containing letter, range, and description
 */
function calculateLetterGrade(totalMarks) {
  // Handle manual grades first - these should not be calculated
  if (typeof totalMarks === 'string' && MANUAL_GRADES.includes(totalMarks)) {
    const manualGrade = totalMarks;
    return {
      letter: manualGrade,
      range: manualGrade,
      description: manualGrade === 'FB' ? 'راسب بسبب الغياب' : 
                 manualGrade === 'FA' ? 'راسب بسبب التغيب' : 
                 'انسحاب مع درجة',
      isManual: true
    };
  }

  // Convert to number if it's a string
  const marks = parseFloat(totalMarks);
  if (isNaN(marks)) {
    return {
      letter: 'F',
      range: '0-59.99',
      description: 'راسب',
      isManual: false
    };
  }

  // Find the appropriate grade
  for (const grade of LETTER_GRADE_MAPPING) {
    if (marks >= grade.min && marks <= grade.max) {
      return {
        letter: grade.letter,
        range: `${grade.min}-${grade.max}`,
        description: grade.description,
        isManual: false
      };
    }
  }

  // Default to F if no range matches
  return {
    letter: 'F',
    range: '0-59.99',
    description: 'راسب',
    isManual: false
  };
}

/**
 * Get all letter grade mappings for reference
 * @returns {Array} Array of grade mappings
 */
function getAllGradeMappings() {
  return LETTER_GRADE_MAPPING;
}

export { calculateLetterGrade, getAllGradeMappings, MANUAL_GRADES };
