import logger from '@utils/logger';

/**
 * Get user preferences from Firestore - with performance monitoring and memoization
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences object
 */
export const getUserPreferences = async (userId) => {
  try {
    // Use user service to get user data
    const { getUserById } = await import('./userService');
    const result = await getUserById(userId);
    
    if (result.success && result.data) {
      return result.data.preferences || {};
    }
    
    return {};
  } catch (error) {
    logger.error('Error getting user preferences:', error);
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
    logger.error('Error updating user preferences:', error);
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
    logger.error('Error adding favorite student:', error);
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
    logger.error('Error removing favorite student:', error);
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
    logger.error('Error getting favorite students:', error);
    return [];
  }
};

/**
 * Add behavior to favorites
 * @param {string} userId - User ID
 * @param {string} behaviorId - Behavior ID to add to favorites
 * @returns {Promise<boolean>} Success status
 */
export const addFavoriteBehavior = async (userId, behaviorId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      preferences: {
        favoriteBehaviors: arrayUnion(behaviorId)
      }
    });
    return true;
  } catch (error) {
    logger.error('Error adding favorite behavior:', error);
    return false;
  }
};

/**
 * Remove behavior from favorites
 * @param {string} userId - User ID
 * @param {string} behaviorId - Behavior ID to remove from favorites
 * @returns {Promise<boolean>} Success status
 */
export const removeFavoriteBehavior = async (userId, behaviorId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      preferences: {
        favoriteBehaviors: arrayRemove(behaviorId)
      }
    });
    return true;
  } catch (error) {
    logger.error('Error removing favorite behavior:', error);
    return false;
  }
};

/**
 * Get favorite behaviors for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorite behavior IDs
 */
export const getFavoriteBehaviors = async (userId) => {
  try {
    const preferences = await getUserPreferences(userId);
    return preferences.favoriteBehaviors || [];
  } catch (error) {
    logger.error('Error getting favorite behaviors:', error);
    return [];
  }
};

