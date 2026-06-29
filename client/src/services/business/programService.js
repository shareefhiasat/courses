import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'programService';

// Import business service instead of DB service
import programBusinessService from './programBusinessService.js';

// Core program operations
export const getAllPrograms = async (params = {}) => {
  try {
    info(`${serviceName}:getAllPrograms`, { params });
    
    // Use business service layer
    const result = await programBusinessService.getAllPrograms(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllPrograms:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load programs',
      data: []
    };
  }
};

export const getProgramById = async (id, params = {}) => {
  try {
    info(`${serviceName}:getProgramById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    // Use business service layer
    const result = await programBusinessService.getProgramById(id, params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getProgramById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve program',
      data: null
    };
  }
};

export const createProgram = async (programData, user = null) => {
  try {
    // Use business service layer
    const result = await programBusinessService.createProgram(programData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createProgram:error`, { error: err.message, data: programData });
    return {
      success: false,
      error: err.message || 'Failed to create program',
      data: null
    };
  }
};
export const updateProgram = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateProgram`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    // Use business service layer
    const result = await programBusinessService.updateProgram(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateProgram:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update program',
      data: null
    };
  }
};

export const deleteProgram = async (id, user = null, options = {}) => {
  try {
    info(`${serviceName}:deleteProgram`, { id, force: options.force });
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    // Use business service layer
    const result = await programBusinessService.deleteProgram(id, options);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteProgram:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete program',
      data: null
    };
  }
};

// Query functions
export const getActivePrograms = async (params = {}) => {
  try {
    info(`${serviceName}:getActivePrograms`, { params });
    
    // Use business service layer
    const result = await programBusinessService.getActivePrograms(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getActivePrograms:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve active programs',
      data: []
    };
  }
};

export const getProgramCount = async (params = {}) => {
  try {
    info(`${serviceName}:getProgramCount`, { params });
    
    // Use business service layer
    const result = await programBusinessService.getProgramCount(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getProgramCount:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to get program count',
      data: 0
    };
  }
};

// Subject management functions
export const addSubjectToProgram = async (programId, subjectId, user = null) => {
  try {
    info(`${serviceName}:addSubjectToProgram`, { programId, subjectId });
    
    if (!programId || !subjectId) {
      return {
        success: false,
        error: 'Program ID and Subject ID are required',
        data: null
      };
    }
    
    // Use business service layer
    const result = await programBusinessService.addSubjectToProgram(programId, subjectId, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:addSubjectToProgram:error`, { error: err.message, programId, subjectId });
    return {
      success: false,
      error: err.message || 'Failed to add subject to program',
      data: null
    };
  }
};

export const removeSubjectFromProgram = async (programId, subjectId, user = null) => {
  try {
    info(`${serviceName}:removeSubjectFromProgram`, { programId, subjectId });
    
    if (!programId || !subjectId) {
      return {
        success: false,
        error: 'Program ID and Subject ID are required',
        data: null
      };
    }
    
    // Use business service layer
    const result = await programBusinessService.removeSubjectFromProgram(programId, subjectId, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:removeSubjectFromProgram:error`, { error: err.message, programId, subjectId });
    return {
      success: false,
      error: err.message || 'Failed to remove subject from program',
      data: null
    };
  }
};

// Add getSubjects function for NotificationDrawer.jsx
export const getSubjects = async (params = {}) => {
  try {
    info(`${serviceName}:getSubjects`, { params });
    
    // Use business service layer
    const result = await programBusinessService.getSubjects(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getSubjects:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve subjects',
      data: []
    };
  }
};

// Add getSubject function
export const getSubject = async (id, params = {}) => {
  try {
    info(`${serviceName}:getSubject`, { id });
    
    // Import subject service dynamically to avoid circular dependency
    const { getSubjectById } = await import('@services/business/subjectService');
    const result = await getSubjectById(id, params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getSubject:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve subject',
      data: null
    };
  }
};

// Aliases for commonly expected function names
export const getPrograms = getAllPrograms;
export const getProgram = getProgramById;
export const fetchProgram = getProgramById;
export const fetchSubject = getSubject;
export const addProgram = createProgram;
export const updateProgramData = updateProgram;
export const removeProgram = deleteProgram;

export default {
  // Core functions
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  
  // Query functions
  getActivePrograms,
  getProgramCount,
  
  // Subject management
  addSubjectToProgram,
  removeSubjectFromProgram,
  getSubjects,
  getSubject,
  
  // Aliases
  getPrograms,
  getProgram,
  fetchProgram,
  fetchSubject,
  addProgram,
  updateProgramData,
  removeProgram
};
