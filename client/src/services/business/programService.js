import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { getProgramsSorted } from '../db/programDbService';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';

// Re-export getClasses from classService for convenience
export { getClasses, addClass, updateClass, deleteClass, getClassById } from './classService';

/**
 * Programs Collection - Top-level academic programs that contain subjects
 */
export const getPrograms = async () => {
  try {
    return await getProgramsSorted();
  } catch (error) {
    logger.error('PROGRAM: Failed to fetch programs', { error: error.message });
    return { success: false, error: error.message };
  }
};

export const getProgram = async (programId) => {
  try {
    // Use database service to get program
    const { getProgram: getProgramFromDb } = await import('../db/programDbService');
    const result = await getProgramFromDb(programId);
    
    if (result.success) {
      return { success: true, data: { docId: programId, ...result.data } };
    }
    return { success: false, error: 'Program not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createProgram = async (data, user) => {
  try {
    const auditData = getCreateAuditData(user);
    const programData = {
      ...data,
      ...auditData
    };
    
    // Use database service to create program
    const { createProgram: createProgramToDb } = await import('../db/programDbService');
    const result = await createProgramToDb(programData, auditData);
    
    return { success: true, id: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateProgram = async (programId, data, user) => {
  try {
    const auditData = getUpdateAuditData(user);
    const updateData = {
      ...data,
      ...auditData
    };
    
    // Use database service to update program
    const { updateProgram: updateProgramInDb } = await import('../db/programDbService');
    const result = await updateProgramInDb(programId, updateData, auditData);
    
    return result;
  } catch (error) {
    logger.error('Error updating program:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProgram = async (programId) => {
  try {
    // Use database service to delete program
    const { deleteProgram: deleteProgramFromDb } = await import('../db/programDbService');
    const result = await deleteProgramFromDb(programId);
    
    return result;
  } catch (error) {
    logger.error('Error deleting program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subjects Collection
 * Subjects belong to programs, students enroll in subjects
 */
export const getSubjects = async (programId = null) => {
  try {
    // Use subjectDbService instead of direct Firestore
    const { getSubjects, getSubjectsByProgram } = await import('../db/subjectDbService');
    
    let result;
    if (programId) {
      result = await getSubjectsByProgram(programId);
    } else {
      result = await getSubjects();
    }
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSubject = async (subjectId) => {
  try {
    // Use subjectDbService instead of direct Firestore
    const { getSubject: getSubjectFromDb } = await import('../db/subjectDbService');
    const result = await getSubjectFromDb(subjectId);
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createSubject = async (data, user) => {
  try {
    // Use subjectDbService with proper audit data
    const { createSubject: createSubjectToDb } = await import('../db/subjectDbService');
    const auditData = getCreateAuditData(user);
    const result = await createSubjectToDb(data, auditData);
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSubject = async (subjectId, data, user) => {
  try {
    // Use subjectDbService with proper audit data
    const { updateSubject: updateSubjectInDb } = await import('../db/subjectDbService');
    const auditData = getUpdateAuditData(user);
    const result = await updateSubjectInDb(subjectId, data, auditData);
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    // Use subjectDbService instead of direct Firestore
    const { deleteSubject: deleteSubjectFromDb } = await import('../db/subjectDbService');
    const result = await deleteSubjectFromDb(subjectId);
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Subject Enrollments
 * Track which students are enrolled in which subjects
 */
export const getSubjectEnrollments = async (subjectId = null, studentId = null) => {
  try {
    // Use subjectEnrollmentsDbService instead of direct Firestore
    const { getSubjectEnrollments: getEnrollmentsFromDb } = await import('../db/subjectEnrollmentsDbService');
    
    const filters = {};
    if (subjectId) filters.subjectId = subjectId;
    if (studentId) filters.studentId = studentId;
    
    const result = await getEnrollmentsFromDb(filters);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const enrollStudentInSubject = async (studentId, subjectId, semester, academicYear, user = null) => {
  try {
    // Use subjectEnrollmentsDbService with proper audit data
    const { enrollStudentInSubject: enrollStudentToDb } = await import('../db/subjectEnrollmentsDbService');
    
    const enrollmentData = {
      studentId,
      subjectId,
      semester,
      academicYear,
      status: 'active' // 'active' | 'completed' | 'withdrawn' | 'failed'
    };
    
    const auditData = user ? getCreateAuditData(user) : null;
    const result = await enrollStudentToDb(enrollmentData, auditData);
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateEnrollment = async (enrollmentId, data, user = null) => {
  try {
    // Use subjectEnrollmentsDbService with proper audit data
    const { updateSubjectEnrollment: updateEnrollmentInDb } = await import('../db/subjectEnrollmentsDbService');
    
    const auditData = user ? getUpdateAuditData(user) : null;
    const result = await updateEnrollmentInDb(enrollmentId, data, auditData);
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get program by ID - using existing DB service
export const getProgramById = async (programId) => {
  try {
    // Use programDbService instead of direct Firestore
    const { getProgram: getProgramFromDb } = await import('../db/programDbService');
    const result = await getProgramFromDb(programId);
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Alias functions for consistency with other services
export const fetchProgram = getProgramById;
export const fetchSubject = getSubject;


