/**
 * Quizzes Database Service
 * 
 * PURPOSE: Database operations for quizzes using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { getDatabaseUserId } from '../utils/database/userResolver.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all quizzes from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with quizzes data
 */
export const getQuizzes = async (params = {}) => {
  try {
    console.log('[Quizzes DB] Getting quizzes with params:', params);
    
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 50,
      search = '',
      createdBy = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = { isActive: true };
    
    if (search) {
      where.OR = [
        { titleEn: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
        { descriptionEn: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (createdBy) {
      where.createdBy = createdBy;
    }
    
    // Allow overriding isActive filter if explicitly provided
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    // Build order clause
    const orderByClause = {};
    orderByClause[sortBy] = sortOrder.toLowerCase();
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Execute query
    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: orderByClause,
      skip,
      take: limitNum,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        questions: {
          include: {
            questionType: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    // Get total count
    const total = await prisma.quiz.count({ where });
    
    const duration = Date.now() - startTime;
    console.log(`[Quizzes DB] Retrieved ${quizzes.length} quizzes in ${duration}ms`);
    
    return {
      success: true,
      data: quizzes,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  } catch (error) {
    console.error('[Quizzes DB] Error getting quizzes:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to get quizzes'
    };
  }
};

/**
 * Get quiz by ID
 * 
 * @param {Number} id - Quiz ID
 * @returns {Promise<Object>} - Result object with quiz data
 */
export const getQuizById = async (id) => {
  try {
    console.log(`[Quizzes DB] Getting quiz by ID: ${id}`);
    
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        questions: {
          include: {
            questionType: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!quiz) {
      return {
        success: false,
        error: 'Quiz not found'
      };
    }
    
    return {
      success: true,
      data: quiz
    };
  } catch (error) {
    console.error('[Quizzes DB] Error getting quiz by ID:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to get quiz'
    };
  }
};

/**
 * Create a new quiz
 * 
 * @param {Object} quizData - Quiz data
 * @returns {Promise<Object>} - Result object with created quiz
 */
export const createQuiz = async (quizData) => {
  try {
    console.log('[Quizzes DB] Creating quiz:', quizData);
    
    const {
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      duration = 60,
      maxAttempts = 1,
      passingScore = 60,
      randomizeQuestions = false,
      randomizeAnswers = false,
      showCorrectAnswers = false,
      createdBy,
      questions = []
    } = quizData;
    
    // Resolve Keycloak UUID to numeric DB user ID
    const dbUserId = await getDatabaseUserId(createdBy) || 1;
    
    // Create quiz with questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create quiz
      const quiz = await tx.quiz.create({
        data: {
          titleEn,
          titleAr,
          descriptionEn,
          descriptionAr,
          difficulty: difficulty || 'general',
          duration,
          maxAttempts,
          passingScore,
          randomizeQuestions,
          randomizeAnswers,
          showCorrectAnswers,
          createdBy: dbUserId
        }
      });
      
      // Create questions if provided
      if (questions && questions.length > 0) {
        for (const q of questions) {
          const questionData = {
            quizId: quiz.id,
            questionEn: q.question || q.questionEn || q.question_en || '',
            questionAr: q.questionAr || q.question_ar || '',
            explanationEn: q.explanationEn || q.explanation_en || q.explanation || '',
            explanationAr: q.explanationAr || q.explanation_ar || q.explanation || '',
            typeId: q.typeId || 1, // Default to first question type
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer ? JSON.stringify(q.correctAnswer) : null,
            points: q.points || 1,
            order: q.order || 0,
            createdBy: dbUserId
          };
          
          await tx.question.create({ data: questionData });
        }
      }
      
      return quiz;
    });
    
    // Fetch the created quiz with relations
    const createdQuiz = await prisma.quiz.findUnique({
      where: { id: result.id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        questions: {
          include: {
            questionType: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log('[Quizzes DB] Quiz created successfully:', createdQuiz.id);
    
    return {
      success: true,
      data: createdQuiz
    };
  } catch (error) {
    console.error('[Quizzes DB] Error creating quiz:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create quiz'
    };
  }
};

/**
 * Update an existing quiz
 * 
 * @param {Number} id - Quiz ID
 * @param {Object} quizData - Quiz data to update
 * @returns {Promise<Object>} - Result object with updated quiz
 */
export const updateQuiz = async (id, quizData) => {
  try {
    console.log(`[Quizzes DB] Updating quiz ${id}:`, quizData);
    console.log(`[Quizzes DB] Questions in request:`, quizData.questions?.length);
    quizData.questions?.forEach((q, i) => {
      console.log(`[Quizzes DB] Question ${i} data:`, {
        questionEn: q.questionEn,
        questionAr: q.questionAr,
        question: q.question,
        question_en: q.question_en,
        question_ar: q.question_ar
      });
    });
    
    const {
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      difficulty,
      duration,
      maxAttempts,
      passingScore,
      randomizeQuestions,
      randomizeAnswers,
      showCorrectAnswers,
      updatedBy,
      questions
    } = quizData;
    
    // Resolve Keycloak UUID to numeric DB user ID
    const dbUserId = await getDatabaseUserId(updatedBy) || 1;
    
    // Update quiz with questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update quiz
      const quiz = await tx.quiz.update({
        where: { id: parseInt(id) },
        data: {
          ...(titleEn !== undefined && { titleEn }),
          ...(titleAr !== undefined && { titleAr }),
          ...(descriptionEn !== undefined && { descriptionEn }),
          ...(descriptionAr !== undefined && { descriptionAr }),
          ...(difficulty !== undefined && { difficulty }),
          ...(duration !== undefined && { duration }),
          ...(maxAttempts !== undefined && { maxAttempts }),
          ...(passingScore !== undefined && { passingScore }),
          ...(randomizeQuestions !== undefined && { randomizeQuestions }),
          ...(randomizeAnswers !== undefined && { randomizeAnswers }),
          ...(showCorrectAnswers !== undefined && { showCorrectAnswers }),
          updatedBy: dbUserId
        }
      });
      
      // Handle questions if provided
      if (questions !== undefined) {
        // Delete existing questions
        await tx.question.deleteMany({
          where: { quizId: parseInt(id) }
        });
        
        // Create new questions
        if (questions.length > 0) {
          for (const q of questions) {
            const questionData = {
              quizId: quiz.id,
              questionEn: q.question || q.questionEn || q.question_en || '',
              questionAr: q.questionAr || q.question_ar || '',
              explanationEn: q.explanationEn || q.explanation_en || q.explanation || '',
              explanationAr: q.explanationAr || q.explanation_ar || q.explanation || '',
              typeId: q.typeId || 1,
              options: q.options ? JSON.stringify(q.options) : null,
              correctAnswer: q.correctAnswer ? JSON.stringify(q.correctAnswer) : null,
              points: q.points || 1,
              order: q.order || 0,
              createdBy: quiz.createdBy,
              updatedBy: dbUserId
            };
            
            await tx.question.create({ data: questionData });
          }
        }
      }
      
      return quiz;
    });
    
    // Fetch the updated quiz with relations
    const updatedQuiz = await prisma.quiz.findUnique({
      where: { id: result.id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        questions: {
          include: {
            questionType: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log('[Quizzes DB] Quiz updated successfully:', updatedQuiz.id);
    
    return {
      success: true,
      data: updatedQuiz
    };
  } catch (error) {
    console.error('[Quizzes DB] Error updating quiz:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update quiz'
    };
  }
};

/**
 * Delete a quiz
 * 
 * @param {Number} id - Quiz ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteQuiz = async (id) => {
  try {
    console.log(`[Quizzes DB] Deleting quiz ${id}`);
    
    // Soft delete by setting isActive to false
    const quiz = await prisma.quiz.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    
    console.log('[Quizzes DB] Quiz deleted successfully:', quiz.id);
    
    return {
      success: true,
      data: quiz
    };
  } catch (error) {
    console.error('[Quizzes DB] Error deleting quiz:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to delete quiz'
    };
  }
};

/**
 * Get quizzes by creator
 * 
 * @param {Number} userId - User ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Result object with quizzes
 */
export const getQuizzesByCreator = async (userId, params = {}) => {
  return getQuizzes({ ...params, createdBy: userId });
};

/**
 * Get quiz statistics
 * 
 * @param {Number} quizId - Quiz ID
 * @returns {Promise<Object>} - Result object with statistics
 */
export const getQuizStats = async (quizId) => {
  try {
    console.log(`[Quizzes DB] Getting stats for quiz ${quizId}`);
    
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    });
    
    if (!quiz) {
      return {
        success: false,
        error: 'Quiz not found'
      };
    }
    
    return {
      success: true,
      data: {
        questionCount: quiz._count.questions,
        attemptCount: quiz._count.attempts,
        duration: quiz.duration,
        maxAttempts: quiz.maxAttempts,
        passingScore: quiz.passingScore
      }
    };
  } catch (error) {
    console.error('[Quizzes DB] Error getting quiz stats:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to get quiz stats'
    };
  }
};

export default {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizzesByCreator,
  getQuizStats
};
