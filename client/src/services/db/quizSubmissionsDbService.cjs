/**
 * Quiz Submissions Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for quiz submissions using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: quizSubmissions (via Prisma QuizSubmission model)
 *
 * @typedef {import('@types/index').QuizSubmission} QuizSubmission
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[QuizSubmissionsDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[QuizSubmissionsDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'QuizSubmissionsDbService' });
  })
  .catch((err) => {
    console.error('[QuizSubmissionsDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'QuizSubmissionsDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all quiz submissions
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getQuizSubmissions = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { quizResultId, questionId, studentId, isCorrect, limitCount = 200 } = options;

    logger.info('Getting quiz submissions', {
      service: 'QuizSubmissionsDbService',
      operation: 'getQuizSubmissions',
      filters: { quizResultId, questionId, studentId, isCorrect, limitCount }
    });

    const where = {};
    if (quizResultId) where.quizResultId = quizResultId;
    if (questionId) where.questionId = questionId;
    if (studentId) where.studentId = studentId;
    if (isCorrect !== undefined) where.isCorrect = isCorrect;

    const quizSubmissions = await prisma.quizSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: limitCount,
      include: {
        quizResult: true,
        question: true,
        student: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'quizSubmission', where, quizSubmissions, duration);

    console.log(`[QuizSubmissionsDbService] ✅ Retrieved ${quizSubmissions.length} quiz submissions in ${duration}ms`);
    return { success: true, data: quizSubmissions };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting quiz submissions', {
      service: 'QuizSubmissionsDbService',
      operation: 'getQuizSubmissions',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[QuizSubmissionsDbService] ❌ Error getting quiz submissions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz submission by ID
 * @param {string} quizSubmissionId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getQuizSubmissionById = async (quizSubmissionId) => {
  const startTime = Date.now();
  try {
    const quizSubmission = await prisma.quizSubmission.findUnique({
      where: { id: quizSubmissionId },
      include: {
        quizResult: true,
        question: true,
        student: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'quizSubmission', { id: quizSubmissionId }, quizSubmission, duration);

    if (!quizSubmission) return { success: false, error: 'Quiz submission not found' };
    return { success: true, data: quizSubmission };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting quiz submission by ID', {
      service: 'QuizSubmissionsDbService',
      operation: 'getQuizSubmissionById',
      quizSubmissionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create quiz submission
 * @param {Object} quizSubmissionData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (quizSubmissionData) => {
  const startTime = Date.now();
  try {
    const quizSubmission = await prisma.quizSubmission.create({
      data: quizSubmissionData,
      include: {
        quizResult: true,
        question: true,
        student: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'quizSubmission', quizSubmissionData, quizSubmission, duration);

    return { success: true, data: quizSubmission };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating quiz submission', {
      service: 'QuizSubmissionsDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update quiz submission
 * @param {string} quizSubmissionId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (quizSubmissionId, updateData) => {
  const startTime = Date.now();
  try {
    const quizSubmission = await prisma.quizSubmission.update({
      where: { id: quizSubmissionId },
      data: updateData,
      include: {
        quizResult: true,
        question: true,
        student: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'quizSubmission', { id: quizSubmissionId, ...updateData }, quizSubmission, duration);

    return { success: true, data: quizSubmission };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating quiz submission', {
      service: 'QuizSubmissionsDbService',
      operation: 'update',
      quizSubmissionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz submission
 * @param {string} quizSubmissionId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteQuizSubmission = async (quizSubmissionId) => {
  const startTime = Date.now();
  try {
    const quizSubmission = await prisma.quizSubmission.delete({
      where: { id: quizSubmissionId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'quizSubmission', { id: quizSubmissionId }, quizSubmission, duration);

    return { success: true, message: 'Quiz submission deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting quiz submission', {
      service: 'QuizSubmissionsDbService',
      operation: 'deleteQuizSubmission',
      quizSubmissionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[QuizSubmissionsDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[QuizSubmissionsDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getQuizSubmissions,
  getQuizSubmissionById,
  create,
  update,
  deleteQuizSubmission
};
