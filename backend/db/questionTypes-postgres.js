/**
 * Question Types Database Service
 * 
 * PURPOSE: Database operations for question types using PostgreSQL
 * ARCHITECTURE: Business Services → Database Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { isPrismaError, getPrismaErrorMessage } from '../constants/prisma-errors.js';


/**
 * Get all question types
 */
export const getQuestionTypes = async (params = {}) => {
  const startTime = Date.now();
  
  try {
    const { page = 1, limit = 50, isActive = true } = params;
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;
    
    // Build where clause
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    // Execute query
    const questionTypes = await prisma.questionType.findMany({
      where,
      orderBy: { nameEn: 'asc' },
      skip,
      take: limitNum,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        }
      }
    });
    
    // Get total count
    const total = await prisma.questionType.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[QuestionTypes DB] ✅ Retrieved ${questionTypes.length} question types in ${executionTime}ms`);
    
    return {
      success: true,
      data: questionTypes,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[QuestionTypes DB] ❌ Error getting question types:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve question types';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get question type by ID
 */
export const getQuestionTypeById = async (questionTypeId) => {
  const startTime = Date.now();
  
  try {
    const questionType = await prisma.questionType.findUnique({
      where: { id: parseInt(questionTypeId) },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        questions: {
          select: {
            id: true,
            questionEn: true,
            questionAr: true,
            points: true,
            isActive: true
          },
          take: 5 // Just show sample questions
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[QuestionTypes DB] ✅ Retrieved question type in ${executionTime}ms`);
    
    if (!questionType) {
      return {
        success: false,
        error: 'Question type not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: questionType
    };
    
  } catch (error) {
    console.error('[QuestionTypes DB] ❌ Error getting question type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve question type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Create new question type
 */
export const createQuestionType = async (questionTypeData, createdBy) => {
  const startTime = Date.now();
  
  try {
    const newQuestionType = await prisma.questionType.create({
      data: {
        code: questionTypeData.code,
        nameEn: questionTypeData.nameEn,
        nameAr: questionTypeData.nameAr || null,
        description: questionTypeData.description || null,
        isActive: questionTypeData.isActive !== undefined ? questionTypeData.isActive : true,
        createdBy: createdBy,
        updatedBy: createdBy
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[QuestionTypes DB] ✅ Created question type in ${executionTime}ms`);
    
    return {
      success: true,
      data: newQuestionType
    };
    
  } catch (error) {
    console.error('[QuestionTypes DB] ❌ Error creating question type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create question type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update question type
 */
export const updateQuestionType = async (questionTypeId, updateData, updatedBy) => {
  const startTime = Date.now();
  
  try {
    const data = { ...updateData };
    data.updatedBy = updatedBy;
    data.updatedAt = new Date();
    
    const updatedQuestionType = await prisma.questionType.update({
      where: { id: parseInt(questionTypeId) },
      data,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[QuestionTypes DB] ✅ Updated question type in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedQuestionType
    };
    
  } catch (error) {
    console.error('[QuestionTypes DB] ❌ Error updating question type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update question type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Delete question type (soft delete)
 */
export const deleteQuestionType = async (questionTypeId) => {
  const startTime = Date.now();
  
  try {
    // Check if question type is being used by questions
    const questionsCount = await prisma.question.count({
      where: { typeId: parseInt(questionTypeId) }
    });
    
    if (questionsCount > 0) {
      return {
        success: false,
        error: `Cannot delete question type. It is being used by ${questionsCount} questions.`,
        data: null
      };
    }
    
    const deletedQuestionType = await prisma.questionType.delete({
      where: { id: parseInt(questionTypeId) }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[QuestionTypes DB] ✅ Deleted question type in ${executionTime}ms`);
    
    return {
      success: true,
      data: deletedQuestionType
    };
    
  } catch (error) {
    console.error('[QuestionTypes DB] ❌ Error deleting question type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to delete question type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

export default {
  getQuestionTypes,
  getQuestionTypeById,
  createQuestionType,
  updateQuestionType,
  deleteQuestionType
};
