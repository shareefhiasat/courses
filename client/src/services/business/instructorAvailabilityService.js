import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Instructor Availability Service
 * 
 * Service layer for instructor availability operations
 */

const API_BASE = '/api/v1/instructor-availability';

/**
 * Get all instructor availabilities
 */
export const getAllInstructorAvailabilities = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.instructorUserId) params.append('instructorUserId', filters.instructorUserId);
    if (filters.dayOfWeek) params.append('dayOfWeek', filters.dayOfWeek);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.timeFrom) params.append('timeFrom', filters.timeFrom);
    if (filters.timeTo) params.append('timeTo', filters.timeTo);
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const response = await fetch(`${API_BASE}?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting instructor availabilities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get instructor availability by user ID
 */
export const getInstructorAvailabilityByUserId = async (instructorUserId) => {
  try {
    const response = await fetch(`${API_BASE}/instructor/${instructorUserId}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting instructor availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create instructor availability
 */
export const createInstructorAvailability = async (data) => {
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
    error('Error creating instructor availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update instructor availability
 */
export const updateInstructorAvailability = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error, conflicts: result.conflicts, code: result.code };
    }
  } catch (error) {
    error('Error updating instructor availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete instructor availability
 */
export const deleteInstructorAvailability = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error, conflicts: result.conflicts, code: result.code };
    }
  } catch (error) {
    error('Error deleting instructor availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if instructor is available on a specific date
 */
export const checkInstructorAvailability = async (instructorUserId, date) => {
  try {
    const response = await fetch(`${API_BASE}/instructor/${instructorUserId}/check/${date}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error checking instructor availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get instructor workload for a date range
 */
export const getInstructorWorkload = async (instructorUserId, startDate, endDate) => {
  try {
    const response = await fetch(`${API_BASE}/instructor/${instructorUserId}/workload/${startDate}/${endDate}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting instructor workload:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate instructor availability change before save/delete
 */
export const validateInstructorAvailabilityChange = async (data) => {
  try {
    const response = await fetch(`${API_BASE}/validate-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    error('Error validating instructor availability change:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getAllInstructorAvailabilities,
  getInstructorAvailabilityByUserId,
  createInstructorAvailability,
  updateInstructorAvailability,
  deleteInstructorAvailability,
  checkInstructorAvailability,
  getInstructorWorkload,
  validateInstructorAvailabilityChange,
};
