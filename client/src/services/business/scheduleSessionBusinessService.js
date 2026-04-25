/**
 * Schedule Session Business Service
 * 
 * PURPOSE: Business logic layer for schedule session-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import scheduleSessionDbService from '../db/scheduleSessionDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'scheduleSessionBusinessService';

const getAllScheduleSessions = async (params = {}) => {
  try {
    info(`${serviceName}:getAllScheduleSessions`, { params });
    const result = await scheduleSessionDbService.getScheduleSessions(params);
    
    return {
      success: result.success,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllScheduleSessions:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load schedule sessions',
      data: []
    };
  }
};

const getScheduleSessionsByRange = async (params) => {
  try {
    info(`${serviceName}:getScheduleSessionsByRange`, { params });
    
    if (!params.dateFrom || !params.dateTo) {
      return {
        success: false,
        error: 'Date from and date to are required',
        data: []
      };
    }
    
    const result = await scheduleSessionDbService.getScheduleSessionsByRange(params);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getScheduleSessionsByRange:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load schedule sessions',
      data: []
    };
  }
};

const getScheduleSessionById = async (sessionId) => {
  try {
    info(`${serviceName}:getScheduleSessionById`, { sessionId });
    
    if (!sessionId) {
      return {
        success: false,
        error: 'Schedule session ID is required',
        data: null
      };
    }
    
    const result = await scheduleSessionDbService.getScheduleSessionById(sessionId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getScheduleSessionById:error`, { error: error.message, sessionId });
    return {
      success: false,
      error: error.message || 'Failed to load schedule session',
      data: null
    };
  }
};

const checkConflicts = async (params) => {
  try {
    info(`${serviceName}:checkConflicts`, { params });
    
    if (!params.instructorUserId || !params.date || !params.timeSlotId) {
      return {
        success: false,
        error: 'Instructor user ID, date, and time slot ID are required',
        hasConflicts: false,
        conflicts: []
      };
    }
    
    const result = await scheduleSessionDbService.checkConflicts(params);
    
    return {
      success: result.success,
      hasConflicts: result.hasConflicts || false,
      conflicts: result.conflicts || [],
      canSchedule: result.canSchedule || true,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:checkConflicts:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to check conflicts',
      hasConflicts: false,
      conflicts: []
    };
  }
};

const createScheduleSession = async (sessionData, user = null) => {
  try {
    // Business rules validation
    const { classId, subjectId, instructorUserId, timeSlotId, date } = sessionData;
    
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    if (!instructorUserId) {
      return {
        success: false,
        error: 'Instructor user ID is required',
        data: null
      };
    }
    
    if (!timeSlotId) {
      return {
        success: false,
        error: 'Time slot ID is required',
        data: null
      };
    }
    
    if (!date) {
      return {
        success: false,
        error: 'Date is required',
        data: null
      };
    }
    
    const processedData = {
      ...sessionData,
      date: new Date(date),
      notes: sessionData.notes || null,
      isCancelled: false,
      isActive: sessionData.isActive !== undefined ? sessionData.isActive : true,
      classroomId: sessionData.classroomId || null
    };
    
    const result = await scheduleSessionDbService.createScheduleSession(processedData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Schedule session created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create schedule session',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createScheduleSession:error`, { error: error.message, data: sessionData });
    return {
      success: false,
      error: error.message || 'Failed to create schedule session',
      data: null
    };
  }
};

const updateScheduleSession = async (sessionId, updateData, user = null) => {
  try {
    info(`${serviceName}:updateScheduleSession`, { sessionId, data: updateData });
    
    if (!sessionId) {
      return {
        success: false,
        error: 'Schedule session ID is required',
        data: null
      };
    }
    
    // Convert date to Date object if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    const result = await scheduleSessionDbService.updateScheduleSession(sessionId, updateData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Schedule session updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update schedule session',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateScheduleSession:error`, { error: error.message, sessionId, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update schedule session',
      data: null
    };
  }
};

const cancelScheduleSession = async (sessionId, cancelReason = '', user = null) => {
  try {
    info(`${serviceName}:cancelScheduleSession`, { sessionId, cancelReason });
    
    if (!sessionId) {
      return {
        success: false,
        error: 'Schedule session ID is required',
        data: null
      };
    }
    
    const result = await scheduleSessionDbService.cancelScheduleSession(sessionId, cancelReason, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Schedule session cancelled successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to cancel schedule session',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:cancelScheduleSession:error`, { error: error.message, sessionId });
    return {
      success: false,
      error: error.message || 'Failed to cancel schedule session',
      data: null
    };
  }
};

const deleteScheduleSession = async (sessionId, user = null) => {
  try {
    info(`${serviceName}:deleteScheduleSession`, { sessionId });
    
    if (!sessionId) {
      return {
        success: false,
        error: 'Schedule session ID is required',
        data: null
      };
    }
    
    const result = await scheduleSessionDbService.deleteScheduleSession(sessionId, user);
    
    if (result.success) {
      return {
        success: true,
        message: 'Schedule session deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to delete schedule session'
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteScheduleSession:error`, { error: error.message, sessionId });
    return {
      success: false,
      error: error.message || 'Failed to delete schedule session'
    };
  }
};

const bulkCreateScheduleSessions = async (sessions, user = null) => {
  try {
    info(`${serviceName}:bulkCreateScheduleSessions`, { count: sessions.length });
    
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return {
        success: false,
        error: 'Sessions array is required and must not be empty',
        data: null
      };
    }
    
    // Validate each session
    for (const session of sessions) {
      if (!session.classId || !session.subjectId || !session.instructorUserId || !session.timeSlotId || !session.date) {
        return {
          success: false,
          error: 'All sessions must have classId, subjectId, instructorUserId, timeSlotId, and date',
          data: null
        };
      }
      
      // Convert date to Date object
      session.date = new Date(session.date);
    }
    
    const result = await scheduleSessionDbService.bulkCreateScheduleSessions(sessions, user);
    
    if (result.success) {
      return {
        success: true,
        count: result.count,
        message: result.message || 'Schedule sessions created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create schedule sessions',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:bulkCreateScheduleSessions:error`, { error: error.message, count: sessions?.length });
    return {
      success: false,
      error: error.message || 'Failed to create schedule sessions',
      data: null
    };
  }
};

export default {
  getAllScheduleSessions,
  getScheduleSessionsByRange,
  getScheduleSessionById,
  checkConflicts,
  createScheduleSession,
  updateScheduleSession,
  cancelScheduleSession,
  deleteScheduleSession,
  bulkCreateScheduleSessions
};
