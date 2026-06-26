/**
 * Users Service - Business Logic Layer
 *
 * PURPOSE: Business logic for user operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import prisma from '../db/prismaClient.js';


export const getAllUsers = async (params = {}, user = null) => {
  try {
    const { search, limit = 20, excludeStudents = false, page = 1 } = params;

    const where = {};

    // Add search filter
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exclude students if requested
    if (excludeStudents) {
      where.role = { not: 'student' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { displayName: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('[Users Service] getAllUsers error:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0,
    };
  }
};

export const getUserById = async (id, user = null) => {
  return {
    success: true,
    data: null
  };
};

export const createUser = async (userData, user = null) => {
  return {
    success: true,
    data: { ...userData, id: Date.now() }
  };
};

export const updateUser = async (id, updateData, user = null) => {
  return {
    success: true,
    data: { ...updateData, id }
  };
};

export const deleteUser = async (id, user = null) => {
  return {
    success: true
  };
};

export const getUserByEmail = async (email, user = null) => {
  return {
    success: true,
    data: null
  };
};
