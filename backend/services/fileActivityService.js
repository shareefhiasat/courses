/**
 * File Activity Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for file activity tracking
 * ARCHITECTURE: Controllers → Business Services → Database
 */

import prisma from '../db/prismaClient.js';


/**
 * Log file activity
 * @param {string} fileId - File ID in Nextcloud
 * @param {number} userId - Database user ID performing the action
 * @param {string} action - Action type (upload, download, edit, share, delete, restore)
 * @param {Object} metadata - Additional metadata about the action
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const logFileActivity = async ({ fileId, userId, action, metadata = {} }) => {
  try {
    const activity = await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action,
        metadata
      },
      include: {
        user: {
          select: { id: true, email: true, displayName: true }
        }
      }
    });

    return {
      success: true,
      data: activity,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileActivityService] Log file activity error:', error);
    return {
      success: false,
      error: error.message || 'Failed to log file activity',
      timestamp: Date.now()
    };
  }
};

/**
 * Get file activities
 * @param {string} fileId - File ID in Nextcloud
 * @param {number} userId - Database user ID requesting activities
 * @param {number} limit - Maximum number of activities to return
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getFileActivities = async ({ fileId, userId, limit = 50 }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: true } } }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        timestamp: Date.now()
      };
    }

    const roles = user.roleAssignments.map(ra => ra.role.code);
    const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');

    // Get activities for the file
    const activities = await prisma.fileActivity.findMany({
      where: { fileId },
      include: {
        user: {
          select: { id: true, email: true, displayName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return {
      success: true,
      data: activities,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileActivityService] Get file activities error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get file activities',
      timestamp: Date.now()
    };
  }
};

/**
 * Get file activity statistics
 * @param {string} fileId - File ID in Nextcloud
 * @param {number} userId - Database user ID requesting stats
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getFileActivityStats = async ({ fileId, userId }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: true } } }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        timestamp: Date.now()
      };
    }

    const roles = user.roleAssignments.map(ra => ra.role.code);
    const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');

    // Get activity counts by action type
    const activities = await prisma.fileActivity.findMany({
      where: { fileId },
      select: { action: true }
    });

    const stats = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});

    // Get unique users who interacted with the file
    const uniqueUsers = await prisma.fileActivity.findMany({
      where: { fileId },
      select: { userId: true },
      distinct: ['userId']
    });

    return {
      success: true,
      data: {
        totalActivities: activities.length,
        uniqueUsers: uniqueUsers.length,
        actionBreakdown: stats
      },
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileActivityService] Get file activity stats error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get file activity stats',
      timestamp: Date.now()
    };
  }
};

export default {
  logFileActivity,
  getFileActivities,
  getFileActivityStats
};
