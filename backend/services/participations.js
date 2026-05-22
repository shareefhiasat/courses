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
import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';

export const getAllParticipations = async (params = {}, user = null) => {
  return await getAllParticipationsDB(params, user);
};

export const getParticipationById = async (id, user = null) => {
  return await getParticipationByIdDB(id, user);
};

export const createParticipation = async (participationData, user = null) => {
  const result = await createParticipationDB(participationData, user);
  
  // Send notification for new participation record
  if (result.success && result.data) {
    try {
      // Map participation type to specific event
      const participationType = result.data.participationType?.code || 'recorded';
      const eventTypeMap = {
        'explained_lesson': EVENTS.PARTICIPATION_EXPLAINED_LESSON,
        'gave_project': EVENTS.PARTICIPATION_GAVE_PROJECT,
        'gave_paper': EVENTS.PARTICIPATION_GAVE_PAPER,
        'gave_research': EVENTS.PARTICIPATION_GAVE_RESEARCH,
        'active_discussion': EVENTS.PARTICIPATION_ACTIVE_DISCUSSION,
        'answered_question': EVENTS.PARTICIPATION_ANSWERED_QUESTION,
        'helped_classmate': EVENTS.PARTICIPATION_HELPED_CLASSMATE,
        'excellent': EVENTS.PARTICIPATION_EXCELLENT
      };
      
      const eventType = eventTypeMap[participationType] || EVENTS.PARTICIPATION_RECORDED;
      
      await notificationGateway.emit(
        eventType,
        {
          studentName: result.data.student?.displayName || result.data.studentName,
          participationType: result.data.participationType?.nameEn || participationType
        },
        user,
        { userId: result.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send participation notification:', notifError);
    }
  }
  
  return result;
};

export const updateParticipation = async (id, updateData, user = null) => {
  const result = await updateParticipationDB(id, updateData, user);
  
  // Send notification for participation update
  if (result.success && result.data) {
    try {
      await notificationGateway.emit(
        EVENTS.PARTICIPATION_UPDATED,
        {
          studentName: result.data.student?.displayName || result.data.studentName,
          participationType: result.data.participationType?.nameEn || 'participation'
        },
        user,
        { userId: result.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send participation update notification:', notifError);
    }
  }
  
  return result;
};

export const deleteParticipation = async (id, user = null) => {
  // Get participation data before deletion for notification
  const existing = await getParticipationByIdDB(id, user);
  
  const result = await deleteParticipationDB(id, user);
  
  // Send notification for participation deletion
  if (result.success && existing?.data) {
    try {
      await notificationGateway.emit(
        EVENTS.PARTICIPATION_DELETED,
        {
          studentName: existing.data.student?.displayName || existing.data.studentName,
          participationType: existing.data.participationType?.nameEn || 'participation'
        },
        user,
        { userId: existing.data.studentId }
      );
    } catch (notifError) {
      console.error('Failed to send participation deletion notification:', notifError);
    }
  }
  
  return result;
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
