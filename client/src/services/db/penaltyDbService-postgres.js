/**
 * Penalty Database Service - API Client
 * 
 * PURPOSE: Handles all penalty operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';
import api from '@api';

class PenaltyDbService extends BaseDbService {
  constructor() {
    super('PenaltyDbService', 'penalties');
  }

  /**
   * Get penalties by student ID
   */
  async getByStudent(studentId, params = {}) {
    return this.getAll({ ...params, userId: studentId });
  }

  /**
   * Get penalties by class ID
   */
  async getByClass(classId, params = {}) {
    return this.getAll({ ...params, classId });
  }

  /**
   * Get active penalties only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }

  /**
   * Get penalties by type
   */
  async getByType(typeId, params = {}) {
    return this.getAll({ ...params, typeId });
  }

  /**
   * Get penalty stats for a student
   */
  async getStudentStats(studentId) {
    try {
      const result = await api.get(`/penalties/stats?userId=${studentId}`);
      return result;
    } catch (error) {
      this.logError('getStudentStats', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Get penalties by issuer
   */
  async getByIssuer(issuerId, params = {}) {
    return this.getAll({ ...params, issuedBy: issuerId });
  }

  /**
   * Get expired penalties
   */
  async getExpired(params = {}) {
    const now = new Date().toISOString();
    return this.getAll({ ...params, expiresAt_lt: now, isActive: false });
  }
}

export default new PenaltyDbService();
