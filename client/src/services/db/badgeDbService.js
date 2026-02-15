/**
 * Badge Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for badge records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTIONS: 'badges', 'users/{userId}/badges'
 * 
 * @typedef {import('@types/index').Badge} Badge
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get all badges
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getBadges = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'badges'));
    const badges = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: badges };
  } catch (error) {
    logger.error('[BadgeDbService] Error getting badges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get badge by ID
 * @param {string} badgeId - Badge ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getBadge = async (badgeId) => {
  try {
    const docSnap = await getDoc(doc(db, 'badges', badgeId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Badge not found' };
  } catch (error) {
    logger.error('[BadgeDbService] Error getting badge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create badge
 * @param {Object} badgeData - Badge data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createBadge = async (badgeData) => {
  try {
    const docRef = doc(collection(db, 'badges'));
    await setDoc(docRef, {
      ...badgeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[BadgeDbService] Error creating badge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update badge
 * @param {string} badgeId - Badge ID
 * @param {Object} badgeData - Updated badge data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateBadge = async (badgeId, badgeData) => {
  try {
    await updateDoc(doc(db, 'badges', badgeId), {
      ...badgeData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[BadgeDbService] Error updating badge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete badge
 * @param {string} badgeId - Badge ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteBadge = async (badgeId) => {
  try {
    await deleteDoc(doc(db, 'badges', badgeId));
    return { success: true };
  } catch (error) {
    logger.error('[BadgeDbService] Error deleting badge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get badges by category
 * @param {string} category - Badge category
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getBadgesByCategory = async (category) => {
  try {
    const q = query(collection(db, 'badges'), where('category', '==', category));
    const querySnapshot = await getDocs(q);
    const badges = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: badges };
  } catch (error) {
    logger.error('[BadgeDbService] Error getting badges by category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's earned badges
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getUserBadges = async (userId) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'badges'));
    const badges = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: badges };
  } catch (error) {
    logger.error('[BadgeDbService] Error getting user badges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Award badge to user
 * @param {string} userId - User ID
 * @param {string} badgeId - Badge ID
 * @param {Object} badgeData - Badge award data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const awardBadgeToUser = async (userId, badgeId, badgeData = {}) => {
  try {
    await setDoc(doc(db, 'users', userId, 'badges', badgeId), {
      badgeId,
      earnedAt: serverTimestamp(),
      progress: 1,
      ...badgeData
    });
    return { success: true };
  } catch (error) {
    logger.error('[BadgeDbService] Error awarding badge to user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user badge progress
 * @param {string} userId - User ID
 * @param {string} badgeId - Badge ID
 * @param {Object} progressData - Progress data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserBadgeProgress = async (userId, badgeId, progressData) => {
  try {
    await updateDoc(doc(db, 'users', userId, 'badges', badgeId), {
      ...progressData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[BadgeDbService] Error updating user badge progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove badge from user
 * @param {string} userId - User ID
 * @param {string} badgeId - Badge ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeBadgeFromUser = async (userId, badgeId) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'badges', badgeId));
    return { success: true };
  } catch (error) {
    logger.error('[BadgeDbService] Error removing badge from user:', error);
    return { success: false, error: error.message };
  }
};
