/**
 * Formatting Utilities
 * Centralized data formatting and grading functions
 */

export { 
  GRADING_STANDARDS, 
  MANUAL_GRADES, 
  calculateLetterGrade, 
  getAllGradingStandards, 
  getManualGrades 
} from './gradingStandards.js';

export { 
  calculateLetterGrade as calculateLetterGradeSimple, 
  getAllGradeMappings, 
  MANUAL_GRADES as MANUAL_GRADES_SIMPLE 
} from './letterGrades.js';
