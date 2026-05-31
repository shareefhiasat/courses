import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Classroom Availability Service
 * 
 * Service layer for classroom availability operations
 */

const API_BASE = '/api/v1/classroom-availability';

/**
 * Get all classroom availabilities
 */
export const getAllClassroomAvailabilities = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    
    const response = await fetch(`${API_BASE}?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting classroom availabilities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get classroom availability by classroom ID
 */
export const getClassroomAvailabilityByClassroomId = async (classroomId) => {
  try {
    const response = await fetch(`${API_BASE}/classroom/${classroomId}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting classroom availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create classroom availability
 */
export const createClassroomAvailability = async (data) => {
  try {
    const response = await fetch(API_BASE, {
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
    error('Error creating classroom availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update classroom availability
 */
export const updateClassroomAvailability = async (classroomId, data) => {
  try {
    const response = await fetch(`${API_BASE}/classroom/${classroomId}`, {
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
    error('Error updating classroom availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete classroom availability
 */
export const deleteClassroomAvailability = async (classroomId) => {
  try {
    const response = await fetch(`${API_BASE}/classroom/${classroomId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error deleting classroom availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if classroom is available on a specific date
 */
export const checkClassroomAvailability = async (classroomId, date) => {
  try {
    const response = await fetch(`${API_BASE}/classroom/${classroomId}/check/${date}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error checking classroom availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get classroom utilization for a date range
 */
export const getClassroomUtilization = async (classroomId, startDate, endDate) => {
  try {
    const response = await fetch(`${API_BASE}/classroom/${classroomId}/utilization/${startDate}/${endDate}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting classroom utilization:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all available classrooms for a specific date and time slot
 */
export const getAvailableClassroomsForDate = async (date, timeSlotId, programId) => {
  try {
    const response = await fetch(`${API_BASE}/available/${date}/${timeSlotId}/${programId}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting available classrooms:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getAllClassroomAvailabilities,
  getClassroomAvailabilityByClassroomId,
  createClassroomAvailability,
  updateClassroomAvailability,
  deleteClassroomAvailability,
  checkClassroomAvailability,
  getClassroomUtilization,
  getAvailableClassroomsForDate,
};
