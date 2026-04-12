/**
 * Subject Database Service - API Client
 * 
 * PURPOSE: Handles all subject operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

class SubjectDbService {
  constructor() {
    this.serviceName = 'SubjectDbService';
  }

  /**
   * Get all subjects with pagination and filtering
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
      if (params.includeEnrollments) queryParams.append('includeEnrollments', params.includeEnrollments);

      const url = `/subjects?${queryParams.toString()}`;
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
   * Get active subjects only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }

  /**
   * Get subjects by program
   */
  async getByProgram(programId, params = {}) {
    return this.getAll({ ...params, programId });
  }

  /**
   * Get subjects by instructor
   */
  async getByInstructor(instructorId, params = {}) {
    return this.getAll({ ...params, instructorId });
  }

  /**
   * Get subjects with enrollment count
   */
  async getWithEnrollmentCount(params = {}) {
    return this.getAll({ ...params, includeEnrollments: true });
  }

  /**
   * Get subject by ID
   */
  async getById(id, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.includeEnrollments) queryParams.append('includeEnrollments', params.includeEnrollments);
      
      const url = `/subjects/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await api.get(url);
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Error getting subject by ID:`, error);
      return { success: false, error: error.message, data: null };
    }
  }
}

// Create singleton instance
const subjectDbService = new SubjectDbService();

// Export the instance
export default subjectDbService;
