/**
 * Schedule Business Service
 * 
 * PURPOSE:
 * Business logic for schedule operations. This layer handles data transformation,
 * validation, and orchestration of database operations.
 * 
 * @typedef {import('@types/index').Schedule} Schedule
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import {
  getSchedulesByTermAndYear,
  getAllSchedules,
  getSchedulesByProgram,
  getSchedulesByInstructor
} from '@services/db/scheduleDbService';
import logger from '@utils/logger';

/**
 * Get schedules for a specific term and year
 * @param {string} term - Term (e.g., 'Fall', 'Spring', 'Summer')
 * @param {string} year - Year (e.g., '2024')
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSchedules = async (term, year) => {
  try {
    if (!term || !year) {
      return { success: false, error: 'Term and year are required' };
    }

    const result = await getSchedulesByTermAndYear(term, year);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('[ScheduleService] Error getting schedules:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all schedules (no filtering)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllSchedulesData = async () => {
  try {
    const result = await getAllSchedules();
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('[ScheduleService] Error getting all schedules:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedules by program with optional term/year filter
 * @param {string} programId - Program ID
 * @param {string} term - Term (optional)
 * @param {string} year - Year (optional)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSchedulesByProgramId = async (programId, term = null, year = null) => {
  try {
    if (!programId) {
      return { success: false, error: 'Program ID is required' };
    }

    const result = await getSchedulesByProgram(programId, term, year);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('[ScheduleService] Error getting schedules by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedules by instructor with optional term/year filter
 * @param {string} instructorEmail - Instructor email
 * @param {string} term - Term (optional)
 * @param {string} year - Year (optional)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSchedulesByInstructorEmail = async (instructorEmail, term = null, year = null) => {
  try {
    if (!instructorEmail) {
      return { success: false, error: 'Instructor email is required' };
    }

    const result = await getSchedulesByInstructor(instructorEmail, term, year);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('[ScheduleService] Error getting schedules by instructor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Transform class schedules into calendar events
 * @param {Array} classes - Array of class objects with schedule data
 * @param {Date} startDate - Start date for the calendar range
 * @param {Date} endDate - End date for the calendar range
 * @returns {Array} Array of calendar events
 */
export const transformSchedulesToCalendarEvents = (classes, startDate, endDate) => {
  try {
    const events = [];
    const dayMap = {
      'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
    };

    classes.forEach(classItem => {
      const schedule = classItem.schedule;
      if (!schedule || !schedule.days || schedule.days.length === 0) {
        return;
      }

      const holidays = new Set(schedule.holidays || []);
      const instructorAbsent = new Set(schedule.instructorAbsent || []);

      schedule.days.forEach(day => {
        const dayOfWeek = dayMap[day];
        if (dayOfWeek === undefined) return;

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          if (currentDate.getDay() === dayOfWeek) {
            const dateString = currentDate.toISOString().split('T')[0];
            
            if (!holidays.has(dateString) && !instructorAbsent.has(dateString)) {
              const [hours, minutes] = (schedule.startTime || '09:00').split(':');
              const eventStart = new Date(currentDate);
              eventStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

              const eventEnd = new Date(eventStart);
              eventEnd.setMinutes(eventEnd.getMinutes() + (schedule.duration || 60));

              events.push({
                id: `${classItem.docId}-${dateString}`,
                title: classItem.name || classItem.code || 'Class',
                start: eventStart,
                end: eventEnd,
                resource: {
                  classId: classItem.docId,
                  className: classItem.name,
                  classCode: classItem.code,
                  subjectId: classItem.subjectId,
                  programId: classItem.programId,
                  instructorEmail: classItem.ownerEmail,
                  term: classItem.term,
                  day: day,
                  duration: schedule.duration
                }
              });
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    });

    return events;
  } catch (error) {
    logger.error('[ScheduleService] Error transforming schedules to calendar events:', error);
    return [];
  }
};
