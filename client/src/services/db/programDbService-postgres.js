/**
 * Program Database Service - API Client
 * 
 * PURPOSE: Handles all program operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get all programs from API with pagination and filtering
 */
const getPrograms = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[ProgramDbService] Getting programs with params:', params);
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.includeSubjects) queryParams.append('includeSubjects', params.includeSubjects);
    if (params.includeClasses) queryParams.append('includeClasses', params.includeClasses);
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.orderDirection) queryParams.append('orderDirection', params.orderDirection);

    const url = `/programs?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[ProgramDbService] ✅ Retrieved programs in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ProgramDbService] ❌ Error getting programs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get program by ID
 */
const getProgramById = async (programId, params = {}) => {
  const startTime = Date.now();
  try {
    console.log(`[ProgramDbService] Getting program by ID: ${programId}`);
    
    // Build query string for includes
    const queryParams = new URLSearchParams();
    if (params.includeSubjects) queryParams.append('includeSubjects', params.includeSubjects);
    if (params.includeClasses) queryParams.append('includeClasses', params.includeClasses);

    const url = `/programs/${programId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[ProgramDbService] ✅ Retrieved program in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ProgramDbService] ❌ Error getting program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new program
 */
const create = async (programData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[ProgramDbService] Creating new program', { data: programData });

    const result = await api.post('/programs', programData);

    const duration = Date.now() - startTime;
    console.log(`[ProgramDbService] ✅ Created program in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ProgramDbService] ❌ Error creating program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update program
 */
const update = async (programId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[ProgramDbService] Updating program: ${programId}`, { data: updateData });

    const result = await api.put(`/programs/${programId}`, updateData);

    const duration = Date.now() - startTime;
    console.log(`[ProgramDbService] ✅ Updated program in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ProgramDbService] ❌ Error updating program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete program (soft delete by setting isActive to false)
 */
const deleteProgram = async (programId) => {
  const startTime = Date.now();
  try {
    console.log(`[ProgramDbService] Soft deleting program: ${programId}`);

    const result = await api.delete(`/programs/${programId}`);

    const duration = Date.now() - startTime;
    console.log(`[ProgramDbService] ✅ Soft deleted program in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ProgramDbService] ❌ Error deleting program:', error);
    return { success: false, error: error.message };
  }
};

// Export for ES module compatibility
export default {
  getPrograms,
  getProgramById,
  create,
  update,
  deleteProgram
};
