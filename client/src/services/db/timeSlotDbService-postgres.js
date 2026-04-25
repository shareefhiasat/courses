/**
 * Time Slot Database Service - API Client
 * 
 * PURPOSE: Handles all time slot operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get all time slots from API with pagination and filtering
 */
const getTimeSlots = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[TimeSlotDbService] Getting time slots with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.isBreak !== undefined) queryParams.append('isBreak', params.isBreak);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/time-slots?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Retrieved time slots in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error getting time slots:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedulable time slots (excludes breaks)
 */
const getSchedulableTimeSlots = async (params) => {
  const startTime = Date.now();
  try {
    console.log('[TimeSlotDbService] Getting schedulable time slots:', params);
    
    const queryParams = new URLSearchParams();
    if (params.programId) queryParams.append('programId', params.programId);

    const url = `/time-slots/schedulable?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Retrieved schedulable time slots in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error getting schedulable time slots:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bulk initialize default time slots for a program
 */
const bulkInitDefaults = async (params) => {
  const startTime = Date.now();
  try {
    console.log('[TimeSlotDbService] Bulk initializing default time slots:', params);
    
    const result = await api.post('/time-slots/bulk-init', params);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Bulk initialized time slots in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error bulk initializing time slots:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get time slots by program ID
 */
const getTimeSlotsByProgram = async (programId) => {
  const startTime = Date.now();
  try {
    console.log(`[TimeSlotDbService] Getting time slots for program: ${programId}`);
    
    const result = await api.get(`/time-slots/program/${programId}`);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Retrieved time slots in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error getting time slots by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get time slot by ID
 */
const getTimeSlotById = async (timeSlotId) => {
  const startTime = Date.now();
  try {
    console.log(`[TimeSlotDbService] Getting time slot by ID: ${timeSlotId}`);
    
    const result = await api.get(`/time-slots/${timeSlotId}`);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Retrieved time slot in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error getting time slot:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new time slot
 */
const createTimeSlot = async (timeSlotData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[TimeSlotDbService] Creating new time slot', { data: timeSlotData });

    const result = await api.post('/time-slots', timeSlotData);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Created time slot in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error creating time slot:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update time slot
 */
const updateTimeSlot = async (timeSlotId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[TimeSlotDbService] Updating time slot: ${timeSlotId}`, { data: updateData });

    const result = await api.put(`/time-slots/${timeSlotId}`, updateData);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Updated time slot in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error updating time slot:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete time slot
 */
const deleteTimeSlot = async (timeSlotId, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[TimeSlotDbService] Deleting time slot: ${timeSlotId}`);

    const result = await api.delete(`/time-slots/${timeSlotId}`);

    const duration = Date.now() - startTime;
    console.log(`[TimeSlotDbService] ✅ Deleted time slot in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[TimeSlotDbService] ❌ Error deleting time slot:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getTimeSlots,
  getSchedulableTimeSlots,
  bulkInitDefaults,
  getTimeSlotsByProgram,
  getTimeSlotById,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot
};
