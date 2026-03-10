/**
 * Enrollment Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for enrollments using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: enrollments (via Prisma Enrollment model)
 *
 * @typedef {import('@types/index').Enrollment} Enrollment
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[EnrollmentDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[EnrollmentDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'EnrollmentDbService' });
  })
  .catch((err) => {
    console.error('[EnrollmentDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'EnrollmentDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all enrollments
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getEnrollments = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, classId, status, limitCount = 200 } = options;

    logger.info('Getting enrollments', {
      service: 'EnrollmentDbService',
      operation: 'getEnrollments',
      filters: { userId, classId, status, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (classId) where.classId = classId;
    if (status) where.status = status;

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      take: limitCount,
      include: {
        user: true,
        class: true,
        approver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'enrollment', where, enrollments, duration);

    console.log(`[EnrollmentDbService] ✅ Retrieved ${enrollments.length} enrollments in ${duration}ms`);
    return { success: true, data: enrollments };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting enrollments', {
      service: 'EnrollmentDbService',
      operation: 'getEnrollments',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[EnrollmentDbService] ❌ Error getting enrollments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enrollment by ID
 * @param {string} enrollmentId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getEnrollmentById = async (enrollmentId) => {
  const startTime = Date.now();
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        class: true,
        approver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'enrollment', { id: enrollmentId }, enrollment, duration);

    if (!enrollment) return { success: false, error: 'Enrollment not found' };
    return { success: true, data: enrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting enrollment by ID', {
      service: 'EnrollmentDbService',
      operation: 'getEnrollmentById',
      enrollmentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create enrollment
 * @param {Object} enrollmentData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (enrollmentData) => {
  const startTime = Date.now();
  try {
    const enrollment = await prisma.enrollment.create({
      data: enrollmentData,
      include: {
        user: true,
        class: true,
        approver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'enrollment', enrollmentData, enrollment, duration);

    return { success: true, data: enrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating enrollment', {
      service: 'EnrollmentDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update enrollment
 * @param {string} enrollmentId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (enrollmentId, updateData) => {
  const startTime = Date.now();
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        user: true,
        class: true,
        approver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'enrollment', { id: enrollmentId, ...updateData }, enrollment, duration);

    return { success: true, data: enrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating enrollment', {
      service: 'EnrollmentDbService',
      operation: 'update',
      enrollmentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete enrollment
 * @param {string} enrollmentId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteEnrollment = async (enrollmentId) => {
  const startTime = Date.now();
  try {
    const enrollment = await prisma.enrollment.delete({
      where: { id: enrollmentId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'enrollment', { id: enrollmentId }, enrollment, duration);

    return { success: true, message: 'Enrollment deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting enrollment', {
      service: 'EnrollmentDbService',
      operation: 'deleteEnrollment',
      enrollmentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Approve enrollment
 * @param {string} enrollmentId
 * @param {string} approvedBy
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const approveEnrollment = async (enrollmentId, approvedBy) => {
  const startTime = Date.now();
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'approved',
        approvedBy,
        updatedAt: new Date()
      },
      include: {
        user: true,
        class: true,
        approver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'enrollment', { id: enrollmentId, status: 'approved', approvedBy }, enrollment, duration);

    return { success: true, data: enrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error approving enrollment', {
      service: 'EnrollmentDbService',
      operation: 'approveEnrollment',
      enrollmentId,
      approvedBy,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Reject enrollment
 * @param {string} enrollmentId
 * @param {string} approvedBy
 * @param {string} notes
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const rejectEnrollment = async (enrollmentId, approvedBy, notes) => {
  const startTime = Date.now();
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'rejected',
        approvedBy,
        notes,
        updatedAt: new Date()
      },
      include: {
        user: true,
        class: true,
        approver: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'enrollment', { id: enrollmentId, status: 'rejected', approvedBy, notes }, enrollment, duration);

    return { success: true, data: enrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error rejecting enrollment', {
      service: 'EnrollmentDbService',
      operation: 'rejectEnrollment',
      enrollmentId,
      approvedBy,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get class enrollment statistics
 * @param {string} classId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getClassStats = async (classId) => {
  const startTime = Date.now();
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        user: true,
        class: true
      }
    });

    // Calculate statistics
    const stats = {
      total: enrollments.length,
      pending: enrollments.filter(e => e.status === 'pending').length,
      approved: enrollments.filter(e => e.status === 'approved').length,
      rejected: enrollments.filter(e => e.status === 'rejected').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      averageGrade: enrollments.filter(e => e.grade !== null).length > 0 ?
        enrollments.filter(e => e.grade !== null).reduce((sum, e) => sum + e.grade, 0) / enrollments.filter(e => e.grade !== null).length : 0,
      enrollments: enrollments
    };

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'enrollment', { classId }, enrollments, duration);

    return { success: true, data: stats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting class enrollment statistics', {
      service: 'EnrollmentDbService',
      operation: 'getClassStats',
      classId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[EnrollmentDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[EnrollmentDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getEnrollments,
  getEnrollmentById,
  create,
  update,
  deleteEnrollment,
  approveEnrollment,
  rejectEnrollment,
  getClassStats
};
