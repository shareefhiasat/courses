import { info, error, warn, debug } from '@services/utils/logger.js';

import classroomAvailabilityBusinessService from './classroomAvailabilityBusinessService.js';

const serviceName = 'classroomAvailabilityService';

export const getAllClassroomAvailabilities = async (params = {}) => {
  try {
    info(`${serviceName}:getAllClassroomAvailabilities`, { params });
    const result = await classroomAvailabilityBusinessService.getAllClassroomAvailabilities(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllClassroomAvailabilities:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load classroom availabilities',
      data: []
    };
  }
};

export const createClassroomAvailability = async (data, user = null) => {
  try {
    const payload = { ...data };
    if (user && user.dbId) {
      payload.createdBy = user.dbId;
    }
    const result = await classroomAvailabilityBusinessService.createClassroomAvailability(payload);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createClassroomAvailability:error`, { error: err.message, data });
    return {
      success: false,
      error: err.message || 'Failed to create classroom availability',
      data: null
    };
  }
};

export const updateClassroomAvailability = async (id, data, user = null) => {
  try {
    info(`${serviceName}:updateClassroomAvailability`, { id, data });
    const payload = { ...data };
    if (user && user.dbId) {
      payload.updatedBy = user.dbId;
    }
    const result = await classroomAvailabilityBusinessService.updateClassroomAvailability(id, payload);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateClassroomAvailability:error`, { error: err.message, id, data });
    return {
      success: false,
      error: err.message || 'Failed to update classroom availability',
      data: null
    };
  }
};

export const deleteClassroomAvailability = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteClassroomAvailability`, { id });
    const result = await classroomAvailabilityBusinessService.deleteClassroomAvailability(id);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteClassroomAvailability:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete classroom availability',
      data: null
    };
  }
};

export default {
  getAllClassroomAvailabilities,
  createClassroomAvailability,
  updateClassroomAvailability,
  deleteClassroomAvailability
};
