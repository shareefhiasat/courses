import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'timeSlotService';

import timeSlotBusinessService from './timeSlotBusinessService.js';

export const getAllTimeSlots = async (params = {}) => {
  try {
    info(`${serviceName}:getAllTimeSlots`, { params });
    const result = await timeSlotBusinessService.getAllTimeSlots(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllTimeSlots:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load time slots',
      data: []
    };
  }
};

export const getSchedulableTimeSlots = async (params) => {
  try {
    info(`${serviceName}:getSchedulableTimeSlots`, { params });
    const result = await timeSlotBusinessService.getSchedulableTimeSlots(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getSchedulableTimeSlots:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load schedulable time slots',
      data: []
    };
  }
};

export const bulkInitDefaults = async (params) => {
  try {
    info(`${serviceName}:bulkInitDefaults`, { params });
    const result = await timeSlotBusinessService.bulkInitDefaults(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:bulkInitDefaults:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to initialize default time slots',
      data: null
    };
  }
};

export const getTimeSlotsByProgram = async (programId) => {
  try {
    info(`${serviceName}:getTimeSlotsByProgram`, { programId });
    const result = await timeSlotBusinessService.getTimeSlotsByProgram(programId);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getTimeSlotsByProgram:error`, { error: err.message, programId });
    return {
      success: false,
      error: err.message || 'Failed to load time slots',
      data: []
    };
  }
};

export const getTimeSlotById = async (id) => {
  try {
    info(`${serviceName}:getTimeSlotById`, { id });
    const result = await timeSlotBusinessService.getTimeSlotById(id);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getTimeSlotById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve time slot',
      data: null
    };
  }
};

export const createTimeSlot = async (timeSlotData, user = null) => {
  try {
    const result = await timeSlotBusinessService.createTimeSlot(timeSlotData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createTimeSlot:error`, { error: err.message, data: timeSlotData });
    return {
      success: false,
      error: err.message || 'Failed to create time slot',
      data: null
    };
  }
};

export const updateTimeSlot = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateTimeSlot`, { id, data: updateData });
    const result = await timeSlotBusinessService.updateTimeSlot(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateTimeSlot:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update time slot',
      data: null
    };
  }
};

export const deleteTimeSlot = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteTimeSlot`, { id });
    const result = await timeSlotBusinessService.deleteTimeSlot(id, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteTimeSlot:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete time slot'
    };
  }
};
