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
      if (error.response?.status === 404) {
        return { success: false, error: 'Subject not found', data: null };
      }
      console.error(`[${this.serviceName}] ❌ Error getting subject by ID:`, error);
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * Create a new subject
   */
  async create(subjectData) {
    const startTime = Date.now();
    try {
      console.log(`[${this.serviceName}] Creating subject:`, { data: subjectData });
      
      const result = await api.post('/subjects', subjectData);

      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] ✅ Created subject in ${duration}ms`, { subjectId: result.data?.id });

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        duration: `${duration}ms`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] ❌ Error creating subject:`, error);
      return { 
        success: false, 
        error: error.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }

  /**
   * Update an existing subject
   */
  async update(id, updateData) {
    const startTime = Date.now();
    try {
      console.log(`[${this.serviceName}] Updating subject:`, { id, data: updateData });
      
      const result = await api.put(`/subjects/${id}`, updateData);

      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] ✅ Updated subject in ${duration}ms`, { subjectId: id });

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        duration: `${duration}ms`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] ❌ Error updating subject:`, error);
      return { 
        success: false, 
        error: error.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }

  /**
   * Delete a subject (soft delete)
   */
  async delete(id, options = {}) {
    const startTime = Date.now();
    try {
      console.log(`[${this.serviceName}] Deleting subject:`, { id, force: options.force });
      
      const result = await api.delete(`/subjects/${id}`, { data: { force: options.force || false } });

      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] ✅ Deleted subject in ${duration}ms`, { subjectId: id });

      return {
        success: result.success,
        error: result.error,
        code: result.code,
        dependencies: result.dependencies,
        message: result.message,
        duration: `${duration}ms`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] ❌ Error deleting subject:`, error);
      return { 
        success: false, 
        error: error.message,
        duration: `${duration}ms`
      };
    }
  }
}

// Create singleton instance
const subjectDbService = new SubjectDbService();

// Export the instance
export default subjectDbService;
