/**
 * API Service - Real Database Integration for Activities
 * 
 * This file provides direct database access for activities
 * while keeping other services as mock data for now
 */

import activityDbService from '../db/activityDbService-postgres.cjs';

// Real activities endpoints using database
export const activities = {
  getAll: async (filters = {}) => {
    try {
      const result = await activityDbService.getActivities();
      return result;
    } catch (error) {
      console.error('Activities API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await activityDbService.getActivityById(id);
      return result;
    } catch (error) {
      console.error('Activity by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await activityDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create activity API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await activityDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update activity API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await activityDbService.deleteActivity(id);
      return result;
    } catch (error) {
      console.error('Delete activity API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
