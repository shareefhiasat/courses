/**
 * Attendance Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for attendance using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: attendance (via Prisma Attendance model)
 *
 * @typedef {import('@types/index').Attendance} Attendance
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[AttendanceDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[AttendanceDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'AttendanceDbService' });
  })
  .catch((err) => {
    console.error('[AttendanceDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'AttendanceDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all attendance records
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getAttendance = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, classId, status, date, limitCount = 200 } = options;

    logger.info('Getting attendance records', {
      service: 'AttendanceDbService',
      operation: 'getAttendance',
      filters: { userId, classId, status, date, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (classId) where.classId = classId;
    if (status) where.status = status;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limitCount,
      include: {
        user: true,
        class: true,
        marker: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'attendance', where, attendance, duration);

    console.log(`[AttendanceDbService] ✅ Retrieved ${attendance.length} attendance records in ${duration}ms`);
    return { success: true, data: attendance };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting attendance records', {
      service: 'AttendanceDbService',
      operation: 'getAttendance',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[AttendanceDbService] ❌ Error getting attendance records:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance by ID
 * @param {string} attendanceId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getAttendanceById = async (attendanceId) => {
  const startTime = Date.now();
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        user: true,
        class: true,
        marker: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'attendance', { id: attendanceId }, attendance, duration);

    if (!attendance) return { success: false, error: 'Attendance record not found' };
    return { success: true, data: attendance };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting attendance by ID', {
      service: 'AttendanceDbService',
      operation: 'getAttendanceById',
      attendanceId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create attendance record
 * @param {Object} attendanceData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (attendanceData) => {
  const startTime = Date.now();
  try {
    const attendance = await prisma.attendance.create({
      data: attendanceData,
      include: {
        user: true,
        class: true,
        marker: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'attendance', attendanceData, attendance, duration);

    return { success: true, data: attendance };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating attendance record', {
      service: 'AttendanceDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update attendance record
 * @param {string} attendanceId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (attendanceId, updateData) => {
  const startTime = Date.now();
  try {
    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        user: true,
        class: true,
        marker: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'attendance', { id: attendanceId, ...updateData }, attendance, duration);

    return { success: true, data: attendance };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating attendance record', {
      service: 'AttendanceDbService',
      operation: 'update',
      attendanceId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete attendance record
 * @param {string} attendanceId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteAttendance = async (attendanceId) => {
  const startTime = Date.now();
  try {
    const attendance = await prisma.attendance.delete({
      where: { id: attendanceId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'attendance', { id: attendanceId }, attendance, duration);

    return { success: true, message: 'Attendance record deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting attendance record', {
      service: 'AttendanceDbService',
      operation: 'deleteAttendance',
      attendanceId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get class attendance statistics
 * @param {string} classId
 * @param {Object} dateRange
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getClassStats = async (classId, dateRange = {}) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = dateRange;
    
    const where = { classId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        user: true,
        class: true
      }
    });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length,
      attendanceRate: attendance.length > 0 ? 
        (attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(2) : 0,
      records: attendance
    };

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'attendance', where, attendance, duration);

    return { success: true, data: stats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting class attendance statistics', {
      service: 'AttendanceDbService',
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
  console.log('[AttendanceDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[AttendanceDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getAttendance,
  getAttendanceById,
  create,
  update,
  deleteAttendance,
  getClassStats
};
