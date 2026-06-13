import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

/**
 * Detect instructor conflict
 * Returns conflict details if instructor is already scheduled during the time range
 */
export const detectInstructorConflict = async (instructorId, startDateTime, endDateTime, excludeSessionId = null) => {
  const conflict = await prisma.scheduledSession.findFirst({
    where: {
      instructorId: parseInt(instructorId),
      isActive: true,
      ...(excludeSessionId && { id: { not: parseInt(excludeSessionId) } }),
      AND: [
        { startDateTime: { lt: new Date(endDateTime) } },
        { endDateTime: { gt: new Date(startDateTime) } }
      ]
    },
    include: {
      class: {
        select: { code: true, nameEn: true, nameAr: true }
      },
      classroom: {
        select: { code: true, nameEn: true, nameAr: true }
      }
    }
  });

  if (conflict) {
    return {
      type: 'instructor',
      message: 'Instructor is already scheduled for another class during this time',
      conflict: {
        sessionId: conflict.id,
        class: conflict.class,
        classroom: conflict.classroom,
        startDateTime: conflict.startDateTime,
        endDateTime: conflict.endDateTime
      }
    };
  }

  return null;
};

/**
 * Detect classroom conflict
 * Returns conflict details if classroom is already booked during the time range
 */
export const detectClassroomConflict = async (classroomId, startDateTime, endDateTime, excludeSessionId = null) => {
  const conflict = await prisma.scheduledSession.findFirst({
    where: {
      classroomId: parseInt(classroomId),
      isActive: true,
      ...(excludeSessionId && { id: { not: parseInt(excludeSessionId) } }),
      AND: [
        { startDateTime: { lt: new Date(endDateTime) } },
        { endDateTime: { gt: new Date(startDateTime) } }
      ]
    },
    include: {
      class: {
        select: { code: true, nameEn: true, nameAr: true }
      },
      instructor: {
        select: { id: true, firstName: true, lastName: true, displayName: true }
      }
    }
  });

  if (conflict) {
    return {
      type: 'classroom',
      message: 'Classroom is already booked for another class during this time',
      conflict: {
        sessionId: conflict.id,
        class: conflict.class,
        instructor: conflict.instructor,
        startDateTime: conflict.startDateTime,
        endDateTime: conflict.endDateTime
      }
    };
  }

  return null;
};

/**
 * Detect class conflict
 * Returns conflict details if the same class already has a session during the time range
 */
export const detectClassConflict = async (classId, startDateTime, endDateTime, excludeSessionId = null) => {
  const conflict = await prisma.scheduledSession.findFirst({
    where: {
      classId: parseInt(classId),
      isActive: true,
      ...(excludeSessionId && { id: { not: parseInt(excludeSessionId) } }),
      AND: [
        { startDateTime: { lt: new Date(endDateTime) } },
        { endDateTime: { gt: new Date(startDateTime) } }
      ]
    },
    include: {
      instructor: {
        select: { id: true, firstName: true, lastName: true, displayName: true }
      },
      classroom: {
        select: { code: true, nameEn: true, nameAr: true }
      }
    }
  });

  if (conflict) {
    return {
      type: 'class',
      message: 'This class already has a session scheduled during this time',
      conflict: {
        sessionId: conflict.id,
        instructor: conflict.instructor,
        classroom: conflict.classroom,
        startDateTime: conflict.startDateTime,
        endDateTime: conflict.endDateTime
      }
    };
  }

  return null;
};

/**
 * Detect capacity conflict
 * Returns conflict details if enrolled students exceed classroom capacity
 */
export const detectCapacityConflict = async (classId, classroomId) => {
  // If no classroom specified, no capacity conflict
  if (!classroomId || classroomId === 'null' || classroomId === null) {
    return null;
  }

  const [classData, classroomData] = await Promise.all([
    prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: {
        enrollments: {
          select: { id: true }
        }
      }
    }),
    prisma.classroom.findUnique({
      where: { id: parseInt(classroomId) },
      select: { capacity: true, nameEn: true, nameAr: true, code: true }
    })
  ]);

  if (!classData || !classroomData) {
    return null;
  }

  const enrolledStudents = classData.enrollments.length;
  const roomCapacity = classroomData.capacity;

  if (enrolledStudents > roomCapacity) {
    return {
      type: 'capacity',
      message: `Classroom capacity (${roomCapacity}) is less than enrolled students (${enrolledStudents})`,
      conflict: {
        classroom: classroomData,
        enrolledStudents,
        roomCapacity,
        overflow: enrolledStudents - roomCapacity
      }
    };
  }

  return null;
};

/**
 * Validate instructor and classroom availability
 * Checks against InstructorAvailability and ClassroomAvailability records
 */
export const validateAvailability = async (instructorId, classroomId, startDateTime, endDateTime) => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][start.getDay()];
  const startTime = start.toTimeString().substring(0, 5); // HH:mm
  const endTime = end.toTimeString().substring(0, 5);

  const conflicts = [];

  // Check instructor availability
  const instructorAvailability = await prisma.instructorAvailability.findFirst({
    where: {
      instructorUserId: parseInt(instructorId),
      isActive: true,
      startDate: { lte: start },
      endDate: { gte: start },
      dayOfWeek: { has: dayOfWeek }
    },
    include: {
      slots: true
    }
  });

  if (!instructorAvailability) {
    conflicts.push({
      type: 'instructor_availability',
      message: `Instructor is not available on ${dayOfWeek}s during the specified date range`
    });
  } else {
    // Check if time falls within any slot
    const hasMatchingSlot = instructorAvailability.slots.some(slot => 
      slot.startTime <= startTime && slot.endTime >= endTime
    );

    if (!hasMatchingSlot) {
      conflicts.push({
        type: 'instructor_availability',
        message: `Instructor is not available during ${startTime}-${endTime} on ${dayOfWeek}s`,
        availableSlots: instructorAvailability.slots.map(s => `${s.startTime}-${s.endTime}`)
      });
    }
  }

  // Check classroom availability
  const classroomAvailability = await prisma.classroomAvailability.findFirst({
    where: {
      classroomId: parseInt(classroomId),
      isActive: true,
      startDate: { lte: start },
      endDate: { gte: start },
      dayOfWeek: { has: dayOfWeek }
    },
    include: {
      slots: true
    }
  });

  if (!classroomAvailability) {
    conflicts.push({
      type: 'classroom_availability',
      message: `Classroom is not available on ${dayOfWeek}s during the specified date range`
    });
  } else {
    // Check if time falls within any slot
    const hasMatchingSlot = classroomAvailability.slots.some(slot => 
      slot.startTime <= startTime && slot.endTime >= endTime
    );

    if (!hasMatchingSlot) {
      conflicts.push({
        type: 'classroom_availability',
        message: `Classroom is not available during ${startTime}-${endTime} on ${dayOfWeek}s`,
        availableSlots: classroomAvailability.slots.map(s => `${s.startTime}-${s.endTime}`)
      });
    }
  }

  return conflicts.length > 0 ? conflicts : null;
};

/**
 * Comprehensive validation of a scheduled session
 * Returns all conflicts found
 */
export const validateSession = async (sessionData, excludeSessionId = null) => {
  const { classId, instructorId, classroomId, startDateTime, endDateTime } = sessionData;
  
  // Validate required fields - instructor and classroom are now optional
  if (!classId || !startDateTime || !endDateTime) {
    return {
      valid: false,
      conflicts: [{
        type: 'validation',
        message: 'Missing required fields: classId, startDateTime, and endDateTime are required'
      }]
    };
  }
  
  // At least one resource (instructor or classroom) should be specified
  if (!instructorId && !classroomId) {
    return {
      valid: false,
      conflicts: [{
        type: 'validation',
        message: 'Please specify at least an instructor or classroom'
      }]
    };
  }
  
  const conflicts = [];

  // Run conflict checks in parallel - only check resources that are specified
  const checks = [
    detectClassConflict(classId, startDateTime, endDateTime, excludeSessionId),
    detectCapacityConflict(classId, startDateTime, endDateTime, excludeSessionId)
  ];
  
  if (instructorId) {
    checks.push(detectInstructorConflict(instructorId, startDateTime, endDateTime, excludeSessionId));
  }
  
  if (classroomId) {
    checks.push(detectClassroomConflict(classroomId, startDateTime, endDateTime, excludeSessionId));
  }

  const [
    classConflict,
    capacityConflict,
    ...resourceConflicts
  ] = await Promise.all(checks);
  
  const instructorConflict = instructorId ? resourceConflicts[0] : null;
  const classroomConflict = classroomId ? (instructorId ? resourceConflicts[1] : resourceConflicts[0]) : null;

  if (instructorConflict) conflicts.push(instructorConflict);
  if (classroomConflict) conflicts.push(classroomConflict);
  if (classConflict) conflicts.push(classConflict);
  if (capacityConflict) conflicts.push(capacityConflict);

  return {
    valid: conflicts.length === 0,
    conflicts
  };
};

/**
 * Generate recurring sessions based on recurrence configuration
 * Returns array of session objects to be created
 */
export const generateRecurringSessions = (baseSession, recurrenceConfig) => {
  const { recurrenceType, recurrenceDays, recurrenceEndDate, recurrenceCount, timesPerDay } = recurrenceConfig;
  const sessions = [];

  let currentDate = new Date(baseSession.startDateTime);
  const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
  let count = 0;
  const maxCount = recurrenceCount || 1000; // Safety limit

  while (count < maxCount) {
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];

    // Check if current day matches recurrence pattern
    if (recurrenceDays.includes(dayOfWeek)) {
      // Handle different times per day
      const dayTimes = timesPerDay?.find(t => t.day === dayOfWeek);
      
      if (dayTimes) {
        // Use specific time for this day
        const [startHour, startMinute] = dayTimes.startTime.split(':').map(Number);
        const [endHour, endMinute] = dayTimes.endTime.split(':').map(Number);
        
        const sessionStart = new Date(currentDate);
        sessionStart.setHours(startHour, startMinute, 0, 0);
        
        const sessionEnd = new Date(currentDate);
        sessionEnd.setHours(endHour, endMinute, 0, 0);

        sessions.push({
          ...baseSession,
          startDateTime: sessionStart,
          endDateTime: sessionEnd,
          isRecurringInstance: count > 0,
          parentSessionId: null // Will be set after first session is created
        });
      } else {
        // Use base session times
        const baseStart = new Date(baseSession.startDateTime);
        const baseEnd = new Date(baseSession.endDateTime);
        
        const sessionStart = new Date(currentDate);
        sessionStart.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);
        
        const sessionEnd = new Date(currentDate);
        sessionEnd.setHours(baseEnd.getHours(), baseEnd.getMinutes(), 0, 0);

        sessions.push({
          ...baseSession,
          startDateTime: sessionStart,
          endDateTime: sessionEnd,
          isRecurringInstance: count > 0,
          parentSessionId: null
        });
      }

      count++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);

    // Check end conditions
    if (endDate && currentDate > endDate) break;
    if (recurrenceCount && count >= recurrenceCount) break;
  }

  return sessions;
};

export default {
  detectInstructorConflict,
  detectClassroomConflict,
  detectClassConflict,
  detectCapacityConflict,
  validateAvailability,
  validateSession,
  generateRecurringSessions
};
