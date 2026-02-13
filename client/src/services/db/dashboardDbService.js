/**
 * Database Service Layer - Dashboard
 * Direct database operations for dashboard data
 * No business logic - pure data fetching operations
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../other/config.js';

/**
 * Get user enrollments
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of enrollment objects
 */
export const getUserEnrollments = async (userId) => {
  try {
    const enrollmentsRef = collection(db, 'enrollments');
    const q = query(enrollmentsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting enrollments:', error);
    throw error;
  }
};

/**
 * Get user activities
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of activity objects
 */
export const getUserActivities = async (userId) => {
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef, 
      where('assignedTo', 'array-contains', userId),
      orderBy('dueDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting activities:', error);
    throw error;
  }
};

/**
 * Get user quiz submissions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of quiz submission objects
 */
export const getUserQuizSubmissions = async (userId) => {
  try {
    const submissionsRef = collection(db, 'quizSubmissions');
    const q = query(
      submissionsRef, 
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting quiz submissions:', error);
    throw error;
  }
};

/**
 * Get user attendance records
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of attendance record objects
 */
export const getUserAttendanceRecords = async (userId) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef, 
      where('studentId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting attendance records:', error);
    throw error;
  }
};

/**
 * Get user badges/achievements
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of badge objects
 */
export const getUserBadges = async (userId) => {
  try {
    const badgesRef = collection(db, 'userBadges');
    const q = query(
      badgesRef, 
      where('userId', '==', userId),
      orderBy('earnedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting user badges:', error);
    throw error;
  }
};

/**
 * Get class details by ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} Class object
 */
export const getClassById = async (classId) => {
  try {
    const classRef = doc(db, 'classes', classId);
    const classDoc = await getDoc(classRef);
    
    if (classDoc.exists()) {
      return { id: classDoc.id, docId: classDoc.id, ...classDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('[DashboardDbService] Error getting class:', error);
    throw error;
  }
};

/**
 * Get subject details by ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} Subject object
 */
export const getSubjectById = async (subjectId) => {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (subjectDoc.exists()) {
      return { id: subjectDoc.id, docId: subjectDoc.id, ...subjectDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('[DashboardDbService] Error getting subject:', error);
    throw error;
  }
};

/**
 * Get program details by ID
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Program object
 */
export const getProgramById = async (programId) => {
  try {
    const programRef = doc(db, 'programs', programId);
    const programDoc = await getDoc(programRef);
    
    if (programDoc.exists()) {
      return { id: programDoc.id, docId: programDoc.id, ...programDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('[DashboardDbService] Error getting program:', error);
    throw error;
  }
};

/**
 * Get quiz details by ID
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} Quiz object
 */
export const getQuizById = async (quizId) => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    const quizDoc = await getDoc(quizRef);
    
    if (quizDoc.exists()) {
      return { id: quizDoc.id, docId: quizDoc.id, ...quizDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('[DashboardDbService] Error getting quiz:', error);
    throw error;
  }
};

/**
 * Get activity details by ID
 * @param {string} activityId - Activity ID
 * @returns {Promise<Object>} Activity object
 */
export const getActivityById = async (activityId) => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    const activityDoc = await getDoc(activityRef);
    
    if (activityDoc.exists()) {
      return { id: activityDoc.id, docId: activityDoc.id, ...activityDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('[DashboardDbService] Error getting activity:', error);
    throw error;
  }
};

/**
 * Get grade records for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of grade record objects
 */
export const getUserGradeRecords = async (userId) => {
  try {
    const gradesRef = collection(db, 'grades');
    const q = query(
      gradesRef, 
      where('studentId', '==', userId),
      orderBy('gradedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting grade records:', error);
    throw error;
  }
};

/**
 * Get participation records for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of participation record objects
 */
export const getUserParticipationRecords = async (userId) => {
  try {
    const participationRef = collection(db, 'participation');
    const q = query(
      participationRef, 
      where('studentId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting participation records:', error);
    throw error;
  }
};

/**
 * Get behavior records for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of behavior record objects
 */
export const getUserBehaviorRecords = async (userId) => {
  try {
    const behaviorRef = collection(db, 'behavior');
    const q = query(
      behaviorRef, 
      where('studentId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, docId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[DashboardDbService] Error getting behavior records:', error);
    throw error;
  }
};
