/**
 * Break Sessions Database Service
 */

import { PrismaClient } from '@prisma/client';
import { buildBreakWhere } from '../utils/schedulingDateRange.js';
import {
  expandRecurrenceDates,
  buildRecurrencePattern,
  generateSeriesId,
} from '../utils/schedulingRecurrence.js';

const prisma = new PrismaClient();

const MAX_RECURRING_OCCURRENCES = 500;

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
    const isRecurring = Boolean(data.isRecurring);
    const seriesId = isRecurring ? generateSeriesId() : null;
    const recurrencePattern = isRecurring
      ? data.recurrencePattern || buildRecurrencePattern({
          recurrenceType: data.recurrenceType,
          recurrenceDays: data.recurrenceDays,
          recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
          recurrenceCount: data.recurrenceCount,
        })
      : null;

    const baseRecord = {
      programId: parseInt(data.programId, 10),
      instructorUserId: data.instructorUserId ? parseInt(data.instructorUserId, 10) : null,
      classroomId: data.classroomId ? parseInt(data.classroomId, 10) : null,
      timeSlotId: parseInt(data.timeSlotId, 10),
      breakType: data.breakType,
      notes: data.notes || null,
      createdBy: userId,
      updatedBy: userId,
    };

    if (!isRecurring) {
      const record = await prisma.breakSession.create({
        data: {
          ...baseRecord,
          date: new Date(data.date),
          isRecurring: false,
          recurrencePattern: null,
          seriesId: null,
        },
        include: breakInclude,
      });
      return { success: true, data: record };
    }

    const dates = expandRecurrenceDates({
      startDate: data.date,
      recurrenceType: data.recurrenceType,
      recurrenceDays: data.recurrenceDays,
      recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
      recurrenceCount: data.recurrenceCount,
      maxOccurrences: MAX_RECURRING_OCCURRENCES,
    });

    if (dates.length === 0) {
      return { success: false, error: 'No valid recurrence dates found' };
    }

    const records = await prisma.$transaction(
      dates.map((date) =>
        prisma.breakSession.create({
          data: {
            ...baseRecord,
            date,
            isRecurring: true,
            recurrencePattern,
            seriesId,
          },
          include: breakInclude,
        })
      )
    );

    return { success: true, data: records, seriesId, count: records.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBreakSession = async (id, data, userId) => {
  try {
    const existing = await prisma.breakSession.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing) {
      return { success: false, error: 'Break session not found' };
    }

    const updateScope = data.updateScope || 'single';
    const updatePayload = {
      ...(data.programId != null && { programId: parseInt(data.programId, 10) }),
      ...(data.instructorUserId !== undefined && {
        instructorUserId: data.instructorUserId ? parseInt(data.instructorUserId, 10) : null,
      }),
      ...(data.classroomId !== undefined && {
        classroomId: data.classroomId ? parseInt(data.classroomId, 10) : null,
      }),
      ...(data.timeSlotId != null && { timeSlotId: parseInt(data.timeSlotId, 10) }),
      ...(data.breakType && { breakType: data.breakType }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      updatedBy: userId,
    };

    if (updateScope === 'series' && existing.seriesId) {
      await prisma.breakSession.updateMany({
        where: { seriesId: existing.seriesId },
        data: updatePayload,
      });
      const records = await prisma.breakSession.findMany({
        where: { seriesId: existing.seriesId },
        include: breakInclude,
      });
      return { success: true, data: records, scope: 'series' };
    }

    const record = await prisma.breakSession.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...updatePayload,
        ...(data.date && { date: new Date(data.date) }),
      },
      include: breakInclude,
    });
    return { success: true, data: record, scope: 'single' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteBreakSession = async (id, deleteScope = 'single') => {
  try {
    const existing = await prisma.breakSession.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing) {
      return { success: false, error: 'Break session not found' };
    }

    if (deleteScope === 'series' && existing.seriesId) {
      const { count } = await prisma.breakSession.deleteMany({
        where: { seriesId: existing.seriesId },
      });
      return { success: true, scope: 'series', count };
    }

    await prisma.breakSession.delete({ where: { id: parseInt(id, 10) } });
    return { success: true, scope: 'single' };
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
