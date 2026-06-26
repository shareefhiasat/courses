/**
 * Break Sessions Database Service
 */

import prisma from './prismaClient.js';
import { buildBreakWhere } from '../utils/schedulingDateRange.js';
import {
  expandRecurrenceDates,
  buildRecurrencePattern,
  generateSeriesId,
} from '../utils/schedulingRecurrence.js';


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
    // Input validation
    if (!data.programId || !data.timeSlotId || !data.date || !data.breakType) {
      return { success: false, error: 'Missing required fields: programId, timeSlotId, date, breakType' };
    }

    const breakDate = new Date(data.date);
    if (isNaN(breakDate.getTime())) {
      return { success: false, error: 'Invalid date format' };
    }

    // Prevent breaks too far in the past or future (max 2 years)
    const now = new Date();
    const maxFuture = new Date();
    maxFuture.setFullYear(now.getFullYear() + 2);
    const maxPast = new Date();
    maxPast.setFullYear(now.getFullYear() - 2);

    if (breakDate > maxFuture) {
      return { success: false, error: 'Break date cannot be more than 2 years in the future' };
    }

    if (breakDate < maxPast) {
      return { success: false, error: 'Break date cannot be more than 2 years in the past' };
    }

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
      descriptionEn: data.descriptionEn || null,
      descriptionAr: data.descriptionAr || null,
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
    console.log('[BreakSessions DB] Updating break session:', { id, data, userId });
    console.log('[BreakSessions DB] Received date:', data.date);
    console.log('[BreakSessions DB] Date type:', typeof data.date);
    
    const existing = await prisma.breakSession.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing) {
      console.log('[BreakSessions DB] Break session not found:', id);
      return { success: false, error: 'Break session not found' };
    }
    console.log('[BreakSessions DB] Existing break session:', existing);
    console.log('[BreakSessions DB] Existing date:', existing.date);

    // Validate date if provided
    if (data.date) {
      const breakDate = new Date(data.date);
      if (isNaN(breakDate.getTime())) {
        return { success: false, error: 'Invalid date format' };
      }

      // Prevent breaks too far in the past or future (max 2 years)
      const now = new Date();
      const maxFuture = new Date();
      maxFuture.setFullYear(now.getFullYear() + 2);
      const maxPast = new Date();
      maxPast.setFullYear(now.getFullYear() - 2);

      if (breakDate > maxFuture) {
        return { success: false, error: 'Break date cannot be more than 2 years in the future' };
      }

      if (breakDate < maxPast) {
        return { success: false, error: 'Break date cannot be more than 2 years in the past' };
      }
    }

    const updateScope = data.updateScope || 'single';
    console.log('[BreakSessions DB] Update scope:', updateScope);
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
      ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
      ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      updatedBy: userId,
    };
    
    if (data.date) {
      const dateObj = new Date(data.date);
      console.log('[BreakSessions DB] Date object created:', dateObj);
      console.log('[BreakSessions DB] Date object ISO:', dateObj.toISOString());
      updatePayload.date = dateObj;
    }
    
    console.log('[BreakSessions DB] Update payload:', updatePayload);

    if (updateScope === 'series' && existing.seriesId) {
      console.log('[BreakSessions DB] Updating series:', existing.seriesId);
      await prisma.breakSession.updateMany({
        where: { seriesId: existing.seriesId },
        data: updatePayload,
      });
      const records = await prisma.breakSession.findMany({
        where: { seriesId: existing.seriesId },
        include: breakInclude,
      });
      console.log('[BreakSessions DB] Series updated, records:', records.length);
      return { success: true, data: records, scope: 'series' };
    }

    console.log('[BreakSessions DB] Updating single record');
    const record = await prisma.breakSession.update({
      where: { id: parseInt(id, 10) },
      data: updatePayload,
      include: breakInclude,
    });
    console.log('[BreakSessions DB] Record updated successfully:', record);
    console.log('[BreakSessions DB] Updated date in DB:', record.date);
    return { success: true, data: record, scope: 'single' };
  } catch (error) {
    console.error('[BreakSessions DB] Error updating break session:', error);
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
