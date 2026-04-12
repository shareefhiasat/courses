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

export const getAllBehaviors = async (params = {}, user = null) => {
  return await getBehaviorsFromDb(params, user);
};

export const getBehaviorById = async (id, user = null) => {
  return await getBehaviorByIdFromDb(id, user);
};

export const createBehavior = async (behaviorData, user = null) => {
  return await createBehaviorInDb(behaviorData, user);
};

export const updateBehavior = async (id, behaviorData, user = null) => {
  return await updateBehaviorInDb(id, behaviorData, user);
};

export const deleteBehavior = async (id, user = null) => {
  return await deleteBehaviorInDb(id, user);
};

export const getBehaviorsByStudent = async (studentId, params = {}, user = null) => {
  return await getBehaviorsByStudentFromDb(studentId, params, user);
};

export const getBehaviorsByClass = async (classId, params = {}, user = null) => {
  return await getBehaviorsByClassFromDb(classId, params, user);
};
