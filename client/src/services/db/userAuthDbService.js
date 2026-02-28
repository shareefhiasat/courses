/**
 * User Authentication Database Service
 * 
 * PURPOSE:
 * Direct Firebase Authentication operations for user accounts. This service handles
 * the Firebase Auth user management operations that complement Firestore user records.
 * 
 * USAGE:
 * Import these functions in business services only.
 * Do NOT import directly in UI components - use business services instead.
 * 
 * ARCHITECTURE:
 * - Firebase Auth user operations (enable/disable)
 * - Auth state management
 * - No business logic or validation (handled by business layer)
 * 
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../other/config';
import logger from '@utils/logger';

/**
 * Disable user in Firebase Authentication
 * @param {string} userId - User ID
 * @returns {Promise<ServiceResponse>} Result object
 */
export const disableUserAuth = async (userId) => {
  try {
    const disableUserFn = httpsCallable(functions, 'disableUser');
    const result = await disableUserFn({ userId });
    
    return {
      success: true,
      payload: result.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('[UserAuthDbService] Failed to disable user auth', { userId, error: error.message });
    
    return {
      success: false,
      error: {
        code: error.code || 'DISABLE_USER_AUTH_FAILED',
        message: error.message || 'Failed to disable user authentication'
      },
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Enable user in Firebase Authentication
 * @param {string} userId - User ID
 * @returns {Promise<ServiceResponse>} Result object
 */
export const enableUserAuth = async (userId) => {
  try {
    const enableUserFn = httpsCallable(functions, 'enableUser');
    const result = await enableUserFn({ userId });
    
    return {
      success: true,
      payload: result.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('[UserAuthDbService] Failed to enable user auth', { userId, error: error.message });
    
    return {
      success: false,
      error: {
        code: error.code || 'ENABLE_USER_AUTH_FAILED',
        message: error.message || 'Failed to enable user authentication'
      },
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Delete user from Firebase Authentication
 * @param {string} userId - User ID
 * @returns {Promise<ServiceResponse>} Result object
 */
export const deleteUserAuth = async (userId) => {
  try {
    const deleteUserFn = httpsCallable(functions, 'deleteUserAuth');
    const result = await deleteUserFn({ userId });
    
    return {
      success: true,
      payload: result.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('[UserAuthDbService] Failed to delete user auth', { userId, error: error.message });
    
    return {
      success: false,
      error: {
        code: error.code || 'DELETE_USER_AUTH_FAILED',
        message: error.message || 'Failed to delete user authentication'
      },
      timestamp: new Date().toISOString()
    };
  }
};
