/**
 * Unit Tests for Announcement Business Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as announcementService from '../src/services/business/announcementBusinessService.js';

// Mock the API service
vi.mock('../src/services/api/announcements-api.js', () => ({
  announcements: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getByClass: vi.fn(),
    getByType: vi.fn(),
    getActive: vi.fn(),
    getStats: vi.fn()
  }
}));

// Mock the logger
vi.mock('../src/services/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}));

describe('Announcement Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllAnnouncements', () => {
    it('should return all announcements successfully', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Announcement 1', content: 'Content 1', status: 'published' },
        { id: '2', title: 'Announcement 2', content: 'Content 2', status: 'draft' }
      ];
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getAll.mockResolvedValue({ success: true, data: mockAnnouncements });
      
      const result = await announcementService.getAllAnnouncements();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnnouncements);
      expect(result.total).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getAll.mockRejectedValue(new Error('API Error'));
      
      const result = await announcementService.getAllAnnouncements();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load announcements');
      expect(result.data).toEqual([]);
    });
  });

  describe('getAnnouncementById', () => {
    it('should return announcement by ID successfully', async () => {
      const mockAnnouncement = { id: '1', title: 'Announcement 1', content: 'Content 1', status: 'published' };
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getById.mockResolvedValue({ success: true, data: mockAnnouncement });
      
      const result = await announcementService.getAnnouncementById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnnouncement);
    });

    it('should handle not found announcement', async () => {
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getById.mockResolvedValue({ success: false, error: 'Announcement not found' });
      
      const result = await announcementService.getAnnouncementById('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Announcement not found');
      expect(result.data).toBeNull();
    });
  });

  describe('createAnnouncement', () => {
    it('should create announcement successfully with valid data', async () => {
      const announcementData = {
        title: 'Test Announcement',
        content: 'This is a test announcement',
        type: 'general',
        priority: 'normal'
      };
      
      const mockCreatedAnnouncement = { 
        id: '1', 
        ...announcementData, 
        isPublic: true,
        allowComments: true,
        publishAt: expect.any(String),
        status: 'published',
        metadata: {}
      };
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.create.mockResolvedValue({ success: true, data: mockCreatedAnnouncement });
      
      const result = await announcementService.createAnnouncement(announcementData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedAnnouncement);
      expect(result.message).toBe('Announcement created successfully');
    });

    it('should reject announcement without title', async () => {
      const announcementData = {
        content: 'This is a test announcement'
      };
      
      const result = await announcementService.createAnnouncement(announcementData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Announcement title is required');
      expect(result.data).toBeNull();
    });

    it('should reject announcement without content', async () => {
      const announcementData = {
        title: 'Test Announcement'
      };
      
      const result = await announcementService.createAnnouncement(announcementData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Announcement content is required');
      expect(result.data).toBeNull();
    });

    it('should reject invalid announcement type', async () => {
      const announcementData = {
        title: 'Test Announcement',
        content: 'This is a test announcement',
        type: 'invalid'
      };
      
      const result = await announcementService.createAnnouncement(announcementData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid announcement type. Must be one of: general, urgent, academic, administrative, event');
      expect(result.data).toBeNull();
    });

    it('should reject invalid priority', async () => {
      const announcementData = {
        title: 'Test Announcement',
        content: 'This is a test announcement',
        priority: 'invalid'
      };
      
      const result = await announcementService.createAnnouncement(announcementData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid announcement priority. Must be one of: low, normal, high, critical');
      expect(result.data).toBeNull();
    });

    it('should reject expire date before publish date', async () => {
      const announcementData = {
        title: 'Test Announcement',
        content: 'This is a test announcement',
        publishAt: '2024-01-02T10:00:00Z',
        expireAt: '2024-01-01T10:00:00Z'
      };
      
      const result = await announcementService.createAnnouncement(announcementData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Expire date must be after publish date');
      expect(result.data).toBeNull();
    });
  });

  describe('updateAnnouncement', () => {
    it('should update announcement successfully', async () => {
      const updateData = {
        title: 'Updated Announcement',
        content: 'Updated content'
      };
      
      const mockUpdatedAnnouncement = { 
        id: '1', 
        ...updateData, 
        updatedAt: new Date().toISOString() 
      };
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.update.mockResolvedValue({ success: true, data: mockUpdatedAnnouncement });
      
      const result = await announcementService.updateAnnouncement('1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedAnnouncement);
      expect(result.message).toBe('Announcement updated successfully');
    });

    it('should reject update without ID', async () => {
      const updateData = { title: 'Updated Announcement' };
      
      const result = await announcementService.updateAnnouncement('', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Announcement ID is required');
      expect(result.data).toBeNull();
    });

    it('should auto-set publish date when publishing', async () => {
      const updateData = { status: 'published' };
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.update.mockResolvedValue({ success: true, data: { id: '1' } });
      
      const result = await announcementService.updateAnnouncement('1', updateData);
      
      expect(result.success).toBe(true);
      expect(announcements.update).toHaveBeenCalledWith('1', {
        status: 'published',
        publishAt: expect.any(Date)
      }, null);
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete announcement successfully', async () => {
      const { announcements } = await import('../src/services/api/announcements-api.js');
      // Mock announcement from today
      announcements.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', publishAt: new Date().toISOString(), status: 'published' } 
      });
      announcements.delete.mockResolvedValue({ success: true });
      
      const result = await announcementService.deleteAnnouncement('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Announcement deleted successfully');
    });

    it('should reject delete without ID', async () => {
      const result = await announcementService.deleteAnnouncement('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Announcement ID is required');
      expect(result.data).toBeNull();
    });

    it('should prevent deletion of old published announcements', async () => {
      const { announcements } = await import('../src/services/api/announcements-api.js');
      // Mock announcement from 10 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      announcements.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', publishAt: oldDate.toISOString(), status: 'published' } 
      });
      
      const result = await announcementService.deleteAnnouncement('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete announcements published more than 7 days ago');
      expect(result.data).toBeNull();
    });
  });

  describe('getAnnouncementsByClass', () => {
    it('should return announcements for a specific class', async () => {
      const mockAnnouncements = [
        { id: '1', classId: 'class1', title: 'Class Announcement 1' },
        { id: '2', classId: 'class1', title: 'Class Announcement 2' }
      ];
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getAll.mockResolvedValue({ success: true, data: mockAnnouncements });
      
      const result = await announcementService.getAnnouncementsByClass('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnnouncements);
      expect(result.total).toBe(2);
    });

    it('should reject without class ID', async () => {
      const result = await announcementService.getAnnouncementsByClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getAnnouncementsByType', () => {
    it('should return announcements for a specific type', async () => {
      const mockAnnouncements = [
        { id: '1', type: 'urgent', title: 'Urgent Announcement' },
        { id: '2', type: 'urgent', title: 'Another Urgent' }
      ];
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getAll.mockResolvedValue({ success: true, data: mockAnnouncements });
      
      const result = await announcementService.getAnnouncementsByType('urgent');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnnouncements);
      expect(result.total).toBe(2);
    });

    it('should reject without type', async () => {
      const result = await announcementService.getAnnouncementsByType('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Announcement type is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getActiveAnnouncements', () => {
    it('should return only active announcements', async () => {
      const now = new Date();
      const mockAnnouncements = [
        { 
          id: '1', 
          status: 'published', 
          publishAt: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
          expireAt: new Date(now.getTime() + 86400000).toISOString()  // 1 day from now
        },
        { 
          id: '2', 
          status: 'draft', 
          publishAt: new Date(now.getTime() - 86400000).toISOString()
        },
        { 
          id: '3', 
          status: 'published', 
          publishAt: new Date(now.getTime() + 86400000).toISOString() // Future
        },
        { 
          id: '4', 
          status: 'published', 
          publishAt: new Date(now.getTime() - 86400000).toISOString(),
          expireAt: new Date(now.getTime() - 86400000).toISOString() // Expired
        }
      ];
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getAll.mockResolvedValue({ success: true, data: mockAnnouncements });
      
      const result = await announcementService.getActiveAnnouncements();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Only the first announcement is active
      expect(result.data[0].id).toBe('1');
    });
  });

  describe('publishAnnouncement', () => {
    it('should publish announcement successfully', async () => {
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.update.mockResolvedValue({ success: true, data: { id: '1', status: 'published' } });
      
      const result = await announcementService.publishAnnouncement('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Announcement published successfully');
      expect(announcements.update).toHaveBeenCalledWith('1', {
        status: 'published',
        publishAt: expect.any(Date)
      }, null);
    });

    it('should reject without ID', async () => {
      const result = await announcementService.publishAnnouncement('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Announcement ID is required');
      expect(result.data).toBeNull();
    });
  });

  describe('unpublishAnnouncement', () => {
    it('should unpublish announcement successfully', async () => {
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.update.mockResolvedValue({ success: true, data: { id: '1', status: 'draft' } });
      
      const result = await announcementService.unpublishAnnouncement('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Announcement unpublished successfully');
      expect(announcements.update).toHaveBeenCalledWith('1', {
        status: 'draft'
      }, null);
    });
  });

  describe('getAnnouncementStats', () => {
    it('should return announcement statistics', async () => {
      const mockAnnouncements = [
        { id: '1', status: 'published', type: 'general', priority: 'normal', isPublic: true, allowComments: false },
        { id: '2', status: 'draft', type: 'urgent', priority: 'high', isPublic: false, allowComments: true },
        { id: '3', status: 'published', type: 'academic', priority: 'low', isPublic: true, allowComments: true }
      ];
      
      const { announcements } = await import('../src/services/api/announcements-api.js');
      announcements.getAll.mockResolvedValue({ success: true, data: mockAnnouncements });
      
      const result = await announcementService.getAnnouncementStats();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total: 3,
        published: 2,
        draft: 1,
        expired: 0,
        byType: {
          general: 1,
          urgent: 1,
          academic: 1,
          administrative: 0,
          event: 0
        },
        byPriority: {
          critical: 0,
          high: 1,
          normal: 1,
          low: 1
        },
        public: 2,
        private: 1,
        allowComments: 2
      });
    });
  });
});
