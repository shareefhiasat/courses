/**
 * Dashboard Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for dashboards using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: dashboards (via Prisma Dashboard model)
 *
 * @typedef {import('@types/index').Dashboard} Dashboard
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[DashboardDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[DashboardDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'DashboardDbService' });
  })
  .catch((err) => {
    console.error('[DashboardDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'DashboardDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all dashboards
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getDashboards = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, isDefault, isActive, limitCount = 200 } = options;

    logger.info('Getting dashboards', {
      service: 'DashboardDbService',
      operation: 'getDashboards',
      filters: { userId, isDefault, isActive, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (isDefault !== undefined) where.isDefault = isDefault;
    if (isActive !== undefined) where.isActive = isActive;

    const dashboards = await prisma.dashboard.findMany({
      where,
      orderBy: { isDefault: 'desc' },
      take: limitCount,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'dashboard', where, dashboards, duration);

    console.log(`[DashboardDbService] ✅ Retrieved ${dashboards.length} dashboards in ${duration}ms`);
    return { success: true, data: dashboards };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting dashboards', {
      service: 'DashboardDbService',
      operation: 'getDashboards',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[DashboardDbService] ❌ Error getting dashboards:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get dashboard by ID
 * @param {string} dashboardId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getDashboardById = async (dashboardId) => {
  const startTime = Date.now();
  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'dashboard', { id: dashboardId }, dashboard, duration);

    if (!dashboard) return { success: false, error: 'Dashboard not found' };
    return { success: true, data: dashboard };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting dashboard by ID', {
      service: 'DashboardDbService',
      operation: 'getDashboardById',
      dashboardId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create dashboard
 * @param {Object} dashboardData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (dashboardData) => {
  const startTime = Date.now();
  try {
    const dashboard = await prisma.dashboard.create({
      data: dashboardData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'dashboard', dashboardData, dashboard, duration);

    return { success: true, data: dashboard };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating dashboard', {
      service: 'DashboardDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update dashboard
 * @param {string} dashboardId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (dashboardId, updateData) => {
  const startTime = Date.now();
  try {
    const dashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'dashboard', { id: dashboardId, ...updateData }, dashboard, duration);

    return { success: true, data: dashboard };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating dashboard', {
      service: 'DashboardDbService',
      operation: 'update',
      dashboardId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete dashboard
 * @param {string} dashboardId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteDashboard = async (dashboardId) => {
  const startTime = Date.now();
  try {
    const dashboard = await prisma.dashboard.delete({
      where: { id: dashboardId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'dashboard', { id: dashboardId }, dashboard, duration);

    return { success: true, message: 'Dashboard deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting dashboard', {
      service: 'DashboardDbService',
      operation: 'deleteDashboard',
      dashboardId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get user default dashboard
 * @param {string} userId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getUserDefault = async (userId) => {
  const startTime = Date.now();
  try {
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        userId,
        isDefault: true,
        isActive: true
      },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findFirst', 'dashboard', { userId, isDefault: true, isActive: true }, dashboard, duration);

    if (!dashboard) return { success: false, error: 'Default dashboard not found' };
    return { success: true, data: dashboard };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting user default dashboard', {
      service: 'DashboardDbService',
      operation: 'getUserDefault',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Set dashboard as default
 * @param {string} dashboardId
 * @param {string} userId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const setAsDefault = async (dashboardId, userId) => {
  const startTime = Date.now();
  try {
    // First, unset all other dashboards for this user
    await prisma.dashboard.updateMany({
      where: {
        userId,
        isDefault: true
      },
      data: {
        isDefault: false,
        updatedAt: new Date()
      }
    });

    // Then set the new default
    const dashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: {
        isDefault: true,
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'dashboard', { id: dashboardId, isDefault: true }, dashboard, duration);

    return { success: true, data: dashboard };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error setting dashboard as default', {
      service: 'DashboardDbService',
      operation: 'setAsDefault',
      dashboardId,
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[DashboardDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[DashboardDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getDashboards,
  getDashboardById,
  create,
  update,
  deleteDashboard,
  getUserDefault,
  setAsDefault
};
