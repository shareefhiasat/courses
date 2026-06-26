/**
 * Announcement Database Service - API Client
 * 
 * PURPOSE: Handles all announcement operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

class AnnouncementDbService {
  constructor() {
    this.serviceName = 'AnnouncementDbService';
  }

  /**
   * Get all announcements with pagination and filtering
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
      if (params.programId) queryParams.append('programId', params.programId);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.includeReadStatus) queryParams.append('includeReadStatus', params.includeReadStatus);

      const url = `/announcements?${queryParams.toString()}`;
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
   * Get active announcements only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }
  
  /**
   * Get announcements by program
   */
  async getByProgram(programId, params = {}) {
    return this.getAll({ ...params, programId });
  }
  
  /**
   * Get announcements by priority
   */
  async getByPriority(priority, params = {}) {
    return this.getAll({ ...params, priority });
  }
  
  /**
   * Get announcements with read status
   */
  async getWithReadStatus(userId, params = {}) {
    return this.getAll({ ...params, userId, includeReadStatus: true });
  }

  /**
   * Get announcement by ID
   */
  async getById(id, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.includeReadStatus) queryParams.append('includeReadStatus', params.includeReadStatus);
      
      const url = `/announcements/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await api.get(url);
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Error getting announcement by ID:`, error);
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * Create a new announcement
   */
  async create(announcementData) {
    const startTime = Date.now();
    try {
      console.log(`[${this.serviceName}] Creating announcement:`, { data: announcementData });
      
      const result = await api.post('/announcements', announcementData);

      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] ✅ Created announcement in ${duration}ms`, { announcementId: result.data?.id });

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        duration: `${duration}ms`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] ❌ Error creating announcement:`, error);
      return { 
        success: false, 
        error: error.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }

  /**
   * Update an existing announcement
   */
  async update(id, updateData) {
    const startTime = Date.now();
    try {
      console.log(`[${this.serviceName}] Updating announcement:`, { id, data: updateData });
      
      const result = await api.put(`/announcements/${id}`, updateData);

      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] ✅ Updated announcement in ${duration}ms`, { announcementId: id });

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        duration: `${duration}ms`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] ❌ Error updating announcement:`, error);
      return { 
        success: false, 
        error: error.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }

  /**
   * Delete an announcement (soft delete)
   */
  async delete(id) {
    const startTime = Date.now();
    try {
      console.log(`[${this.serviceName}] Deleting announcement:`, { id });
      
      const result = await api.delete(`/announcements/${id}`);

      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] ✅ Deleted announcement in ${duration}ms`, { announcementId: id });

      return {
        success: result.success,
        error: result.error,
        duration: `${duration}ms`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] ❌ Error deleting announcement:`, error);
      return { 
        success: false, 
        error: error.message,
        duration: `${duration}ms`
      };
    }
  }
}

// Create singleton instance
const announcementDbService = new AnnouncementDbService();

// Export the instance
export default announcementDbService;
