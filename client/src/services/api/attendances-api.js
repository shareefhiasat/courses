/**
 * Attendances API Service - Real Database Integration
 * 
 * This file provides direct database access for attendances
 * while keeping other services as mock data for now
 */

import attendanceDbService from '../db/attendanceDbService-postgres.cjs';

// Real attendances endpoints using database
export const attendances = {
  getAll: async (filters = {}) => {
    try {
      const result = await attendanceDbService.getAttendances();
      return result;
    } catch (error) {
      console.error('Attendances API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await attendanceDbService.getAttendanceById(id);
      return result;
    } catch (error) {
      console.error('Attendance by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await attendanceDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create attendance API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await attendanceDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update attendance API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await attendanceDbService.deleteAttendance(id);
      return result;
    } catch (error) {
      console.error('Delete attendance API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for attendance-specific operations
  getByUser: async (userId) => {
    try {
      const result = await attendanceDbService.getAttendances({ userId });
      return result;
    } catch (error) {
      console.error('Get attendances by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByClass: async (classId) => {
    try {
      const result = await attendanceDbService.getAttendances({ classId });
      return result;
    } catch (error) {
      console.error('Get attendances by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByDate: async (date) => {
    try {
      const result = await attendanceDbService.getAttendances({ date });
      return result;
    } catch (error) {
      console.error('Get attendances by date API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getClassStats: async (classId, filters = {}) => {
    try {
      const result = await attendanceDbService.getAttendances({ classId, ...filters });
      if (result.success) {
        const attendances = result.data;
        const stats = {
          total: attendances.length,
          present: attendances.filter(a => a.status === 'present').length,
          absent: attendances.filter(a => a.status === 'absent').length,
          late: attendances.filter(a => a.status === 'late').length,
          excused: attendances.filter(a => a.status === 'excused').length,
          attendanceRate: attendances.length > 0 
            ? (attendances.filter(a => a.status === 'present' || a.status === 'late').length / attendances.length) * 100 
            : 0,
          uniqueStudents: [...new Set(attendances.map(a => a.userId))].length,
          uniqueDates: [...new Set(attendances.map(a => a.date))].length
        };
        return { success: true, data: stats };
      }
      return result;
    } catch (error) {
      console.error('Get class stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
