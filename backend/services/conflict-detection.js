/**
 * Scheduling Conflict Detection Service
 * 
 * PURPOSE: Detects scheduling conflicts before creating/updating schedule sessions
 * ARCHITECTURE: Controllers → Conflict Detection Service → DB Services → PostgreSQL
 * 
 * Conflict Types:
 * - TEACHER_CONFLICT: Teacher already booked at same date/time
 * - CLASSROOM_CONFLICT: Classroom already booked at same date/time
 * - MAX_SESSIONS_EXCEEDED: Teacher exceeds max sessions per day
 * - WEEKEND_CONFLICT: Date falls on weekend (Friday/Saturday)
 * - HOLIDAY_CONFLICT: Date falls on a holiday
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Day mapping for weekend check
const WEEKEND_DAYS = [5, 6]; // Friday=5, Saturday=6

/**
 * Check if a date falls on a weekend
 * 
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if weekend
 */
const isWeekend = (date) => {
  const d = new Date(date);
  return WEEKEND_DAYS.includes(d.getDay());
};

/**
 * Check if a date falls on a holiday (global or program-specific)
 * 
 * @param {Date|string} date - Date to check
 * @param {number} programId - Program ID (optional)
 * @returns {Promise<boolean>} - True if holiday
 */
const isHoliday = async (date, programId = null) => {
  const d = new Date(date);
  
  const holidays = await prisma.holiday.findMany({
    where: {
      isActive: true,
      startDate: { lte: d },
      endDate: { gte: d },
      OR: [
        { programId: null }, // Global holidays
        ...(programId ? [{ programId }] : []) // Program-specific holidays
      ]
    }
  });

  return holidays.length > 0;
};

/**
 * Check for teacher conflict
 * 
 * @param {number} instructorUserId - Teacher user ID
 * @param {Date|string} date - Date of session
 * @param {number} timeSlotId - Time slot ID
 * @param {number} excludeSessionId - Session ID to exclude (for updates)
 * @returns {Promise<Object|null>} - Conflict details or null
 */
const checkTeacherConflict = async (instructorUserId, date, timeSlotId, excludeSessionId = null) => {
  const where = {
    instructorUserId: parseInt(instructorUserId),
    date: new Date(date),
    timeSlotId: parseInt(timeSlotId),
    isCancelled: false,
    isActive: true
  };

  if (excludeSessionId) {
    where.id = { not: parseInt(excludeSessionId) };
  }

  const existingSession = await prisma.scheduleSession.findFirst({
    where,
    include: {
      class: {
        include: {
          subject: true
        }
      },
      timeSlot: true
    }
  });

  if (existingSession) {
    return {
      type: 'TEACHER_CONFLICT',
      message: 'Teacher already has a session scheduled at this time',
      details: {
        conflictingSession: existingSession,
        teacherId: instructorUserId,
        date,
        timeSlotId
      }
    };
  }

  return null;
};

/**
 * Check for classroom conflict
 * 
 * @param {number} classroomId - Classroom ID
 * @param {Date|string} date - Date of session
 * @param {number} timeSlotId - Time slot ID
 * @param {number} excludeSessionId - Session ID to exclude (for updates)
 * @returns {Promise<Object|null>} - Conflict details or null
 */
const checkClassroomConflict = async (classroomId, date, timeSlotId, excludeSessionId = null) => {
  if (!classroomId) return null;

  const where = {
    classroomId: parseInt(classroomId),
    date: new Date(date),
    timeSlotId: parseInt(timeSlotId),
    isCancelled: false,
    isActive: true
  };

  if (excludeSessionId) {
    where.id = { not: parseInt(excludeSessionId) };
  }

  const existingSession = await prisma.scheduleSession.findFirst({
    where,
    include: {
      class: {
        include: {
          subject: true
        }
      },
      instructor: true,
      classroom: true
    }
  });

  if (existingSession) {
    return {
      type: 'CLASSROOM_CONFLICT',
      message: 'Classroom already booked at this time',
      details: {
        conflictingSession: existingSession,
        classroomId,
        date,
        timeSlotId
      }
    };
  }

  return null;
};

/**
 * Check if teacher exceeds max sessions per day
 * 
 * @param {number} instructorUserId - Teacher user ID
 * @param {Date|string} date - Date to check
 * @param {number} excludeSessionId - Session ID to exclude (for updates)
 * @returns {Promise<Object|null>} - Conflict details or null
 */
const checkMaxSessionsPerDay = async (instructorUserId, date, excludeSessionId = null) => {
  // Get teacher's max sessions per day
  const teacherAvailability = await prisma.teacherAvailability.findUnique({
    where: { userId: parseInt(instructorUserId) }
  });

  const maxSessions = teacherAvailability?.maxSessionsPerDay || 3;

  // Count existing sessions for this date
  const where = {
    instructorUserId: parseInt(instructorUserId),
    date: new Date(date),
    isCancelled: false,
    isActive: true
  };

  if (excludeSessionId) {
    where.id = { not: parseInt(excludeSessionId) };
  }

  const sessionCount = await prisma.scheduleSession.count({ where });

  if (sessionCount >= maxSessions) {
    return {
      type: 'MAX_SESSIONS_EXCEEDED',
      message: `Teacher exceeds maximum sessions per day (${maxSessions})`,
      details: {
        teacherId: instructorUserId,
        date,
        currentCount: sessionCount,
        maxAllowed: maxSessions
      }
    };
  }

  return null;
};

/**
 * Check for weekend conflict
 * 
 * @param {Date|string} date - Date to check
 * @returns {Object|null} - Conflict details or null
 */
const checkWeekendConflict = (date) => {
  if (isWeekend(date)) {
    return {
      type: 'WEEKEND_CONFLICT',
      message: 'Date falls on weekend (Friday/Saturday)',
      details: {
        date
      }
    };
  }

  return null;
};

/**
 * Check for holiday conflict
 * 
 * @param {Date|string} date - Date to check
 * @param {number} programId - Program ID (optional)
 * @returns {Promise<Object|null>} - Conflict details or null
 */
const checkHolidayConflict = async (date, programId = null) => {
  const holidayExists = await isHoliday(date, programId);

  if (holidayExists) {
    // Get holiday details
    const d = new Date(date);
    const holiday = await prisma.holiday.findFirst({
      where: {
        isActive: true,
        startDate: { lte: d },
        endDate: { gte: d },
        OR: [
          { programId: null },
          ...(programId ? [{ programId }] : [])
        ]
      }
    });

    return {
      type: 'HOLIDAY_CONFLICT',
      message: `Date falls on holiday: ${holiday?.descriptionEn || holiday?.descriptionAr}`,
      details: {
        date,
        holiday
      }
    };
  }

  return null;
};

/**
 * Comprehensive conflict detection for a schedule session
 * 
 * @param {Object} params - Session parameters
 * @param {number} params.instructorUserId - Teacher user ID
 * @param {Date|string} params.date - Date of session
 * @param {number} params.timeSlotId - Time slot ID
 * @param {number|null} params.classroomId - Classroom ID (optional)
 * @param {number|null} params.programId - Program ID (optional)
 * @param {number|null} params.excludeSessionId - Session ID to exclude (for updates)
 * @returns {Promise<Object>} - Conflict detection result
 */
export const detectConflicts = async (params) => {
  const {
    instructorUserId,
    date,
    timeSlotId,
    classroomId = null,
    programId = null,
    excludeSessionId = null
  } = params;

  const conflicts = [];

  // 1. Check weekend conflict
  const weekendConflict = checkWeekendConflict(date);
  if (weekendConflict) {
    conflicts.push(weekendConflict);
  }

  // 2. Check holiday conflict
  const holidayConflict = await checkHolidayConflict(date, programId);
  if (holidayConflict) {
    conflicts.push(holidayConflict);
  }

  // 3. Check teacher conflict
  if (instructorUserId) {
    const teacherConflict = await checkTeacherConflict(instructorUserId, date, timeSlotId, excludeSessionId);
    if (teacherConflict) {
      conflicts.push(teacherConflict);
    }

    // 4. Check max sessions per day
    const maxSessionsConflict = await checkMaxSessionsPerDay(instructorUserId, date, excludeSessionId);
    if (maxSessionsConflict) {
      conflicts.push(maxSessionsConflict);
    }
  }

  // 5. Check classroom conflict
  if (classroomId) {
    const classroomConflict = await checkClassroomConflict(classroomId, date, timeSlotId, excludeSessionId);
    if (classroomConflict) {
      conflicts.push(classroomConflict);
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    canSchedule: conflicts.length === 0
  };
};

/**
 * Get bilingual conflict message
 * 
 * @param {Object} conflict - Conflict object
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string} - Localized message
 */
export const getLocalizedConflictMessage = (conflict, lang = 'en') => {
  const messages = {
    TEACHER_CONFLICT: {
      en: 'Teacher already has a session scheduled at this time',
      ar: 'المعلم لديه بالفعل جلسة مجدولة في هذا الوقت'
    },
    CLASSROOM_CONFLICT: {
      en: 'Classroom already booked at this time',
      ar: 'الفصل الدراسي محجوز بالفعل في هذا الوقت'
    },
    MAX_SESSIONS_EXCEEDED: {
      en: `Teacher exceeds maximum sessions per day (${conflict.details?.maxAllowed || 3})`,
      ar: `المعلم يتجاوز الحد الأقصى للجلسات اليومية (${conflict.details?.maxAllowed || 3})`
    },
    WEEKEND_CONFLICT: {
      en: 'Date falls on weekend (Friday/Saturday)',
      ar: 'التاريخ يقع في عطلة نهاية الأسبوع (الجمعة/السبت)'
    },
    HOLIDAY_CONFLICT: {
      en: `Date falls on holiday: ${conflict.details?.holiday?.descriptionEn || conflict.details?.holiday?.descriptionAr}`,
      ar: `التاريخ يقع في عطلة: ${conflict.details?.holiday?.descriptionAr || conflict.details?.holiday?.descriptionEn}`
    }
  };

  const conflictMessages = messages[conflict.type] || messages.TEACHER_CONFLICT;
  return conflictMessages[lang] || conflictMessages.en;
};
