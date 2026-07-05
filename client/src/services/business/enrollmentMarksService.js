/**
 * Enrollment Marks Service - Interface Layer
 * 
 * PURPOSE: Public API for marks-related operations
 * ARCHITECTURE: Frontend Components → Enrollment Marks Service → Backend API
 */

import { apiService } from '../api/apiService';
import { info, error as logError } from '../utils/logger.js';
import {
  GRADING_STANDARDS,
  GRADE_TYPE,
  calculateLetterGrade,
  resolveMarkGrade,
  resolveComplementaryGrade,
  getGradePoints,
  getGpaStanding,
  getGradeDescription,
  getGradeColor,
  calculateGpaFromMarks,
  groupMarksBySemester,
  mergeComplementaryRecords,
  getAllGradingStandards,
  getManualGrades,
  MANUAL_GRADES,
  COMPLEMENTARY_GRADE,
  GPA_STANDINGS,
} from '@constants/gradingStandards';

const serviceName = 'enrollmentMarksService';

// Base API URL (apiService already includes /api/v1)
const API_BASE = '/marks';

export {
  GRADING_STANDARDS,
  GRADE_TYPE,
  calculateLetterGrade,
  resolveMarkGrade,
  resolveComplementaryGrade,
  getGradePoints,
  getGpaStanding,
  getGradeDescription,
  getGradeColor,
  calculateGpaFromMarks,
  groupMarksBySemester,
  mergeComplementaryRecords,
  getAllGradingStandards,
  getManualGrades,
  MANUAL_GRADES,
  COMPLEMENTARY_GRADE,
  GPA_STANDINGS,
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
    const response = await apiService.post(`${API_BASE}/distribution/${subjectId}`, distribution);
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
 * @param {number} userId - The user ID
 * @param {number} subjectId - The subject ID
 * @param {number} classId - The class ID
 * @returns {Promise<Object>} Student marks
 */
export const getStudentMarks = async (userId, subjectId, classId) => {
  info(`${serviceName}:getStudentMarks`, { userId, subjectId, classId });
  
  try {
    const response = await apiService.get(`${API_BASE}/students/${userId}/${subjectId}/${classId}`);
    return response;
  } catch (err) {
    logError(`${serviceName}:getStudentMarks:error`, { error: err.message, userId, subjectId, classId });
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
 * @param {Object} marksData - The marks data
 * @returns {Promise<Object>} Result object
 */
export const updateStudentMarks = async (userId, subjectId, classId, marksData) => {
  info(`${serviceName}:updateStudentMarks`, { userId, subjectId, classId, marksData });
  
  try {
    const response = await apiService.put(`${API_BASE}/students/${userId}/${subjectId}/${classId}`, marksData);
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
    if (filters.gradeType) params.append('gradeType', filters.gradeType);
    
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
    return response;
  } catch (err) {
    logError(`${serviceName}:getStudentMarksHistory:error`, { error: err.message, userId, subjectId, classId });
    return {
      success: false,
      error: err.message || 'Failed to get marks history'
    };
  }
};
