/**
 * Access Control Service
 * 
 * Provides centralized access control for class-level activities, resources, and chat.
 * Ensures students with disabled access cannot access class features.
 */

import { useState, useEffect, useCallback } from 'react';
import { checkStudentAccess } from './enrollmentService';
import logger from '@utils/logger';

/**
 * Check if user can access class activities
 * @param {string} classId - The class ID
 * @param {string} userId - The user ID
 * @param {string} userRole - The user role
 * @returns {Promise<Object>} Access check result
 */
export const canAccessClassActivities = async (classId, userId, userRole) => {
  // Non-students (instructors, admins, etc.) always have access
  if (userRole !== 'student' && userRole !== 'Student') {
    return {
      success: true,
      data: {
        hasAccess: true,
        reason: 'Non-student role has full access'
      }
    };
  }

  // Check student access
  const accessResult = await checkStudentAccess(classId, userId);
  if (!accessResult.success) {
    logger.error('Failed to check student access for activities:', accessResult.error);
    return {
      success: false,
      error: accessResult.error,
      data: {
        hasAccess: false,
        reason: 'Failed to verify access'
      }
    };
  }

  return {
    success: true,
    data: {
      hasAccess: accessResult.data.hasAccess,
      reason: accessResult.data.hasAccess ? 'Student has full access' : 'Student access is disabled or not enrolled'
    }
  };
};

/**
 * Check if user can access class resources
 * @param {string} classId - The class ID
 * @param {string} userId - The user ID
 * @param {string} userRole - The user role
 * @returns {Promise<Object>} Access check result
 */
export const canAccessClassResources = async (classId, userId, userRole) => {
  // Same logic as activities - resources are part of class activities
  return canAccessClassActivities(classId, userId, userRole);
};

/**
 * Check if user can access class chat
 * @param {string} classId - The class ID
 * @param {string} userId - The user ID
 * @param {string} userRole - The user role
 * @returns {Promise<Object>} Access check result
 */
export const canAccessClassChat = async (classId, userId, userRole) => {
  // Same logic as activities - chat is part of class activities
  return canAccessClassActivities(classId, userId, userRole);
};

/**
 * Check if user can participate in class (submit assignments, take quizzes, etc.)
 * @param {string} classId - The class ID
 * @param {string} userId - The user ID
 * @param {string} userRole - The user role
 * @returns {Promise<Object>} Access check result
 */
export const canParticipateInClass = async (classId, userId, userRole) => {
  // Same logic as activities - participation requires access
  return canAccessClassActivities(classId, userId, userRole);
};

/**
 * Middleware function to protect class routes/features
 * @param {string} classId - The class ID
 * @param {string} userId - The user ID
 * @param {string} userRole - The user role
 * @param {string} feature - The feature being accessed ('activities', 'resources', 'chat', 'participation')
 * @returns {Promise<Object>} Access check result
 */
export const protectClassFeature = async (classId, userId, userRole, feature) => {
  try {
    let accessResult;
    
    switch (feature) {
      case 'activities':
        accessResult = await canAccessClassActivities(classId, userId, userRole);
        break;
      case 'resources':
        accessResult = await canAccessClassResources(classId, userId, userRole);
        break;
      case 'chat':
        accessResult = await canAccessClassChat(classId, userId, userRole);
        break;
      case 'participation':
        accessResult = await canParticipateInClass(classId, userId, userRole);
        break;
      default:
        accessResult = await canAccessClassActivities(classId, userId, userRole);
    }

    // Log access attempt for audit purposes
    logger.info('Class feature access check:', {
      classId,
      userId,
      userRole,
      feature,
      hasAccess: accessResult.data?.hasAccess,
      reason: accessResult.data?.reason
    });

    return accessResult;
  } catch (error) {
    logger.error('Error in protectClassFeature:', error);
    return {
      success: false,
      error: error.message,
      data: {
        hasAccess: false,
        reason: 'Access check failed'
      }
    };
  }
};

/**
 * React Hook for class access control
 * @param {string} classId - The class ID
 * @param {string} userId - The user ID
 * @param {string} userRole - The user role
 * @returns {Object} Access state and checking functions
 */
export const useClassAccessControl = (classId, userId, userRole) => {
  const [accessState, setAccessState] = useState({
    activities: { hasAccess: false, loading: true },
    resources: { hasAccess: false, loading: true },
    chat: { hasAccess: false, loading: true },
    participation: { hasAccess: false, loading: true }
  });

  const checkAccess = useCallback(async (feature) => {
    setAccessState(prev => ({ ...prev, [feature]: { ...prev[feature], loading: true } }));
    
    try {
      const result = await protectClassFeature(classId, userId, userRole, feature);
      setAccessState(prev => ({
        ...prev,
        [feature]: {
          hasAccess: result.data?.hasAccess || false,
          loading: false,
          reason: result.data?.reason
        }
      }));
      
      return result;
    } catch (error) {
      setAccessState(prev => ({
        ...prev,
        [feature]: {
          hasAccess: false,
          loading: false,
          reason: 'Access check failed'
        }
      }));
      
      return {
        success: false,
        data: { hasAccess: false, reason: 'Access check failed' }
      };
    }
  }, [classId, userId, userRole]);

  const checkAllAccess = useCallback(async () => {
    await Promise.all([
      checkAccess('activities'),
      checkAccess('resources'),
      checkAccess('chat'),
      checkAccess('participation')
    ]);
  }, [checkAccess]);

  useEffect(() => {
    if (classId && userId && userRole) {
      checkAllAccess();
    }
  }, [classId, userId, userRole, checkAllAccess]);

  return {
    accessState,
    checkAccess,
    checkAllAccess,
    canAccessActivities: accessState.activities.hasAccess,
    canAccessResources: accessState.resources.hasAccess,
    canAccessChat: accessState.chat.hasAccess,
    canParticipate: accessState.participation.hasAccess,
    isLoading: Object.values(accessState).some(state => state.loading)
  };
};
