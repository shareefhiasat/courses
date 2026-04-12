/**
 * Unit Tests for Enrollment Business Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as enrollmentService from '../src/services/business/enrollmentBusinessService.js';

// Mock the API service
vi.mock('../src/services/api/enrollments-api.js', () => ({
  enrollments: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    getClassStats: vi.fn()
  }
}));

// Mock the logger
vi.mock('../src/services/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}));

describe('Enrollment Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllEnrollments', () => {
    it('should return all enrollments successfully', async () => {
      const mockEnrollments = [
        { id: '1', userId: 'user1', type: 'program', status: 'active' },
        { id: '2', userId: 'user2', type: 'class', status: 'active' }
      ];
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getAll.mockResolvedValue({ success: true, data: mockEnrollments });
      
      const result = await enrollmentService.getAllEnrollments();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEnrollments);
      expect(result.total).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getAll.mockRejectedValue(new Error('API Error'));
      
      const result = await enrollmentService.getAllEnrollments();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load enrollments');
      expect(result.data).toEqual([]);
    });
  });

  describe('getEnrollmentById', () => {
    it('should return enrollment by ID successfully', async () => {
      const mockEnrollment = { id: '1', userId: 'user1', type: 'program', status: 'active' };
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getById.mockResolvedValue({ success: true, data: mockEnrollment });
      
      const result = await enrollmentService.getEnrollmentById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEnrollment);
    });

    it('should handle not found enrollment', async () => {
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getById.mockResolvedValue({ success: false, error: 'Enrollment not found' });
      
      const result = await enrollmentService.getEnrollmentById('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Enrollment not found');
      expect(result.data).toBeNull();
    });
  });

  describe('createEnrollment', () => {
    it('should create enrollment successfully with valid data', async () => {
      const enrollmentData = {
        userId: 'user1',
        type: 'program',
        programId: 'program1'
      };
      
      const mockCreatedEnrollment = { id: '1', ...enrollmentData, status: 'active', enrolledAt: new Date() };
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getAll.mockResolvedValue({ success: true, data: [] }); // No existing enrollments
      enrollments.create.mockResolvedValue({ success: true, data: mockCreatedEnrollment });
      
      const result = await enrollmentService.createEnrollment(enrollmentData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedEnrollment);
      expect(result.message).toBe('Enrollment created successfully');
      expect(enrollments.create).toHaveBeenCalledWith(
        {
          ...enrollmentData,
          status: 'active',
          enrolledAt: expect.any(Date),
          grade: null,
          score: null,
          attendanceRate: null
        },
        null
      );
    });

    it('should reject enrollment without user ID', async () => {
      const enrollmentData = {
        type: 'program',
        programId: 'program1'
      };
      
      const result = await enrollmentService.createEnrollment(enrollmentData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
      expect(result.data).toBeNull();
    });

    it('should reject enrollment without type', async () => {
      const enrollmentData = {
        userId: 'user1',
        programId: 'program1'
      };
      
      const result = await enrollmentService.createEnrollment(enrollmentData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Enrollment type is required');
      expect(result.data).toBeNull();
    });

    it('should reject enrollment without program or class ID', async () => {
      const enrollmentData = {
        userId: 'user1',
        type: 'program'
      };
      
      const result = await enrollmentService.createEnrollment(enrollmentData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Either program ID or class ID is required');
      expect(result.data).toBeNull();
    });

    it('should reject duplicate enrollment', async () => {
      const enrollmentData = {
        userId: 'user1',
        type: 'program',
        programId: 'program1'
      };
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getAll.mockResolvedValue({ 
        success: true, 
        data: [{ id: 'existing', userId: 'user1', programId: 'program1' }] 
      });
      
      const result = await enrollmentService.createEnrollment(enrollmentData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User is already enrolled in this program/class');
      expect(result.data).toBeNull();
    });
  });

  describe('updateEnrollment', () => {
    it('should update enrollment successfully', async () => {
      const updateData = {
        status: 'completed',
        grade: 'A',
        score: 95
      };
      
      const mockUpdatedEnrollment = { 
        id: '1', 
        ...updateData, 
        completedAt: new Date(),
        updatedAt: new Date().toISOString() 
      };
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.update.mockResolvedValue({ success: true, data: mockUpdatedEnrollment });
      
      const result = await enrollmentService.updateEnrollment('1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedEnrollment);
      expect(result.message).toBe('Enrollment updated successfully');
    });

    it('should reject update without ID', async () => {
      const updateData = { status: 'completed' };
      
      const result = await enrollmentService.updateEnrollment('', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Enrollment ID is required');
      expect(result.data).toBeNull();
    });

    it('should require grade or score when completing enrollment', async () => {
      const updateData = { status: 'completed' };
      
      const result = await enrollmentService.updateEnrollment('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Grade or score is required when completing enrollment');
      expect(result.data).toBeNull();
    });

    it('should validate score range', async () => {
      const updateData = { score: 105 };
      
      const result = await enrollmentService.updateEnrollment('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Score must be between 0 and 100');
      expect(result.data).toBeNull();
    });

    it('should validate attendance rate range', async () => {
      const updateData = { attendanceRate: -5 };
      
      const result = await enrollmentService.updateEnrollment('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance rate must be between 0 and 100');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteEnrollment', () => {
    it('should delete enrollment successfully', async () => {
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', status: 'active' } 
      });
      enrollments.delete.mockResolvedValue({ success: true });
      
      const result = await enrollmentService.deleteEnrollment('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Enrollment deleted successfully');
    });

    it('should reject delete without ID', async () => {
      const result = await enrollmentService.deleteEnrollment('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Enrollment ID is required');
      expect(result.data).toBeNull();
    });

    it('should prevent deletion of completed enrollment', async () => {
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', status: 'completed' } 
      });
      
      const result = await enrollmentService.deleteEnrollment('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete completed enrollment');
      expect(result.data).toBeNull();
    });
  });

  describe('approveEnrollment', () => {
    it('should approve enrollment successfully', async () => {
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.update.mockResolvedValue({ 
        success: true, 
        data: { id: '1', status: 'active', approvedBy: 'admin1' } 
      });
      
      const result = await enrollmentService.approveEnrollment('1', 'admin1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Enrollment approved successfully');
      expect(enrollments.update).toHaveBeenCalledWith('1', {
        status: 'active',
        approvedBy: 'admin1',
        approvedAt: expect.any(Date)
      });
    });
  });

  describe('rejectEnrollment', () => {
    it('should reject enrollment successfully', async () => {
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.update.mockResolvedValue({ 
        success: true, 
        data: { id: '1', status: 'rejected', approvedBy: 'admin1' } 
      });
      
      const result = await enrollmentService.rejectEnrollment('1', 'admin1', 'Incomplete documentation');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Enrollment rejected successfully');
      expect(enrollments.update).toHaveBeenCalledWith('1', {
        status: 'rejected',
        approvedBy: 'admin1',
        rejectedAt: expect.any(Date),
        rejectionNotes: 'Incomplete documentation'
      });
    });
  });

  describe('getEnrollmentsByUser', () => {
    it('should return enrollments for a specific user', async () => {
      const mockEnrollments = [
        { id: '1', userId: 'user1', type: 'program' },
        { id: '2', userId: 'user1', type: 'class' }
      ];
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getAll.mockResolvedValue({ success: true, data: mockEnrollments });
      
      const result = await enrollmentService.getEnrollmentsByUser('user1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEnrollments);
      expect(result.total).toBe(2);
      expect(enrollments.getAll).toHaveBeenCalledWith({ userId: 'user1' });
    });

    it('should reject without user ID', async () => {
      const result = await enrollmentService.getEnrollmentsByUser('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getEnrollmentsByProgram', () => {
    it('should return enrollments for a specific program', async () => {
      const mockEnrollments = [
        { id: '1', programId: 'program1', userId: 'user1' },
        { id: '2', programId: 'program1', userId: 'user2' }
      ];
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getAll.mockResolvedValue({ success: true, data: mockEnrollments });
      
      const result = await enrollmentService.getEnrollmentsByProgram('program1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEnrollments);
      expect(result.total).toBe(2);
      expect(enrollments.getAll).toHaveBeenCalledWith({ programId: 'program1' });
    });

    it('should reject without program ID', async () => {
      const result = await enrollmentService.getEnrollmentsByProgram('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Program ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getEnrollmentsByClass', () => {
    it('should return enrollments for a specific class', async () => {
      const mockEnrollments = [
        { id: '1', classId: 'class1', userId: 'user1' },
        { id: '2', classId: 'class1', userId: 'user2' }
      ];
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getAll.mockResolvedValue({ success: true, data: mockEnrollments });
      
      const result = await enrollmentService.getEnrollmentsByClass('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEnrollments);
      expect(result.total).toBe(2);
      expect(enrollments.getAll).toHaveBeenCalledWith({ classId: 'class1' });
    });

    it('should reject without class ID', async () => {
      const result = await enrollmentService.getEnrollmentsByClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('completeEnrollment', () => {
    it('should complete enrollment successfully', async () => {
      const gradeData = { grade: 'A', score: 95 };
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.update.mockResolvedValue({ 
        success: true, 
        data: { id: '1', status: 'completed', grade: 'A', score: 95 } 
      });
      
      const result = await enrollmentService.completeEnrollment('1', gradeData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Enrollment completed successfully');
      expect(enrollments.update).toHaveBeenCalledWith('1', {
        status: 'completed',
        completedAt: expect.any(Date),
        grade: 'A',
        score: 95
      }, null);
    });

    it('should require grade or score', async () => {
      const gradeData = {};
      
      const result = await enrollmentService.completeEnrollment('1', gradeData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Either grade or score is required');
      expect(result.data).toBeNull();
    });
  });

  describe('updateEnrollmentProgress', () => {
    it('should update progress successfully', async () => {
      const progressData = { attendanceRate: 85, score: 88 };
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.update.mockResolvedValue({ 
        success: true, 
        data: { id: '1', attendanceRate: 85, score: 88 } 
      });
      
      const result = await enrollmentService.updateEnrollmentProgress('1', progressData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Enrollment progress updated successfully');
      expect(enrollments.update).toHaveBeenCalledWith('1', progressData, null);
    });

    it('should validate attendance rate', async () => {
      const progressData = { attendanceRate: 105 };
      
      const result = await enrollmentService.updateEnrollmentProgress('1', progressData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance rate must be between 0 and 100');
      expect(result.data).toBeNull();
    });
  });

  describe('getEnrollmentClassStats', () => {
    it('should return class statistics', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        completed: 2,
        dropped: 0,
        averageScore: 85.5,
        averageAttendance: 92.3
      };
      
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getClassStats.mockResolvedValue({ success: true, data: mockStats });
      
      const result = await enrollmentService.getEnrollmentClassStats('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should handle stats error', async () => {
      const { enrollments } = await import('../src/services/api/enrollments-api.js');
      enrollments.getClassStats.mockResolvedValue({ success: false, error: 'Class not found' });
      
      const result = await enrollmentService.getEnrollmentClassStats('class1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get class stats');
      expect(result.data).toBeNull();
    });
  });
});
