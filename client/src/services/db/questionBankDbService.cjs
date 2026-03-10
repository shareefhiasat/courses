/**
 * Question Bank Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for question bank using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: questionBanks (via Prisma QuestionBank model)
 *
 * @typedef {import('@types/index').QuestionBank} QuestionBank
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[QuestionBankDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[QuestionBankDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'QuestionBankDbService' });
  })
  .catch((err) => {
    console.error('[QuestionBankDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'QuestionBankDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all question bank items
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getQuestionBanks = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { createdBy, category, type, difficulty, isActive, limitCount = 200 } = options;

    logger.info('Getting question banks', {
      service: 'QuestionBankDbService',
      operation: 'getQuestionBanks',
      filters: { createdBy, category, type, difficulty, isActive, limitCount }
    });

    const where = {};
    if (createdBy) where.createdBy = createdBy;
    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (isActive !== undefined) where.isActive = isActive;

    const questionBanks = await prisma.questionBank.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        creator: true,
        questions: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'questionBank', where, questionBanks, duration);

    console.log(`[QuestionBankDbService] ✅ Retrieved ${questionBanks.length} question bank items in ${duration}ms`);
    return { success: true, data: questionBanks };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting question banks', {
      service: 'QuestionBankDbService',
      operation: 'getQuestionBanks',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[QuestionBankDbService] ❌ Error getting question banks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get question bank by ID
 * @param {string} questionBankId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getQuestionBankById = async (questionBankId) => {
  const startTime = Date.now();
  try {
    const questionBank = await prisma.questionBank.findUnique({
      where: { id: questionBankId },
      include: {
        creator: true,
        questions: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'questionBank', { id: questionBankId }, questionBank, duration);

    if (!questionBank) return { success: false, error: 'Question bank item not found' };
    return { success: true, data: questionBank };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting question bank by ID', {
      service: 'QuestionBankDbService',
      operation: 'getQuestionBankById',
      questionBankId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create question bank item
 * @param {Object} questionBankData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (questionBankData) => {
  const startTime = Date.now();
  try {
    const questionBank = await prisma.questionBank.create({
      data: questionBankData,
      include: {
        creator: true,
        questions: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'questionBank', questionBankData, questionBank, duration);

    return { success: true, data: questionBank };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating question bank', {
      service: 'QuestionBankDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update question bank item
 * @param {string} questionBankId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (questionBankId, updateData) => {
  const startTime = Date.now();
  try {
    const questionBank = await prisma.questionBank.update({
      where: { id: questionBankId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        creator: true,
        questions: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'questionBank', { id: questionBankId, ...updateData }, questionBank, duration);

    return { success: true, data: questionBank };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating question bank', {
      service: 'QuestionBankDbService',
      operation: 'update',
      questionBankId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete question bank item
 * @param {string} questionBankId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteQuestionBank = async (questionBankId) => {
  const startTime = Date.now();
  try {
    const questionBank = await prisma.questionBank.delete({
      where: { id: questionBankId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'questionBank', { id: questionBankId }, questionBank, duration);

    return { success: true, message: 'Question bank item deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting question bank', {
      service: 'QuestionBankDbService',
      operation: 'deleteQuestionBank',
      questionBankId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Search question bank items
 * @param {Object} searchOptions
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const searchQuestions = async (searchOptions) => {
  const startTime = Date.now();
  try {
    const { query, category, type, difficulty, createdBy, limitCount = 50 } = searchOptions;

    logger.info('Searching question banks', {
      service: 'QuestionBankDbService',
      operation: 'searchQuestions',
      filters: { query, category, type, difficulty, createdBy, limitCount }
    });

    const where = {};
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { question: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (createdBy) where.createdBy = createdBy;
    where.isActive = true;

    const questionBanks = await prisma.questionBank.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        creator: true,
        questions: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'questionBank', where, questionBanks, duration);

    console.log(`[QuestionBankDbService] ✅ Found ${questionBanks.length} question bank items in ${duration}ms`);
    return { success: true, data: questionBanks };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error searching question banks', {
      service: 'QuestionBankDbService',
      operation: 'searchQuestions',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get question bank statistics
 * @param {string} createdBy
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getStats = async (createdBy) => {
  const startTime = Date.now();
  try {
    const where = createdBy ? { createdBy } : {};

    const questionBanks = await prisma.questionBank.findMany({
      where,
      include: {
        creator: true,
        questions: true
      }
    });

    // Calculate statistics
    const stats = {
      total: questionBanks.length,
      active: questionBanks.filter(qb => qb.isActive).length,
      byType: questionBanks.reduce((acc, qb) => {
        acc[qb.type] = (acc[qb.type] || 0) + 1;
        return acc;
      }, {}),
      byDifficulty: questionBanks.reduce((acc, qb) => {
        acc[qb.difficulty] = (acc[qb.difficulty] || 0) + 1;
        return acc;
      }, {}),
      byCategory: questionBanks.reduce((acc, qb) => {
        acc[qb.category || 'uncategorized'] = (acc[qb.category || 'uncategorized'] || 0) + 1;
        return acc;
      }, {}),
      averagePoints: questionBanks.length > 0 ?
        questionBanks.reduce((sum, qb) => sum + (qb.points || 0), 0) / questionBanks.length : 0
    };

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'questionBank', where, questionBanks, duration);

    return { success: true, data: stats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting question bank statistics', {
      service: 'QuestionBankDbService',
      operation: 'getStats',
      createdBy,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[QuestionBankDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[QuestionBankDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getQuestionBanks,
  getQuestionBankById,
  create,
  update,
  deleteQuestionBank,
  searchQuestions,
  getStats
};
