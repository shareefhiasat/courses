/**
 * User Preferences API Service - Real Database Integration
 * 
 * This file provides direct database access for user preferences
 * while keeping other services as mock data for now
 */

import userPreferenceDbService from '../db/userPreferenceDbService-postgres.cjs';

// Real user preferences endpoints using database
export const userPreferences = {
  getAll: async (filters = {}) => {
    try {
      const result = await userPreferenceDbService.getUserPreferences(filters);
      return result;
    } catch (error) {
      console.error('User Preferences API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await userPreferenceDbService.getUserPreferenceById(id);
      return result;
    } catch (error) {
      console.error('User preference by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await userPreferenceDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create user preference API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await userPreferenceDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update user preference API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await userPreferenceDbService.deleteUserPreference(id);
      return result;
    } catch (error) {
      console.error('Delete user preference API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for user preference-specific operations
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await userPreferenceDbService.getPreferencesByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get user preferences by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByKey: async (userId, key) => {
    try {
      const result = await userPreferenceDbService.getPreferenceByKey(userId, key);
      return result;
    } catch (error) {
      console.error('Get user preference by key API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  setPreference: async (userId, key, value, user) => {
    try {
      const result = await userPreferenceDbService.setPreference(userId, key, value, user);
      return result;
    } catch (error) {
      console.error('Set user preference API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  deleteByKey: async (userId, key) => {
    try {
      const result = await userPreferenceDbService.deletePreferenceByKey(userId, key);
      return result;
    } catch (error) {
      console.error('Delete user preference by key API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await userPreferenceDbService.getUserPreferenceStats(filters);
      return result;
    } catch (error) {
      console.error('Get user preference stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
