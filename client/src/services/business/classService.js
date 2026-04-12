import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'classService';

// Import business service (named imports from CommonJS)
import { 
  getAllClasses as getAllClassesBusiness,
  getClassById as getClassByIdBusiness,
  createClass as createClassBusiness,
  updateClass as updateClassBusiness,
  deleteClass as deleteClassBusiness
} from './classBusinessService.js';

// Core class operations
export const getAllClasses = async (params = {}) => {
  try {
    info(`${serviceName}:getAllClasses`, { params });
    
    // Use business service layer
    const result = await getAllClassesBusiness(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllClasses:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load classes',
      data: []
    };
  }
};

export const getClassById = async (id, params = {}) => {
  try {
    info(`${serviceName}:getClassById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    const result = await getClassByIdBusiness(id, params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getClassById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to load class',
      data: null
    };
  }
};

export const createClass = async (classData, user = null) => {
  try {
    info(`${serviceName}:createClass`, { data: classData });
    
    const result = await createClassBusiness(classData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createClass:error`, { error: err.message, data: classData });
    return {
      success: false,
      error: err.message || 'Failed to create class',
      data: null
    };
  }
};

export const updateClass = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateClass`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    const result = await updateClassBusiness(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateClass:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update class',
      data: null
    };
  }
};

// Aliases for commonly expected function names
export const getClass = getClassById;
export const fetchClass = getClassById;
export const addClass = createClass;

export const deleteClass = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteClass`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    const result = await deleteClassBusiness(id, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteClass:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete class',
      data: null
    };
  }
};

// Query functions
export const getClassesByProgram = async (programId, params = {}) => {
  try {
    info(`${serviceName}:getClassesByProgram`, { programId, params });
    
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    // For now, use getAllClasses with filter
    const result = await classBusinessService.getAllClasses({ ...params, programId });
    return result;
  } catch (err) {
    console.error(`${serviceName}:getClassesByProgram:error`, { error: err.message, programId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve program classes',
      data: []
    };
  }
};

export const getClassesByInstructor = async (instructorId, params = {}) => {
  try {
    info(`${serviceName}:getClassesByInstructor`, { instructorId, params });
    
    if (!instructorId) {
      return {
        success: false,
        error: 'Instructor ID is required',
        data: []
      };
    }
    
    // For now, use getAllClasses with filter
    const result = await classBusinessService.getAllClasses({ ...params, instructorId });
    return result;
  } catch (err) {
    console.error(`${serviceName}:getClassesByInstructor:error`, { error: err.message, instructorId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve instructor classes',
      data: []
    };
  }
};

export const getActiveClasses = async (params = {}) => {
  try {
    info(`${serviceName}:getActiveClasses`, { params });
    
    // Use getAllClasses with active filter
    const result = await classBusinessService.getAllClasses({ ...params, isActive: true });
    return result;
  } catch (err) {
    console.error(`${serviceName}:getActiveClasses:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve active classes',
      data: []
    };
  }
};

// Update class schedule
export const updateClassSchedule = async (classId, scheduleData, user = null) => {
  try {
    info(`${serviceName}:updateClassSchedule`, { classId, scheduleData });
    
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    // Update the class with schedule information
    const result = await updateClass(classId, {
      schedule: scheduleData,
      updatedAt: new Date()
    }, user);
    
    if (result.success) {
      info(`${serviceName}:updateClassSchedule:success`, { classId });
      return {
        success: true,
        data: result.data,
        message: 'Class schedule updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update class schedule',
        data: null
      };
    }
  } catch (error) {
    console.error(`${serviceName}:updateClassSchedule:error`, { error: error.message, classId });
    return {
      success: false,
      error: error.message || 'Failed to update class schedule',
      data: null
    };
  }
};

// Aliases for commonly expected function names
export const getClasses = getAllClasses;

// Default export
export default {
  // Core functions
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  
  // Query functions
  getClassesByProgram,
  getClassesByInstructor,
  getActiveClasses,
  
  // Aliases
  getClasses
};
