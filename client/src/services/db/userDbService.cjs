/**
 * User Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for users using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB.
 *
 * COLLECTION: users (via Prisma User model)
 *
 * @typedef {import('@types/index').User} User
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[UserDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[UserDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'UserDbService' });
  })
  .catch((err) => {
    console.error('[UserDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'UserDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all users
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getUsers = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { isAdmin, isInstructor, isStudent, isHR, status, limitCount = 200 } = options;

    logger.info('Getting users', {
      service: 'UserDbService',
      operation: 'getUsers',
      filters: { isAdmin, isInstructor, isStudent, isHR, status, limitCount }
    });

    const where = {};
    if (typeof isAdmin === 'boolean') where.isAdmin = isAdmin;
    if (typeof isInstructor === 'boolean') where.isInstructor = isInstructor;
    if (typeof isStudent === 'boolean') where.isStudent = isStudent;
    if (typeof isHR === 'boolean') where.isHR = isHR;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'user', where, users, duration);

    console.log(`[UserDbService] ✅ Retrieved ${users.length} users in ${duration}ms`);
    return { success: true, data: users };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting users', {
      service: 'UserDbService',
      operation: 'getUsers',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[UserDbService] ❌ Error getting users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user by ID
 * @param {string} userId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getUserById = async (userId) => {
  const startTime = Date.now();
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'user', { id: userId }, user, duration);

    if (!user) return { success: false, error: 'User not found' };
    return { success: true, data: user };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting user by ID', {
      service: 'UserDbService',
      operation: 'getUserById',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getUserByEmail = async (email) => {
  const startTime = Date.now();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'user', { email }, user, duration);

    if (!user) return { success: false, error: 'User not found' };
    return { success: true, data: user };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting user by email', {
      service: 'UserDbService',
      operation: 'getUserByEmail',
      email,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create user
 * @param {Object} userData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (userData) => {
  const startTime = Date.now();
  try {
    const user = await prisma.user.create({ data: userData });
    const duration = Date.now() - startTime;
    logDbOperation('create', 'user', userData, user, duration);

    return { success: true, data: user };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating user', {
      service: 'UserDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update user
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (userId, updateData) => {
  const startTime = Date.now();
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...updateData, updatedAt: new Date() }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'user', { id: userId, ...updateData }, user, duration);

    return { success: true, data: user };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating user', {
      service: 'UserDbService',
      operation: 'update',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete user
 * @param {string} userId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteUser = async (userId) => {
  const startTime = Date.now();
  try {
    const user = await prisma.user.delete({ where: { id: userId } });
    const duration = Date.now() - startTime;
    logDbOperation('delete', 'user', { id: userId }, user, duration);

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting user', {
      service: 'UserDbService',
      operation: 'deleteUser',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[UserDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[UserDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  create,
  update,
  deleteUser
};
