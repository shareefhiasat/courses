/**
 * Participations Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for participation operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getAllParticipations as getAllParticipationsDB,
  getParticipationById as getParticipationByIdDB,
  createParticipation as createParticipationDB,
  updateParticipation as updateParticipationDB,
  deleteParticipation as deleteParticipationDB,
  getParticipationsByStudent as getParticipationsByStudentDB,
  getParticipationsByClass as getParticipationsByClassDB,
  getStudentParticipationStats,
  getClassParticipationStats
} from '../db/participations-postgres.js';

export const getAllParticipations = async (params = {}, user = null) => {
  return await getAllParticipationsDB(params, user);
};

export const getParticipationById = async (id, user = null) => {
  return await getParticipationByIdDB(id, user);
};

export const createParticipation = async (participationData, user = null) => {
  return await createParticipationDB(participationData, user);
};

export const updateParticipation = async (id, updateData, user = null) => {
  return await updateParticipationDB(id, updateData, user);
};

export const deleteParticipation = async (id, user = null) => {
  return await deleteParticipationDB(id, user);
};

export const getParticipationsByStudent = async (studentId, params = {}, user = null) => {
  return await getParticipationsByStudentDB(studentId, params, user);
};

export const getParticipationsByClass = async (classId, params = {}, user = null) => {
  return await getParticipationsByClassDB(classId, params, user);
};

export const getStudentStats = async (studentId, user = null) => {
  return await getStudentParticipationStats(studentId, user);
};

export const getClassStats = async (classId, user = null) => {
  return await getClassParticipationStats(classId, user);
};
