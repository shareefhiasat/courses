/**
 * Participation Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for participation tracking using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: participations (via Prisma Participation model)
 *
 * @typedef {import('@types/index').Participation} Participation
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ParticipationDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ParticipationDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ParticipationDbService' });
  })
  .catch((err) => {
    console.error('[ParticipationDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'ParticipationDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all participations
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getParticipations = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { studentId, activityId, classId, type, status, limitCount = 200 } = options;

    logger.info('Getting participations', {
      service: 'ParticipationDbService',
      operation: 'getParticipations',
      filters: { studentId, activityId, classId, type, status, limitCount }
    });

    const where = {};
    if (studentId) where.studentId = studentId;
    if (activityId) where.activityId = activityId;
    if (classId) where.classId = classId;
    if (type) where.type = type;
    if (status) where.status = status;

    const participations = await prisma.participation.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: limitCount,
      include: {
        student: true,
        activity: true,
        class: true,
        recorder: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'participation', where, participations, duration);

    console.log(`[ParticipationDbService] ✅ Retrieved ${participations.length} participations in ${duration}ms`);
    return { success: true, data: participations };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting participations', {
      service: 'ParticipationDbService',
      operation: 'getParticipations',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ParticipationDbService] ❌ Error getting participations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get participation by ID
 * @param {string} participationId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getParticipationById = async (participationId) => {
  const startTime = Date.now();
  try {
    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        student: true,
        activity: true,
        class: true,
        recorder: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'participation', { id: participationId }, participation, duration);

    if (!participation) return { success: false, error: 'Participation not found' };
    return { success: true, data: participation };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting participation by ID', {
      service: 'ParticipationDbService',
      operation: 'getParticipationById',
      participationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create participation
 * @param {Object} participationData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (participationData) => {
  const startTime = Date.now();
  try {
    const participation = await prisma.participation.create({
      data: participationData,
      include: {
        student: true,
        activity: true,
        class: true,
        recorder: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'participation', participationData, participation, duration);

    return { success: true, data: participation };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating participation', {
      service: 'ParticipationDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update participation
 * @param {string} participationId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (participationId, updateData) => {
  const startTime = Date.now();
  try {
    const participation = await prisma.participation.update({
      where: { id: participationId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        student: true,
        activity: true,
        class: true,
        recorder: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'participation', { id: participationId, ...updateData }, participation, duration);

    return { success: true, data: participation };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating participation', {
      service: 'ParticipationDbService',
      operation: 'update',
      participationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete participation
 * @param {string} participationId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteParticipation = async (participationId) => {
  const startTime = Date.now();
  try {
    const participation = await prisma.participation.delete({
      where: { id: participationId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'participation', { id: participationId }, participation, duration);

    return { success: true, message: 'Participation deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting participation', {
      service: 'ParticipationDbService',
      operation: 'deleteParticipation',
      participationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[ParticipationDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ParticipationDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getParticipations,
  getParticipationById,
  create,
  update,
  deleteParticipation
};
