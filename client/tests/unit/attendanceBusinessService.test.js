/**
 * Unit Tests for Attendance Business Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as attendanceService from '../src/services/business/attendanceBusinessService.js';

// Mock the API service
vi.mock('../src/services/api/attendances-api.js', () => ({
  attendances: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getByUser: vi.fn(),
    getByClass: vi.fn(),
    getByDate: vi.fn(),
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

describe('Attendance Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllAttendance', () => {
    it('should return all attendances successfully', async () => {
      const mockAttendances = [
        { id: '1', userId: 'user1', date: '2024-01-01', status: 'present' },
        { id: '2', userId: 'user2', date: '2024-01-01', status: 'absent' }
      ];
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: mockAttendances });
      
      const result = await attendanceService.getAllAttendance();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttendances);
      expect(result.total).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockRejectedValue(new Error('API Error'));
      
      const result = await attendanceService.getAllAttendance();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load attendances');
      expect(result.data).toEqual([]);
    });
  });

  describe('getAttendanceById', () => {
    it('should return attendance by ID successfully', async () => {
      const mockAttendance = { id: '1', userId: 'user1', date: '2024-01-01', status: 'present' };
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getById.mockResolvedValue({ success: true, data: mockAttendance });
      
      const result = await attendanceService.getAttendanceById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttendance);
    });

    it('should handle not found attendance', async () => {
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getById.mockResolvedValue({ success: false, error: 'Attendance not found' });
      
      const result = await attendanceService.getAttendanceById('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance not found');
      expect(result.data).toBeNull();
    });
  });

  describe('createAttendance', () => {
    it('should create attendance successfully with valid data', async () => {
      const attendanceData = {
        userId: 'user1',
        date: '2024-01-01',
        status: 'present',
        classId: 'class1'
      };
      
      const mockCreatedAttendance = { 
        id: '1', 
        ...attendanceData, 
        checkInTime: expect.any(String),
        checkOutTime: null,
        notes: null
      };
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: [] }); // No existing attendances
      attendances.create.mockResolvedValue({ success: true, data: mockCreatedAttendance });
      
      const result = await attendanceService.createAttendance(attendanceData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedAttendance);
      expect(result.message).toBe('Attendance recorded successfully');
      expect(attendances.create).toHaveBeenCalledWith(
        {
          ...attendanceData,
          checkInTime: expect.any(Date),
          checkOutTime: null,
          notes: null
        },
        null
      );
    });

    it('should reject attendance without user ID', async () => {
      const attendanceData = {
        date: '2024-01-01',
        status: 'present'
      };
      
      const result = await attendanceService.createAttendance(attendanceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
      expect(result.data).toBeNull();
    });

    it('should reject attendance without date', async () => {
      const attendanceData = {
        userId: 'user1',
        status: 'present'
      };
      
      const result = await attendanceService.createAttendance(attendanceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance date is required');
      expect(result.data).toBeNull();
    });

    it('should reject attendance without status', async () => {
      const attendanceData = {
        userId: 'user1',
        date: '2024-01-01'
      };
      
      const result = await attendanceService.createAttendance(attendanceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance status is required');
      expect(result.data).toBeNull();
    });

    it('should reject invalid attendance status', async () => {
      const attendanceData = {
        userId: 'user1',
        date: '2024-01-01',
        status: 'invalid'
      };
      
      const result = await attendanceService.createAttendance(attendanceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid attendance status. Must be one of: present, absent, late, excused');
      expect(result.data).toBeNull();
    });

    it('should reject duplicate attendance', async () => {
      const attendanceData = {
        userId: 'user1',
        date: '2024-01-01',
        status: 'present',
        classId: 'class1'
      };
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ 
        success: true, 
        data: [{ id: 'existing', userId: 'user1', date: '2024-01-01', classId: 'class1' }] 
      });
      
      const result = await attendanceService.createAttendance(attendanceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance already recorded for this user, date, and class/activity');
      expect(result.data).toBeNull();
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance successfully', async () => {
      const updateData = {
        status: 'late',
        notes: 'Student arrived late'
      };
      
      const mockUpdatedAttendance = { 
        id: '1', 
        ...updateData, 
        updatedAt: new Date().toISOString() 
      };
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.update.mockResolvedValue({ success: true, data: mockUpdatedAttendance });
      
      const result = await attendanceService.updateAttendance('1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedAttendance);
      expect(result.message).toBe('Attendance updated successfully');
    });

    it('should reject update without ID', async () => {
      const updateData = { status: 'late' };
      
      const result = await attendanceService.updateAttendance('', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance ID is required');
      expect(result.data).toBeNull();
    });

    it('should validate status if provided', async () => {
      const updateData = { status: 'invalid' };
      
      const result = await attendanceService.updateAttendance('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid attendance status. Must be one of: present, absent, late, excused');
      expect(result.data).toBeNull();
    });

    it('should validate check-out time is after check-in time', async () => {
      const updateData = {
        checkInTime: '2024-01-01T10:00:00Z',
        checkOutTime: '2024-01-01T09:00:00Z'
      };
      
      const result = await attendanceService.updateAttendance('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Check-out time must be after check-in time');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteAttendance', () => {
    it('should delete attendance successfully', async () => {
      const { attendances } = await import('../src/services/api/attendances-api.js');
      // Mock attendance from today
      attendances.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', date: new Date().toISOString().split('T')[0], status: 'present' } 
      });
      attendances.delete.mockResolvedValue({ success: true });
      
      const result = await attendanceService.deleteAttendance('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Attendance deleted successfully');
    });

    it('should reject delete without ID', async () => {
      const result = await attendanceService.deleteAttendance('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Attendance ID is required');
      expect(result.data).toBeNull();
    });

    it('should prevent deletion of past attendance', async () => {
      const { attendances } = await import('../src/services/api/attendances-api.js');
      // Mock attendance from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      attendances.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', date: yesterday.toISOString().split('T')[0], status: 'present' } 
      });
      
      const result = await attendanceService.deleteAttendance('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete attendance from past dates');
      expect(result.data).toBeNull();
    });
  });

  describe('getAttendanceByStudent', () => {
    it('should return attendances for a specific student', async () => {
      const mockAttendances = [
        { id: '1', userId: 'user1', date: '2024-01-01', status: 'present' },
        { id: '2', userId: 'user1', date: '2024-01-02', status: 'absent' }
      ];
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: mockAttendances });
      
      const result = await attendanceService.getAttendanceByStudent('user1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttendances);
      expect(result.total).toBe(2);
      expect(attendances.getAll).toHaveBeenCalledWith({ userId: 'user1' });
    });

    it('should reject without student ID', async () => {
      const result = await attendanceService.getAttendanceByStudent('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Student ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getAttendanceByClass', () => {
    it('should return attendances for a specific class', async () => {
      const mockAttendances = [
        { id: '1', classId: 'class1', userId: 'user1', status: 'present' },
        { id: '2', classId: 'class1', userId: 'user2', status: 'absent' }
      ];
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: mockAttendances });
      
      const result = await attendanceService.getAttendanceByClass('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttendances);
      expect(result.total).toBe(2);
      expect(attendances.getAll).toHaveBeenCalledWith({ classId: 'class1' });
    });

    it('should reject without class ID', async () => {
      const result = await attendanceService.getAttendanceByClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getAttendanceClassStats', () => {
    it('should return class statistics', async () => {
      const mockAttendances = [
        { id: '1', classId: 'class1', userId: 'user1', status: 'present' },
        { id: '2', classId: 'class1', userId: 'user2', status: 'present' },
        { id: '3', classId: 'class1', userId: 'user3', status: 'absent' },
        { id: '4', classId: 'class1', userId: 'user4', status: 'late' }
      ];
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: mockAttendances });
      
      const result = await attendanceService.getAttendanceClassStats('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total: 4,
        present: 2,
        absent: 1,
        late: 1,
        excused: 0,
        attendanceRate: 75, // (2+1)/4 * 100
        uniqueStudents: 4,
        uniqueDates: 0
      });
    });

    it('should reject without class ID', async () => {
      const result = await attendanceService.getAttendanceClassStats('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class ID is required');
      expect(result.data).toBeNull();
    });
  });

  describe('getTodayAttendanceStatus', () => {
    it('should return attendance status for today', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ 
        success: true, 
        data: [{ id: '1', userId: 'user1', date: today, status: 'present' }] 
      });
      
      const result = await attendanceService.getTodayAttendanceStatus('user1');
      
      expect(result).toBe('present');
      expect(attendances.getAll).toHaveBeenCalledWith({ userId: 'user1', date: today });
    });

    it('should return not_marked if no attendance today', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: [] });
      
      const result = await attendanceService.getTodayAttendanceStatus('user1');
      
      expect(result).toBe('not_marked');
    });
  });

  describe('isStudentMarkedToday', () => {
    it('should return true if student is marked today', async () => {
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ 
        success: true, 
        data: [{ id: '1', userId: 'user1', date: new Date().toISOString().split('T')[0], status: 'present' }] 
      });
      
      const result = await attendanceService.isStudentMarkedToday('user1');
      
      expect(result).toBe(true);
    });

    it('should return false if student is not marked today', async () => {
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: [] });
      
      const result = await attendanceService.isStudentMarkedToday('user1');
      
      expect(result).toBe(false);
    });
  });

  describe('markAttendance', () => {
    it('should be an alias for createAttendance', async () => {
      const attendanceData = {
        userId: 'user1',
        date: '2024-01-01',
        status: 'present'
      };
      
      const mockCreatedAttendance = { id: '1', ...attendanceData };
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: [] });
      attendances.create.mockResolvedValue({ success: true, data: mockCreatedAttendance });
      
      const result = await attendanceService.markAttendance(attendanceData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedAttendance);
    });
  });

  describe('scanAttendance', () => {
    it('should be an alias for createAttendance', async () => {
      const attendanceData = {
        userId: 'user1',
        date: '2024-01-01',
        status: 'present'
      };
      
      const mockCreatedAttendance = { id: '1', ...attendanceData };
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: [] });
      attendances.create.mockResolvedValue({ success: true, data: mockCreatedAttendance });
      
      const result = await attendanceService.scanAttendance(attendanceData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedAttendance);
    });
  });

  describe('getAttendanceReport', () => {
    it('should be an alias for getAttendanceClassStats', async () => {
      const mockStats = {
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        excused: 0,
        attendanceRate: 90
      };
      
      const { attendances } = await import('../src/services/api/attendances-api.js');
      attendances.getAll.mockResolvedValue({ success: true, data: [] });
      
      const result = await attendanceService.getAttendanceReport('class1');
      
      expect(result.success).toBe(true);
      expect(result.data.total).toBe(0);
    });
  });
});
