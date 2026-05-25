/**
 * Permission Denial Audit DB Service - PostgreSQL Operations
 * 
 * PURPOSE: Database operations for permission denial audit logging
 * ARCHITECTURE: DB Services → Prisma → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a permission denial audit entry
 */
export async function createPermissionDenialAudit(data) {
  try {
    const { userId, action, resource, reason, userRole } = data;

    const denialAudit = await prisma.permissionDenialAudit.create({
      data: {
        userId,
        action,
        resource,
        reason,
        userRole
      }
    });

    return { success: true, data: denialAudit };
  } catch (error) {
    console.error('Error creating permission denial audit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get permission denial audits with filters
 */
export async function getPermissionDenialAudits(filters = {}) {
  try {
    const { startDate, endDate, userId, limit = 100, offset = 0 } = filters;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (userId) where.userId = parseInt(userId);

    const audits = await prisma.permissionDenialAudit.findMany({
      where,
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.permissionDenialAudit.count({ where });

    return { success: true, data: audits, total };
  } catch (error) {
    console.error('Error getting permission denial audits:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createPermissionDenialAudit,
  getPermissionDenialAudits
};
