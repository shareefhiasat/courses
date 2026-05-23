/**
 * Activity Database Service - API Client
 * 
 * PURPOSE: Handles all activity operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

class ActivityDbService {
  constructor() {
    this.serviceName = 'ActivityDbService';
  }

  /**
   * Get all activities with pagination and filtering
   */
  async getAll(params = {}) {
    const startTime = Date.now();
    try {
      console.log(`[${this.serviceName}] Getting items:`, { params });
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive) queryParams.append('isActive', params.isActive);
      if (params.type) queryParams.append('type', params.type);
      if (params.programId) queryParams.append('programId', params.programId);
      if (params.instructorId) queryParams.append('instructorId', params.instructorId);
      if (params.includeParticipation) queryParams.append('includeParticipation', params.includeParticipation);

      const url = `/activities?${queryParams.toString()}`;
      const result = await api.get(url);

      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] ✅ Retrieved items in ${duration}ms`, { count: result.data?.length || 0 });

      return {
        success: result.success,
        data: result.data || [],
        total: result.total || 0,
        duration: `${duration}ms`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] ❌ Error getting items:`, error);
      return { 
        success: false, 
        error: error.message,
        data: [],
        duration: `${duration}ms`
      };
    }
  }
  
  /**
   * Get active activities only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }
  
  /**
   * Get activities by type
   */
  async getByType(type, params = {}) {
    return this.getAll({ ...params, type });
  }
  
  /**
   * Get activities by program
   */
  async getByProgram(programId, params = {}) {
    return this.getAll({ ...params, programId });
  }
  
  /**
   * Get activities by instructor
   */
  async getByInstructor(instructorId, params = {}) {
    return this.getAll({ ...params, instructorId });
  }
  
  /**
   * Get activities with participation count
   */
  async getWithParticipationCount(params = {}) {
    return this.getAll({ ...params, includeParticipation: true });
  }

  /**
   * Get activity by ID
   */
  async getById(id, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.includeParticipation) queryParams.append('includeParticipation', params.includeParticipation);
      
      const url = `/activities/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await api.get(url);
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Error getting activity by ID:`, error);
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * Create a new activity
   */
  async create(activityData) {
    try {
      const result = await api.post('/activities', activityData);
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Error creating activity:`, error);
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * Update an existing activity
   */
  async update(id, updateData) {
    try {
      const result = await api.put(`/activities/${id}`, updateData);
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Error updating activity:`, error);
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * Delete an activity
   */
  async delete(id) {
    try {
      const result = await api.delete(`/activities/${id}`);
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Error deleting activity:`, error);
      return { success: false, error: error.message, data: null };
    }
  }
}

// Create singleton instance
const activityDbService = new ActivityDbService();

// Export the instance
export default activityDbService;
