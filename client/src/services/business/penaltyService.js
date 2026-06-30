import penaltyDbService from '../db/penaltyDbService-postgres.js';
import api from '@services/api/index.js';
import { info, error } from '../utils/logger.js';

const serviceName = 'penaltyService';

export const getPenalties = async (params = {}) => {
  try {
    info(`${serviceName}:getPenalties`, { params });
    const result = await penaltyDbService.getAll(params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Penalties retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getPenalties:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve penalties',
      data: []
    };
  }
};

export const getPenaltiesByStudent = async (studentId, params = {}) => {
  try {
    info(`${serviceName}:getPenaltiesByStudent`, { studentId, params });
    const result = await penaltyDbService.getByStudent(studentId, params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Student penalties retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getPenaltiesByStudent:error`, { error: err.message, studentId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve student penalties',
      data: []
    };
  }
};

export const createPenalty = async (penaltyData) => {
  try {
    info(`${serviceName}:createPenalty`, { penaltyData });
    const payload = { ...penaltyData };

    // Backend expects userId, not studentId
    if (payload.studentId && !payload.userId) {
      payload.userId = payload.studentId;
      delete payload.studentId;
    }
    
    // Convert 'type' to 'typeId' if necessary
    if (payload.type !== undefined) {
      if (typeof payload.type === 'number') {
        payload.typeId = payload.type;
      } else {
        console.warn('⚠️ [DEBUG] Legacy string type mapping in penaltyService:', payload.type);
        payload.typeId = 1;
      }
      delete payload.type;
    }
    
    // Ensure points are numerically evaluated
    if (payload.points !== undefined) {
      payload.points = Number(payload.points);
    }

    // Map reason/description to descriptionEn (required by Prisma schema)
    const descText = payload.reason || payload.description || '';
    payload.descriptionEn = descText;
    payload.descriptionAr = descText;
    delete payload.reason;
    delete payload.description;

    // Ensure integer IDs
    if (payload.userId) payload.userId = parseInt(payload.userId);
    if (payload.classId) payload.classId = parseInt(payload.classId);
    if (payload.subjectId) payload.subjectId = parseInt(payload.subjectId);
    if (payload.programId) payload.programId = parseInt(payload.programId);
    if (payload.typeId) payload.typeId = parseInt(payload.typeId);
    
    const result = await penaltyDbService.create(payload);
    api.clearCacheByPrefix('/penalties');
    return {
      success: result.success,
      data: result.data,
      message: result.success ? 'Penalty created successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:createPenalty:error`, { error: err.message, penaltyData });
    return {
      success: false,
      error: err.message || 'Failed to create penalty',
      data: null
    };
  }
};

export const deletePenalty = async (penaltyId) => {
  try {
    info(`${serviceName}:deletePenalty`, { penaltyId });
    const result = await penaltyDbService.delete(penaltyId);
    api.clearCacheByPrefix('/penalties');
    return {
      success: result.success,
      data: result.data,
      message: result.success ? 'Penalty deleted successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:deletePenalty:error`, { error: err.message, penaltyId });
    return {
      success: false,
      error: err.message || 'Failed to delete penalty',
      data: null
    };
  }
};

export const updatePenalty = async (penaltyId, penaltyData) => {
  try {
    info(`${serviceName}:updatePenalty`, { penaltyId, penaltyData });
    const result = await penaltyDbService.update(penaltyId, penaltyData);
    api.clearCacheByPrefix('/penalties');
    return {
      success: result.success,
      data: result.data,
      message: result.success ? 'Penalty updated successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:updatePenalty:error`, { error: err.message, penaltyId, penaltyData });
    return {
      success: false,
      error: err.message || 'Failed to update penalty',
      data: null
    };
  }
};

export const getPenaltiesByClassAndDate = async (classId, date) => {
  try {
    info(`${serviceName}:getPenaltiesByClassAndDate`, { classId, date });
    
    if (!classId || !date) {
      return {
        success: false,
        error: 'Class ID and date are required',
        data: []
      };
    }
    
    // Mock implementation - in production this would query the database
    const result = await penaltyDbService.getAll({
      classId,
      date,
      limit: 100
    });
    
    return {
      success: true,
      data: result.data || [],
      message: 'Class penalties for date retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getPenaltiesByClassAndDate:error`, { error: error.message, classId, date });
    return {
      success: false,
      error: error.message || 'Failed to retrieve class penalties for date',
      data: []
    };
  }
};

export default {
  getPenalties,
  getPenaltiesByStudent,
  createPenalty,
  updatePenalty,
  deletePenalty,
  getPenaltiesByClassAndDate
};
