/**
 * Gamification Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for gamification records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTIONS: 'gamification', 'leaderboards', 'achievements'
 * 
 * @typedef {import('@types/index').Gamification} Gamification
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get student gamification data
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getStudentGamification = async (studentId) => {
  try {
    const docSnap = await getDoc(doc(db, 'gamification', studentId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Student gamification data not found' };
  } catch (error) {
    logger.error('[GamificationDbService] Error getting student gamification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update student gamification data
 * @param {string} studentId - Student ID
 * @param {Object} gamificationData - Gamification data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setStudentGamification = async (studentId, gamificationData) => {
  try {
    await setDoc(
      doc(db, 'gamification', studentId),
      {
        ...gamificationData,
        studentId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    logger.error('[GamificationDbService] Error setting student gamification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Award points to student
 * @param {string} studentId - Student ID
 * @param {number} points - Points to award
 * @param {Object} metadata - Award metadata
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const awardPoints = async (studentId, points, metadata = {}) => {
  try {
    await updateDoc(doc(db, 'gamification', studentId), {
      totalPoints: increment(points),
      pointsHistory: increment(1),
      lastPointsAwarded: serverTimestamp(),
      lastPointsMetadata: metadata,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[GamificationDbService] Error awarding points:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update student rank
 * @param {string} studentId - Student ID
 * @param {string} rank - New rank
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateStudentRank = async (studentId, rank) => {
  try {
    await updateDoc(doc(db, 'gamification', studentId), {
      currentRank: rank,
      rankUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[GamificationDbService] Error updating student rank:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get leaderboard
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getLeaderboard = async (options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'totalPoints', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'gamification'),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const leaderboard = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: leaderboard };
  } catch (error) {
    logger.error('[GamificationDbService] Error getting leaderboard:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get class leaderboard
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClassLeaderboard = async (classId, options = {}) => {
  try {
    const { limitCount = 50 } = options;
    
    // This would require a composite index or different data structure
    // For now, get all leaderboard and filter client-side
    const result = await getLeaderboard({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    // Filter by class (this would need to be optimized with proper indexing)
    const filteredLeaderboard = result.data.filter(student => 
      student.classId === classId
    );
    
    return { success: true, data: filteredLeaderboard };
  } catch (error) {
    logger.error('[GamificationDbService] Error getting class leaderboard:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get student achievements
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getStudentAchievements = async (studentId) => {
  try {
    const q = query(
      collection(db, 'achievements'),
      where('studentId', '==', studentId),
      orderBy('earnedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const achievements = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: achievements };
  } catch (error) {
    logger.error('[GamificationDbService] Error getting student achievements:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Award achievement to student
 * @param {string} studentId - Student ID
 * @param {Object} achievementData - Achievement data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const awardAchievement = async (studentId, achievementData) => {
  try {
    const docRef = doc(collection(db, 'achievements'));
    await setDoc(docRef, {
      ...achievementData,
      studentId,
      earnedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[GamificationDbService] Error awarding achievement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update student skills
 * @param {string} studentId - Student ID
 * @param {Object} skillsData - Skills data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateStudentSkills = async (studentId, skillsData) => {
  try {
    await updateDoc(doc(db, 'gamification', studentId), {
      skills: skillsData,
      skillsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[GamificationDbService] Error updating student skills:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get top students by points
 * @param {number} count - Number of top students to get
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getTopStudents = async (count = 10) => {
  try {
    const q = query(
      collection(db, 'gamification'),
      orderBy('totalPoints', 'desc'),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    const topStudents = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: topStudents };
  } catch (error) {
    logger.error('[GamificationDbService] Error getting top students:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize student gamification data
 * @param {string} studentId - Student ID
 * @param {Object} initialData - Initial gamification data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const initializeStudentGamification = async (studentId, initialData = {}) => {
  try {
    const defaultData = {
      studentId,
      totalPoints: 0,
      pointsHistory: 0,
      currentRank: 'Beginner',
      skills: {},
      achievements: [],
      streak: {
        current: 0,
        longest: 0,
        lastActiveDate: null
      },
      ...initialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'gamification', studentId), defaultData);
    return { success: true };
  } catch (error) {
    logger.error('[GamificationDbService] Error initializing student gamification:', error);
    return { success: false, error: error.message };
  }
};
