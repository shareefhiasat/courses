/**
 * Behavior Database Service - API Client
 * 
 * PURPOSE: Handles all behavior operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';
import api from '@api';

class BehaviorDbService extends BaseDbService {
  constructor() {
    super('BehaviorDbService', 'behaviors');
  }

  /**
   * Get behaviors by student ID
   */
  async getByStudent(studentId, params = {}) {
    return this.getAll({ ...params, userId: studentId });
  }

  /**
   * Get behaviors by class ID
   */
  async getByClass(classId, params = {}) {
    return this.getAll({ ...params, classId });
  }

  /**
   * Get active behaviors only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }

  /**
   * Get behaviors by type
   */
  async getByType(typeId, params = {}) {
    return this.getAll({ ...params, typeId });
  }

  /**
   * Get behavior stats for a student
   */
  async getStudentStats(studentId) {
    try {
      const result = await api.get(`/behaviors/stats?userId=${studentId}`);
      return result;
    } catch (error) {
      this.logError('getStudentStats', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Get behaviors by recorder
   */
  async getByRecorder(recorderId, params = {}) {
    return this.getAll({ ...params, recordedBy: recorderId });
  }

  /**
   * Get recent behaviors for a student
   */
  async getRecentForStudent(studentId, limit = 10) {
    return this.getAll({ userId: studentId, _sort: 'recordedAt', _order: 'desc', _limit: limit });
  }
}

export default new BehaviorDbService();
