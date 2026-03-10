/**
 * Behavior Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for behavior tracking using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: behaviors (via Prisma Behavior model)
 *
 * @typedef {import('@types/index').Behavior} Behavior
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[BehaviorDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[BehaviorDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'BehaviorDbService' });
  })
  .catch((err) => {
    console.error('[BehaviorDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'BehaviorDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all behaviors
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getBehaviors = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { studentId, classId, instructorId, type, category, severity, status, limitCount = 200 } = options;

    logger.info('Getting behaviors', {
      service: 'BehaviorDbService',
      operation: 'getBehaviors',
      filters: { studentId, classId, instructorId, type, category, severity, status, limitCount }
    });

    const where = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (instructorId) where.instructorId = instructorId;
    if (type) where.type = type;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const behaviors = await prisma.behavior.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      take: limitCount,
      include: {
        student: true,
        class: true,
        instructor: true,
        reporter: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'behavior', where, behaviors, duration);

    console.log(`[BehaviorDbService] ✅ Retrieved ${behaviors.length} behaviors in ${duration}ms`);
    return { success: true, data: behaviors };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting behaviors', {
      service: 'BehaviorDbService',
      operation: 'getBehaviors',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[BehaviorDbService] ❌ Error getting behaviors:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get behavior by ID
 * @param {string} behaviorId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getBehaviorById = async (behaviorId) => {
  const startTime = Date.now();
  try {
    const behavior = await prisma.behavior.findUnique({
      where: { id: behaviorId },
      include: {
        student: true,
        class: true,
        instructor: true,
        reporter: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'behavior', { id: behaviorId }, behavior, duration);

    if (!behavior) return { success: false, error: 'Behavior not found' };
    return { success: true, data: behavior };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting behavior by ID', {
      service: 'BehaviorDbService',
      operation: 'getBehaviorById',
      behaviorId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create behavior
 * @param {Object} behaviorData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (behaviorData) => {
  const startTime = Date.now();
  try {
    const behavior = await prisma.behavior.create({
      data: behaviorData,
      include: {
        student: true,
        class: true,
        instructor: true,
        reporter: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'behavior', behaviorData, behavior, duration);

    return { success: true, data: behavior };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating behavior', {
      service: 'BehaviorDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update behavior
 * @param {string} behaviorId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (behaviorId, updateData) => {
  const startTime = Date.now();
  try {
    const behavior = await prisma.behavior.update({
      where: { id: behaviorId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        student: true,
        class: true,
        instructor: true,
        reporter: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'behavior', { id: behaviorId, ...updateData }, behavior, duration);

    return { success: true, data: behavior };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating behavior', {
      service: 'BehaviorDbService',
      operation: 'update',
      behaviorId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete behavior
 * @param {string} behaviorId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteBehavior = async (behaviorId) => {
  const startTime = Date.now();
  try {
    const behavior = await prisma.behavior.delete({
      where: { id: behaviorId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'behavior', { id: behaviorId }, behavior, duration);

    return { success: true, message: 'Behavior deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting behavior', {
      service: 'BehaviorDbService',
      operation: 'deleteBehavior',
      behaviorId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[BehaviorDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[BehaviorDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getBehaviors,
  getBehaviorById,
  create,
  update,
  deleteBehavior
};
