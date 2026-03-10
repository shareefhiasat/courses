/**
 * Templates Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for templates using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: templates (via Prisma Template model)
 *
 * @typedef {import('@types/index').Template} Template
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[TemplatesDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[TemplatesDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'TemplatesDbService' });
  })
  .catch((err) => {
    console.error('[TemplatesDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'TemplatesDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all templates
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getTemplates = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { type, createdBy, isActive, limitCount = 200 } = options;

    logger.info('Getting templates', {
      service: 'TemplatesDbService',
      operation: 'getTemplates',
      filters: { type, createdBy, isActive, limitCount }
    });

    const where = {};
    if (type) where.type = type;
    if (createdBy) where.createdBy = createdBy;
    if (isActive !== undefined) where.isActive = isActive;

    const templates = await prisma.template.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: limitCount,
      include: {
        creator: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'template', where, templates, duration);

    console.log(`[TemplatesDbService] ✅ Retrieved ${templates.length} templates in ${duration}ms`);
    return { success: true, data: templates };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting templates', {
      service: 'TemplatesDbService',
      operation: 'getTemplates',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[TemplatesDbService] ❌ Error getting templates:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get template by ID
 * @param {string} templateId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getTemplateById = async (templateId) => {
  const startTime = Date.now();
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        creator: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'template', { id: templateId }, template, duration);

    if (!template) return { success: false, error: 'Template not found' };
    return { success: true, data: template };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting template by ID', {
      service: 'TemplatesDbService',
      operation: 'getTemplateById',
      templateId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create template
 * @param {Object} templateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (templateData) => {
  const startTime = Date.now();
  try {
    const template = await prisma.template.create({
      data: templateData,
      include: {
        creator: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'template', templateData, template, duration);

    return { success: true, data: template };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating template', {
      service: 'TemplatesDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update template
 * @param {string} templateId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (templateId, updateData) => {
  const startTime = Date.now();
  try {
    const template = await prisma.template.update({
      where: { id: templateId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        creator: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'template', { id: templateId, ...updateData }, template, duration);

    return { success: true, data: template };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating template', {
      service: 'TemplatesDbService',
      operation: 'update',
      templateId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete template
 * @param {string} templateId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteTemplate = async (templateId) => {
  const startTime = Date.now();
  try {
    const template = await prisma.template.delete({
      where: { id: templateId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'template', { id: templateId }, template, duration);

    return { success: true, message: 'Template deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting template', {
      service: 'TemplatesDbService',
      operation: 'deleteTemplate',
      templateId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Increment template usage count
 * @param {string} templateId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const incrementUsage = async (templateId) => {
  const startTime = Date.now();
  try {
    const template = await prisma.template.update({
      where: { id: templateId },
      data: { 
        usageCount: { increment: 1 },
        updatedAt: new Date()
      },
      include: {
        creator: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'template', { id: templateId, usageCount: { increment: 1 } }, template, duration);

    return { success: true, data: template };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error incrementing template usage', {
      service: 'TemplatesDbService',
      operation: 'incrementUsage',
      templateId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[TemplatesDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[TemplatesDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getTemplates,
  getTemplateById,
  create,
  update,
  deleteTemplate,
  incrementUsage
};
