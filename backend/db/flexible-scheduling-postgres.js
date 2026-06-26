import prisma from './prismaClient.js';

/**
 * Flexible Scheduling Database Operations
 */

// Create flexible schedule session
async function createFlexibleScheduleSession(data) {
  try {
    const session = await prisma.flexibleScheduleSession.create({
      data: {
        programId: data.programId,
        courseId: data.courseId || null,
        subjectId: data.subjectId || null,
        instructorUserId: data.instructorUserId,
        classroomId: data.classroomId || null,
        timeSlotId: data.timeSlotId,
        date: new Date(data.date),
        recurrenceRule: data.recurrenceRule || null,
        isRecurring: data.isRecurring || false,
        parentSessionId: data.parentSessionId || null,
        notes: data.notes || null,
        createdBy: data.createdBy || null,
      },
      include: {
        program: true,
        instructor: true,
        classroom: true,
        timeSlot: true,
      },
    });
    return { success: true, data: session };
  } catch (error) {
    console.error('Error creating flexible schedule session:', error);
    return { success: false, error: error.message };
  }
}

// Get flexible schedule session by ID
async function getFlexibleScheduleSessionById(id) {
  try {
    const session = await prisma.flexibleScheduleSession.findUnique({
      where: { id },
      include: {
        program: true,
        instructor: true,
        classroom: true,
        timeSlot: true,
        parentSession: true,
        recurringSessions: true,
      },
    });
    return { success: true, data: session };
  } catch (error) {
    console.error('Error getting flexible schedule session:', error);
    return { success: false, error: error.message };
  }
}

// Get all flexible schedule sessions with filters
async function getFlexibleScheduleSessions(filters = {}) {
  try {
    const where = {
      isActive: true,
      ...(filters.programId && { programId: parseInt(filters.programId) }),
      ...(filters.instructorUserId && { instructorUserId: parseInt(filters.instructorUserId) }),
      ...(filters.classroomId && { classroomId: parseInt(filters.classroomId) }),
      ...(filters.startDate && { date: { gte: new Date(filters.startDate) } }),
      ...(filters.endDate && { date: { lte: new Date(filters.endDate) } }),
      ...(filters.isCancelled !== undefined && { isCancelled: filters.isCancelled }),
    };

    const sessions = await prisma.flexibleScheduleSession.findMany({
      where,
      include: {
        program: true,
        instructor: true,
        classroom: true,
        timeSlot: true,
      },
      orderBy: { date: 'asc' },
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error getting flexible schedule sessions:', error);
    return { success: false, error: error.message };
  }
}

// Update flexible schedule session
async function updateFlexibleScheduleSession(id, data) {
  try {
    const session = await prisma.flexibleScheduleSession.update({
      where: { id },
      data: {
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.courseId !== undefined && { courseId: data.courseId }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.instructorUserId !== undefined && { instructorUserId: data.instructorUserId }),
        ...(data.classroomId !== undefined && { classroomId: data.classroomId }),
        ...(data.timeSlotId !== undefined && { timeSlotId: data.timeSlotId }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.recurrenceRule !== undefined && { recurrenceRule: data.recurrenceRule }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.parentSessionId !== undefined && { parentSessionId: data.parentSessionId }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isCancelled !== undefined && { isCancelled: data.isCancelled }),
        ...(data.cancelledAt !== undefined && { cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null }),
        ...(data.cancelReason !== undefined && { cancelReason: data.cancelReason }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
      },
      include: {
        program: true,
        instructor: true,
        classroom: true,
        timeSlot: true,
      },
    });
    return { success: true, data: session };
  } catch (error) {
    console.error('Error updating flexible schedule session:', error);
    return { success: false, error: error.message };
  }
}

// Delete flexible schedule session (soft delete)
async function deleteFlexibleScheduleSession(id) {
  try {
    const session = await prisma.flexibleScheduleSession.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, data: session };
  } catch (error) {
    console.error('Error deleting flexible schedule session:', error);
    return { success: false, error: error.message };
  }
}

// Bulk create flexible schedule sessions
async function bulkCreateFlexibleScheduleSessions(sessions) {
  try {
    const createdSessions = await prisma.flexibleScheduleSession.createMany({
      data: sessions.map(session => ({
        programId: session.programId,
        courseId: session.courseId || null,
        subjectId: session.subjectId || null,
        instructorUserId: session.instructorUserId,
        classroomId: session.classroomId || null,
        timeSlotId: session.timeSlotId,
        date: new Date(session.date),
        recurrenceRule: session.recurrenceRule || null,
        isRecurring: session.isRecurring || false,
        parentSessionId: session.parentSessionId || null,
        notes: session.notes || null,
        createdBy: session.createdBy || null,
      })),
    });
    return { success: true, data: { count: createdSessions.count } };
  } catch (error) {
    console.error('Error bulk creating flexible schedule sessions:', error);
    return { success: false, error: error.message };
  }
}

// Get sessions for a specific date range
async function getSessionsByDateRange(startDate, endDate, filters = {}) {
  try {
    const where = {
      isActive: true,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      ...(filters.programId && { programId: parseInt(filters.programId) }),
      ...(filters.instructorUserId && { instructorUserId: parseInt(filters.instructorUserId) }),
      ...(filters.classroomId && { classroomId: parseInt(filters.classroomId) }),
    };

    const sessions = await prisma.flexibleScheduleSession.findMany({
      where,
      include: {
        program: true,
        instructor: true,
        classroom: true,
        timeSlot: true,
      },
      orderBy: { date: 'asc' },
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error getting sessions by date range:', error);
    return { success: false, error: error.message };
  }
}

// Check for conflicts
async function checkConflicts(instructorUserId, date, timeSlotId, classroomId, excludeSessionId = null) {
  try {
    const where = {
      isActive: true,
      isCancelled: false,
      date: new Date(date),
      timeSlotId: parseInt(timeSlotId),
      ...(excludeSessionId && { id: { not: parseInt(excludeSessionId) } }),
    };

    const conflicts = await prisma.flexibleScheduleSession.findMany({
      where: {
        OR: [
          { ...where, instructorUserId: parseInt(instructorUserId) },
          ...(classroomId ? [{ ...where, classroomId: parseInt(classroomId) }] : []),
        ],
      },
      include: {
        instructor: true,
        classroom: true,
        timeSlot: true,
      },
    });

    return { success: true, data: conflicts };
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createFlexibleScheduleSession,
  getFlexibleScheduleSessionById,
  getFlexibleScheduleSessions,
  updateFlexibleScheduleSession,
  deleteFlexibleScheduleSession,
  bulkCreateFlexibleScheduleSessions,
  getSessionsByDateRange,
  checkConflicts,
};
