/**
 * Announcements API Service - Real Database Integration
 * 
 * This file provides direct database access for announcements
 * while keeping other services as mock data for now
 */

import announcementDbService from '../db/announcementDbService-postgres.cjs';

// Real announcements endpoints using database
export const announcements = {
  getAll: async (filters = {}) => {
    try {
      const result = await announcementDbService.getAnnouncements();
      return result;
    } catch (error) {
      console.error('Announcements API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await announcementDbService.getAnnouncementById(id);
      return result;
    } catch (error) {
      console.error('Announcement by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await announcementDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create announcement API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await announcementDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update announcement API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await announcementDbService.deleteAnnouncement(id);
      return result;
    } catch (error) {
      console.error('Delete announcement API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for announcement-specific operations
  getByClass: async (classId) => {
    try {
      const result = await announcementDbService.getAnnouncements({ classId });
      return result;
    } catch (error) {
      console.error('Get announcements by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByType: async (type) => {
    try {
      const result = await announcementDbService.getAnnouncements({ type });
      return result;
    } catch (error) {
      console.error('Get announcements by type API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getActive: async (filters = {}) => {
    try {
      const result = await announcementDbService.getAnnouncements(filters);
      if (result.success) {
        const now = new Date();
        const activeAnnouncements = result.data.filter(announcement => {
          // Check if status is published
          if (announcement.status !== 'published') return false;
          
          // Check if publish date is in the past or now
          const publishDate = new Date(announcement.publishAt);
          if (publishDate > now) return false;
          
          // Check if expire date is in the future or not set
          if (announcement.expireAt) {
            const expireDate = new Date(announcement.expireAt);
            if (expireDate <= now) return false;
          }
          
          return true;
        });
        
        // Sort by publish date (newest first) and priority
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        activeAnnouncements.sort((a, b) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.publishAt) - new Date(a.publishAt);
        });
        
        return { success: true, data: activeAnnouncements };
      }
      return result;
    } catch (error) {
      console.error('Get active announcements API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await announcementDbService.getAnnouncements(filters);
      if (result.success) {
        const announcements = result.data;
        
        const stats = {
          total: announcements.length,
          published: announcements.filter(a => a.status === 'published').length,
          draft: announcements.filter(a => a.status === 'draft').length,
          expired: announcements.filter(a => {
            if (!a.expireAt) return false;
            return new Date(a.expireAt) <= new Date();
          }).length,
          byType: {
            general: announcements.filter(a => a.type === 'general').length,
            urgent: announcements.filter(a => a.type === 'urgent').length,
            academic: announcements.filter(a => a.type === 'academic').length,
            administrative: announcements.filter(a => a.type === 'administrative').length,
            event: announcements.filter(a => a.type === 'event').length
          },
          byPriority: {
            critical: announcements.filter(a => a.priority === 'critical').length,
            high: announcements.filter(a => a.priority === 'high').length,
            normal: announcements.filter(a => a.priority === 'normal').length,
            low: announcements.filter(a => a.priority === 'low').length
          },
          public: announcements.filter(a => a.isPublic).length,
          private: announcements.filter(a => !a.isPublic).length,
          allowComments: announcements.filter(a => a.allowComments).length
        };
        
        return { success: true, data: stats };
      }
      return result;
    } catch (error) {
      console.error('Get announcement stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
