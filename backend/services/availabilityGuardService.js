/**
 * Guards availability edits/deletes against orphaning scheduled sessions.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDateOnly(dateValue) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  const str = String(dateValue);
  if (str.includes('T')) return new Date(str);
  const [year, month, day] = str.split('-');
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
}

function getDayCode(date) {
  return DAY_ORDER[new Date(date).getDay()];
}

function timeToMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Whether a session fits inside a single availability record.
 */
export function sessionFitsRecord(sessionStart, sessionEnd, record) {
  if (!record) return false;
  const day = getDayCode(sessionStart);
  if (!record.dayOfWeek?.includes(day)) return false;

  const sessionStartMin = sessionStart.getHours() * 60 + sessionStart.getMinutes();
  const sessionEndMin = sessionEnd.getHours() * 60 + sessionEnd.getMinutes();

  const recordStart = record.startDate ? startOfDay(record.startDate) : null;
  const recordEnd = record.endDate ? endOfDay(record.endDate) : null;
  if (recordStart && sessionStart < recordStart) return false;
  if (recordEnd && sessionStart > recordEnd) return false;

  return (record.slots || []).some((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return sessionStartMin >= slotStart && sessionEndMin <= slotEnd;
  });
}

function sessionFitsAnyRecord(sessionStart, sessionEnd, records) {
  if (!records?.length) return false;
  return records.some((record) => record.isActive !== false && sessionFitsRecord(sessionStart, sessionEnd, record));
}

function formatSessionConflict(session) {
  const start = new Date(session.startDateTime);
  const end = new Date(session.endDateTime);
  const day = getDayCode(start);
  const pad = (n) => String(n).padStart(2, '0');
  const timeRange = `${pad(start.getHours())}:${pad(start.getMinutes())}–${pad(end.getHours())}:${pad(end.getMinutes())}`;
  const classLabel = session.class?.nameEn || session.class?.code || `Class #${session.classId}`;
  const dateLabel = start.toISOString().split('T')[0];

  return {
    type: 'scheduled_session',
    sessionId: session.id,
    message: `${classLabel} on ${day} ${dateLabel} ${timeRange}`,
    details: {
      classCode: session.class?.code,
      className: session.class?.nameEn,
      classroomCode: session.classroom?.code,
      startDateTime: session.startDateTime,
      endDateTime: session.endDateTime,
      day
    }
  };
}

async function loadInstructorAvailabilityRecord(id) {
  return prisma.instructorAvailability.findUnique({
    where: { id: parseInt(id, 10) },
    include: { slots: { orderBy: { startTime: 'asc' } } }
  });
}

async function loadClassroomAvailabilityRecord(id) {
  return prisma.classroomAvailability.findUnique({
    where: { id: parseInt(id, 10) },
    include: { slots: { orderBy: { startTime: 'asc' } } }
  });
}

async function getInstructorRecordsAfterChange(instructorUserId, excludeId, proposedRecord) {
  const others = await prisma.instructorAvailability.findMany({
    where: {
      instructorUserId: parseInt(instructorUserId, 10),
      isActive: true,
      ...(excludeId ? { id: { not: parseInt(excludeId, 10) } } : {})
    },
    include: { slots: { orderBy: { startTime: 'asc' } } }
  });

  if (proposedRecord) {
    return [...others, proposedRecord];
  }
  return others;
}

async function getClassroomRecordsAfterChange(classroomId, excludeId, proposedRecord) {
  const others = await prisma.classroomAvailability.findMany({
    where: {
      classroomId: parseInt(classroomId, 10),
      isActive: true,
      ...(excludeId ? { id: { not: parseInt(excludeId, 10) } } : {})
    },
    include: { slots: { orderBy: { startTime: 'asc' } } }
  });

  if (proposedRecord) {
    return [...others, proposedRecord];
  }
  return others;
}

async function findBlockingSessions({ entityField, entityId, recordsAfterChange, originalRecord }) {
  const where = {
    [entityField]: parseInt(entityId, 10),
    status: { not: 'cancelled' },
    deletedAt: null
  };

  if (originalRecord?.startDate || originalRecord?.endDate) {
    where.startDateTime = {};
    if (originalRecord.startDate) {
      where.startDateTime.gte = startOfDay(originalRecord.startDate);
    }
    if (originalRecord.endDate) {
      where.startDateTime.lte = endOfDay(originalRecord.endDate);
    }
  }

  const sessions = await prisma.scheduledSession.findMany({
    where,
    include: {
      class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      classroom: { select: { id: true, code: true, nameEn: true, nameAr: true } }
    },
    orderBy: { startDateTime: 'asc' },
    take: 25
  });

  const blocking = [];
  for (const session of sessions) {
    const start = new Date(session.startDateTime);
    const end = new Date(session.endDateTime);

    if (originalRecord && !sessionFitsRecord(start, end, originalRecord)) {
      continue;
    }

    if (!sessionFitsAnyRecord(start, end, recordsAfterChange)) {
      blocking.push(session);
    }
  }

  return blocking;
}

function buildProposedRecord(data) {
  return {
    dayOfWeek: data.dayOfWeek || [],
    startDate: parseDateOnly(data.startDate),
    endDate: parseDateOnly(data.endDate),
    slots: (data.slots || []).map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime
    })),
    isActive: data.isActive !== false
  };
}

/**
 * Validate instructor availability update or delete will not orphan sessions.
 */
export async function validateInstructorAvailabilityChange({
  availabilityId = null,
  instructorUserId,
  dayOfWeek,
  slots,
  startDate,
  endDate,
  action = 'update'
}) {
  if (!instructorUserId) {
    return { valid: true, conflicts: [] };
  }

  let originalRecord = null;
  if (availabilityId) {
    originalRecord = await loadInstructorAvailabilityRecord(availabilityId);
    if (!originalRecord) {
      return { valid: false, conflicts: [{ type: 'validation', message: 'Availability record not found' }] };
    }
  }

  const proposedRecord = action === 'delete' ? null : buildProposedRecord({ dayOfWeek, slots, startDate, endDate });
  const recordsAfterChange = await getInstructorRecordsAfterChange(
    instructorUserId,
    availabilityId,
    proposedRecord
  );

  const blockingSessions = await findBlockingSessions({
    entityField: 'instructorId',
    entityId: instructorUserId,
    recordsAfterChange,
    originalRecord
  });

  const conflicts = blockingSessions.map(formatSessionConflict);
  return {
    valid: conflicts.length === 0,
    conflicts,
    blockingCount: blockingSessions.length
  };
}

/**
 * Validate classroom availability update or delete will not orphan sessions.
 */
export async function validateClassroomAvailabilityChange({
  availabilityId = null,
  classroomId,
  dayOfWeek,
  slots,
  startDate,
  endDate,
  action = 'update'
}) {
  if (!classroomId) {
    return { valid: true, conflicts: [] };
  }

  let originalRecord = null;
  if (availabilityId) {
    originalRecord = await loadClassroomAvailabilityRecord(availabilityId);
    if (!originalRecord) {
      return { valid: false, conflicts: [{ type: 'validation', message: 'Availability record not found' }] };
    }
  }

  const proposedRecord = action === 'delete' ? null : buildProposedRecord({ dayOfWeek, slots, startDate, endDate });
  const recordsAfterChange = await getClassroomRecordsAfterChange(
    classroomId,
    availabilityId,
    proposedRecord
  );

  const blockingSessions = await findBlockingSessions({
    entityField: 'classroomId',
    entityId: classroomId,
    recordsAfterChange,
    originalRecord
  });

  const conflicts = blockingSessions.map(formatSessionConflict);
  return {
    valid: conflicts.length === 0,
    conflicts,
    blockingCount: blockingSessions.length
  };
}

/**
 * Check if disabling/deleting a user would affect scheduled sessions.
 */
export async function validateUserRemoval(userId) {
  const id = parseInt(userId, 10);
  const now = new Date();

  const [upcomingSessions, availabilityCount] = await Promise.all([
    prisma.scheduledSession.count({
      where: {
        instructorId: id,
        status: { not: 'cancelled' },
        deletedAt: null,
        startDateTime: { gte: now }
      }
    }),
    prisma.instructorAvailability.count({
      where: { instructorUserId: id, isActive: true }
    })
  ]);

  const conflicts = [];
  if (upcomingSessions > 0) {
    conflicts.push({
      type: 'scheduled_session',
      message: `User is assigned to ${upcomingSessions} upcoming scheduled session(s)`
    });
  }
  if (availabilityCount > 0) {
    conflicts.push({
      type: 'instructor_availability',
      message: `User has ${availabilityCount} instructor availability record(s)`
    });
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    upcomingSessions,
    availabilityCount
  };
}

/**
 * Check if deleting a classroom would affect scheduled sessions.
 */
export async function validateClassroomRemoval(classroomId) {
  const id = parseInt(classroomId, 10);

  const [scheduledCount, availabilityCount] = await Promise.all([
    prisma.scheduledSession.count({
      where: {
        classroomId: id,
        status: { not: 'cancelled' },
        deletedAt: null
      }
    }),
    prisma.classroomAvailability.count({
      where: { classroomId: id, isActive: true }
    })
  ]);

  const conflicts = [];
  if (scheduledCount > 0) {
    conflicts.push({
      type: 'scheduled_session',
      message: `Classroom is used in ${scheduledCount} scheduled session(s)`
    });
  }
  if (availabilityCount > 0) {
    conflicts.push({
      type: 'classroom_availability',
      message: `Classroom has ${availabilityCount} availability record(s) — remove them first`
    });
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    scheduledCount,
    availabilityCount
  };
}

export default {
  sessionFitsRecord,
  validateInstructorAvailabilityChange,
  validateClassroomAvailabilityChange,
  validateUserRemoval,
  validateClassroomRemoval
};
