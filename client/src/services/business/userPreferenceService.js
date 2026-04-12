/**
 * User Preference Service
 * 
 * PURPOSE:
 * Handles user preferences and favorites management
 * Manages favorite behaviors, participation types, and other user-specific settings
 * 
 * ARCHITECTURE:
 * Frontend Components → User Preference Service → Database/Storage
 */

import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'userPreferenceService';

// In-memory cache for user preferences (in production, this would be in a database)
const userPreferencesCache = new Map();

/**
 * Get favorite behaviors for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorite behavior IDs
 */
export const getFavoriteBehaviors = async (userId) => {
  try {
    info(`${serviceName}:getFavoriteBehaviors`, { userId });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check cache first
    if (userPreferencesCache.has(userId)) {
      const cached = userPreferencesCache.get(userId);
      debug(`${serviceName}:getFavoriteBehaviors:cached`, { 
        userId, 
        count: cached.favoriteBehaviors?.length || 0 
      });
      return cached.favoriteBehaviors || [];
    }

    // Mock data for development - in production this would fetch from database
    const mockFavorites = [
      'behavior_positive_participation',
      'behavior_helpful_attitude',
      'behavior_excellent_work'
    ];

    const userPrefs = {
      userId,
      favoriteBehaviors: mockFavorites,
      favoriteParticipations: [],
      settings: {
        theme: 'light',
        language: 'en',
        notifications: true
      },
      updatedAt: new Date().toISOString()
    };

    // Cache the preferences
    userPreferencesCache.set(userId, userPrefs);

    debug(`${serviceName}:getFavoriteBehaviors:success`, { 
      userId, 
      count: mockFavorites.length,
      favorites: mockFavorites
    });

    return mockFavorites;

  } catch (error) {
    error(`${serviceName}:getFavoriteBehaviors:error`, { 
      error: error.message, 
      userId 
    });

    return [];
  }
};

/**
 * Add a behavior to user favorites
 * @param {string} userId - User ID
 * @param {string} behaviorId - Behavior ID to add
 * @returns {Promise<Object>} Operation result
 */
export const addFavoriteBehavior = async (userId, behaviorId) => {
  try {
    info(`${serviceName}:addFavoriteBehavior`, { userId, behaviorId });

    if (!userId || !behaviorId) {
      throw new Error('User ID and behavior ID are required');
    }

    // Get current preferences
    let userPrefs = userPreferencesCache.get(userId) || {
      userId,
      favoriteBehaviors: [],
      favoriteParticipations: [],
      settings: {},
      updatedAt: new Date().toISOString()
    };

    // Check if already in favorites
    if (userPrefs.favoriteBehaviors.includes(behaviorId)) {
      debug(`${serviceName}:addFavoriteBehavior:already_exists`, { 
        userId, 
        behaviorId 
      });

      return {
        success: true,
        message: 'Behavior already in favorites',
        data: userPrefs.favoriteBehaviors
      };
    }

    // Add to favorites
    userPrefs.favoriteBehaviors.push(behaviorId);
    userPrefs.updatedAt = new Date().toISOString();

    // Update cache
    userPreferencesCache.set(userId, userPrefs);

    // In production, this would save to database
    debug(`${serviceName}:addFavoriteBehavior:success`, { 
      userId, 
      behaviorId,
      totalFavorites: userPrefs.favoriteBehaviors.length
    });

    return {
      success: true,
      message: 'Behavior added to favorites',
      data: userPrefs.favoriteBehaviors
    };

  } catch (error) {
    error(`${serviceName}:addFavoriteBehavior:error`, { 
      error: error.message, 
      userId, 
      behaviorId 
    });

    return {
      success: false,
      error: error.message || 'Failed to add favorite behavior',
      data: []
    };
  }
};

/**
 * Remove a behavior from user favorites
 * @param {string} userId - User ID
 * @param {string} behaviorId - Behavior ID to remove
 * @returns {Promise<Object>} Operation result
 */
export const removeFavoriteBehavior = async (userId, behaviorId) => {
  try {
    info(`${serviceName}:removeFavoriteBehavior`, { userId, behaviorId });

    if (!userId || !behaviorId) {
      throw new Error('User ID and behavior ID are required');
    }

    // Get current preferences
    const userPrefs = userPreferencesCache.get(userId);
    if (!userPrefs) {
      warn(`${serviceName}:removeFavoriteBehavior:no_preferences`, { userId });
      
      return {
        success: true,
        message: 'No favorites to remove',
        data: []
      };
    }

    // Check if behavior exists in favorites
    const initialCount = userPrefs.favoriteBehaviors.length;
    userPrefs.favoriteBehaviors = userPrefs.favoriteBehaviors.filter(id => id !== behaviorId);
    
    if (userPrefs.favoriteBehaviors.length === initialCount) {
      debug(`${serviceName}:removeFavoriteBehavior:not_found`, { 
        userId, 
        behaviorId 
      });

      return {
        success: true,
        message: 'Behavior not found in favorites',
        data: userPrefs.favoriteBehaviors
      };
    }

    // Update cache
    userPrefs.updatedAt = new Date().toISOString();
    userPreferencesCache.set(userId, userPrefs);

    // In production, this would save to database
    debug(`${serviceName}:removeFavoriteBehavior:success`, { 
      userId, 
      behaviorId,
      remainingFavorites: userPrefs.favoriteBehaviors.length
    });

    return {
      success: true,
      message: 'Behavior removed from favorites',
      data: userPrefs.favoriteBehaviors
    };

  } catch (error) {
    error(`${serviceName}:removeFavoriteBehavior:error`, { 
      error: error.message, 
      userId, 
      behaviorId 
    });

    return {
      success: false,
      error: error.message || 'Failed to remove favorite behavior',
      data: []
    };
  }
};

/**
 * Get favorite participation types for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorite participation type IDs
 */
export const getFavoriteParticipations = async (userId) => {
  try {
    info(`${serviceName}:getFavoriteParticipations`, { userId });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check cache first
    const userPrefs = userPreferencesCache.get(userId);
    if (userPrefs) {
      debug(`${serviceName}:getFavoriteParticipations:cached`, { 
        userId, 
        count: userPrefs.favoriteParticipations?.length || 0 
      });
      return userPrefs.favoriteParticipations || [];
    }

    // Return empty array if no preferences exist
    debug(`${serviceName}:getFavoriteParticipations:no_data`, { userId });
    return [];

  } catch (error) {
    error(`${serviceName}:getFavoriteParticipations:error`, { 
      error: error.message, 
      userId 
    });

    return [];
  }
};

/**
 * Add a participation type to user favorites
 * @param {string} userId - User ID
 * @param {string} participationId - Participation type ID to add
 * @returns {Promise<Object>} Operation result
 */
export const addFavoriteParticipation = async (userId, participationId) => {
  try {
    info(`${serviceName}:addFavoriteParticipation`, { userId, participationId });

    if (!userId || !participationId) {
      throw new Error('User ID and participation ID are required');
    }

    // Get current preferences
    let userPrefs = userPreferencesCache.get(userId) || {
      userId,
      favoriteBehaviors: [],
      favoriteParticipations: [],
      settings: {},
      updatedAt: new Date().toISOString()
    };

    // Check if already in favorites
    if (userPrefs.favoriteParticipations.includes(participationId)) {
      debug(`${serviceName}:addFavoriteParticipation:already_exists`, { 
        userId, 
        participationId 
      });

      return {
        success: true,
        message: 'Participation already in favorites',
        data: userPrefs.favoriteParticipations
      };
    }

    // Add to favorites
    userPrefs.favoriteParticipations.push(participationId);
    userPrefs.updatedAt = new Date().toISOString();

    // Update cache
    userPreferencesCache.set(userId, userPrefs);

    debug(`${serviceName}:addFavoriteParticipation:success`, { 
      userId, 
      participationId,
      totalFavorites: userPrefs.favoriteParticipations.length
    });

    return {
      success: true,
      message: 'Participation added to favorites',
      data: userPrefs.favoriteParticipations
    };

  } catch (error) {
    error(`${serviceName}:addFavoriteParticipation:error`, { 
      error: error.message, 
      userId, 
      participationId 
    });

    return {
      success: false,
      error: error.message || 'Failed to add favorite participation',
      data: []
    };
  }
};

/**
 * Remove a participation type from user favorites
 * @param {string} userId - User ID
 * @param {string} participationId - Participation type ID to remove
 * @returns {Promise<Object>} Operation result
 */
export const removeFavoriteParticipation = async (userId, participationId) => {
  try {
    info(`${serviceName}:removeFavoriteParticipation`, { userId, participationId });

    if (!userId || !participationId) {
      throw new Error('User ID and participation ID are required');
    }

    // Get current preferences
    const userPrefs = userPreferencesCache.get(userId);
    if (!userPrefs) {
      warn(`${serviceName}:removeFavoriteParticipation:no_preferences`, { userId });
      
      return {
        success: true,
        message: 'No favorites to remove',
        data: []
      };
    }

    // Check if participation exists in favorites
    const initialCount = userPrefs.favoriteParticipations.length;
    userPrefs.favoriteParticipations = userPrefs.favoriteParticipations.filter(id => id !== participationId);
    
    if (userPrefs.favoriteParticipations.length === initialCount) {
      debug(`${serviceName}:removeFavoriteParticipation:not_found`, { 
        userId, 
        participationId 
      });

      return {
        success: true,
        message: 'Participation not found in favorites',
        data: userPrefs.favoriteParticipations
      };
    }

    // Update cache
    userPrefs.updatedAt = new Date().toISOString();
    userPreferencesCache.set(userId, userPrefs);

    debug(`${serviceName}:removeFavoriteParticipation:success`, { 
      userId, 
      participationId,
      remainingFavorites: userPrefs.favoriteParticipations.length
    });

    return {
      success: true,
      message: 'Participation removed from favorites',
      data: userPrefs.favoriteParticipations
    };

  } catch (error) {
    error(`${serviceName}:removeFavoriteParticipation:error`, { 
      error: error.message, 
      userId, 
      participationId 
    });

    return {
      success: false,
      error: error.message || 'Failed to remove favorite participation',
      data: []
    };
  }
};

/**
 * Get all user preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences object
 */
export const getUserPreferences = async (userId) => {
  try {
    info(`${serviceName}:getUserPreferences`, { userId });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check cache first
    if (userPreferencesCache.has(userId)) {
      const cached = userPreferencesCache.get(userId);
      debug(`${serviceName}:getUserPreferences:cached`, { userId });
      return cached;
    }

    // Return default preferences if none exist
    const defaultPrefs = {
      userId,
      favoriteBehaviors: [],
      favoriteParticipations: [],
      settings: {
        theme: 'light',
        language: 'en',
        notifications: true,
        autoSave: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Cache default preferences
    userPreferencesCache.set(userId, defaultPrefs);

    debug(`${serviceName}:getUserPreferences:default`, { userId });
    return defaultPrefs;

  } catch (error) {
    error(`${serviceName}:getUserPreferences:error`, { 
      error: error.message, 
      userId 
    });

    return null;
  }
};

/**
 * Update user settings
 * @param {string} userId - User ID
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Operation result
 */
export const updateUserSettings = async (userId, settings) => {
  try {
    info(`${serviceName}:updateUserSettings`, { userId, settings });

    if (!userId || !settings) {
      throw new Error('User ID and settings are required');
    }

    // Get current preferences
    let userPrefs = userPreferencesCache.get(userId) || {
      userId,
      favoriteBehaviors: [],
      favoriteParticipations: [],
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update settings
    userPrefs.settings = { ...userPrefs.settings, ...settings };
    userPrefs.updatedAt = new Date().toISOString();

    // Update cache
    userPreferencesCache.set(userId, userPrefs);

    debug(`${serviceName}:updateUserSettings:success`, { 
      userId, 
      updatedSettings: Object.keys(settings)
    });

    return {
      success: true,
      message: 'Settings updated successfully',
      data: userPrefs.settings
    };

  } catch (error) {
    error(`${serviceName}:updateUserSettings:error`, { 
      error: error.message, 
      userId, 
      settings 
    });

    return {
      success: false,
      error: error.message || 'Failed to update settings',
      data: null
    };
  }
};

/**
 * Get favorite students for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorite student IDs
 */
export const getFavoriteStudents = async (userId) => {
  try {
    info(`${serviceName}:getFavoriteStudents`, { userId });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check cache first
    if (userPreferencesCache.has(userId)) {
      const cached = userPreferencesCache.get(userId);
      debug(`${serviceName}:getFavoriteStudents:cached`, { 
        userId, 
        count: cached.favoriteStudents?.length || 0 
      });
      return cached.favoriteStudents || [];
    }

    // Mock data for development - in production this would fetch from database
    const mockFavorites = [];
    
    // Cache the result
    const currentCache = userPreferencesCache.get(userId) || {};
    userPreferencesCache.set(userId, {
      ...currentCache,
      favoriteStudents: mockFavorites
    });

    return mockFavorites;
  } catch (error) {
    error(`${serviceName}:getFavoriteStudents:error`, { error: error.message, userId });
    return [];
  }
};

/**
 * Add a student to favorites
 * @param {string} userId - User ID
 * @param {string} studentId - Student ID to add
 * @returns {Promise<Object>} Operation result
 */
export const addFavoriteStudent = async (userId, studentId) => {
  try {
    info(`${serviceName}:addFavoriteStudent`, { userId, studentId });

    if (!userId || !studentId) {
      throw new Error('User ID and Student ID are required');
    }

    // Get current favorites
    const currentFavorites = await getFavoriteStudents(userId);
    
    // Check if already in favorites
    if (currentFavorites.includes(studentId)) {
      return {
        success: false,
        error: 'Student already in favorites',
        data: null
      };
    }

    // Add to favorites
    const updatedFavorites = [...currentFavorites, studentId];
    
    // Update cache
    const currentCache = userPreferencesCache.get(userId) || {};
    userPreferencesCache.set(userId, {
      ...currentCache,
      favoriteStudents: updatedFavorites
    });

    // In production, this would save to database
    info(`${serviceName}:addFavoriteStudent:success`, { userId, studentId, totalFavorites: updatedFavorites.length });

    return {
      success: true,
      data: updatedFavorites,
      message: 'Student added to favorites successfully'
    };
  } catch (error) {
    error(`${serviceName}:addFavoriteStudent:error`, { error: error.message, userId, studentId });
    return {
      success: false,
      error: error.message || 'Failed to add student to favorites',
      data: null
    };
  }
};

/**
 * Remove a student from favorites
 * @param {string} userId - User ID
 * @param {string} studentId - Student ID to remove
 * @returns {Promise<Object>} Operation result
 */
export const removeFavoriteStudent = async (userId, studentId) => {
  try {
    info(`${serviceName}:removeFavoriteStudent`, { userId, studentId });

    if (!userId || !studentId) {
      throw new Error('User ID and Student ID are required');
    }

    // Get current favorites
    const currentFavorites = await getFavoriteStudents(userId);
    
    // Check if student is in favorites
    if (!currentFavorites.includes(studentId)) {
      return {
        success: false,
        error: 'Student not found in favorites',
        data: null
      };
    }

    // Remove from favorites
    const updatedFavorites = currentFavorites.filter(id => id !== studentId);
    
    // Update cache
    const currentCache = userPreferencesCache.get(userId) || {};
    userPreferencesCache.set(userId, {
      ...currentCache,
      favoriteStudents: updatedFavorites
    });

    // In production, this would save to database
    info(`${serviceName}:removeFavoriteStudent:success`, { userId, studentId, totalFavorites: updatedFavorites.length });

    return {
      success: true,
      data: updatedFavorites,
      message: 'Student removed from favorites successfully'
    };
  } catch (error) {
    error(`${serviceName}:removeFavoriteStudent:error`, { error: error.message, userId, studentId });
    return {
      success: false,
      error: error.message || 'Failed to remove student from favorites',
      data: null
    };
  }
};

// Export all functions for easy importing
export default {
  getFavoriteBehaviors,
  addFavoriteBehavior,
  removeFavoriteBehavior,
  getFavoriteParticipations,
  addFavoriteParticipation,
  removeFavoriteParticipation,
  getFavoriteStudents,
  addFavoriteStudent,
  removeFavoriteStudent,
  getUserPreferences,
  updateUserSettings
};
