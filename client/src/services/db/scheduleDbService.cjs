/**
 * Schedule Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for schedules using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: schedules (via Prisma Schedule model)
 *
 * @typedef {import('@types/index').Schedule} Schedule
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ScheduleDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ScheduleDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ScheduleDbService' });
  })
  .catch((err) => {
    console.error('[ScheduleDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'ScheduleDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all schedules
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getSchedules = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { classId, instructorId, type, status, startDate, endDate, limitCount = 200 } = options;

    logger.info('Getting schedules', {
      service: 'ScheduleDbService',
      operation: 'getSchedules',
      filters: { classId, instructorId, type, status, startDate, endDate, limitCount }
    });

    const where = {};
    if (classId) where.classId = classId;
    if (instructorId) where.instructorId = instructorId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: limitCount,
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'schedule', where, schedules, duration);

    console.log(`[ScheduleDbService] ✅ Retrieved ${schedules.length} schedules in ${duration}ms`);
    return { success: true, data: schedules };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting schedules', {
      service: 'ScheduleDbService',
      operation: 'getSchedules',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ScheduleDbService] ❌ Error getting schedules:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedule by ID
 * @param {string} scheduleId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getScheduleById = async (scheduleId) => {
  const startTime = Date.now();
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'schedule', { id: scheduleId }, schedule, duration);

    if (!schedule) return { success: false, error: 'Schedule not found' };
    return { success: true, data: schedule };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting schedule by ID', {
      service: 'ScheduleDbService',
      operation: 'getScheduleById',
      scheduleId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create schedule
 * @param {Object} scheduleData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (scheduleData) => {
  const startTime = Date.now();
  try {
    const schedule = await prisma.schedule.create({
      data: scheduleData,
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'schedule', scheduleData, schedule, duration);

    return { success: true, data: schedule };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating schedule', {
      service: 'ScheduleDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update schedule
 * @param {string} scheduleId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (scheduleId, updateData) => {
  const startTime = Date.now();
  try {
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'schedule', { id: scheduleId, ...updateData }, schedule, duration);

    return { success: true, data: schedule };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating schedule', {
      service: 'ScheduleDbService',
      operation: 'update',
      scheduleId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete schedule
 * @param {string} scheduleId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteSchedule = async (scheduleId) => {
  const startTime = Date.now();
  try {
    const schedule = await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'schedule', { id: scheduleId }, schedule, duration);

    return { success: true, message: 'Schedule deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting schedule', {
      service: 'ScheduleDbService',
      operation: 'deleteSchedule',
      scheduleId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[ScheduleDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ScheduleDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getSchedules,
  getScheduleById,
  create,
  update,
  deleteSchedule
};
