/**
 * Behaviors Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for behavior operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getBehaviors as getBehaviorsFromDb,
  getBehaviorById as getBehaviorByIdFromDb,
  createBehavior as createBehaviorInDb,
  updateBehavior as updateBehaviorInDb,
  deleteBehavior as deleteBehaviorInDb,
  getBehaviorsByStudent as getBehaviorsByStudentFromDb,
  getBehaviorsByClass as getBehaviorsByClassFromDb
} from '../db/behaviors-postgres.js';
import { buildNotificationNameVars } from '../utils/localizedUserName.js';
import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';

export const getAllBehaviors = async (params = {}, user = null) => {
  return await getBehaviorsFromDb(params, user);
};

export const getBehaviorById = async (id, user = null) => {
  return await getBehaviorByIdFromDb(id, user);
};

export const createBehavior = async (behaviorData, user = null) => {
  const result = await createBehaviorInDb(behaviorData, user);
  
  // Send notification for new behavior record
  if (result.success && result.data) {
    try {
      // Determine if positive or negative behavior
      const eventType = result.data.isPositive 
        ? EVENTS.BEHAVIOR_POSITIVE_RECORDED 
        : EVENTS.BEHAVIOR_NEGATIVE_RECORDED;
      
      await notificationGateway.emit(
        eventType,
        {
          ...buildNotificationNameVars(result.data.student || { displayName: result.data.studentName }, 'Unknown Student'),
          behaviorType: result.data.behaviorType?.nameEn || result.data.action
        },
        user,
        { userId: result.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send behavior notification:', notifError);
    }
  }
  
  return result;
};

export const updateBehavior = async (id, behaviorData, user = null) => {
  const result = await updateBehaviorInDb(id, behaviorData, user);
  
  // Send notification for behavior update
  if (result.success && result.data) {
    try {
      await notificationGateway.emit(
        EVENTS.BEHAVIOR_UPDATED,
        {
          ...buildNotificationNameVars(result.data.student || { displayName: result.data.studentName }, 'Unknown Student'),
          behaviorType: result.data.behaviorType?.nameEn || result.data.action
        },
        user,
        { userId: result.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send behavior update notification:', notifError);
    }
  }
  
  return result;
};

export const deleteBehavior = async (id, user = null) => {
  // Get behavior data before deletion for notification
  const existing = await getBehaviorByIdFromDb(id, user);
  
  const result = await deleteBehaviorInDb(id, user);
  
  // Send notification for behavior deletion
  if (result.success && existing?.data) {
    try {
      await notificationGateway.emit(
        EVENTS.BEHAVIOR_DELETED,
        {
          ...buildNotificationNameVars(existing.data.student || { displayName: existing.data.studentName }, 'Unknown Student'),
          behaviorType: existing.data.behaviorType?.nameEn || existing.data.action
        },
        user,
        { userId: existing.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send behavior deletion notification:', notifError);
    }
  }
  
  return result;
};

export const getBehaviorsByStudent = async (studentId, params = {}, user = null) => {
  return await getBehaviorsByStudentFromDb(studentId, params, user);
};

export const getBehaviorsByClass = async (classId, params = {}, user = null) => {
  return await getBehaviorsByClassFromDb(classId, params, user);
};
