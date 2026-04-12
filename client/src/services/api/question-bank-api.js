/**
 * Question Bank API Service - Real Database Integration
 * 
 * This file provides direct database access for question bank
 * while keeping other services as mock data for now
 */

import questionBankDbService from '../db/questionBankDbService-postgres.cjs';

// Real question bank endpoints using database
export const questionBank = {
  getAll: async (filters = {}) => {
    try {
      const result = await questionBankDbService.getQuestions(filters);
      return result;
    } catch (error) {
      console.error('Question Bank API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await questionBankDbService.getQuestionById(id);
      return result;
    } catch (error) {
      console.error('Question by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await questionBankDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create question API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await questionBankDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update question API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await questionBankDbService.deleteQuestion(id);
      return result;
    } catch (error) {
      console.error('Delete question API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for question bank-specific operations
  getBySubject: async (subjectId, filters = {}) => {
    try {
      const result = await questionBankDbService.getQuestionsBySubject(subjectId, filters);
      return result;
    } catch (error) {
      console.error('Get questions by subject API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByType: async (type, filters = {}) => {
    try {
      const result = await questionBankDbService.getQuestionsByType(type, filters);
      return result;
    } catch (error) {
      console.error('Get questions by type API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByDifficulty: async (difficulty, filters = {}) => {
    try {
      const result = await questionBankDbService.getQuestionsByDifficulty(difficulty, filters);
      return result;
    } catch (error) {
      console.error('Get questions by difficulty API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getRandom: async (filters = {}) => {
    try {
      const result = await questionBankDbService.getRandomQuestions(filters);
      return result;
    } catch (error) {
      console.error('Get random questions API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await questionBankDbService.getQuestionStats(filters);
      return result;
    } catch (error) {
      console.error('Get question stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
