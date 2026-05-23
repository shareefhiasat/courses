/**
 * Quizzes Controller
 * 
 * PURPOSE: Controller layer for quiz operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizzesByCreator,
  getQuizStats
} from '../db/quizzes-postgres.js';

/**
 * Get all quizzes
 */
export const getAllQuizzesController = async (req, res) => {
  try {
    const { page, limit, search, createdBy, isActive, sortBy, sortOrder } = req.query;
    
    const result = await getQuizzes({
      page,
      limit,
      search,
      createdBy,
      isActive,
      sortBy,
      sortOrder
    });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Quizzes Controller] Error in getAllQuizzesController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Get quiz by ID
 */
export const getQuizByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getQuizById(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('[Quizzes Controller] Error in getQuizByIdController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Create a new quiz
 */
export const createQuizController = async (req, res) => {
  try {
    const quizData = req.body;
    
    // Add createdBy from authenticated user if not provided
    if (!quizData.createdBy && req.user?.dbId) {
      quizData.createdBy = req.user.dbId;
    }
    
    const result = await createQuiz(quizData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Quizzes Controller] Error in createQuizController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Update a quiz
 */
export const updateQuizController = async (req, res) => {
  try {
    const { id } = req.params;
    const quizData = req.body;
    
    // Add updatedBy from authenticated user if not provided
    if (!quizData.updatedBy && req.user?.dbId) {
      quizData.updatedBy = req.user.dbId;
    }
    
    const result = await updateQuiz(id, quizData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Quizzes Controller] Error in updateQuizController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Delete a quiz (soft delete)
 */
export const deleteQuizController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteQuiz(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('[Quizzes Controller] Error in deleteQuizController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Get quizzes by creator
 */
export const getQuizzesByCreatorController = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { page, limit, search, isActive, sortBy, sortOrder } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User database ID not found'
      });
    }
    
    const result = await getQuizzesByCreator(userId, {
      page,
      limit,
      search,
      isActive,
      sortBy,
      sortOrder
    });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Quizzes Controller] Error in getQuizzesByCreatorController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Get quiz statistics
 */
export const getQuizStatsController = async (req, res) => {
  try {
    const { quizId } = req.query;
    
    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: 'quizId parameter is required'
      });
    }
    
    const result = await getQuizStats(quizId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('[Quizzes Controller] Error in getQuizStatsController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

export default {
  getAllQuizzesController,
  getQuizByIdController,
  createQuizController,
  updateQuizController,
  deleteQuizController,
  getQuizzesByCreatorController,
  getQuizStatsController
};
