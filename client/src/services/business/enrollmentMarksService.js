/**
 * Enrollment Marks Service - Interface Layer
 * 
 * PURPOSE: Public API for marks-related operations
 * ARCHITECTURE: Frontend Components → Enrollment Marks Service → Backend API
 */

import { apiService } from '../api/apiService';
import { info, error as logError } from '../utils/logger.js';

const serviceName = 'enrollmentMarksService';

// Base API URL (apiService already includes /api/v1)
const API_BASE = '/marks';

// Frontend grading standards utility
// NOTE: This must match backend/utils/gradingStandards.js exactly
// Single source of truth is backend - update both if changing
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
const MANUAL_GRADES = [
  { letter: 'FB', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب الغياب' },
  { letter: 'FA', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب التغيب' },
  { letter: 'WF', description: 'Withdrawal with Grade', descriptionAr: 'انسحاب مع درجة' }
];

// Frontend letter grade calculation utility
export const calculateLetterGrade = (totalMarks, isRepeated = false) => {
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
};

/**
 * Get marks distribution configuration for a subject
 * @param {number} subjectId - The subject ID
 * @returns {Promise<Object>} Marks distribution configuration
 */
export const getSubjectMarksDistribution = async (subjectId) => {
  info(`${serviceName}:getSubjectMarksDistribution`, { subjectId });
  
  try {
    const response = await apiService.get(`${API_BASE}/distribution/${subjectId}`);
    return response;
  } catch (err) {
    logError(`${serviceName}:getSubjectMarksDistribution:error`, { error: err.message, subjectId });
    return {
      success: false,
      error: err.message || 'Failed to get marks distribution'
    };
  }
};

/**
 * Set marks distribution configuration for a subject
 * @param {number} subjectId - The subject ID
 * @param {Object} distribution - The marks distribution configuration
 * @returns {Promise<Object>} Result object
 */
export const setSubjectMarksDistribution = async (subjectId, distribution) => {
  info(`${serviceName}:setSubjectMarksDistribution`, { subjectId, distribution });
  
  try {
    const response = await apiService.put(`${API_BASE}/distribution/${subjectId}`, distribution);
    return response;
  } catch (err) {
    logError(`${serviceName}:setSubjectMarksDistribution:error`, { error: err.message, subjectId });
    return {
      success: false,
      error: err.message || 'Failed to set marks distribution'
    };
  }
};

/**
 * Get student marks for a subject
 * @param {number} subjectId - The subject ID
 * @param {number|null} classId - The class ID (optional)
 * @returns {Promise<Object>} Student marks data
 */
export const getStudentMarks = async (subjectId, classId = null) => {
  info(`${serviceName}:getStudentMarks`, { subjectId, classId });
  
  try {
    const params = classId ? { classId } : {};
    const response = await apiService.get(`${API_BASE}/students/${subjectId}`, { params });
    return response;
  } catch (err) {
    logError(`${serviceName}:getStudentMarks:error`, { error: err.message, subjectId });
    return {
      success: false,
      error: err.message || 'Failed to get student marks'
    };
  }
};

/**
 * Update student marks
 * @param {number} userId - The user ID
 * @param {number} subjectId - The subject ID
 * @param {number} classId - The class ID
 * @param {Object} marks - The marks data
 * @returns {Promise<Object>} Result object
 */
export const updateStudentMarks = async (userId, subjectId, classId, marks) => {
  info(`${serviceName}:updateStudentMarks`, { userId, subjectId, classId, marks });
  
  try {
    const response = await apiService.put(`${API_BASE}/students/${userId}/${subjectId}/${classId}`, marks);
    return response;
  } catch (err) {
    logError(`${serviceName}:updateStudentMarks:error`, { error: err.message, userId, subjectId, classId });
    return {
      success: false,
      error: err.message || 'Failed to update student marks'
    };
  }
};

/**
 * Save student marks (alias for updateStudentMarks)
 * @param {number} subjectId - The subject ID
 * @param {Object} marksData - The marks data
 * @returns {Promise<Object>} Result object
 */
export const saveStudentMarks = async (subjectId, marksData) => {
  info(`${serviceName}:saveStudentMarks`, { subjectId, marksData });
  
  try {
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required'
      };
    }

    const response = await apiService.post(`${API_BASE}/students/${subjectId}`, marksData);
    return response;
  } catch (err) {
    logError(`${serviceName}:saveStudentMarks:error`, { error: err.message, subjectId });
    return {
      success: false,
      error: err.message || 'Failed to save student marks'
    };
  }
};

/**
 * Get all student marks report with complete information
 * @param {Object} filters - Optional filters (programId, subjectId, classId, year, term, isRepeated)
 * @returns {Promise<Object>} - Student marks report data
 */
export const getAllStudentMarksReport = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.year) params.append('year', filters.year);
    if (filters.term) params.append('term', filters.term);
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.isRepeated !== undefined && filters.isRepeated !== '') {
      params.append('isRepeated', filters.isRepeated);
    }
    
    const response = await apiService.get(`${API_BASE}/report?${params.toString()}`);
    
    return {
      success: response.success,
      data: response.data || [],
      total: response.total || 0
    };
  } catch (error) {
    console.error('[enrollmentMarksService] Error getting student marks report:', error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error.message || 'Failed to get student marks report'
    };
  }
};

// Get marks history for a specific student
export const getStudentMarksHistory = async (userId, subjectId, classId) => {
  try {
    info(serviceName, 'getStudentMarksHistory', { userId, subjectId, classId });
    
    const response = await apiService.get(`${API_BASE}/history/${userId}/${subjectId}/${classId}`);
    
    return {
      success: response.success,
      data: response.data || [],
      total: response.total || 0
    };
  } catch (error) {
    console.error('[enrollmentMarksService] Error getting student marks history:', error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error.message || 'Failed to get student marks history'
    };
  }
};

export default {
  getSubjectMarksDistribution,
  setSubjectMarksDistribution,
  getStudentMarks,
  updateStudentMarks,
  saveStudentMarks,
  getAllStudentMarksReport,
  getStudentMarksHistory
};
