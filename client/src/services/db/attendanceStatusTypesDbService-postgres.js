/**
 * Attendance Status Types Database Service - API Client
 * 
 * PURPOSE: Handles attendance status types lookup via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

class AttendanceStatusTypesDbService {
  constructor() {
    this.serviceName = 'AttendanceStatusTypesDbService';
  }

  /**
   * Log service operation error
   */
  logError(operation, error, data = {}) {
    console.error(`[${this.serviceName}] ❌ Error ${operation}:`, error, data);
  }

  /**
   * Get all attendance status types
   */
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.isActive) queryParams.append('isActive', params.isActive);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `/attendance-status-types${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await api.get(url);
      
      return result;
    } catch (error) {
      this.logError('getAll', error, { params });
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get active attendance status types only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }

  /**
   * Get attendance status type by code
   */
  async getByCode(code, params = {}) {
    try {
      // Use unified lookup endpoint for consistency
      const result = await api.get(`/lookup/attendance-status-types/by-code?code=${encodeURIComponent(code)}`);
      return result;
    } catch (error) {
      this.logError('getByCode', error, { code });
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Get localized label for attendance status
   */
  async getLocalizedLabel(code, lang = 'en') {
    try {
      const result = await this.getByCode(code);
      if (result.success && result.data) {
        const type = result.data;
        return lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn;
      }
      return code; // Fallback to code if not found
    } catch (error) {
      this.logError('getLocalizedLabel', error, { code, lang });
      return code; // Fallback to code
    }
  }

  /**
   * Get color for attendance status
   */
  async getColor(code) {
    try {
      const result = await this.getByCode(code);
      if (result.success && result.data && result.data.color) {
        return result.data.color;
      }
      // Fallback colors
      const fallbackColors = {
        present: '#10b981', // Green
        absent: '#ef4444',  // Red
        late: '#f59e0b',    // Yellow
        excused: '#3b82f6', // Blue
        sick: '#8b5cf6',    // Purple
        holiday: '#06b6d4', // Cyan
        cancelled: '#6b7280' // Gray
      };
      return fallbackColors[code] || '#6b7280';
    } catch (error) {
      this.logError('getColor', error, { code });
      return '#6b7280'; // Default gray
    }
  }
}

export default new AttendanceStatusTypesDbService();
