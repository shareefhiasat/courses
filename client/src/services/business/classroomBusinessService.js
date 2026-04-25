/**
 * Classroom Business Service
 * 
 * PURPOSE: Business logic layer for classroom-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import classroomDbService from '../db/classroomDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'classroomBusinessService';

const getAllClassrooms = async (params = {}) => {
  try {
    info(`${serviceName}:getAllClassrooms`, { params });
    const result = await classroomDbService.getClassrooms(params);
    
    return {
      success: result.success,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllClassrooms:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load classrooms',
      data: []
    };
  }
};

const getAvailableClassrooms = async (params) => {
  try {
    info(`${serviceName}:getAvailableClassrooms`, { params });
    
    if (!params.date || !params.timeSlotId) {
      return {
        success: false,
        error: 'Date and timeSlotId are required',
        data: []
      };
    }
    
    const result = await classroomDbService.getAvailableClassrooms(params);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getAvailableClassrooms:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load available classrooms',
      data: []
    };
  }
};

const getClassroomsByProgram = async (programId) => {
  try {
    info(`${serviceName}:getClassroomsByProgram`, { programId });
    
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    const result = await classroomDbService.getClassroomsByProgram(programId);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getClassroomsByProgram:error`, { error: error.message, programId });
    return {
      success: false,
      error: error.message || 'Failed to load classrooms',
      data: []
    };
  }
};

const getClassroomById = async (classroomId) => {
  try {
    info(`${serviceName}:getClassroomById`, { classroomId });
    
    if (!classroomId) {
      return {
        success: false,
        error: 'Classroom ID is required',
        data: null
      };
    }
    
    const result = await classroomDbService.getClassroomById(classroomId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getClassroomById:error`, { error: error.message, classroomId });
    return {
      success: false,
      error: error.message || 'Failed to load classroom',
      data: null
    };
  }
};

const createClassroom = async (classroomData, user = null) => {
  try {
    // Business rules validation
    const nameEn = classroomData.nameEn || classroomData.name;
    const code = classroomData.code;
    
    if (!code || code.trim() === '') {
      return {
        success: false,
        error: 'Classroom code is required',
        data: null
      };
    }
    
    if (!nameEn || nameEn.trim() === '') {
      return {
        success: false,
        error: 'Classroom English name is required',
        data: null
      };
    }
    
    if (!classroomData.programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    if (!classroomData.capacity || classroomData.capacity <= 0) {
      return {
        success: false,
        error: 'Capacity must be greater than 0',
        data: null
      };
    }
    
    const processedData = {
      ...classroomData,
      code: code.trim(),
      nameEn: nameEn.trim(),
      nameAr: (classroomData.nameAr || '').trim(),
      locationEn: (classroomData.locationEn || '').trim(),
      locationAr: (classroomData.locationAr || '').trim(),
      equipment: classroomData.equipment || [],
      availableDays: classroomData.availableDays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      status: classroomData.status || 'Available',
      isActive: classroomData.isActive !== undefined ? classroomData.isActive : true
    };
    
    const result = await classroomDbService.createClassroom(processedData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Classroom created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create classroom',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createClassroom:error`, { error: error.message, data: classroomData });
    return {
      success: false,
      error: error.message || 'Failed to create classroom',
      data: null
    };
  }
};

const updateClassroom = async (classroomId, updateData, user = null) => {
  try {
    info(`${serviceName}:updateClassroom`, { classroomId, data: updateData });
    
    if (!classroomId) {
      return {
        success: false,
        error: 'Classroom ID is required',
        data: null
      };
    }
    
    const result = await classroomDbService.updateClassroom(classroomId, updateData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Classroom updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update classroom',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateClassroom:error`, { error: error.message, classroomId, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update classroom',
      data: null
    };
  }
};

const deleteClassroom = async (classroomId, user = null) => {
  try {
    info(`${serviceName}:deleteClassroom`, { classroomId });
    
    if (!classroomId) {
      return {
        success: false,
        error: 'Classroom ID is required',
        data: null
      };
    }
    
    const result = await classroomDbService.deleteClassroom(classroomId, user);
    
    if (result.success) {
      return {
        success: true,
        message: 'Classroom deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to delete classroom'
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteClassroom:error`, { error: error.message, classroomId });
    return {
      success: false,
      error: error.message || 'Failed to delete classroom'
    };
  }
};

export default {
  getAllClassrooms,
  getAvailableClassrooms,
  getClassroomsByProgram,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom
};
