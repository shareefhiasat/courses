/**
 * Penalty Types Database Service
 * 
 * PURPOSE: Database operations for penalty types using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all active penalty types
 * 
 * @returns {Promise<Array>} - Array of active penalty types
 */
export async function getAllActivePenaltyTypes() {
  try {
    const penaltyTypes = await prisma.penaltyTypes.findMany({
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

    return penaltyTypes;
  } catch (error) {
    console.error('[PenaltyTypes DB] Error fetching active penalty types:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      console.error('[PenaltyTypes DB] Prisma error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to fetch penalty types');
  }
}

/**
 * Get penalty type by ID
 * 
 * @param {number} id - Penalty type ID
 * @returns {Promise<Object|null>} - Penalty type object or null
 */
export async function getPenaltyTypeById(id) {
  try {
    const penaltyType = await prisma.penaltyTypes.findUnique({
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

    return penaltyType;
  } catch (error) {
    console.error('[PenaltyTypes DB] Error fetching penalty type by ID:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      console.error('[PenaltyTypes DB] Prisma error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to fetch penalty type');
  }
}

export default {
  getAllActive: getAllActivePenaltyTypes,
  getById: getPenaltyTypeById
};
