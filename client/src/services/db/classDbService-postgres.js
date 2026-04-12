/**
 * Class Database Service - API Client
 * 
 * PURPOSE: Handles all class operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

class ClassDbService {
  constructor() {
    this.serviceName = 'ClassDbService';
  }

  /**
   * Get all classes with pagination and filtering
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
      if (params.instructorId) queryParams.append('instructorId', params.instructorId);
      if (params.subjectId) queryParams.append('subjectId', params.subjectId);
      if (params.includeEnrollments) queryParams.append('includeEnrollments', params.includeEnrollments);

      const url = `/classes?${queryParams.toString()}`;
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
   * Get active classes only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }

  /**
   * Get classes by instructor
   */
  async getByInstructor(instructorId, params = {}) {
    return this.getAll({ ...params, instructorId });
  }

  /**
   * Get classes by program
   */
  async getByProgram(programId, params = {}) {
    return this.getAll({ ...params, programId });
  }

  /**
   * Get classes with enrollment count
   */
  async getWithEnrollmentCount(params = {}) {
    return this.getAll({ ...params, includeEnrollments: true });
  }

  /**
   * Get class by ID
   */
  async getById(id, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.includeEnrollments) queryParams.append('includeEnrollments', params.includeEnrollments);
      
      const url = `/classes/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await api.get(url);
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Error getting class by ID:`, error);
      return { success: false, error: error.message, data: null };
    }
  }
}

// Create singleton instance
const classDbService = new ClassDbService();

// Export the instance
export default classDbService;
