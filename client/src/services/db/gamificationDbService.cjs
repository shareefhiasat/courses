/**
 * Gamification Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for gamification using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: gamifications (via Prisma Gamification model)
 *
 * @typedef {import('@types/index').Gamification} Gamification
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[GamificationDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[GamificationDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'GamificationDbService' });
  })
  .catch((err) => {
    console.error('[GamificationDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'GamificationDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all gamification records
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getGamifications = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, type, isActive, limitCount = 200 } = options;

    logger.info('Getting gamifications', {
      service: 'GamificationDbService',
      operation: 'getGamifications',
      filters: { userId, type, isActive, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const gamifications = await prisma.gamification.findMany({
      where,
      orderBy: { earnedAt: 'desc' },
      take: limitCount,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'gamification', where, gamifications, duration);

    console.log(`[GamificationDbService] ✅ Retrieved ${gamifications.length} gamifications in ${duration}ms`);
    return { success: true, data: gamifications };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting gamifications', {
      service: 'GamificationDbService',
      operation: 'getGamifications',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[GamificationDbService] ❌ Error getting gamifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get gamification by ID
 * @param {string} gamificationId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getGamificationById = async (gamificationId) => {
  const startTime = Date.now();
  try {
    const gamification = await prisma.gamification.findUnique({
      where: { id: gamificationId },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'gamification', { id: gamificationId }, gamification, duration);

    if (!gamification) return { success: false, error: 'Gamification record not found' };
    return { success: true, data: gamification };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting gamification by ID', {
      service: 'GamificationDbService',
      operation: 'getGamificationById',
      gamificationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create gamification record
 * @param {Object} gamificationData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (gamificationData) => {
  const startTime = Date.now();
  try {
    const gamification = await prisma.gamification.create({
      data: gamificationData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'gamification', gamificationData, gamification, duration);

    return { success: true, data: gamification };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating gamification', {
      service: 'GamificationDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update gamification record
 * @param {string} gamificationId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (gamificationId, updateData) => {
  const startTime = Date.now();
  try {
    const gamification = await prisma.gamification.update({
      where: { id: gamificationId },
      data: updateData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'gamification', { id: gamificationId, ...updateData }, gamification, duration);

    return { success: true, data: gamification };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating gamification', {
      service: 'GamificationDbService',
      operation: 'update',
      gamificationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete gamification record
 * @param {string} gamificationId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteGamification = async (gamificationId) => {
  const startTime = Date.now();
  try {
    const gamification = await prisma.gamification.delete({
      where: { id: gamificationId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'gamification', { id: gamificationId }, gamification, duration);

    return { success: true, message: 'Gamification record deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting gamification', {
      service: 'GamificationDbService',
      operation: 'deleteGamification',
      gamificationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get user gamification stats
 * @param {string} userId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getUserStats = async (userId) => {
  const startTime = Date.now();
  try {
    const gamifications = await prisma.gamification.findMany({
      where: { 
        userId,
        isActive: true
      },
      include: {
        user: true
      }
    });

    // Calculate stats
    const stats = {
      totalPoints: gamifications
        .filter(g => g.type === 'points')
        .reduce((sum, g) => sum + (g.value || 0), 0),
      badges: gamifications.filter(g => g.type === 'badge').length,
      achievements: gamifications.filter(g => g.type === 'achievement').length,
      level: gamifications.filter(g => g.type === 'level').length,
      recent: gamifications.slice(0, 10)
    };

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'gamification', { userId, isActive: true }, gamifications, duration);

    return { success: true, data: stats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting user gamification stats', {
      service: 'GamificationDbService',
      operation: 'getUserStats',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[GamificationDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[GamificationDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getGamifications,
  getGamificationById,
  create,
  update,
  deleteGamification,
  getUserStats
};
