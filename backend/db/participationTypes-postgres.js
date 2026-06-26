/**
 * Participation Types Database Service
 * 
 * PURPOSE: Database operations for participation types using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get all active participation types
 * 
 * @returns {Promise<Array>} - Array of active participation types
 */
export async function getAllActiveParticipationTypes() {
  try {
    const participationTypes = await prisma.participationTypes.findMany({
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

    return participationTypes;
  } catch (error) {
    console.error('[ParticipationTypes DB] Error fetching active participation types:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      console.error('[ParticipationTypes DB] Prisma error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to fetch participation types');
  }
}

/**
 * Get participation type by ID
 * 
 * @param {number} id - Participation type ID
 * @returns {Promise<Object|null>} - Participation type object or null
 */
export async function getParticipationTypeById(id) {
  try {
    const participationType = await prisma.participationTypes.findUnique({
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

    return participationType;
  } catch (error) {
    console.error('[ParticipationTypes DB] Error fetching participation type by ID:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      console.error('[ParticipationTypes DB] Prisma error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to fetch participation type');
  }
}

export default {
  getAllActive: getAllActiveParticipationTypes,
  getById: getParticipationTypeById
};
