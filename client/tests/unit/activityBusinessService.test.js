/**
 * Unit Tests for Activity Business Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as activityService from '../src/services/business/activityBusinessService.js';

// Mock the API service
vi.mock('../src/services/api/apiService.js', () => ({
  activities: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock the logger
vi.mock('../src/services/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}));

describe('Activity Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllActivities', () => {
    it('should return all activities successfully', async () => {
      const mockActivities = [
        { id: '1', title: 'Activity 1', type: 'assignment' },
        { id: '2', title: 'Activity 2', type: 'quiz' }
      ];
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getAll.mockResolvedValue({ success: true, data: mockActivities });
      
      const result = await activityService.getAllActivities();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(result.total).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getAll.mockRejectedValue(new Error('API Error'));
      
      const result = await activityService.getAllActivities();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load activities');
      expect(result.data).toEqual([]);
    });
  });

  describe('getActivityById', () => {
    it('should return activity by ID successfully', async () => {
      const mockActivity = { id: '1', title: 'Activity 1', type: 'assignment' };
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getById.mockResolvedValue({ success: true, data: mockActivity });
      
      const result = await activityService.getActivityById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivity);
    });

    it('should handle not found activity', async () => {
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getById.mockResolvedValue({ success: false, error: 'Activity not found' });
      
      const result = await activityService.getActivityById('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Activity not found');
      expect(result.data).toBeNull();
    });
  });

  describe('createActivity', () => {
    it('should create activity successfully with valid data', async () => {
      const activityData = {
        title: 'New Activity',
        type: 'assignment',
        description: 'Test description'
      };
      
      const mockCreatedActivity = { id: '1', ...activityData, status: 'draft' };
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.create.mockResolvedValue({ success: true, data: mockCreatedActivity });
      
      const result = await activityService.createActivity(activityData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedActivity);
      expect(result.message).toBe('Activity created successfully');
      expect(activities.create).toHaveBeenCalledWith(
        {
          ...activityData,
          status: 'draft',
          allowLateSubmission: false,
          autoGrade: false,
          maxScore: 100,
          duration: 60,
          attempts: 1
        },
        null
      );
    });

    it('should reject activity without title', async () => {
      const activityData = {
        type: 'assignment',
        description: 'Test description'
      };
      
      const result = await activityService.createActivity(activityData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Activity title is required');
      expect(result.data).toBeNull();
    });

    it('should reject activity without type', async () => {
      const activityData = {
        title: 'New Activity',
        description: 'Test description'
      };
      
      const result = await activityService.createActivity(activityData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Activity type is required');
      expect(result.data).toBeNull();
    });
  });

  describe('updateActivity', () => {
    it('should update activity successfully', async () => {
      const updateData = {
        title: 'Updated Activity',
        description: 'Updated description'
      };
      
      const mockUpdatedActivity = { id: '1', ...updateData, updatedAt: new Date().toISOString() };
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.update.mockResolvedValue({ success: true, data: mockUpdatedActivity });
      
      const result = await activityService.updateActivity('1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedActivity);
      expect(result.message).toBe('Activity updated successfully');
    });

    it('should reject update without ID', async () => {
      const updateData = { title: 'Updated Activity' };
      
      const result = await activityService.updateActivity('', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Activity ID is required');
      expect(result.data).toBeNull();
    });

    it('should validate date relationships', async () => {
      const updateData = {
        startDate: '2024-01-15',
        endDate: '2024-01-10' // End before start
      };
      
      const result = await activityService.updateActivity('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Start date must be before end date');
      expect(result.data).toBeNull();
    });

    it('should validate due date after start date', async () => {
      const updateData = {
        startDate: '2024-01-15',
        dueDate: '2024-01-10' // Due before start
      };
      
      const result = await activityService.updateActivity('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Due date must be after start date');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity successfully', async () => {
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getById.mockResolvedValue({ success: true, data: { enrollments: [] } });
      activities.delete.mockResolvedValue({ success: true });
      
      const result = await activityService.deleteActivity('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Activity deleted successfully');
    });

    it('should reject delete without ID', async () => {
      const result = await activityService.deleteActivity('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Activity ID is required');
      expect(result.data).toBeNull();
    });

    it('should prevent deletion if activity has enrollments', async () => {
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getById.mockResolvedValue({ 
        success: true, 
        data: { enrollments: [{ id: 'e1' }, { id: 'e2' }] } 
      });
      
      const result = await activityService.deleteActivity('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete activity with existing enrollments');
      expect(result.data).toBeNull();
    });
  });

  describe('publishActivity', () => {
    it('should publish activity successfully', async () => {
      const mockActivity = { 
        id: '1', 
        title: 'Activity 1', 
        type: 'assignment',
        status: 'draft' 
      };
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getById.mockResolvedValue({ success: true, data: mockActivity });
      activities.update.mockResolvedValue({ success: true, data: { ...mockActivity, status: 'published' } });
      
      const result = await activityService.publishActivity('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Activity published successfully');
      expect(activities.update).toHaveBeenCalledWith('1', { status: 'published' }, null);
    });

    it('should reject publishing non-existent activity', async () => {
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getById.mockResolvedValue({ success: false, error: 'Activity not found' });
      
      const result = await activityService.publishActivity('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Activity not found');
      expect(result.data).toBeNull();
    });

    it('should reject publishing incomplete activity', async () => {
      const mockActivity = { 
        id: '1', 
        type: 'assignment',
        status: 'draft' 
        // Missing title
      };
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getById.mockResolvedValue({ success: true, data: mockActivity });
      
      const result = await activityService.publishActivity('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Activity must have title and type before publishing');
      expect(result.data).toBeNull();
    });
  });

  describe('getActivitiesByClass', () => {
    it('should return activities for a specific class', async () => {
      const mockActivities = [
        { id: '1', title: 'Activity 1', classId: 'class1' },
        { id: '2', title: 'Activity 2', classId: 'class1' }
      ];
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getAll.mockResolvedValue({ success: true, data: mockActivities });
      
      const result = await activityService.getActivitiesByClass('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(result.total).toBe(2);
      expect(activities.getAll).toHaveBeenCalledWith({ classId: 'class1' });
    });

    it('should reject without class ID', async () => {
      const result = await activityService.getActivitiesByClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getActivitiesBySubject', () => {
    it('should return activities for a specific subject', async () => {
      const mockActivities = [
        { id: '1', title: 'Activity 1', subjectId: 'subject1' },
        { id: '2', title: 'Activity 2', subjectId: 'subject1' }
      ];
      
      const { activities } = await import('../src/services/api/apiService.js');
      activities.getAll.mockResolvedValue({ success: true, data: mockActivities });
      
      const result = await activityService.getActivitiesBySubject('subject1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivities);
      expect(result.total).toBe(2);
      expect(activities.getAll).toHaveBeenCalledWith({ subjectId: 'subject1' });
    });

    it('should reject without subject ID', async () => {
      const result = await activityService.getActivitiesBySubject('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Subject ID is required');
      expect(result.data).toEqual([]);
    });
  });
});
