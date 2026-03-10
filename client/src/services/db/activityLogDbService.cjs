/**
 * Activity Log Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for activity logs using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: activityLogs (via Prisma ActivityLog model)
 *
 * @typedef {import('@types/index').ActivityLog} ActivityLog
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ActivityLogDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ActivityLogDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ActivityLogDbService' });
  })
  .catch((err) => {
    console.error('[ActivityLogDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'ActivityLogDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all activity logs
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getActivityLogs = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, action, resource, resourceId, startDate, endDate, limitCount = 200 } = options;

    logger.info('Getting activity logs', {
      service: 'ActivityLogDbService',
      operation: 'getActivityLogs',
      filters: { userId, action, resource, resourceId, startDate, endDate, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const activityLogs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limitCount,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'activityLog', where, activityLogs, duration);

    console.log(`[ActivityLogDbService] ✅ Retrieved ${activityLogs.length} activity logs in ${duration}ms`);
    return { success: true, data: activityLogs };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting activity logs', {
      service: 'ActivityLogDbService',
      operation: 'getActivityLogs',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ActivityLogDbService] ❌ Error getting activity logs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity log by ID
 * @param {string} activityLogId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getActivityLogById = async (activityLogId) => {
  const startTime = Date.now();
  try {
    const activityLog = await prisma.activityLog.findUnique({
      where: { id: activityLogId },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'activityLog', { id: activityLogId }, activityLog, duration);

    if (!activityLog) return { success: false, error: 'Activity log not found' };
    return { success: true, data: activityLog };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting activity log by ID', {
      service: 'ActivityLogDbService',
      operation: 'getActivityLogById',
      activityLogId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create activity log
 * @param {Object} activityLogData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (activityLogData) => {
  const startTime = Date.now();
  try {
    const activityLog = await prisma.activityLog.create({
      data: activityLogData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'activityLog', activityLogData, activityLog, duration);

    return { success: true, data: activityLog };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating activity log', {
      service: 'ActivityLogDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update activity log
 * @param {string} activityLogId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (activityLogId, updateData) => {
  const startTime = Date.now();
  try {
    const activityLog = await prisma.activityLog.update({
      where: { id: activityLogId },
      data: updateData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'activityLog', { id: activityLogId, ...updateData }, activityLog, duration);

    return { success: true, data: activityLog };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating activity log', {
      service: 'ActivityLogDbService',
      operation: 'update',
      activityLogId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete activity log
 * @param {string} activityLogId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteActivityLog = async (activityLogId) => {
  const startTime = Date.now();
  try {
    const activityLog = await prisma.activityLog.delete({
      where: { id: activityLogId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'activityLog', { id: activityLogId }, activityLog, duration);

    return { success: true, message: 'Activity log deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting activity log', {
      service: 'ActivityLogDbService',
      operation: 'deleteActivityLog',
      activityLogId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Log user activity (convenience method)
 * @param {string} userId
 * @param {string} action
 * @param {string} resource
 * @param {string} resourceId
 * @param {Object} details
 * @param {Object} metadata
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const logActivity = async (userId, action, resource, resourceId, details = {}, metadata = {}) => {
  const startTime = Date.now();
  try {
    const activityLogData = {
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      timestamp: new Date()
    };

    const activityLog = await prisma.activityLog.create({
      data: activityLogData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'activityLog', activityLogData, activityLog, duration);

    return { success: true, data: activityLog };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error logging activity', {
      service: 'ActivityLogDbService',
      operation: 'logActivity',
      userId,
      action,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get user activity summary
 * @param {string} userId
 * @param {Object} dateRange
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getUserSummary = async (userId, dateRange = {}) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = dateRange;
    
    const where = { userId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const activityLogs = await prisma.activityLog.findMany({
      where,
      include: {
        user: true
      }
    });

    // Calculate summary statistics
    const summary = {
      totalActivities: activityLogs.length,
      actions: activityLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {}),
      resources: activityLogs.reduce((acc, log) => {
        acc[log.resource] = (acc[log.resource] || 0) + 1;
        return acc;
      }, {}),
      recentActivities: activityLogs.slice(0, 10)
    };

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'activityLog', where, activityLogs, duration);

    return { success: true, data: summary };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting user activity summary', {
      service: 'ActivityLogDbService',
      operation: 'getUserSummary',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[ActivityLogDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ActivityLogDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getActivityLogs,
  getActivityLogById,
  create,
  update,
  deleteActivityLog,
  logActivity,
  getUserSummary
};
