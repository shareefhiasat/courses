import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'scheduleSessionService';

import scheduleSessionBusinessService from './scheduleSessionBusinessService.js';

export const getAllScheduleSessions = async (params = {}) => {
  try {
    info(`${serviceName}:getAllScheduleSessions`, { params });
    const result = await scheduleSessionBusinessService.getAllScheduleSessions(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllScheduleSessions:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load schedule sessions',
      data: []
    };
  }
};

export const getScheduleSessionsByRange = async (params) => {
  try {
    info(`${serviceName}:getScheduleSessionsByRange`, { params });
    const result = await scheduleSessionBusinessService.getScheduleSessionsByRange(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getScheduleSessionsByRange:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load schedule sessions',
      data: []
    };
  }
};

export const getScheduleSessionById = async (id) => {
  try {
    info(`${serviceName}:getScheduleSessionById`, { id });
    const result = await scheduleSessionBusinessService.getScheduleSessionById(id);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getScheduleSessionById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve schedule session',
      data: null
    };
  }
};

export const checkConflicts = async (params) => {
  try {
    info(`${serviceName}:checkConflicts`, { params });
    const result = await scheduleSessionBusinessService.checkConflicts(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:checkConflicts:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to check conflicts',
      hasConflicts: false,
      conflicts: []
    };
  }
};

export const createScheduleSession = async (sessionData, user = null) => {
  try {
    const result = await scheduleSessionBusinessService.createScheduleSession(sessionData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createScheduleSession:error`, { error: err.message, data: sessionData });
    return {
      success: false,
      error: err.message || 'Failed to create schedule session',
      data: null
    };
  }
};

export const updateScheduleSession = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateScheduleSession`, { id, data: updateData });
    const result = await scheduleSessionBusinessService.updateScheduleSession(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateScheduleSession:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update schedule session',
      data: null
    };
  }
};

export const cancelScheduleSession = async (id, cancelReason = '', user = null) => {
  try {
    info(`${serviceName}:cancelScheduleSession`, { id, cancelReason });
    const result = await scheduleSessionBusinessService.cancelScheduleSession(id, cancelReason, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:cancelScheduleSession:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to cancel schedule session',
      data: null
    };
  }
};

export const deleteScheduleSession = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteScheduleSession`, { id });
    const result = await scheduleSessionBusinessService.deleteScheduleSession(id, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteScheduleSession:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete schedule session'
    };
  }
};

export const bulkCreateScheduleSessions = async (sessions, user = null) => {
  try {
    info(`${serviceName}:bulkCreateScheduleSessions`, { count: sessions?.length });
    const result = await scheduleSessionBusinessService.bulkCreateScheduleSessions(sessions, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:bulkCreateScheduleSessions:error`, { error: err.message, count: sessions?.length });
    return {
      success: false,
      error: err.message || 'Failed to create schedule sessions',
      data: null
    };
  }
};
