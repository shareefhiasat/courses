/**
 * Programs Business Service
 * 
 * PURPOSE: Business logic layer for program-related operations
 * ARCHITECTURE: Backend API → Business Services → DB Services → PostgreSQL
 */

import programDbService from '../db/programs-postgres.js';

const serviceName = 'programsBusinessService';

/**
 * Get all programs with filtering and pagination
 * 
 * @param {object} params - Query parameters
 * @returns {Promise<object>} - Result object with programs data
 */
const getAllPrograms = async (params = {}) => {
  try {
    console.log(`[${serviceName}] Getting all programs with params:`, params);
    
    const result = await programDbService.getPrograms(params);
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      pagination: result.pagination
    };
  } catch (error) {
    console.error(`[${serviceName}] Error getting all programs:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load programs',
      data: []
    };
  }
};

/**
 * Get program by ID
 * 
 * @param {string} id - Program ID
 * @param {object} params - Additional parameters
 * @returns {Promise<object>} - Result object with program data
 */
const getProgramById = async (id, params = {}) => {
  try {
    console.log(`[${serviceName}] Getting program by ID: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    const result = await programDbService.getProgramById(id, params);
    
    if (!result.success && result.error === 'Program not found') {
      return {
        success: false,
        error: 'Program not found',
        data: null
      };
    }
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    console.error(`[${serviceName}] Error getting program by ID:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load program',
      data: null
    };
  }
};

/**
 * Create new program
 * 
 * @param {object} programData - Program data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with created program
 */
const createProgram = async (programData, user = null) => {
  try {
    console.log(`[${serviceName}] Creating program:`, programData.nameEn || 'unnamed');
    
    // Business rules validation
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
    
    if (!programData.code || programData.code.trim() === '') {
      return {
        success: false,
        error: 'Program code is required',
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
      nameAr: nameAr ? nameAr.trim() : nameEn.trim(),
      description: description.trim(),
      isActive: programData.isActive !== undefined ? programData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await programDbService.create(processedData, user);
    
    if (result.success) {
      console.log(`[${serviceName}] Program created successfully: ${result.data.id}`);
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
    console.error(`[${serviceName}] Error creating program:`, error);
    return {
      success: false,
      error: error.message || 'Failed to create program',
      data: null
    };
  }
};

/**
 * Update program
 * 
 * @param {string} id - Program ID
 * @param {object} updateData - Update data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with updated program
 */
const updateProgram = async (id, updateData, user = null) => {
  try {
    console.log(`[${serviceName}] Updating program: ${id}`);
    
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
      console.log(`[${serviceName}] Program updated successfully: ${id}`);
      return {
        success: true,
        data: result.data,
        message: 'Program updated successfully'
      };
    } else if (result.error === 'Program not found') {
      return {
        success: false,
        error: 'Program not found',
        data: null
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update program',
        data: null
      };
    }
  } catch (error) {
    console.error(`[${serviceName}] Error updating program:`, error);
    return {
      success: false,
      error: error.message || 'Failed to update program',
      data: null
    };
  }
};

/**
 * Delete program (soft delete)
 * 
 * @param {string} id - Program ID
 * @returns {Promise<object>} - Result object
 */
const deleteProgram = async (id) => {
  try {
    console.log(`[${serviceName}] Deleting program: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    // Business rule: Check if program has active enrollments
    // In real implementation, you would check for active enrollments here
    // For now, proceed with soft delete
    
    const result = await programDbService.deleteProgram(id);
    
    if (result.success) {
      console.log(`[${serviceName}] Program deleted successfully: ${id}`);
      return result;
    } else {
      console.error(`[${serviceName}] Failed to delete program: ${id}`, result.error);
      return result;
    }
  } catch (error) {
    console.error(`[${serviceName}] Error deleting program:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete program',
      data: null
    };
  }
};

/**
 * Hard delete program
 * 
 * @param {string} id - Program ID
 * @returns {Promise<object>} - Result object
 */
const hardDeleteProgram = async (id) => {
  try {
    console.log(`[${serviceName}] Hard deleting program: ${id}`);
    
    if (!id) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    // Check for active enrollments or dependencies
    // In real implementation, you would check for active enrollments here
    // For now, proceed with hard delete
    
    const result = await programDbService.hardDeleteProgram(id);
    
    if (result.success) {
      console.log(`[${serviceName}] Program hard deleted successfully: ${id}`);
      return result;
    } else {
      console.error(`[${serviceName}] Failed to hard delete program: ${id}`, result.error);
      return result;
    }
  } catch (error) {
    console.error(`[${serviceName}] Error hard deleting program:`, error);
    return {
      success: false,
      error: error.message || 'Failed to hard delete program',
      data: null
    };
  }
};

export default {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  hardDeleteProgram
};
