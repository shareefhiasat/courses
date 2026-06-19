/**
 * Penalties Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for penalty operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';
import { buildLocalizedNameFields, buildNotificationNameVars } from '../utils/localizedUserName.js';

export const getAllPenalties = async (params = {}, user = null) => {
  return {
    success: true,
    data: [],
    total: 0,
    page: parseInt(params.page) || 1,
    limit: parseInt(params.limit) || 10,
    totalPages: 0
  };
};

export const getPenaltyById = async (id, user = null) => {
  return {
    success: true,
    data: null
  };
};

export const createPenalty = async (penaltyData, user = null) => {
  const result = {
    success: true,
    data: { ...penaltyData, id: Date.now() }
  };
  
  // Send notification for new penalty record
  if (result.success && result.data) {
    try {
      // Map penalty type to specific event
      const penaltyType = result.data.penaltyType?.code || 'assigned';
      const eventTypeMap = {
        'late': EVENTS.PENALTY_ASSIGNED_LATE,
        'absent': EVENTS.PENALTY_ASSIGNED_ABSENT,
        'misconduct': EVENTS.PENALTY_ASSIGNED_MISCONDUCT
      };
      
      const eventType = eventTypeMap[penaltyType] || EVENTS.PENALTY_ASSIGNED;
      
      await notificationGateway.emit(
        eventType,
        {
          ...buildNotificationNameVars(result.data.student || { displayName: result.data.studentName }, 'Unknown Student'),
          penaltyType: result.data.penaltyType?.nameEn || penaltyType
        },
        user,
        { userId: result.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send penalty notification:', notifError);
    }
  }
  
  return result;
};

export const updatePenalty = async (id, updateData, user = null) => {
  const result = {
    success: true,
    data: { ...updateData, id }
  };
  
  // Send notification for penalty update
  if (result.success && result.data) {
    try {
      await notificationGateway.emit(
        EVENTS.PENALTY_UPDATED,
        {
          ...buildNotificationNameVars(result.data.student || { displayName: result.data.studentName }, 'Unknown Student'),
          penaltyType: result.data.penaltyType?.nameEn || 'penalty'
        },
        user,
        { userId: result.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send penalty update notification:', notifError);
    }
  }
  
  return result;
};

export const deletePenalty = async (id, user = null) => {
  const result = {
    success: true
  };
  
  // Send notification for penalty deletion
  if (result.success) {
    try {
      await notificationGateway.emit(
        EVENTS.PENALTY_DELETED,
        {
          penaltyId: id
        },
        user,
        { userId: user?.id }
      );
    } catch (notifError) {
      console.error('Failed to send penalty deletion notification:', notifError);
    }
  }
  
  return result;
};

export const getPenaltiesByStudent = async (studentId, params = {}, user = null) => {
  return {
    success: true,
    data: [],
    total: 0
  };
};

export const getPenaltiesByClass = async (classId, params = {}, user = null) => {
  return {
    success: true,
    data: [],
    total: 0
  };
};
