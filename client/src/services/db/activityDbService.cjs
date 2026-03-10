/**
 * Activity Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for activities using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: activities (via Prisma Activity model)
 *
 * @typedef {import('@types/index').Activity} Activity
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ActivityDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ActivityDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ActivityDbService' });
  })
  .catch((err) => {
    console.error('[ActivityDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'ActivityDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all activities from MongoDB
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getActivities = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all activities', {
      service: 'ActivityDbService',
      operation: 'getActivities'
    });

    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        class: true,
        subject: true,
        submissions: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'activity', {}, activities, duration);

    logger.info('Activities retrieved successfully', {
      service: 'ActivityDbService',
      operation: 'getActivities',
      count: activities.length,
      duration: `${duration}ms`
    });

    console.log(`[ActivityDbService] ✅ Retrieved ${activities.length} activities in ${duration}ms`);
    return { success: true, data: activities };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting activities', {
      service: 'ActivityDbService',
      operation: 'getActivities',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ActivityDbService] ❌ Error getting activities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity by ID
 * @param {string} activityId - Activity ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getActivityById = async (activityId) => {
  const startTime = Date.now();
  try {
    logger.info('Getting activity by ID', {
      service: 'ActivityDbService',
      operation: 'getActivityById',
      activityId
    });

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        class: true,
        subject: true,
        submissions: {
          include: {
            student: true
          }
        }
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'activity', { id: activityId }, activity, duration);

    if (activity) {
      logger.info('Activity retrieved successfully', {
        service: 'ActivityDbService',
        operation: 'getActivityById',
        activityId,
        duration: `${duration}ms`
      });
      console.log(`[ActivityDbService] ✅ Retrieved activity in ${duration}ms`);
      return { success: true, data: activity };
    }

    logger.warn('Activity not found', {
      service: 'ActivityDbService',
      operation: 'getActivityById',
      activityId,
      duration: `${duration}ms`
    });
    console.log(`[ActivityDbService] ⚠️ Activity not found in ${duration}ms`);
    return { success: false, error: 'Activity not found' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting activity by ID', {
      service: 'ActivityDbService',
      operation: 'getActivityById',
      activityId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ActivityDbService] ❌ Error getting activity by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new activity
 * @param {Object} activityData - Activity data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (activityData) => {
  const startTime = Date.now();
  try {
    logger.info('Creating new activity', {
      service: 'ActivityDbService',
      operation: 'create',
      data: activityData
    });

    const activity = await prisma.activity.create({
      data: activityData,
      include: {
        class: true,
        subject: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'activity', activityData, activity, duration);

    logger.info('Activity created successfully', {
      service: 'ActivityDbService',
      operation: 'create',
      activityId: activity.id,
      duration: `${duration}ms`
    });

    console.log(`[ActivityDbService] ✅ Created activity in ${duration}ms`);
    return { success: true, data: activity };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating activity', {
      service: 'ActivityDbService',
      operation: 'create',
      data: activityData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ActivityDbService] ❌ Error creating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update activity
 * @param {string} activityId - Activity ID
 * @param {Object} updateData - Update data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (activityId, updateData) => {
  const startTime = Date.now();
  try {
    logger.info('Updating activity', {
      service: 'ActivityDbService',
      operation: 'update',
      activityId,
      data: updateData
    });

    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        class: true,
        subject: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'activity', { id: activityId, ...updateData }, activity, duration);

    logger.info('Activity updated successfully', {
      service: 'ActivityDbService',
      operation: 'update',
      activityId,
      duration: `${duration}ms`
    });

    console.log(`[ActivityDbService] ✅ Updated activity in ${duration}ms`);
    return { success: true, data: activity };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating activity', {
      service: 'ActivityDbService',
      operation: 'update',
      activityId,
      data: updateData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ActivityDbService] ❌ Error updating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteActivity = async (activityId) => {
  const startTime = Date.now();
  try {
    logger.info('Deleting activity', {
      service: 'ActivityDbService',
      operation: 'deleteActivity',
      activityId
    });

    const activity = await prisma.activity.delete({
      where: { id: activityId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'activity', { id: activityId }, activity, duration);

    logger.info('Activity deleted successfully', {
      service: 'ActivityDbService',
      operation: 'deleteActivity',
      activityId,
      duration: `${duration}ms`
    });

    console.log(`[ActivityDbService] ✅ Deleted activity in ${duration}ms`);
    return { success: true, message: 'Activity deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting activity', {
      service: 'ActivityDbService',
      operation: 'deleteActivity',
      activityId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ActivityDbService] ❌ Error deleting activity:', error);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[ActivityDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ActivityDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getActivities,
  getActivityById,
  create,
  update,
  deleteActivity
};
