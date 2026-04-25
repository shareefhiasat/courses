import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'holidayService';

import holidayBusinessService from './holidayBusinessService.js';

export const getAllHolidays = async (params = {}) => {
  try {
    info(`${serviceName}:getAllHolidays`, { params });
    const result = await holidayBusinessService.getAllHolidays(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllHolidays:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load holidays',
      data: []
    };
  }
};

export const getUpcomingHolidays = async (params) => {
  try {
    info(`${serviceName}:getUpcomingHolidays`, { params });
    const result = await holidayBusinessService.getUpcomingHolidays(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getUpcomingHolidays:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load upcoming holidays',
      data: []
    };
  }
};

export const getHolidaysByProgram = async (programId) => {
  try {
    info(`${serviceName}:getHolidaysByProgram`, { programId });
    const result = await holidayBusinessService.getHolidaysByProgram(programId);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getHolidaysByProgram:error`, { error: err.message, programId });
    return {
      success: false,
      error: err.message || 'Failed to load holidays',
      data: []
    };
  }
};

export const getHolidayById = async (id) => {
  try {
    info(`${serviceName}:getHolidayById`, { id });
    const result = await holidayBusinessService.getHolidayById(id);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getHolidayById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve holiday',
      data: null
    };
  }
};

export const createHoliday = async (holidayData, user = null) => {
  try {
    const result = await holidayBusinessService.createHoliday(holidayData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createHoliday:error`, { error: err.message, data: holidayData });
    return {
      success: false,
      error: err.message || 'Failed to create holiday',
      data: null
    };
  }
};

export const updateHoliday = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateHoliday`, { id, data: updateData });
    const result = await holidayBusinessService.updateHoliday(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateHoliday:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update holiday',
      data: null
    };
  }
};

export const deleteHoliday = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteHoliday`, { id });
    const result = await holidayBusinessService.deleteHoliday(id, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteHoliday:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete holiday'
    };
  }
};
