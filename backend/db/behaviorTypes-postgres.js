/**
 * Behavior Types Database Service
 * 
 * PURPOSE: Database operations for behavior types using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all active behavior types
 * 
 * @returns {Promise<Array>} - Array of active behavior types
 */
export async function getAllActiveBehaviorTypes() {
  try {
    const behaviorTypes = await prisma.behaviorTypes.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        nameEn: 'asc'
      },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameAr: true,
        description: true,
        icon: true,
        color: true,
        points: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return behaviorTypes;
  } catch (error) {
    console.error('[BehaviorTypes DB] Error fetching active behavior types:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      console.error('[BehaviorTypes DB] Prisma error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to fetch behavior types');
  }
}

/**
 * Get behavior type by ID
 * 
 * @param {number} id - Behavior type ID
 * @returns {Promise<Object|null>} - Behavior type object or null
 */
export async function getBehaviorTypeById(id) {
  try {
    const behaviorType = await prisma.behaviorTypes.findUnique({
      where: {
        id: parseInt(id)
      },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameAr: true,
        description: true,
        icon: true,
        color: true,
        points: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return behaviorType;
  } catch (error) {
    console.error('[BehaviorTypes DB] Error fetching behavior type by ID:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      console.error('[BehaviorTypes DB] Prisma error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to fetch behavior type');
  }
}

export default {
  getAllActive: getAllActiveBehaviorTypes,
  getById: getBehaviorTypeById
};
