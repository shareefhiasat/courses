/**
 * Classroom Database Service - API Client
 * 
 * PURPOSE: Handles all classroom operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get all classrooms from API with pagination and filtering
 */
const getClassrooms = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[ClassroomDbService] Getting classrooms with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.status) queryParams.append('status', params.status);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/classrooms?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[ClassroomDbService] ✅ Retrieved classrooms in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ClassroomDbService] ❌ Error getting classrooms:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get available classrooms for a date/time slot
 */
const getAvailableClassrooms = async (params) => {
  const startTime = Date.now();
  try {
    console.log('[ClassroomDbService] Getting available classrooms:', params);
    
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.timeSlotId) queryParams.append('timeSlotId', params.timeSlotId);
    if (params.programId) queryParams.append('programId', params.programId);

    const url = `/classrooms/available?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[ClassroomDbService] ✅ Retrieved available classrooms in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ClassroomDbService] ❌ Error getting available classrooms:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get classrooms by program ID
 */
const getClassroomsByProgram = async (programId) => {
  const startTime = Date.now();
  try {
    console.log(`[ClassroomDbService] Getting classrooms for program: ${programId}`);
    
    const result = await api.get(`/classrooms/program/${programId}`);

    const duration = Date.now() - startTime;
    console.log(`[ClassroomDbService] ✅ Retrieved classrooms in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ClassroomDbService] ❌ Error getting classrooms by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get classroom by ID
 */
const getClassroomById = async (classroomId) => {
  const startTime = Date.now();
  try {
    console.log(`[ClassroomDbService] Getting classroom by ID: ${classroomId}`);
    
    const result = await api.get(`/classrooms/${classroomId}`);

    const duration = Date.now() - startTime;
    console.log(`[ClassroomDbService] ✅ Retrieved classroom in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ClassroomDbService] ❌ Error getting classroom:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new classroom
 */
const createClassroom = async (classroomData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[ClassroomDbService] Creating new classroom', { data: classroomData });

    const result = await api.post('/classrooms', classroomData);

    const duration = Date.now() - startTime;
    console.log(`[ClassroomDbService] ✅ Created classroom in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ClassroomDbService] ❌ Error creating classroom:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update classroom
 */
const updateClassroom = async (classroomId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[ClassroomDbService] Updating classroom: ${classroomId}`, { data: updateData });

    const result = await api.put(`/classrooms/${classroomId}`, updateData);

    const duration = Date.now() - startTime;
    console.log(`[ClassroomDbService] ✅ Updated classroom in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ClassroomDbService] ❌ Error updating classroom:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete classroom
 */
const deleteClassroom = async (classroomId, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[ClassroomDbService] Deleting classroom: ${classroomId}`);

    const result = await api.delete(`/classrooms/${classroomId}`);

    const duration = Date.now() - startTime;
    console.log(`[ClassroomDbService] ✅ Deleted classroom in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ClassroomDbService] ❌ Error deleting classroom:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getClassrooms,
  getAvailableClassrooms,
  getClassroomsByProgram,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom
};
