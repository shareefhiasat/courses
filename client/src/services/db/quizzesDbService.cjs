/**
 * Quizzes Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for quizzes using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: quizzes (via Prisma Quiz model)
 *
 * @typedef {import('@types/index').Quiz} Quiz
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[QuizzesDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[QuizzesDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'QuizzesDbService' });
  })
  .catch((err) => {
    console.error('[QuizzesDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'QuizzesDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all quizzes
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getQuizzes = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { classId, instructorId, type, isPublished, limitCount = 200 } = options;

    logger.info('Getting quizzes', {
      service: 'QuizzesDbService',
      operation: 'getQuizzes',
      filters: { classId, instructorId, type, isPublished, limitCount }
    });

    const where = {};
    if (classId) where.classId = classId;
    if (instructorId) where.instructorId = instructorId;
    if (type) where.type = type;
    if (isPublished !== undefined) where.isPublished = isPublished;

    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        class: true,
        instructor: true,
        questions: true,
        results: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'quiz', where, quizzes, duration);

    console.log(`[QuizzesDbService] ✅ Retrieved ${quizzes.length} quizzes in ${duration}ms`);
    return { success: true, data: quizzes };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting quizzes', {
      service: 'QuizzesDbService',
      operation: 'getQuizzes',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[QuizzesDbService] ❌ Error getting quizzes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz by ID
 * @param {string} quizId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getQuizById = async (quizId) => {
  const startTime = Date.now();
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        class: true,
        instructor: true,
        questions: true,
        results: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'quiz', { id: quizId }, quiz, duration);

    if (!quiz) return { success: false, error: 'Quiz not found' };
    return { success: true, data: quiz };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting quiz by ID', {
      service: 'QuizzesDbService',
      operation: 'getQuizById',
      quizId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create quiz
 * @param {Object} quizData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (quizData) => {
  const startTime = Date.now();
  try {
    const quiz = await prisma.quiz.create({
      data: quizData,
      include: {
        class: true,
        instructor: true,
        questions: true,
        results: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'quiz', quizData, quiz, duration);

    return { success: true, data: quiz };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating quiz', {
      service: 'QuizzesDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update quiz
 * @param {string} quizId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (quizId, updateData) => {
  const startTime = Date.now();
  try {
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        class: true,
        instructor: true,
        questions: true,
        results: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'quiz', { id: quizId, ...updateData }, quiz, duration);

    return { success: true, data: quiz };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating quiz', {
      service: 'QuizzesDbService',
      operation: 'update',
      quizId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz
 * @param {string} quizId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteQuiz = async (quizId) => {
  const startTime = Date.now();
  try {
    const quiz = await prisma.quiz.delete({
      where: { id: quizId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'quiz', { id: quizId }, quiz, duration);

    return { success: true, message: 'Quiz deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting quiz', {
      service: 'QuizzesDbService',
      operation: 'deleteQuiz',
      quizId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Publish quiz
 * @param {string} quizId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const publishQuiz = async (quizId) => {
  const startTime = Date.now();
  try {
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        isPublished: true,
        updatedAt: new Date()
      },
      include: {
        class: true,
        instructor: true,
        questions: true,
        results: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'quiz', { id: quizId, isPublished: true }, quiz, duration);

    return { success: true, data: quiz };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error publishing quiz', {
      service: 'QuizzesDbService',
      operation: 'publishQuiz',
      quizId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz statistics
 * @param {string} quizId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getQuizStats = async (quizId) => {
  const startTime = Date.now();
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        results: {
          include: {
            student: true
          }
        },
        questions: true
      }
    });

    if (!quiz) return { success: false, error: 'Quiz not found' };

    // Calculate statistics
    const stats = {
      totalAttempts: quiz.results.length,
      averageScore: quiz.results.length > 0 ?
        quiz.results.reduce((sum, result) => sum + result.score, 0) / quiz.results.length : 0,
      averagePercentage: quiz.results.length > 0 ?
        quiz.results.reduce((sum, result) => sum + result.percentage, 0) / quiz.results.length : 0,
      passRate: quiz.results.length > 0 ?
        (quiz.results.filter(result => result.status === 'passed').length / quiz.results.length * 100) : 0,
      questionCount: quiz.questions.length,
      maxScore: quiz.maxScore,
      passingScore: quiz.passingScore,
      recentResults: quiz.results.slice(0, 10).reverse(),
      scoreDistribution: quiz.results.reduce((acc, result) => {
        const range = Math.floor(result.percentage / 10) * 10;
        acc[`${range}-${range + 9}%`] = (acc[`${range}-${range + 9}%`] || 0) + 1;
        return acc;
      }, {})
    };

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'quiz', { id: quizId }, quiz, duration);

    return { success: true, data: stats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting quiz statistics', {
      service: 'QuizzesDbService',
      operation: 'getQuizStats',
      quizId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[QuizzesDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[QuizzesDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getQuizzes,
  getQuizById,
  create,
  update,
  deleteQuiz,
  publishQuiz,
  getQuizStats
};
