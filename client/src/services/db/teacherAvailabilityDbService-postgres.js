/**
 * Teacher Availability Database Service - API Client
 * 
 * PURPOSE: Handles all teacher availability operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get all teacher availabilities from API with pagination and filtering
 */
const getTeacherAvailabilities = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[TeacherAvailabilityDbService] Getting teacher availabilities with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/teacher-availability?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[TeacherAvailabilityDbService] ✅ Retrieved teacher availabilities in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TeacherAvailabilityDbService] ❌ Error getting teacher availabilities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get available teachers for a date/time slot
 */
const getAvailableTeachers = async (params) => {
  const startTime = Date.now();
  try {
    console.log('[TeacherAvailabilityDbService] Getting available teachers:', params);
    
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.timeSlotId) queryParams.append('timeSlotId', params.timeSlotId);

    const url = `/teacher-availability/available?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[TeacherAvailabilityDbService] ✅ Retrieved available teachers in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TeacherAvailabilityDbService] ❌ Error getting available teachers:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get teacher availability by user ID
 */
const getTeacherAvailabilityByUserId = async (userId) => {
  const startTime = Date.now();
  try {
    console.log(`[TeacherAvailabilityDbService] Getting teacher availability for user: ${userId}`);
    
    const result = await api.get(`/teacher-availability/user/${userId}`);

    const duration = Date.now() - startTime;
    console.log(`[TeacherAvailabilityDbService] ✅ Retrieved teacher availability in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TeacherAvailabilityDbService] ❌ Error getting teacher availability by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get teacher availability by ID
 */
const getTeacherAvailabilityById = async (availabilityId) => {
  const startTime = Date.now();
  try {
    console.log(`[TeacherAvailabilityDbService] Getting teacher availability by ID: ${availabilityId}`);
    
    const result = await api.get(`/teacher-availability/${availabilityId}`);

    const duration = Date.now() - startTime;
    console.log(`[TeacherAvailabilityDbService] ✅ Retrieved teacher availability in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TeacherAvailabilityDbService] ❌ Error getting teacher availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new teacher availability
 */
const createTeacherAvailability = async (availabilityData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[TeacherAvailabilityDbService] Creating new teacher availability', { data: availabilityData });

    const result = await api.post('/teacher-availability', availabilityData);

    const duration = Date.now() - startTime;
    console.log(`[TeacherAvailabilityDbService] ✅ Created teacher availability in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TeacherAvailabilityDbService] ❌ Error creating teacher availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update teacher availability
 */
const updateTeacherAvailability = async (availabilityId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[TeacherAvailabilityDbService] Updating teacher availability: ${availabilityId}`, { data: updateData });

    const result = await api.put(`/teacher-availability/${availabilityId}`, updateData);

    const duration = Date.now() - startTime;
    console.log(`[TeacherAvailabilityDbService] ✅ Updated teacher availability in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TeacherAvailabilityDbService] ❌ Error updating teacher availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete teacher availability
 */
const deleteTeacherAvailability = async (availabilityId, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[TeacherAvailabilityDbService] Deleting teacher availability: ${availabilityId}`);

    const result = await api.delete(`/teacher-availability/${availabilityId}`);

    const duration = Date.now() - startTime;
    console.log(`[TeacherAvailabilityDbService] ✅ Deleted teacher availability in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TeacherAvailabilityDbService] ❌ Error deleting teacher availability:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getTeacherAvailabilities,
  getAvailableTeachers,
  getTeacherAvailabilityByUserId,
  getTeacherAvailabilityById,
  createTeacherAvailability,
  updateTeacherAvailability,
  deleteTeacherAvailability
};
