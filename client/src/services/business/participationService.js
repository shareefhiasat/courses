import participationDbService from '../db/participationDbService-postgres.js';
import { info, error } from '../utils/logger.js';

const serviceName = 'participationService';

export const getParticipations = async (params = {}) => {
  try {
    info(`${serviceName}:getParticipations`, { params });
    const result = await participationDbService.getAll(params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Participations retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getParticipations:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve participations',
      data: []
    };
  }
};

export const getParticipationsByStudent = async (studentId, params = {}) => {
  try {
    info(`${serviceName}:getParticipationsByStudent`, { studentId, params });
    const result = await participationDbService.getByStudent(studentId, params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Student participations retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getParticipationsByStudent:error`, { error: err.message, studentId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve student participations',
      data: []
    };
  }
};

export const createParticipation = async (participationData) => {
  try {
    info(`${serviceName}:createParticipation`, { participationData });
    
    console.log('🔍 [DEBUG] Original participation data:', participationData);
    
    // Check for typeId natively mapped from component useLookupTypes
    let processedData = { ...participationData };

    // Backend expects userId, not studentId
    if (processedData.studentId && !processedData.userId) {
      processedData.userId = processedData.studentId;
      delete processedData.studentId;
    }
    
    // If the component passed 'typeId', great. If it passed 'type' which is a number/ID, remap it.
    if (processedData.type && typeof processedData.type === 'number') {
      processedData.typeId = processedData.type;
      delete processedData.type;
    } else if (processedData.type && typeof processedData.type === 'string' && !processedData.typeId) {
      // In case a legacy string arrives, just warn and default to integer fallback to prevent Postgres FK violation
      console.warn('⚠️ [DEBUG] Legacy string type code received:', processedData.type);
      processedData.typeId = 1; // Default fallback typeId
      delete processedData.type;
    }
    
    // Ensure points is correctly mapped
    if (processedData.points !== undefined) {
      processedData.points = Number(processedData.points);
    }
    
    console.log('🔍 [DEBUG] Final processed data before sending to DB:', processedData);
    
    const result = await participationDbService.create(processedData);
    return {
      success: result.success,
      data: result.data,
      message: result.success ? 'Participation created successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:createParticipation:error`, { error: err.message, participationData });
    return {
      success: false,
      error: err.message || 'Failed to create participation',
      data: null
    };
  }
};

export const deleteParticipation = async (participationId) => {
  try {
    info(`${serviceName}:deleteParticipation`, { participationId });
    const result = await participationDbService.delete(participationId);
    return {
      success: result.success,
      data: result.data,
      message: result.success ? 'Participation deleted successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:deleteParticipation:error`, { error: err.message, participationId });
    return {
      success: false,
      error: err.message || 'Failed to delete participation',
      data: null
    };
  }
};

export const loadParticipations = async (uiParams = {}) => {
  try {
    // Extract UI-specific parameters and filter them out before passing to API
    const { setParticipations, setPageState, toast, classes, programs, subjects, filters, getUserById, fetchClass, fetchSubject, fetchProgram, ...apiParams } = uiParams;
    
    info(`${serviceName}:loadParticipations`, { apiParams });
    const result = await participationDbService.getAll(apiParams);
    
    // Handle UI updates if the functions are provided
    if (result.success && setParticipations) {
      setParticipations(result.data || []);
    }
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Participations loaded successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:loadParticipations:error`, { error: err.message });
    return {
      success: false,
      error: err.message || 'Failed to load participations',
      data: []
    };
  }
};

export const updateParticipation = async (participationId, participationData) => {
  try {
    info(`${serviceName}:updateParticipation`, { participationId, participationData });
    const result = await participationDbService.update(participationId, participationData);
    return {
      success: result.success,
      data: result.data,
      message: result.success ? 'Participation updated successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:updateParticipation:error`, { error: err.message, participationId, participationData });
    return {
      success: false,
      error: err.message || 'Failed to update participation',
      data: null
    };
  }
};

export const getParticipationsByClassAndDate = async (classId, date) => {
  try {
    info(`${serviceName}:getParticipationsByClassAndDate`, { classId, date });
    
    if (!classId || !date) {
      return {
        success: false,
        error: 'Class ID and date are required',
        data: []
      };
    }
    
    // Mock implementation - in production this would query the database
    const result = await participationDbService.getAll({
      classId,
      date,
      limit: 100
    });
    
    return {
      success: true,
      data: result.data || [],
      message: 'Class participations for date retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getParticipationsByClassAndDate:error`, { error: error.message, classId, date });
    return {
      success: false,
      error: error.message || 'Failed to retrieve class participations for date',
      data: []
    };
  }
};

export default {
  getParticipations,
  getParticipationsByStudent,
  createParticipation,
  updateParticipation,
  deleteParticipation,
  loadParticipations,
  getParticipationsByClassAndDate
};
