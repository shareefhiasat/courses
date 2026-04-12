/**
 * Enrollment Database Service - API Client
 * 
 * PURPOSE: Handles all enrollment operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';
import api from '@api';

class EnrollmentDbService extends BaseDbService {
  constructor() {
    super('EnrollmentDbService', 'enrollments');
  }

  /**
   * Get enrollments by student ID
   */
  async getByStudent(studentId, params = {}) {
    return this.getAll({ ...params, userId: studentId });
  }

  /**
   * Get enrollments by class ID
   */
  async getByClass(classId, params = {}) {
    return this.getAll({ ...params, classId });
  }

  /**
   * Get enrollments by program ID
   */
  async getByProgram(programId, params = {}) {
    return this.getAll({ ...params, programId });
  }

  /**
   * Get enrollments by status
   */
  async getByStatus(statusId, params = {}) {
    return this.getAll({ ...params, statusId });
  }

  /**
   * Get active enrollments
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }

  /**
   * Get students by class (returns user data for enrolled students)
   */
  async getStudentsByClass(classId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (classId) queryParams.append('classId', classId);
      if (params.includeUsers) queryParams.append('includeUsers', params.includeUsers);
      
      const url = `/enrollments/students-by-class${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await api.get(url);
      return result;
    } catch (error) {
      this.logError('getStudentsByClass', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get enrollment stats for a class
   */
  async getClassStats(classId, params = {}) {
    try {
      const result = await api.get(`/enrollments/stats?classId=${classId}`);
      return result;
    } catch (error) {
      this.logError('getClassStats', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export default new EnrollmentDbService();
