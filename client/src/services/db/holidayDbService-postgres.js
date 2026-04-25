/**
 * Holiday Database Service - API Client
 * 
 * PURPOSE: Handles all holiday operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get all holidays from API with pagination and filtering
 */
const getHolidays = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[HolidayDbService] Getting holidays with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.type) queryParams.append('type', params.type);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/holidays?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[HolidayDbService] ✅ Retrieved holidays in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[HolidayDbService] ❌ Error getting holidays:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get upcoming holidays
 */
const getUpcomingHolidays = async (params) => {
  const startTime = Date.now();
  try {
    console.log('[HolidayDbService] Getting upcoming holidays:', params);
    
    const queryParams = new URLSearchParams();
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/holidays/upcoming?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[HolidayDbService] ✅ Retrieved upcoming holidays in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[HolidayDbService] ❌ Error getting upcoming holidays:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get holidays by program ID (including global)
 */
const getHolidaysByProgram = async (programId) => {
  const startTime = Date.now();
  try {
    console.log(`[HolidayDbService] Getting holidays for program: ${programId}`);
    
    const result = await api.get(`/holidays/program/${programId}`);

    const duration = Date.now() - startTime;
    console.log(`[HolidayDbService] ✅ Retrieved holidays in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[HolidayDbService] ❌ Error getting holidays by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get holiday by ID
 */
const getHolidayById = async (holidayId) => {
  const startTime = Date.now();
  try {
    console.log(`[HolidayDbService] Getting holiday by ID: ${holidayId}`);
    
    const result = await api.get(`/holidays/${holidayId}`);

    const duration = Date.now() - startTime;
    console.log(`[HolidayDbService] ✅ Retrieved holiday in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[HolidayDbService] ❌ Error getting holiday:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new holiday
 */
const createHoliday = async (holidayData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[HolidayDbService] Creating new holiday', { data: holidayData });

    const result = await api.post('/holidays', holidayData);

    const duration = Date.now() - startTime;
    console.log(`[HolidayDbService] ✅ Created holiday in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[HolidayDbService] ❌ Error creating holiday:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update holiday
 */
const updateHoliday = async (holidayId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[HolidayDbService] Updating holiday: ${holidayId}`, { data: updateData });

    const result = await api.put(`/holidays/${holidayId}`, updateData);

    const duration = Date.now() - startTime;
    console.log(`[HolidayDbService] ✅ Updated holiday in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[HolidayDbService] ❌ Error updating holiday:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete holiday
 */
const deleteHoliday = async (holidayId, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[HolidayDbService] Deleting holiday: ${holidayId}`);

    const result = await api.delete(`/holidays/${holidayId}`);

    const duration = Date.now() - startTime;
    console.log(`[HolidayDbService] ✅ Deleted holiday in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[HolidayDbService] ❌ Error deleting holiday:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getHolidays,
  getUpcomingHolidays,
  getHolidaysByProgram,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
