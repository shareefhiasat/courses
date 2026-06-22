/**
 * Holiday Business Service
 * 
 * PURPOSE: Business logic layer for holiday-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import holidayDbService from '../db/holidayDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'holidayBusinessService';

const getAllHolidays = async (params = {}) => {
  try {
    info(`${serviceName}:getAllHolidays`, { params });
    const result = await holidayDbService.getHolidays(params);
    
    return {
      success: result.success,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllHolidays:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load holidays',
      data: []
    };
  }
};

const getUpcomingHolidays = async (params) => {
  try {
    info(`${serviceName}:getUpcomingHolidays`, { params });
    
    const result = await holidayDbService.getUpcomingHolidays(params);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getUpcomingHolidays:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load upcoming holidays',
      data: []
    };
  }
};

const getHolidaysByProgram = async (programId) => {
  try {
    info(`${serviceName}:getHolidaysByProgram`, { programId });
    
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    const result = await holidayDbService.getHolidaysByProgram(programId);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getHolidaysByProgram:error`, { error: error.message, programId });
    return {
      success: false,
      error: error.message || 'Failed to load holidays',
      data: []
    };
  }
};

const getHolidayById = async (holidayId) => {
  try {
    info(`${serviceName}:getHolidayById`, { holidayId });
    
    if (!holidayId) {
      return {
        success: false,
        error: 'Holiday ID is required',
        data: null
      };
    }
    
    const result = await holidayDbService.getHolidayById(holidayId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getHolidayById:error`, { error: error.message, holidayId });
    return {
      success: false,
      error: error.message || 'Failed to load holiday',
      data: null
    };
  }
};

const createHoliday = async (holidayData, user = null) => {
  try {
    // Business rules validation
    const descriptionEn = holidayData.descriptionEn || holidayData.description;
    const type = holidayData.type;
    const startDate = holidayData.startDate;
    const endDate = holidayData.endDate;
    
    if (!descriptionEn || descriptionEn.trim() === '') {
      return {
        success: false,
        error: 'Holiday English description is required',
        data: null
      };
    }
    
    if (!type) {
      return {
        success: false,
        error: 'Holiday type is required',
        data: null
      };
    }
    
    if (!startDate) {
      return {
        success: false,
        error: 'Start date is required',
        data: null
      };
    }
    
    if (!endDate) {
      return {
        success: false,
        error: 'End date is required',
        data: null
      };
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      return {
        success: false,
        error: 'End date must be after or equal to start date',
        data: null
      };
    }
    
    const processedData = {
      ...holidayData,
      descriptionEn: descriptionEn.trim(),
      descriptionAr: (holidayData.descriptionAr || '').trim(),
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isRecurring: holidayData.isRecurring || false,
      recurrenceType: holidayData.recurrenceType || null,
      recurrenceDays: holidayData.recurrenceDays || null,
      recurrenceEndDate: holidayData.recurrenceEndDate || null,
      recurrenceCount: holidayData.recurrenceCount || null,
      recurrencePattern: holidayData.recurrencePattern || null,
      isActive: holidayData.isActive !== undefined ? holidayData.isActive : true
    };
    
    const result = await holidayDbService.createHoliday(processedData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Holiday created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create holiday',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createHoliday:error`, { error: error.message, data: holidayData });
    return {
      success: false,
      error: error.message || 'Failed to create holiday',
      data: null
    };
  }
};

const updateHoliday = async (holidayId, updateData, user = null) => {
  try {
    info(`${serviceName}:updateHoliday`, { holidayId, data: updateData });
    
    if (!holidayId) {
      return {
        success: false,
        error: 'Holiday ID is required',
        data: null
      };
    }
    
    // Validate date range if both dates are provided
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.endDate) < new Date(updateData.startDate)) {
        return {
          success: false,
          error: 'End date must be after or equal to start date',
          data: null
        };
      }
    }
    
    const result = await holidayDbService.updateHoliday(holidayId, updateData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Holiday updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update holiday',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateHoliday:error`, { error: error.message, holidayId, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update holiday',
      data: null
    };
  }
};

const deleteHoliday = async (holidayId, deleteScope = 'single', user = null) => {
  try {
    info(`${serviceName}:deleteHoliday`, { holidayId, deleteScope });
    
    if (!holidayId) {
      return {
        success: false,
        error: 'Holiday ID is required',
        data: null
      };
    }
    
    const result = await holidayDbService.deleteHoliday(holidayId, deleteScope, user);
    
    if (result.success) {
      return {
        success: true,
        message: result.message || 'Holiday deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to delete holiday'
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteHoliday:error`, { error: error.message, holidayId });
    return {
      success: false,
      error: error.message || 'Failed to delete holiday'
    };
  }
};

export default {
  getAllHolidays,
  getUpcomingHolidays,
  getHolidaysByProgram,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
