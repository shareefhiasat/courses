/**
 * Bookmarks API Service - Real Database Integration
 * 
 * This file provides direct database access for bookmarks
 * while keeping other services as mock data for now
 */

import bookmarkDbService from '../db/bookmarkDbService-postgres.cjs';

// Real bookmarks endpoints using database
export const bookmarks = {
  getAll: async (filters = {}) => {
    try {
      const result = await bookmarkDbService.getBookmarks(filters);
      return result;
    } catch (error) {
      console.error('Bookmarks API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await bookmarkDbService.getBookmarkById(id);
      return result;
    } catch (error) {
      console.error('Bookmark by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await bookmarkDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create bookmark API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await bookmarkDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update bookmark API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await bookmarkDbService.deleteBookmark(id);
      return result;
    } catch (error) {
      console.error('Delete bookmark API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for bookmark-specific operations
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await bookmarkDbService.getBookmarksByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get bookmarks by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByType: async (type, filters = {}) => {
    try {
      const result = await bookmarkDbService.getBookmarksByType(type, filters);
      return result;
    } catch (error) {
      console.error('Get bookmarks by type API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByCategory: async (category, filters = {}) => {
    try {
      const result = await bookmarkDbService.getBookmarksByCategory(category, filters);
      return result;
    } catch (error) {
      console.error('Get bookmarks by category API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getRecent: async (filters = {}) => {
    try {
      const result = await bookmarkDbService.getRecentBookmarks(filters);
      return result;
    } catch (error) {
      console.error('Get recent bookmarks API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getPopular: async (filters = {}) => {
    try {
      const result = await bookmarkDbService.getPopularBookmarks(filters);
      return result;
    } catch (error) {
      console.error('Get popular bookmarks API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await bookmarkDbService.getBookmarkStats(filters);
      return result;
    } catch (error) {
      console.error('Get bookmark stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
