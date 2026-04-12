/**
 * Quiz Submissions API Service - Real Database Integration
 * 
 * This file provides direct database access for quiz submissions
 * while keeping other services as mock data for now
 */

import quizSubmissionDbService from '../db/quizSubmissionDbService-postgres.cjs';

// Real quiz submissions endpoints using database
export const quizSubmissions = {
  getAll: async (filters = {}) => {
    try {
      const result = await quizSubmissionDbService.getQuizSubmissions(filters);
      return result;
    } catch (error) {
      console.error('Quiz Submissions API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await quizSubmissionDbService.getQuizSubmissionById(id);
      return result;
    } catch (error) {
      console.error('Quiz submission by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await quizSubmissionDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create quiz submission API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await quizSubmissionDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update quiz submission API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await quizSubmissionDbService.deleteQuizSubmission(id);
      return result;
    } catch (error) {
      console.error('Delete quiz submission API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for quiz submission-specific operations
  getByQuiz: async (quizId, filters = {}) => {
    try {
      const result = await quizSubmissionDbService.getSubmissionsByQuiz(quizId, filters);
      return result;
    } catch (error) {
      console.error('Get quiz submissions by quiz API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByUser: async (userId, filters = {}) => {
    try {
      const result = await quizSubmissionDbService.getSubmissionsByUser(userId, filters);
      return result;
    } catch (error) {
      console.error('Get quiz submissions by user API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  startQuiz: async (quizId, userId, user) => {
    try {
      const result = await quizSubmissionDbService.startQuiz(quizId, userId, user);
      return result;
    } catch (error) {
      console.error('Start quiz API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  submitQuiz: async (id, data, user) => {
    try {
      const result = await quizSubmissionDbService.submitQuiz(id, data, user);
      return result;
    } catch (error) {
      console.error('Submit quiz API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  gradeQuiz: async (id, data, user) => {
    try {
      const result = await quizSubmissionDbService.gradeQuiz(id, data, user);
      return result;
    } catch (error) {
      console.error('Grade quiz API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await quizSubmissionDbService.getQuizSubmissionStats(filters);
      return result;
    } catch (error) {
      console.error('Get quiz submission stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
