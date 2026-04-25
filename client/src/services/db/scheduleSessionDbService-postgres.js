/**
 * Schedule Session Database Service - API Client
 * 
 * PURPOSE: Handles all schedule session operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get all schedule sessions from API with pagination and filtering
 */
const getScheduleSessions = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[ScheduleSessionDbService] Getting schedule sessions with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.classId) queryParams.append('classId', params.classId);
    if (params.subjectId) queryParams.append('subjectId', params.subjectId);
    if (params.instructorUserId) queryParams.append('instructorUserId', params.instructorUserId);
    if (params.classroomId) queryParams.append('classroomId', params.classroomId);
    if (params.timeSlotId) queryParams.append('timeSlotId', params.timeSlotId);
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.isCancelled !== undefined) queryParams.append('isCancelled', params.isCancelled);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/schedule-sessions?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Retrieved schedule sessions in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error getting schedule sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedule sessions by date range
 */
const getScheduleSessionsByRange = async (params) => {
  const startTime = Date.now();
  try {
    console.log('[ScheduleSessionDbService] Getting schedule sessions by range:', params);
    
    const queryParams = new URLSearchParams();
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.instructorUserId) queryParams.append('instructorUserId', params.instructorUserId);
    if (params.classroomId) queryParams.append('classroomId', params.classroomId);

    const url = `/schedule-sessions/range?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Retrieved schedule sessions in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error getting schedule sessions by range:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedule session by ID
 */
const getScheduleSessionById = async (sessionId) => {
  const startTime = Date.now();
  try {
    console.log(`[ScheduleSessionDbService] Getting schedule session by ID: ${sessionId}`);
    
    const result = await api.get(`/schedule-sessions/${sessionId}`);

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Retrieved schedule session in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error getting schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check for scheduling conflicts
 */
const checkConflicts = async (params) => {
  const startTime = Date.now();
  try {
    console.log('[ScheduleSessionDbService] Checking conflicts:', params);
    
    const result = await api.post('/schedule-sessions/check-conflicts', params);

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Checked conflicts in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error checking conflicts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new schedule session with conflict detection
 */
const createScheduleSession = async (sessionData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[ScheduleSessionDbService] Creating new schedule session', { data: sessionData });

    const result = await api.post('/schedule-sessions', sessionData);

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Created schedule session in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error creating schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update schedule session with conflict detection
 */
const updateScheduleSession = async (sessionId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[ScheduleSessionDbService] Updating schedule session: ${sessionId}`, { data: updateData });

    const result = await api.put(`/schedule-sessions/${sessionId}`, updateData);

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Updated schedule session in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error updating schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a schedule session
 */
const cancelScheduleSession = async (sessionId, cancelReason = '', user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[ScheduleSessionDbService] Cancelling schedule session: ${sessionId}`);

    const result = await api.post(`/schedule-sessions/${sessionId}/cancel`, { cancelReason });

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Cancelled schedule session in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error cancelling schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete schedule session
 */
const deleteScheduleSession = async (sessionId, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[ScheduleSessionDbService] Deleting schedule session: ${sessionId}`);

    const result = await api.delete(`/schedule-sessions/${sessionId}`);

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Deleted schedule session in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error deleting schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bulk create schedule sessions
 */
const bulkCreateScheduleSessions = async (sessions, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[ScheduleSessionDbService] Bulk creating schedule sessions', { count: sessions.length });

    const result = await api.post('/schedule-sessions/bulk', { sessions });

    const duration = Date.now() - startTime;
    console.log(`[ScheduleSessionDbService] ✅ Bulk created schedule sessions in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ScheduleSessionDbService] ❌ Error bulk creating schedule sessions:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getScheduleSessions,
  getScheduleSessionsByRange,
  getScheduleSessionById,
  checkConflicts,
  createScheduleSession,
  updateScheduleSession,
  cancelScheduleSession,
  deleteScheduleSession,
  bulkCreateScheduleSessions
};
