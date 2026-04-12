/**
 * Quiz Results API Service - Real Database Integration
 * 
 * This file provides direct database access for quiz results
 * while keeping other services as mock data for now
 */

import quizResultDbService from '../db/quizResultDbService-postgres.cjs';

// Real quiz results endpoints using database
export const quizResults = {
  getAll: async (filters = {}) => {
    try {
      const result = await quizResultDbService.getQuizResults(filters);
      return result;
    } catch (error) {
      console.error('Quiz Results API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await quizResultDbService.getQuizResultById(id);
      return result;
    } catch (error) {
      console.error('Quiz result by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await quizResultDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create quiz result API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await quizResultDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update quiz result API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await quizResultDbService.deleteQuizResult(id);
      return result;
    } catch (error) {
      console.error('Delete quiz result API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for quiz result-specific operations
  getByQuiz: async (quizId, filters = {}) => {
    try {
      const result = await quizResultDbService.getResultsByQuiz(quizId, filters);
      return result;
    } catch (error) {
      console.error('Get quiz results by quiz API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await quizResultDbService.getResultsByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get quiz results by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByClass: async (classId, filters = {}) => {
    try {
      const result = await quizResultDbService.getResultsByClass(classId, filters);
      return result;
    } catch (error) {
      console.error('Get quiz results by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  generateResult: async (submissionId, user) => {
    try {
      const result = await quizResultDbService.generateResult(submissionId, user);
      return result;
    } catch (error) {
      console.error('Generate quiz result API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await quizResultDbService.getQuizResultStats(filters);
      return result;
    } catch (error) {
      console.error('Get quiz result stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
