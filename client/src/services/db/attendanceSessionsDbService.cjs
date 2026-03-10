/**
 * Attendance Sessions Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for attendance sessions using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: attendanceSessions (via Prisma AttendanceSession model)
 *
 * @typedef {import('@types/index').AttendanceSession} AttendanceSession
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[AttendanceSessionsDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[AttendanceSessionsDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'AttendanceSessionsDbService' });
  })
  .catch((err) => {
    console.error('[AttendanceSessionsDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'AttendanceSessionsDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all attendance sessions
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getAttendanceSessions = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { classId, instructorId, status, date, limitCount = 200 } = options;

    logger.info('Getting attendance sessions', {
      service: 'AttendanceSessionsDbService',
      operation: 'getAttendanceSessions',
      filters: { classId, instructorId, status, date, limitCount }
    });

    const where = {};
    if (classId) where.classId = classId;
    if (instructorId) where.instructorId = instructorId;
    if (status) where.status = status;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.sessionDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const attendanceSessions = await prisma.attendanceSession.findMany({
      where,
      orderBy: { sessionDate: 'desc' },
      take: limitCount,
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'attendanceSession', where, attendanceSessions, duration);

    console.log(`[AttendanceSessionsDbService] ✅ Retrieved ${attendanceSessions.length} attendance sessions in ${duration}ms`);
    return { success: true, data: attendanceSessions };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting attendance sessions', {
      service: 'AttendanceSessionsDbService',
      operation: 'getAttendanceSessions',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[AttendanceSessionsDbService] ❌ Error getting attendance sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance session by ID
 * @param {string} attendanceSessionId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getAttendanceSessionById = async (attendanceSessionId) => {
  const startTime = Date.now();
  try {
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: attendanceSessionId },
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'attendanceSession', { id: attendanceSessionId }, attendanceSession, duration);

    if (!attendanceSession) return { success: false, error: 'Attendance session not found' };
    return { success: true, data: attendanceSession };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting attendance session by ID', {
      service: 'AttendanceSessionsDbService',
      operation: 'getAttendanceSessionById',
      attendanceSessionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create attendance session
 * @param {Object} attendanceSessionData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (attendanceSessionData) => {
  const startTime = Date.now();
  try {
    const attendanceSession = await prisma.attendanceSession.create({
      data: attendanceSessionData,
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'attendanceSession', attendanceSessionData, attendanceSession, duration);

    return { success: true, data: attendanceSession };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating attendance session', {
      service: 'AttendanceSessionsDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update attendance session
 * @param {string} attendanceSessionId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (attendanceSessionId, updateData) => {
  const startTime = Date.now();
  try {
    const attendanceSession = await prisma.attendanceSession.update({
      where: { id: attendanceSessionId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'attendanceSession', { id: attendanceSessionId, ...updateData }, attendanceSession, duration);

    return { success: true, data: attendanceSession };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating attendance session', {
      service: 'AttendanceSessionsDbService',
      operation: 'update',
      attendanceSessionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete attendance session
 * @param {string} attendanceSessionId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteAttendanceSession = async (attendanceSessionId) => {
  const startTime = Date.now();
  try {
    const attendanceSession = await prisma.attendanceSession.delete({
      where: { id: attendanceSessionId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'attendanceSession', { id: attendanceSessionId }, attendanceSession, duration);

    return { success: true, message: 'Attendance session deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting attendance session', {
      service: 'AttendanceSessionsDbService',
      operation: 'deleteAttendanceSession',
      attendanceSessionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Start attendance session
 * @param {string} classId
 * @param {string} instructorId
 * @param {Object} sessionData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const startSession = async (classId, instructorId, sessionData = {}) => {
  const startTime = Date.now();
  try {
    const attendanceSessionData = {
      classId,
      instructorId,
      sessionDate: new Date(),
      startTime: new Date(),
      status: 'active',
      ...sessionData
    };

    const attendanceSession = await prisma.attendanceSession.create({
      data: attendanceSessionData,
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'attendanceSession', attendanceSessionData, attendanceSession, duration);

    return { success: true, data: attendanceSession };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error starting attendance session', {
      service: 'AttendanceSessionsDbService',
      operation: 'startSession',
      classId,
      instructorId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * End attendance session
 * @param {string} attendanceSessionId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const endSession = async (attendanceSessionId) => {
  const startTime = Date.now();
  try {
    const attendanceSession = await prisma.attendanceSession.update({
      where: { id: attendanceSessionId },
      data: {
        status: 'completed',
        endTime: new Date(),
        updatedAt: new Date()
      },
      include: {
        class: true,
        instructor: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'attendanceSession', { id: attendanceSessionId, status: 'completed', endTime: new Date() }, attendanceSession, duration);

    return { success: true, data: attendanceSession };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error ending attendance session', {
      service: 'AttendanceSessionsDbService',
      operation: 'endSession',
      attendanceSessionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[AttendanceSessionsDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[AttendanceSessionsDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getAttendanceSessions,
  getAttendanceSessionById,
  create,
  update,
  deleteAttendanceSession,
  startSession,
  endSession
};
