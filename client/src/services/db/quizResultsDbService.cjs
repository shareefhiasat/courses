/**
 * Quiz Results Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for quiz results using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: quizResults (via Prisma QuizResult model)
 *
 * @typedef {import('@types/index').QuizResult} QuizResult
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[QuizResultsDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[QuizResultsDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'QuizResultsDbService' });
  })
  .catch((err) => {
    console.error('[QuizResultsDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'QuizResultsDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all quiz results
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getQuizResults = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { quizId, studentId, classId, status, limitCount = 200 } = options;

    logger.info('Getting quiz results', {
      service: 'QuizResultsDbService',
      operation: 'getQuizResults',
      filters: { quizId, studentId, classId, status, limitCount }
    });

    const where = {};
    if (quizId) where.quizId = quizId;
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (status) where.status = status;

    const quizResults = await prisma.quizResult.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        quiz: true,
        student: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'quizResult', where, quizResults, duration);

    console.log(`[QuizResultsDbService] ✅ Retrieved ${quizResults.length} quiz results in ${duration}ms`);
    return { success: true, data: quizResults };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting quiz results', {
      service: 'QuizResultsDbService',
      operation: 'getQuizResults',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[QuizResultsDbService] ❌ Error getting quiz results:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz result by ID
 * @param {string} quizResultId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getQuizResultById = async (quizResultId) => {
  const startTime = Date.now();
  try {
    const quizResult = await prisma.quizResult.findUnique({
      where: { id: quizResultId },
      include: {
        quiz: true,
        student: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'quizResult', { id: quizResultId }, quizResult, duration);

    if (!quizResult) return { success: false, error: 'Quiz result not found' };
    return { success: true, data: quizResult };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting quiz result by ID', {
      service: 'QuizResultsDbService',
      operation: 'getQuizResultById',
      quizResultId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create quiz result
 * @param {Object} quizResultData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (quizResultData) => {
  const startTime = Date.now();
  try {
    const quizResult = await prisma.quizResult.create({
      data: quizResultData,
      include: {
        quiz: true,
        student: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'quizResult', quizResultData, quizResult, duration);

    return { success: true, data: quizResult };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating quiz result', {
      service: 'QuizResultsDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update quiz result
 * @param {string} quizResultId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (quizResultId, updateData) => {
  const startTime = Date.now();
  try {
    const quizResult = await prisma.quizResult.update({
      where: { id: quizResultId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        quiz: true,
        student: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'quizResult', { id: quizResultId, ...updateData }, quizResult, duration);

    return { success: true, data: quizResult };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating quiz result', {
      service: 'QuizResultsDbService',
      operation: 'update',
      quizResultId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz result
 * @param {string} quizResultId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteQuizResult = async (quizResultId) => {
  const startTime = Date.now();
  try {
    const quizResult = await prisma.quizResult.delete({
      where: { id: quizResultId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'quizResult', { id: quizResultId }, quizResult, duration);

    return { success: true, message: 'Quiz result deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting quiz result', {
      service: 'QuizResultsDbService',
      operation: 'deleteQuizResult',
      quizResultId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[QuizResultsDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[QuizResultsDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getQuizResults,
  getQuizResultById,
  create,
  update,
  deleteQuizResult
};
