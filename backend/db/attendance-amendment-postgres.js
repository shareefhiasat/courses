/**
 * Attendance Amendment DB Service - PostgreSQL Operations
 * 
 * PURPOSE: Database operations for attendance amendment tracking
 * ARCHITECTURE: DB Services → Prisma → PostgreSQL
 */

import prisma from './prismaClient.js';


/**
 * Create an attendance amendment record
 */
export async function createAttendanceAmendment(data) {
  try {
    const { attendanceId, fromStatusId, toStatusId, reason, amendedBy } = data;

    const amendment = await prisma.attendanceAmendment.create({
      data: {
        attendanceId,
        fromStatusId,
        toStatusId,
        reason,
        amendedBy
      },
      include: {
        attendance: true,
        fromStatus: true,
        toStatus: true,
        amendedByUser: true
      }
    });

    return { success: true, data: amendment };
  } catch (error) {
    console.error('Error creating attendance amendment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get attendance amendments for a specific attendance record
 */
export async function getAttendanceAmendments(attendanceId) {
  try {
    const amendments = await prisma.attendanceAmendment.findMany({
      where: { attendanceId },
      include: {
        fromStatus: true,
        toStatus: true,
        amendedByUser: true
      },
      orderBy: {
        amendedAt: 'desc'
      }
    });

    return { success: true, data: amendments };
  } catch (error) {
    console.error('Error getting attendance amendments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all attendance amendments with filters
 */
export async function getAllAttendanceAmendments(filters = {}) {
  try {
    const { startDate, endDate, amendedBy, limit = 100, offset = 0 } = filters;

    const where = {};
    if (startDate || endDate) {
      where.amendedAt = {};
      if (startDate) where.amendedAt.gte = new Date(startDate);
      if (endDate) where.amendedAt.lte = new Date(endDate);
    }
    if (amendedBy) where.amendedBy = parseInt(amendedBy);

    const amendments = await prisma.attendanceAmendment.findMany({
      where,
      include: {
        attendance: {
          include: {
            user: true,
            class: true
          }
        },
        fromStatus: true,
        toStatus: true,
        amendedByUser: true
      },
      orderBy: {
        amendedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.attendanceAmendment.count({ where });

    return { success: true, data: amendments, total };
  } catch (error) {
    console.error('Error getting all attendance amendments:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createAttendanceAmendment,
  getAttendanceAmendments,
  getAllAttendanceAmendments
};
