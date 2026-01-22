import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './config';

/**
 * Get user preferences from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences object
 */
export const getUserPreferences = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data().preferences || {};
    }
    
    return {};
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
};

/**
 * Update user preferences in Firestore
 * @param {string} userId - User ID
 * @param {Object} preferences - Preferences object to update
 * @returns {Promise<boolean>} Success status
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      preferences: preferences
    });
    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
};

/**
 * Add student to favorites
 * @param {string} userId - User ID
 * @param {string} studentId - Student ID to add to favorites
 * @returns {Promise<boolean>} Success status
 */
export const addFavoriteStudent = async (userId, studentId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      preferences: {
        favoriteStudents: arrayUnion(studentId)
      }
    });
    return true;
  } catch (error) {
    console.error('Error adding favorite student:', error);
    return false;
  }
};

/**
 * Remove student from favorites
 * @param {string} userId - User ID
 * @param {string} studentId - Student ID to remove from favorites
 * @returns {Promise<boolean>} Success status
 */
export const removeFavoriteStudent = async (userId, studentId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      preferences: {
        favoriteStudents: arrayRemove(studentId)
      }
    });
    return true;
  } catch (error) {
    console.error('Error removing favorite student:', error);
    return false;
  }
};

/**
 * Get favorite students for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorite student IDs
 */
export const getFavoriteStudents = async (userId) => {
  try {
    const preferences = await getUserPreferences(userId);
    return preferences.favoriteStudents || [];
  } catch (error) {
    console.error('Error getting favorite students:', error);
    return [];
  }
};
