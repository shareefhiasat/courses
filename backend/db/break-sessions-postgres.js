/**
 * Break Sessions Database Service
 */

import { PrismaClient } from '@prisma/client';
import { buildBreakWhere } from '../utils/schedulingDateRange.js';

const prisma = new PrismaClient();

const breakInclude = {
  program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  instructor: {
    select: {
      id: true, displayName: true, firstName: true, lastName: true,
      displayNameAr: true, firstNameAr: true, lastNameAr: true,
    },
  },
  classroom: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  timeSlot: { select: { id: true, labelEn: true, labelAr: true, startTime: true, endTime: true, durationMinutes: true } },
};

export const getBreakSessions = async (params = {}) => {
  try {
    const { start, end, programId, instructorId, breakType } = params;
    const where = buildBreakWhere({ programId, instructorId, start, end });
    if (breakType) where.breakType = breakType;

    const data = await prisma.breakSession.findMany({
      where,
      include: breakInclude,
      orderBy: [{ date: 'asc' }, { timeSlot: { sortOrder: 'asc' } }],
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBreakSessionsByDateRange = async (params = {}) => getBreakSessions(params);

export const getBreakSessionsByTeacher = async (instructorUserId, params = {}) =>
  getBreakSessions({ ...params, instructorId: instructorUserId });

export const getBreakTypeDistribution = async (params = {}) => {
  try {
    const { start, end, programId, instructorId } = params;
    const where = buildBreakWhere({ programId, instructorId, start, end });

    const grouped = await prisma.breakSession.groupBy({
      by: ['breakType'],
      where,
      _count: { id: true },
    });

    return {
      success: true,
      data: grouped.map((g) => ({ breakType: g.breakType, count: g._count.id })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createBreakSession = async (data, userId) => {
  try {
    const record = await prisma.breakSession.create({
      data: {
        programId: parseInt(data.programId, 10),
        instructorUserId: data.instructorUserId ? parseInt(data.instructorUserId, 10) : null,
        classroomId: data.classroomId ? parseInt(data.classroomId, 10) : null,
        timeSlotId: parseInt(data.timeSlotId, 10),
        date: new Date(data.date),
        breakType: data.breakType,
        notes: data.notes || null,
        isRecurring: Boolean(data.isRecurring),
        recurrencePattern: data.recurrencePattern || null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: breakInclude,
    });
    return { success: true, data: record };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBreakSession = async (id, data, userId) => {
  try {
    const record = await prisma.breakSession.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(data.programId != null && { programId: parseInt(data.programId, 10) }),
        ...(data.instructorUserId !== undefined && {
          instructorUserId: data.instructorUserId ? parseInt(data.instructorUserId, 10) : null,
        }),
        ...(data.classroomId !== undefined && {
          classroomId: data.classroomId ? parseInt(data.classroomId, 10) : null,
        }),
        ...(data.timeSlotId != null && { timeSlotId: parseInt(data.timeSlotId, 10) }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.breakType && { breakType: data.breakType }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isRecurring !== undefined && { isRecurring: Boolean(data.isRecurring) }),
        ...(data.recurrencePattern !== undefined && { recurrencePattern: data.recurrencePattern }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        updatedBy: userId,
      },
      include: breakInclude,
    });
    return { success: true, data: record };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteBreakSession = async (id) => {
  try {
    await prisma.breakSession.delete({ where: { id: parseInt(id, 10) } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  getBreakSessions,
  getBreakSessionsByDateRange,
  getBreakSessionsByTeacher,
  getBreakTypeDistribution,
  createBreakSession,
  updateBreakSession,
  deleteBreakSession,
};
