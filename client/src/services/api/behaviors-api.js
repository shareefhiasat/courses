/**
 * Behaviors API Service - Real Database Integration
 * 
 * This file provides direct database access for behaviors
 * while keeping other services as mock data for now
 */

import behaviorDbService from '../db/behaviorDbService-postgres.cjs';

// Real behaviors endpoints using database
export const behaviors = {
  getAll: async (filters = {}) => {
    try {
      const result = await behaviorDbService.getBehaviors(filters);
      return result;
    } catch (error) {
      console.error('Behaviors API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await behaviorDbService.getBehaviorById(id);
      return result;
    } catch (error) {
      console.error('Behavior by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await behaviorDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create behavior API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await behaviorDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update behavior API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await behaviorDbService.deleteBehavior(id);
      return result;
    } catch (error) {
      console.error('Delete behavior API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for behavior-specific operations
  getByClass: async (classId, filters = {}) => {
    try {
      const result = await behaviorDbService.getBehaviorsByClass(classId, filters);
      return result;
    } catch (error) {
      console.error('Get behaviors by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByActivity: async (activityId, filters = {}) => {
    try {
      const result = await behaviorDbService.getBehaviorsByActivity(activityId, filters);
      return result;
    } catch (error) {
      console.error('Get behaviors by activity API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await behaviorDbService.getBehaviorsByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get behaviors by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await behaviorDbService.getBehaviorStats(filters);
      return result;
    } catch (error) {
      console.error('Get behavior stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
