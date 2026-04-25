import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'teacherAvailabilityService';

import teacherAvailabilityBusinessService from './teacherAvailabilityBusinessService.js';

export const getAllTeacherAvailabilities = async (params = {}) => {
  try {
    info(`${serviceName}:getAllTeacherAvailabilities`, { params });
    const result = await teacherAvailabilityBusinessService.getAllTeacherAvailabilities(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllTeacherAvailabilities:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load teacher availabilities',
      data: []
    };
  }
};

export const getAvailableTeachers = async (params) => {
  try {
    info(`${serviceName}:getAvailableTeachers`, { params });
    const result = await teacherAvailabilityBusinessService.getAvailableTeachers(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAvailableTeachers:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load available teachers',
      data: []
    };
  }
};

export const getTeacherAvailabilityByUserId = async (userId) => {
  try {
    info(`${serviceName}:getTeacherAvailabilityByUserId`, { userId });
    const result = await teacherAvailabilityBusinessService.getTeacherAvailabilityByUserId(userId);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getTeacherAvailabilityByUserId:error`, { error: err.message, userId });
    return {
      success: false,
      error: err.message || 'Failed to retrieve teacher availability',
      data: null
    };
  }
};

export const getTeacherAvailabilityById = async (id) => {
  try {
    info(`${serviceName}:getTeacherAvailabilityById`, { id });
    const result = await teacherAvailabilityBusinessService.getTeacherAvailabilityById(id);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getTeacherAvailabilityById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve teacher availability',
      data: null
    };
  }
};

export const createTeacherAvailability = async (availabilityData, user = null) => {
  try {
    const result = await teacherAvailabilityBusinessService.createTeacherAvailability(availabilityData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createTeacherAvailability:error`, { error: err.message, data: availabilityData });
    return {
      success: false,
      error: err.message || 'Failed to create teacher availability',
      data: null
    };
  }
};

export const updateTeacherAvailability = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateTeacherAvailability`, { id, data: updateData });
    const result = await teacherAvailabilityBusinessService.updateTeacherAvailability(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateTeacherAvailability:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update teacher availability',
      data: null
    };
  }
};

export const deleteTeacherAvailability = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteTeacherAvailability`, { id });
    const result = await teacherAvailabilityBusinessService.deleteTeacherAvailability(id, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteTeacherAvailability:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete teacher availability'
    };
  }
};
