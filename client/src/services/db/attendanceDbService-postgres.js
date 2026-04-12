/**
 * Attendance Database Service - API Client
 * 
 * PURPOSE: Handles all attendance operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';
import api from '@api';

class AttendanceDbService extends BaseDbService {
  constructor() {
    super('AttendanceDbService', 'attendance');
  }

  /**
   * Get attendance by student ID
   */
  async getByStudent(studentId, params = {}) {
    return this.getAll({ ...params, userId: studentId });
  }

  /**
   * Get attendance by class ID
   */
  async getByClass(classId, params = {}) {
    return this.getAll({ ...params, classId });
  }

  /**
   * Get attendance by date
   */
  async getByDate(date, params = {}) {
    const dateStr = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
    return this.getAll({ ...params, date: dateStr });
  }

  /**
   * Get attendance stats for a class
   */
  async getClassStats(classId, params = {}) {
    try {
      const result = await api.get(`/attendance/stats?classId=${classId}`);
      return result;
    } catch (error) {
      this.logError('getClassStats', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get today's attendance for a student
   */
  async getTodayForStudent(studentId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await api.get(`/attendance?userId=${studentId}&date=${today}`);
      return result;
    } catch (error) {
      this.logError('getTodayForStudent', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Bulk create attendance records
   */
  async bulkCreate(records) {
    try {
      const result = await api.post('/attendance/bulk', { records });
      return result;
    } catch (error) {
      this.logError('bulkCreate', error);
      return { success: false, data: [], error: error.message };
    }
  }
}

export default new AttendanceDbService();
