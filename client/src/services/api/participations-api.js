/**
 * Participations API Service - Real Database Integration
 * 
 * This file provides direct database access for participations
 * while keeping other services as mock data for now
 */

import participationDbService from '../db/participationDbService-postgres.cjs';

// Real participations endpoints using database
export const participations = {
  getAll: async (filters = {}) => {
    try {
      const result = await participationDbService.getParticipations(filters);
      return result;
    } catch (error) {
      console.error('Participations API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await participationDbService.getParticipationById(id);
      return result;
    } catch (error) {
      console.error('Participation by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await participationDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create participation API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await participationDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update participation API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await participationDbService.deleteParticipation(id);
      return result;
    } catch (error) {
      console.error('Delete participation API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for participation-specific operations
  getByClass: async (classId, filters = {}) => {
    try {
      const result = await participationDbService.getParticipationsByClass(classId, filters);
      return result;
    } catch (error) {
      console.error('Get participations by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByActivity: async (activityId, filters = {}) => {
    try {
      const result = await participationDbService.getParticipationsByActivity(activityId, filters);
      return result;
    } catch (error) {
      console.error('Get participations by activity API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await participationDbService.getParticipationsByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get participations by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await participationDbService.getParticipationStats(filters);
      return result;
    } catch (error) {
      console.error('Get participation stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
