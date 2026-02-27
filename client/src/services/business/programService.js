import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { getProgramsSorted } from '../db/programDbService';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../other/config.js';

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
    let q;
    if (programId) {
      q = query(
        collection(db, 'subjects'),
        where('programId', '==', programId)
      );
    } else {
      q = query(collection(db, 'subjects'), orderBy('code', 'asc'));
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    
    // Sort client-side when filtering by program to avoid index requirement
    if (programId) {
      items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    }
    
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSubject = async (subjectId) => {
  try {
    const docRef = doc(db, 'subjects', subjectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Subject not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createSubject = async (data) => {
  try {
    const subjectData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, 'subjects'), subjectData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSubject = async (subjectId, data) => {
  try {
    const docRef = doc(db, 'subjects', subjectId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    await deleteDoc(doc(db, 'subjects', subjectId));
    return { success: true };
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
    let q;
    if (subjectId && studentId) {
      q = query(
        collection(db, 'subjectEnrollments'),
        where('subjectId', '==', subjectId),
        where('studentId', '==', studentId)
      );
    } else if (subjectId) {
      q = query(collection(db, 'subjectEnrollments'), where('subjectId', '==', subjectId));
    } else if (studentId) {
      q = query(collection(db, 'subjectEnrollments'), where('studentId', '==', studentId));
    } else {
      q = query(collection(db, 'subjectEnrollments'));
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const enrollStudentInSubject = async (studentId, subjectId, semester, academicYear) => {
  try {
    const enrollmentData = {
      studentId,
      subjectId,
      semester,
      academicYear,
      enrolledAt: Timestamp.now(),
      status: 'active' // 'active' | 'completed' | 'withdrawn' | 'failed'
    };
    const docRef = await addDoc(collection(db, 'subjectEnrollments'), enrollmentData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateEnrollment = async (enrollmentId, data) => {
  try {
    const docRef = doc(db, 'subjectEnrollments', enrollmentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get program by ID
export const getProgramById = async (programId) => {
  try {
    const programDoc = await getDoc(doc(db, 'programs', programId));
    if (programDoc.exists()) {
      return { success: true, data: { docId: programDoc.id, ...programDoc.data() } };
    }
    return { success: false, error: "Program not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Alias functions for consistency with other services
export const fetchProgram = getProgramById;
export const fetchSubject = getSubject;


