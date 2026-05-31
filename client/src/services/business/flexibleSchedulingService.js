import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Flexible Scheduling Service
 * 
 * Service layer for flexible scheduling operations
 */

const API_BASE = '/api/v1/flexible-scheduling';

/**
 * Get all flexible schedule sessions with filters
 */
export const getFlexibleScheduleSessions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.instructorUserId) params.append('instructorUserId', filters.instructorUserId);
    if (filters.classroomId) params.append('classroomId', filters.classroomId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.isCancelled !== undefined) params.append('isCancelled', filters.isCancelled);
    
    const response = await fetch(`${API_BASE}/sessions?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting flexible schedule sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get flexible schedule session by ID
 */
export const getFlexibleScheduleSessionById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/sessions/${id}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting flexible schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create flexible schedule session
 */
export const createFlexibleScheduleSession = async (data) => {
  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error creating flexible schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update flexible schedule session
 */
export const updateFlexibleScheduleSession = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error updating flexible schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete flexible schedule session (soft delete)
 */
export const deleteFlexibleScheduleSession = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error deleting flexible schedule session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bulk create flexible schedule sessions
 */
export const bulkCreateFlexibleScheduleSessions = async (sessions) => {
  try {
    const response = await fetch(`${API_BASE}/sessions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions }),
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error bulk creating flexible schedule sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sessions for a specific date range
 */
export const getSessionsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.instructorUserId) params.append('instructorUserId', filters.instructorUserId);
    if (filters.classroomId) params.append('classroomId', filters.classroomId);
    
    const response = await fetch(`${API_BASE}/sessions/range/${startDate}/${endDate}?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting sessions by date range:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check for conflicts
 */
export const checkConflicts = async (instructorUserId, date, timeSlotId, classroomId, excludeSessionId = null) => {
  try {
    const params = new URLSearchParams();
    params.append('instructorUserId', instructorUserId);
    params.append('date', date);
    params.append('timeSlotId', timeSlotId);
    if (classroomId) params.append('classroomId', classroomId);
    if (excludeSessionId) params.append('excludeSessionId', excludeSessionId);
    
    const response = await fetch(`${API_BASE}/sessions/conflicts/check?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error checking conflicts:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getFlexibleScheduleSessions,
  getFlexibleScheduleSessionById,
  createFlexibleScheduleSession,
  updateFlexibleScheduleSession,
  deleteFlexibleScheduleSession,
  bulkCreateFlexibleScheduleSessions,
  getSessionsByDateRange,
  checkConflicts,
};
