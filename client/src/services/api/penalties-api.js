/**
 * Penalties API Service - Real Database Integration
 * 
 * This file provides direct database access for penalties
 * while keeping other services as mock data for now
 */

import penaltyDbService from '../db/penaltyDbService-postgres.cjs';

// Real penalties endpoints using database
export const penalties = {
  getAll: async (filters = {}) => {
    try {
      const result = await penaltyDbService.getPenalties(filters);
      return result;
    } catch (error) {
      console.error('Penalties API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await penaltyDbService.getPenaltyById(id);
      return result;
    } catch (error) {
      console.error('Penalty by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await penaltyDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create penalty API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await penaltyDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update penalty API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await penaltyDbService.deletePenalty(id);
      return result;
    } catch (error) {
      console.error('Delete penalty API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for penalty-specific operations
  getByClass: async (classId, filters = {}) => {
    try {
      const result = await penaltyDbService.getPenaltiesByClass(classId, filters);
      return result;
    } catch (error) {
      console.error('Get penalties by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByActivity: async (activityId, filters = {}) => {
    try {
      const result = await penaltyDbService.getPenaltiesByActivity(activityId, filters);
      return result;
    } catch (error) {
      console.error('Get penalties by activity API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await penaltyDbService.getPenaltiesByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get penalties by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await penaltyDbService.getPenaltyStats(filters);
      return result;
    } catch (error) {
      console.error('Get penalty stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
