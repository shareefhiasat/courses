/**
 * Participation Database Service - API Client
 * 
 * PURPOSE: Handles all participation operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';
import api from '@api';

class ParticipationDbService extends BaseDbService {
  constructor() {
    super('ParticipationDbService', 'participations');
  }

  /**
   * Get participation by student ID
   */
  async getByStudent(studentId, params = {}) {
    return this.getAll({ ...params, userId: studentId });
  }

  /**
   * Get participation by class ID
   */
  async getByClass(classId, params = {}) {
    return this.getAll({ ...params, classId });
  }

  /**
   * Get participation by activity ID
   */
  async getByActivity(activityId, params = {}) {
    return this.getAll({ ...params, activityId });
  }

  /**
   * Get participation by session
   */
  async getBySession(sessionId, params = {}) {
    return this.getAll({ ...params, sessionId });
  }

  /**
   * Get participation stats for a student
   */
  async getStudentStats(studentId) {
    try {
      const result = await api.get(`/participations/stats?userId=${studentId}`);
      return result;
    } catch (error) {
      this.logError('getStudentStats', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Get participation stats for a class
   */
  async getClassStats(classId) {
    try {
      const result = await api.get(`/participations/class-stats?classId=${classId}`);
      return result;
    } catch (error) {
      this.logError('getClassStats', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export default new ParticipationDbService();
