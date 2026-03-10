/**
 * Penalty Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for penalties using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: penalties (via Prisma Penalty model)
 *
 * @typedef {import('@types/index').Penalty} Penalty
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[PenaltyDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[PenaltyDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'PenaltyDbService' });
  })
  .catch((err) => {
    console.error('[PenaltyDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'PenaltyDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all penalties
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getPenalties = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { studentId, classId, instructorId, type, severity, status, limitCount = 200 } = options;

    logger.info('Getting penalties', {
      service: 'PenaltyDbService',
      operation: 'getPenalties',
      filters: { studentId, classId, instructorId, type, severity, status, limitCount }
    });

    const where = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (instructorId) where.instructorId = instructorId;
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const penalties = await prisma.penalty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        student: true,
        class: true,
        instructor: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'penalty', where, penalties, duration);

    console.log(`[PenaltyDbService] ✅ Retrieved ${penalties.length} penalties in ${duration}ms`);
    return { success: true, data: penalties };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting penalties', {
      service: 'PenaltyDbService',
      operation: 'getPenalties',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[PenaltyDbService] ❌ Error getting penalties:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get penalty by ID
 * @param {string} penaltyId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getPenaltyById = async (penaltyId) => {
  const startTime = Date.now();
  try {
    const penalty = await prisma.penalty.findUnique({
      where: { id: penaltyId },
      include: {
        student: true,
        class: true,
        instructor: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'penalty', { id: penaltyId }, penalty, duration);

    if (!penalty) return { success: false, error: 'Penalty not found' };
    return { success: true, data: penalty };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting penalty by ID', {
      service: 'PenaltyDbService',
      operation: 'getPenaltyById',
      penaltyId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create penalty
 * @param {Object} penaltyData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (penaltyData) => {
  const startTime = Date.now();
  try {
    const penalty = await prisma.penalty.create({
      data: penaltyData,
      include: {
        student: true,
        class: true,
        instructor: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'penalty', penaltyData, penalty, duration);

    return { success: true, data: penalty };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating penalty', {
      service: 'PenaltyDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update penalty
 * @param {string} penaltyId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (penaltyId, updateData) => {
  const startTime = Date.now();
  try {
    const penalty = await prisma.penalty.update({
      where: { id: penaltyId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        student: true,
        class: true,
        instructor: true,
        resolver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'penalty', { id: penaltyId, ...updateData }, penalty, duration);

    return { success: true, data: penalty };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating penalty', {
      service: 'PenaltyDbService',
      operation: 'update',
      penaltyId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete penalty
 * @param {string} penaltyId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deletePenalty = async (penaltyId) => {
  const startTime = Date.now();
  try {
    const penalty = await prisma.penalty.delete({
      where: { id: penaltyId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'penalty', { id: penaltyId }, penalty, duration);

    return { success: true, message: 'Penalty deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting penalty', {
      service: 'PenaltyDbService',
      operation: 'deletePenalty',
      penaltyId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[PenaltyDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[PenaltyDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getPenalties,
  getPenaltyById,
  create,
  update,
  deletePenalty
};
