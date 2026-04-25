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
      await notificationGateway.emit(EVENTS.BEHAVIOR_RECORDED, {
        behaviorId: result.data.id,
        studentId: result.data.studentId,
        classId: result.data.classId,
        action: result.data.action,
        description: result.data.description,
      }, { userId: result.data.studentId }, user);
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
      await notificationGateway.emit(EVENTS.BEHAVIOR_UPDATED, {
        behaviorId: result.data.id,
        studentId: result.data.studentId,
        classId: result.data.classId,
      }, { userId: result.data.studentId }, user);
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
      await notificationGateway.emit(EVENTS.BEHAVIOR_DELETED, {
        behaviorId: existing.data.id,
        studentId: existing.data.studentId,
        classId: existing.data.classId,
      }, { userId: existing.data.studentId }, user);
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
