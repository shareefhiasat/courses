/**
 * Classroom Availability Business Service
 * 
 * PURPOSE: Business logic layer for classroom availability operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import classroomAvailabilityDbService from '../db/classroomAvailabilityDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'classroomAvailabilityBusinessService';

const getAllClassroomAvailabilities = async (params = {}) => {
  try {
    info(`${serviceName}:getAllClassroomAvailabilities`, { params });
    const result = await classroomAvailabilityDbService.getClassroomAvailabilities(params);
    
    return {
      success: result.success,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllClassroomAvailabilities:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load classroom availabilities',
      data: []
    };
  }
};

const createClassroomAvailability = async (data) => {
  try {
    info(`${serviceName}:createClassroomAvailability`, { data });
    
    // Validate required fields
    if (!data.classroomId) {
      return {
        success: false,
        error: 'Classroom is required',
        data: null
      };
    }
    
    if (!data.slots || !Array.isArray(data.slots) || data.slots.length === 0) {
      return {
        success: false,
        error: 'At least one time slot is required',
        data: null
      };
    }
    
    // Validate each slot
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (let i = 0; i < data.slots.length; i++) {
      const slot = data.slots[i];
      
      if (!slot.startTime || !slot.endTime) {
        return {
          success: false,
          error: `Slot ${i + 1}: Start time and end time are required`,
          data: null
        };
      }
      
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return {
          success: false,
          error: `Slot ${i + 1}: Time must be in HH:mm format (e.g., 09:00)`,
          data: null
        };
      }
      
      const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
      const endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
      
      if (endMinutes <= startMinutes) {
        return {
          success: false,
          error: `Slot ${i + 1}: End time must be after start time`,
          data: null
        };
      }
      
      // Check for duplicate slots
      for (let j = i + 1; j < data.slots.length; j++) {
        const otherSlot = data.slots[j];
        if (slot.startTime === otherSlot.startTime && slot.endTime === otherSlot.endTime) {
          return {
            success: false,
            error: `Duplicate slot detected: ${slot.startTime}-${slot.endTime}`,
            data: null
          };
        }
      }
    }
    
    const result = await classroomAvailabilityDbService.createClassroomAvailability(data);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:createClassroomAvailability:error`, { error: error.message, data });
    return {
      success: false,
      error: error.message || 'Failed to create classroom availability',
      data: null
    };
  }
};

const updateClassroomAvailability = async (id, data) => {
  try {
    info(`${serviceName}:updateClassroomAvailability`, { id, data });
    
    if (!id) {
      return {
        success: false,
        error: 'Availability ID is required',
        data: null
      };
    }
    
    // Validate slots if provided
    if (data.slots && Array.isArray(data.slots)) {
      if (data.slots.length === 0) {
        return {
          success: false,
          error: 'At least one time slot is required',
          data: null
        };
      }
      
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (let i = 0; i < data.slots.length; i++) {
        const slot = data.slots[i];
        
        if (slot.startTime && !timeRegex.test(slot.startTime)) {
          return {
            success: false,
            error: `Slot ${i + 1}: Start time must be in HH:mm format (e.g., 09:00)`,
            data: null
          };
        }
        
        if (slot.endTime && !timeRegex.test(slot.endTime)) {
          return {
            success: false,
            error: `Slot ${i + 1}: End time must be in HH:mm format (e.g., 09:00)`,
            data: null
          };
        }
        
        // Validate end time is after start time if both provided
        if (slot.startTime && slot.endTime) {
          const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
          const endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
          
          if (endMinutes <= startMinutes) {
            return {
              success: false,
              error: `Slot ${i + 1}: End time must be after start time`,
              data: null
            };
          }
        }
      }
    }
    
    const result = await classroomAvailabilityDbService.updateClassroomAvailability(id, data);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:updateClassroomAvailability:error`, { error: error.message, id, data });
    return {
      success: false,
      error: error.message || 'Failed to update classroom availability',
      data: null
    };
  }
};

const deleteClassroomAvailability = async (id) => {
  try {
    info(`${serviceName}:deleteClassroomAvailability`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Availability ID is required',
        data: null
      };
    }
    
    const result = await classroomAvailabilityDbService.deleteClassroomAvailability(id);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:deleteClassroomAvailability:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to delete classroom availability',
      data: null
    };
  }
};

export default {
  getAllClassroomAvailabilities,
  createClassroomAvailability,
  updateClassroomAvailability,
  deleteClassroomAvailability
};
