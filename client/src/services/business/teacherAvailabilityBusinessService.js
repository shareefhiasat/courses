/**
 * Teacher Availability Business Service
 * 
 * PURPOSE: Business logic layer for teacher availability-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import teacherAvailabilityDbService from '../db/teacherAvailabilityDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'teacherAvailabilityBusinessService';

const getAllTeacherAvailabilities = async (params = {}) => {
  try {
    info(`${serviceName}:getAllTeacherAvailabilities`, { params });
    const result = await teacherAvailabilityDbService.getTeacherAvailabilities(params);
    
    return {
      success: result.success,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllTeacherAvailabilities:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load teacher availabilities',
      data: []
    };
  }
};

const getAvailableTeachers = async (params) => {
  try {
    info(`${serviceName}:getAvailableTeachers`, { params });
    
    if (!params.date || !params.timeSlotId) {
      return {
        success: false,
        error: 'Date and timeSlotId are required',
        data: []
      };
    }
    
    const result = await teacherAvailabilityDbService.getAvailableTeachers(params);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getAvailableTeachers:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load available teachers',
      data: []
    };
  }
};

const getTeacherAvailabilityByUserId = async (userId) => {
  try {
    info(`${serviceName}:getTeacherAvailabilityByUserId`, { userId });
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    const result = await teacherAvailabilityDbService.getTeacherAvailabilityByUserId(userId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getTeacherAvailabilityByUserId:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to load teacher availability',
      data: null
    };
  }
};

const getTeacherAvailabilityById = async (availabilityId) => {
  try {
    info(`${serviceName}:getTeacherAvailabilityById`, { availabilityId });
    
    if (!availabilityId) {
      return {
        success: false,
        error: 'Availability ID is required',
        data: null
      };
    }
    
    const result = await teacherAvailabilityDbService.getTeacherAvailabilityById(availabilityId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getTeacherAvailabilityById:error`, { error: error.message, availabilityId });
    return {
      success: false,
      error: error.message || 'Failed to load teacher availability',
      data: null
    };
  }
};

const createTeacherAvailability = async (availabilityData, user = null) => {
  try {
    // Business rules validation
    const userId = availabilityData.userId;
    const availableDays = availabilityData.availableDays;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    if (!availableDays || !Array.isArray(availableDays) || availableDays.length === 0) {
      return {
        success: false,
        error: 'Available days must be a non-empty array',
        data: null
      };
    }
    
    const validDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const invalidDays = availableDays.filter(day => !validDays.includes(day));
    if (invalidDays.length > 0) {
      return {
        success: false,
        error: `Invalid day names: ${invalidDays.join(', ')}`,
        data: null
      };
    }
    
    if (availabilityData.maxSessionsPerDay && availabilityData.maxSessionsPerDay <= 0) {
      return {
        success: false,
        error: 'Max sessions per day must be greater than 0',
        data: null
      };
    }
    
    const processedData = {
      ...availabilityData,
      userId,
      availableDays,
      maxSessionsPerDay: availabilityData.maxSessionsPerDay || 3,
      status: availabilityData.status || 'Active',
      contactPhone: availabilityData.contactPhone || null,
      contactEmail: availabilityData.contactEmail || null,
      notes: availabilityData.notes || null,
      isActive: availabilityData.isActive !== undefined ? availabilityData.isActive : true
    };
    
    const result = await teacherAvailabilityDbService.createTeacherAvailability(processedData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Teacher availability created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create teacher availability',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createTeacherAvailability:error`, { error: error.message, data: availabilityData });
    return {
      success: false,
      error: error.message || 'Failed to create teacher availability',
      data: null
    };
  }
};

const updateTeacherAvailability = async (availabilityId, updateData, user = null) => {
  try {
    info(`${serviceName}:updateTeacherAvailability`, { availabilityId, data: updateData });
    
    if (!availabilityId) {
      return {
        success: false,
        error: 'Availability ID is required',
        data: null
      };
    }
    
    // Validate availableDays if provided
    if (updateData.availableDays) {
      const validDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const invalidDays = updateData.availableDays.filter(day => !validDays.includes(day));
      if (invalidDays.length > 0) {
        return {
          success: false,
          error: `Invalid day names: ${invalidDays.join(', ')}`,
          data: null
        };
      }
    }
    
    // Validate maxSessionsPerDay if provided
    if (updateData.maxSessionsPerDay && updateData.maxSessionsPerDay <= 0) {
      return {
        success: false,
        error: 'Max sessions per day must be greater than 0',
        data: null
      };
    }
    
    const result = await teacherAvailabilityDbService.updateTeacherAvailability(availabilityId, updateData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Teacher availability updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update teacher availability',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateTeacherAvailability:error`, { error: error.message, availabilityId, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update teacher availability',
      data: null
    };
  }
};

const deleteTeacherAvailability = async (availabilityId, user = null) => {
  try {
    info(`${serviceName}:deleteTeacherAvailability`, { availabilityId });
    
    if (!availabilityId) {
      return {
        success: false,
        error: 'Availability ID is required',
        data: null
      };
    }
    
    const result = await teacherAvailabilityDbService.deleteTeacherAvailability(availabilityId, user);
    
    if (result.success) {
      return {
        success: true,
        message: 'Teacher availability deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to delete teacher availability'
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteTeacherAvailability:error`, { error: error.message, availabilityId });
    return {
      success: false,
      error: error.message || 'Failed to delete teacher availability'
    };
  }
};

export default {
  getAllTeacherAvailabilities,
  getAvailableTeachers,
  getTeacherAvailabilityByUserId,
  getTeacherAvailabilityById,
  createTeacherAvailability,
  updateTeacherAvailability,
  deleteTeacherAvailability
};
