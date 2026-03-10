/**
 * Subject Enrollments Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for subject enrollments using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: subjectEnrollments (via Prisma SubjectEnrollment model)
 *
 * @typedef {import('@types/index').SubjectEnrollment} SubjectEnrollment
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[SubjectEnrollmentsDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[SubjectEnrollmentsDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'SubjectEnrollmentsDbService' });
  })
  .catch((err) => {
    console.error('[SubjectEnrollmentsDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'SubjectEnrollmentsDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all subject enrollments
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getSubjectEnrollments = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, subjectId, status, limitCount = 200 } = options;

    logger.info('Getting subject enrollments', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'getSubjectEnrollments',
      filters: { userId, subjectId, status, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (subjectId) where.subjectId = subjectId;
    if (status) where.status = status;

    const subjectEnrollments = await prisma.subjectEnrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      take: limitCount,
      include: {
        user: true,
        subject: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'subjectEnrollment', where, subjectEnrollments, duration);

    console.log(`[SubjectEnrollmentsDbService] ✅ Retrieved ${subjectEnrollments.length} subject enrollments in ${duration}ms`);
    return { success: true, data: subjectEnrollments };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting subject enrollments', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'getSubjectEnrollments',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[SubjectEnrollmentsDbService] ❌ Error getting subject enrollments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get subject enrollment by ID
 * @param {string} subjectEnrollmentId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getSubjectEnrollmentById = async (subjectEnrollmentId) => {
  const startTime = Date.now();
  try {
    const subjectEnrollment = await prisma.subjectEnrollment.findUnique({
      where: { id: subjectEnrollmentId },
      include: {
        user: true,
        subject: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'subjectEnrollment', { id: subjectEnrollmentId }, subjectEnrollment, duration);

    if (!subjectEnrollment) return { success: false, error: 'Subject enrollment not found' };
    return { success: true, data: subjectEnrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting subject enrollment by ID', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'getSubjectEnrollmentById',
      subjectEnrollmentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create subject enrollment
 * @param {Object} subjectEnrollmentData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (subjectEnrollmentData) => {
  const startTime = Date.now();
  try {
    const subjectEnrollment = await prisma.subjectEnrollment.create({
      data: subjectEnrollmentData,
      include: {
        user: true,
        subject: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'subjectEnrollment', subjectEnrollmentData, subjectEnrollment, duration);

    return { success: true, data: subjectEnrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating subject enrollment', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update subject enrollment
 * @param {string} subjectEnrollmentId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (subjectEnrollmentId, updateData) => {
  const startTime = Date.now();
  try {
    const subjectEnrollment = await prisma.subjectEnrollment.update({
      where: { id: subjectEnrollmentId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        user: true,
        subject: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'subjectEnrollment', { id: subjectEnrollmentId, ...updateData }, subjectEnrollment, duration);

    return { success: true, data: subjectEnrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating subject enrollment', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'update',
      subjectEnrollmentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete subject enrollment
 * @param {string} subjectEnrollmentId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteSubjectEnrollment = async (subjectEnrollmentId) => {
  const startTime = Date.now();
  try {
    const subjectEnrollment = await prisma.subjectEnrollment.delete({
      where: { id: subjectEnrollmentId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'subjectEnrollment', { id: subjectEnrollmentId }, subjectEnrollment, duration);

    return { success: true, message: 'Subject enrollment deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting subject enrollment', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'deleteSubjectEnrollment',
      subjectEnrollmentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get user subject enrollments
 * @param {string} userId
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getUserEnrollments = async (userId) => {
  const startTime = Date.now();
  try {
    const subjectEnrollments = await prisma.subjectEnrollment.findMany({
      where: { userId },
      include: {
        user: true,
        subject: {
          include: {
            program: true
          }
        }
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'subjectEnrollment', { userId }, subjectEnrollments, duration);

    return { success: true, data: subjectEnrollments };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting user subject enrollments', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'getUserEnrollments',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get subject enrollment statistics
 * @param {string} subjectId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getSubjectStats = async (subjectId) => {
  const startTime = Date.now();
  try {
    const subjectEnrollments = await prisma.subjectEnrollment.findMany({
      where: { subjectId },
      include: {
        user: true,
        subject: true
      }
    });

    // Calculate statistics
    const stats = {
      total: subjectEnrollments.length,
      active: subjectEnrollments.filter(se => se.status === 'active').length,
      completed: subjectEnrollments.filter(se => se.status === 'completed').length,
      dropped: subjectEnrollments.filter(se => se.status === 'dropped').length,
      averageGrade: subjectEnrollments.filter(se => se.grade !== null).length > 0 ?
        subjectEnrollments.filter(se => se.grade !== null).reduce((sum, se) => sum + se.grade, 0) / subjectEnrollments.filter(se => se.grade !== null).length : 0,
      enrollments: subjectEnrollments
    };

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'subjectEnrollment', { subjectId }, subjectEnrollments, duration);

    return { success: true, data: stats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting subject enrollment statistics', {
      service: 'SubjectEnrollmentsDbService',
      operation: 'getSubjectStats',
      subjectId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[SubjectEnrollmentsDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[SubjectEnrollmentsDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getSubjectEnrollments,
  getSubjectEnrollmentById,
  create,
  update,
  deleteSubjectEnrollment,
  getUserEnrollments,
  getSubjectStats
};
