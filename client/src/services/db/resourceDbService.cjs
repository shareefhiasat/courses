/**
 * Resource Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for resources using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: resources (via Prisma Resource model)
 *
 * @typedef {import('@types/index').Resource} Resource
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ResourceDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ResourceDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ResourceDbService' });
  })
  .catch((err) => {
    console.error('[ResourceDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'ResourceDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all resources (supports lightweight filtering)
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getResources = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { classId, subjectId, programId, categoryId, type, limitCount = 100 } = options;

    logger.info('Getting resources', {
      service: 'ResourceDbService',
      operation: 'getResources',
      filters: { classId, subjectId, programId, categoryId, type, limitCount }
    });

    const where = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (programId) where.programId = programId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        category: true,
        class: true,
        program: true,
        subject: true,
        file: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'resource', where, resources, duration);

    logger.info('Resources retrieved successfully', {
      service: 'ResourceDbService',
      operation: 'getResources',
      count: resources.length,
      duration: `${duration}ms`
    });

    console.log(`[ResourceDbService] ✅ Retrieved ${resources.length} resources in ${duration}ms`);
    return { success: true, data: resources };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting resources', {
      service: 'ResourceDbService',
      operation: 'getResources',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ResourceDbService] ❌ Error getting resources:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resource by ID
 * @param {string} resourceId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getResourceById = async (resourceId) => {
  const startTime = Date.now();
  try {
    logger.info('Getting resource by ID', {
      service: 'ResourceDbService',
      operation: 'getResourceById',
      resourceId
    });

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        category: true,
        class: true,
        program: true,
        subject: true,
        file: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'resource', { id: resourceId }, resource, duration);

    if (resource) {
      console.log(`[ResourceDbService] ✅ Retrieved resource in ${duration}ms`);
      return { success: true, data: resource };
    }

    console.log(`[ResourceDbService] ⚠️ Resource not found in ${duration}ms`);
    return { success: false, error: 'Resource not found' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting resource by ID', {
      service: 'ResourceDbService',
      operation: 'getResourceById',
      resourceId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ResourceDbService] ❌ Error getting resource by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create resource
 * @param {Object} resourceData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (resourceData) => {
  const startTime = Date.now();
  try {
    logger.info('Creating resource', {
      service: 'ResourceDbService',
      operation: 'create'
    });

    const resource = await prisma.resource.create({
      data: resourceData,
      include: {
        category: true,
        class: true,
        program: true,
        subject: true,
        file: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'resource', resourceData, resource, duration);

    console.log(`[ResourceDbService] ✅ Created resource in ${duration}ms`);
    return { success: true, data: resource };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating resource', {
      service: 'ResourceDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ResourceDbService] ❌ Error creating resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update resource
 * @param {string} resourceId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (resourceId, updateData) => {
  const startTime = Date.now();
  try {
    logger.info('Updating resource', {
      service: 'ResourceDbService',
      operation: 'update',
      resourceId
    });

    const resource = await prisma.resource.update({
      where: { id: resourceId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        category: true,
        class: true,
        program: true,
        subject: true,
        file: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'resource', { id: resourceId, ...updateData }, resource, duration);

    console.log(`[ResourceDbService] ✅ Updated resource in ${duration}ms`);
    return { success: true, data: resource };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating resource', {
      service: 'ResourceDbService',
      operation: 'update',
      resourceId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ResourceDbService] ❌ Error updating resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete resource
 * @param {string} resourceId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteResource = async (resourceId) => {
  const startTime = Date.now();
  try {
    logger.info('Deleting resource', {
      service: 'ResourceDbService',
      operation: 'deleteResource',
      resourceId
    });

    const resource = await prisma.resource.delete({
      where: { id: resourceId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'resource', { id: resourceId }, resource, duration);

    console.log(`[ResourceDbService] ✅ Deleted resource in ${duration}ms`);
    return { success: true, message: 'Resource deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting resource', {
      service: 'ResourceDbService',
      operation: 'deleteResource',
      resourceId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ResourceDbService] ❌ Error deleting resource:', error);
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[ResourceDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ResourceDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getResources,
  getResourceById,
  create,
  update,
  deleteResource
};
