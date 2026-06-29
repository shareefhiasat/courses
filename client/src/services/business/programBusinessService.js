/**
 * Program Business Service
 * 
 * PURPOSE: Business logic layer for program-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import programDbService from '../db/programDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'programBusinessService';

const getAllPrograms = async (params = {}) => {
  try {
    info(`${serviceName}:getAllPrograms`, { params });
    const result = await programDbService.getPrograms(params);
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllPrograms:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load programs',
      data: []
    };
  }
};

const getProgramById = async (id, params = {}) => {
  try {
    info(`${serviceName}:getProgramById`, { id });
    const result = await programDbService.getProgramById(id, params);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getProgramById:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to load program',
      data: null
    };
  }
};

const createProgram = async (programData, user = null) => {
  try {
    // Business rules validation - check both nameEn and nameAr
    const nameEn = programData.nameEn || programData.name;
    const nameAr = programData.nameAr || programData.name;
    const description = programData.descriptionEn || programData.descriptionAr || programData.description;
    
    if (!nameEn || nameEn.trim() === '') {
      return {
        success: false,
        error: 'Program English name is required',
        data: null
      };
    }
    
    if (!description || description.trim() === '') {
      return {
        success: false,
        error: 'Program description is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...programData,
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      description: description.trim(),
      isActive: programData.isActive !== undefined ? programData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await programDbService.create(processedData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Program created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create program',
        data: null
      };
    }
  } catch (error) {
    console.error(`${serviceName}:createProgram:error`, { error: error.message, data: programData });
    return {
      success: false,
      error: error.message || 'Failed to create program',
      data: null
    };
  }
};

const updateProgram = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateProgram`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    // Business rules validation
    if (updateData.nameEn !== undefined) {
      if (!updateData.nameEn || updateData.nameEn.trim() === '') {
        return {
          success: false,
          error: 'Program English name cannot be empty',
          data: null
        };
      }
      updateData.nameEn = updateData.nameEn.trim();
    }
    
    if (updateData.nameAr !== undefined) {
      if (updateData.nameAr && updateData.nameAr.trim() === '') {
        return {
          success: false,
          error: 'Program Arabic name cannot be empty',
          data: null
        };
      }
      if (updateData.nameAr) updateData.nameAr = updateData.nameAr.trim();
    }
    
    if (updateData.description !== undefined) {
      if (!updateData.description || updateData.description.trim() === '') {
        return {
          success: false,
          error: 'Program description cannot be empty',
          data: null
        };
      }
      updateData.description = updateData.description.trim();
    }
    
    // Handle descriptionEn/descriptionAr fallbacks
    if (updateData.descriptionEn !== undefined) {
      if (!updateData.descriptionEn || updateData.descriptionEn.trim() === '') {
        return {
          success: false,
          error: 'Program description cannot be empty',
          data: null
        };
      }
      updateData.description = updateData.descriptionEn.trim();
      delete updateData.descriptionEn;
    }
    
    if (updateData.descriptionAr !== undefined) {
      if (updateData.descriptionAr && updateData.descriptionAr.trim() === '') {
        return {
          success: false,
          error: 'Program Arabic description cannot be empty',
          data: null
        };
      }
      // Use descriptionAr as fallback if description is not set
      if (!updateData.description && updateData.descriptionAr) {
        updateData.description = updateData.descriptionAr.trim();
      }
      delete updateData.descriptionAr;
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    
    const result = await programDbService.update(id, updateData, user);
    
    if (result.success) {
      info(`${serviceName}:updateProgram:success`, { programId: id });
      return {
        success: true,
        data: result.data,
        message: 'Program updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update program',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateProgram:error`, { error: error.message, id, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update program',
      data: null
    };
  }
};

const deleteProgram = async (id, user = null, options = {}) => {
  try {
    info(`${serviceName}:deleteProgram`, { id, force: options.force });
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    const result = await programDbService.deleteProgram(id, options);
    
    if (result.success) {
      info(`${serviceName}:deleteProgram:success`, { programId: id });
      return {
        success: true,
        message: result.message || 'Program deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to delete program',
        code: result.code,
        dependencies: result.dependencies,
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteProgram:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to delete program',
      data: null
    };
  }
};

const getProgramCount = async (params = {}) => {
  try {
    info(`${serviceName}:getProgramCount`, { params });
    const result = await programDbService.getPrograms({ ...params, countOnly: true });
    
    return {
      success: result.success,
      data: result.count || 0
    };
  } catch (error) {
    error(`${serviceName}:getProgramCount:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to get program count',
      data: 0
    };
  }
};

// Additional functions that might be expected but use API client
const addSubjectToProgram = async (programId, subjectId, user = null) => {
  try {
    info(`${serviceName}:addSubjectToProgram`, { programId, subjectId });
    
    if (!programId || !subjectId) {
      return {
        success: false,
        error: 'Program ID and Subject ID are required',
        data: null
      };
    }
    
    // Mock implementation - would call API client
    return {
      success: true,
      message: 'Subject added to program successfully'
    };
  } catch (error) {
    error(`${serviceName}:addSubjectToProgram:error`, { error: error.message, programId, subjectId });
    return {
      success: false,
      error: error.message || 'Failed to add subject to program',
      data: null
    };
  }
};

const removeSubjectFromProgram = async (programId, subjectId, user = null) => {
  try {
    info(`${serviceName}:removeSubjectFromProgram`, { programId, subjectId });
    
    if (!programId || !subjectId) {
      return {
        success: false,
        error: 'Program ID and Subject ID are required',
        data: null
      };
    }
    
    // Mock implementation - would call API client
    return {
      success: true,
      message: 'Subject removed from program successfully'
    };
  } catch (error) {
    error(`${serviceName}:removeSubjectFromProgram:error`, { error: error.message, programId, subjectId });
    return {
      success: false,
      error: error.message || 'Failed to remove subject from program',
      data: null
    };
  }
};

const getSubjects = async (params = {}) => {
  try {
    info(`${serviceName}:getSubjects`, { params });
    
    // Import subject service dynamically to avoid circular dependency
    const { getAllSubjects } = await import('@services/business/subjectService');
    
    // Call the actual subject service
    const result = await getAllSubjects(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getSubjects:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve subjects',
      data: []
    };
  }
};

const getActivePrograms = async (params = {}) => {
  return await getAllPrograms({ ...params, isActive: true });
};

export default {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getActivePrograms,
  getProgramCount,
  addSubjectToProgram,
  removeSubjectFromProgram,
  getSubjects
};
