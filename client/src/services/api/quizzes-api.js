/**
 * Quizzes API Service - Real Database Integration
 * 
 * This file provides direct database access for quizzes
 * while keeping other services as mock data for now
 */

import quizDbService from '../db/quizDbService-postgres.cjs';

// Real quizzes endpoints using database
export const quizzes = {
  getAll: async (filters = {}) => {
    try {
      const result = await quizDbService.getQuizzes(filters);
      return result;
    } catch (error) {
      console.error('Quizzes API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await quizDbService.getQuizById(id);
      return result;
    } catch (error) {
      console.error('Quiz by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await quizDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create quiz API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await quizDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update quiz API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await quizDbService.deleteQuiz(id);
      return result;
    } catch (error) {
      console.error('Delete quiz API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for quiz-specific operations
  getBySubject: async (subjectId, filters = {}) => {
    try {
      const result = await quizDbService.getQuizzesBySubject(subjectId, filters);
      return result;
    } catch (error) {
      console.error('Get quizzes by subject API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByClass: async (classId, filters = {}) => {
    try {
      const result = await quizDbService.getQuizzesByClass(classId, filters);
      return result;
    } catch (error) {
      console.error('Get quizzes by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByActivity: async (activityId, filters = {}) => {
    try {
      const result = await quizDbService.getQuizzesByActivity(activityId, filters);
      return result;
    } catch (error) {
      console.error('Get quizzes by activity API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getActive: async (filters = {}) => {
    try {
      const result = await quizDbService.getActiveQuizzes(filters);
      return result;
    } catch (error) {
      console.error('Get active quizzes API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await quizDbService.getQuizStats(filters);
      return result;
    } catch (error) {
      console.error('Get quiz stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
