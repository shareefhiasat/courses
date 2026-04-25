/**
 * Time Slot Business Service
 * 
 * PURPOSE: Business logic layer for time slot-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import timeSlotDbService from '../db/timeSlotDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'timeSlotBusinessService';

const getAllTimeSlots = async (params = {}) => {
  try {
    info(`${serviceName}:getAllTimeSlots`, { params });
    const result = await timeSlotDbService.getTimeSlots(params);
    
    return {
      success: result.success,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllTimeSlots:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load time slots',
      data: []
    };
  }
};

const getSchedulableTimeSlots = async (params) => {
  try {
    info(`${serviceName}:getSchedulableTimeSlots`, { params });
    
    if (!params.programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    const result = await timeSlotDbService.getSchedulableTimeSlots(params);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getSchedulableTimeSlots:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load schedulable time slots',
      data: []
    };
  }
};

const bulkInitDefaults = async (params) => {
  try {
    info(`${serviceName}:bulkInitDefaults`, { params });
    
    if (!params.programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    const result = await timeSlotDbService.bulkInitDefaults(params);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message || 'Default time slots initialized successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to initialize default time slots',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:bulkInitDefaults:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to initialize default time slots',
      data: null
    };
  }
};

const getTimeSlotsByProgram = async (programId) => {
  try {
    info(`${serviceName}:getTimeSlotsByProgram`, { programId });
    
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    const result = await timeSlotDbService.getTimeSlotsByProgram(programId);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getTimeSlotsByProgram:error`, { error: error.message, programId });
    return {
      success: false,
      error: error.message || 'Failed to load time slots',
      data: []
    };
  }
};

const getTimeSlotById = async (timeSlotId) => {
  try {
    info(`${serviceName}:getTimeSlotById`, { timeSlotId });
    
    if (!timeSlotId) {
      return {
        success: false,
        error: 'Time slot ID is required',
        data: null
      };
    }
    
    const result = await timeSlotDbService.getTimeSlotById(timeSlotId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getTimeSlotById:error`, { error: error.message, timeSlotId });
    return {
      success: false,
      error: error.message || 'Failed to load time slot',
      data: null
    };
  }
};

const createTimeSlot = async (timeSlotData, user = null) => {
  try {
    // Business rules validation
    const labelEn = timeSlotData.labelEn || timeSlotData.label;
    const startTime = timeSlotData.startTime;
    const endTime = timeSlotData.endTime;
    
    if (!labelEn || labelEn.trim() === '') {
      return {
        success: false,
        error: 'Time slot English label is required',
        data: null
      };
    }
    
    if (!timeSlotData.programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    if (!startTime || !endTime) {
      return {
        success: false,
        error: 'Start time and end time are required',
        data: null
      };
    }
    
    if (!timeSlotData.durationMinutes || timeSlotData.durationMinutes <= 0) {
      return {
        success: false,
        error: 'Duration must be greater than 0',
        data: null
      };
    }
    
    if (timeSlotData.sortOrder === undefined || timeSlotData.sortOrder === null) {
      return {
        success: false,
        error: 'Sort order is required',
        data: null
      };
    }
    
    const processedData = {
      ...timeSlotData,
      labelEn: labelEn.trim(),
      labelAr: (timeSlotData.labelAr || '').trim(),
      startTime,
      endTime,
      durationMinutes: timeSlotData.durationMinutes,
      sortOrder: timeSlotData.sortOrder,
      isBreak: timeSlotData.isBreak || false,
      breakType: timeSlotData.breakType || null,
      isActive: timeSlotData.isActive !== undefined ? timeSlotData.isActive : true
    };
    
    const result = await timeSlotDbService.createTimeSlot(processedData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Time slot created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create time slot',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createTimeSlot:error`, { error: error.message, data: timeSlotData });
    return {
      success: false,
      error: error.message || 'Failed to create time slot',
      data: null
    };
  }
};

const updateTimeSlot = async (timeSlotId, updateData, user = null) => {
  try {
    info(`${serviceName}:updateTimeSlot`, { timeSlotId, data: updateData });
    
    if (!timeSlotId) {
      return {
        success: false,
        error: 'Time slot ID is required',
        data: null
      };
    }
    
    const result = await timeSlotDbService.updateTimeSlot(timeSlotId, updateData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Time slot updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update time slot',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateTimeSlot:error`, { error: error.message, timeSlotId, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update time slot',
      data: null
    };
  }
};

const deleteTimeSlot = async (timeSlotId, user = null) => {
  try {
    info(`${serviceName}:deleteTimeSlot`, { timeSlotId });
    
    if (!timeSlotId) {
      return {
        success: false,
        error: 'Time slot ID is required',
        data: null
      };
    }
    
    const result = await timeSlotDbService.deleteTimeSlot(timeSlotId, user);
    
    if (result.success) {
      return {
        success: true,
        message: 'Time slot deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to delete time slot'
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteTimeSlot:error`, { error: error.message, timeSlotId });
    return {
      success: false,
      error: error.message || 'Failed to delete time slot'
    };
  }
};

export default {
  getAllTimeSlots,
  getSchedulableTimeSlots,
  bulkInitDefaults,
  getTimeSlotsByProgram,
  getTimeSlotById,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot
};
