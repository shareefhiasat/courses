/**
 * Enrollments API Service - Real Database Integration
 * 
 * This file provides direct database access for enrollments
 * while keeping other services as mock data for now
 */

import enrollmentDbService from '../db/enrollmentDbService-postgres.cjs';

// Real enrollments endpoints using database
export const enrollments = {
  getAll: async (filters = {}) => {
    try {
      const result = await enrollmentDbService.getEnrollments();
      return result;
    } catch (error) {
      console.error('Enrollments API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await enrollmentDbService.getEnrollmentById(id);
      return result;
    } catch (error) {
      console.error('Enrollment by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await enrollmentDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create enrollment API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await enrollmentDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update enrollment API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await enrollmentDbService.deleteEnrollment(id);
      return result;
    } catch (error) {
      console.error('Delete enrollment API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for enrollment-specific operations
  approve: async (id, approvedBy) => {
    try {
      const updateData = {
        status: 'active',
        approvedBy,
        approvedAt: new Date()
      };
      const result = await enrollmentDbService.update(id, updateData);
      return result;
    } catch (error) {
      console.error('Approve enrollment API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  reject: async (id, approvedBy, notes) => {
    try {
      const updateData = {
        status: 'rejected',
        approvedBy,
        rejectedAt: new Date(),
        rejectionNotes: notes
      };
      const result = await enrollmentDbService.update(id, updateData);
      return result;
    } catch (error) {
      console.error('Reject enrollment API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  getClassStats: async (classId) => {
    try {
      // This would be implemented in the DB service to get enrollment statistics
      const result = await enrollmentDbService.getEnrollments({ classId });
      if (result.success) {
        const enrollments = result.data;
        const stats = {
          total: enrollments.length,
          active: enrollments.filter(e => e.status === 'active').length,
          completed: enrollments.filter(e => e.status === 'completed').length,
          dropped: enrollments.filter(e => e.status === 'dropped').length,
          averageScore: enrollments
            .filter(e => e.score !== null && e.score !== undefined)
            .reduce((sum, e) => sum + e.score, 0) / enrollments.filter(e => e.score !== null && e.score !== undefined).length || 0,
          averageAttendance: enrollments
            .filter(e => e.attendanceRate !== null && e.attendanceRate !== undefined)
            .reduce((sum, e) => sum + e.attendanceRate, 0) / enrollments.filter(e => e.attendanceRate !== null && e.attendanceRate !== undefined).length || 0
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
