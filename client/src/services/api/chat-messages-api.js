/**
 * Chat Messages API Service - Real Database Integration
 * 
 * This file provides direct database access for chat messages
 * while keeping other services as mock data for now
 */

import chatMessageDbService from '../db/chatMessageDbService-postgres.cjs';

// Real chat messages endpoints using database
export const chatMessages = {
  getAll: async (filters = {}) => {
    try {
      const result = await chatMessageDbService.getChatMessages(filters);
      return result;
    } catch (error) {
      console.error('Chat Messages API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await chatMessageDbService.getChatMessageById(id);
      return result;
    } catch (error) {
      console.error('Chat Message by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await chatMessageDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create chat message API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await chatMessageDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update chat message API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await chatMessageDbService.deleteChatMessage(id);
      return result;
    } catch (error) {
      console.error('Delete chat message API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for chat message-specific operations
  getByClass: async (classId, filters = {}) => {
    try {
      const result = await chatMessageDbService.getChatMessagesByClass(classId, filters);
      return result;
    } catch (error) {
      console.error('Get chat messages by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByActivity: async (activityId, filters = {}) => {
    try {
      const result = await chatMessageDbService.getChatMessagesByActivity(activityId, filters);
      return result;
    } catch (error) {
      console.error('Get chat messages by activity API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await chatMessageDbService.getChatMessagesByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get chat messages by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await chatMessageDbService.getChatMessageStats(filters);
      return result;
    } catch (error) {
      console.error('Get chat message stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
