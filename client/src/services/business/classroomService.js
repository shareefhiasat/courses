import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'classroomService';

import classroomBusinessService from './classroomBusinessService.js';

export const getAllClassrooms = async (params = {}) => {
  try {
    info(`${serviceName}:getAllClassrooms`, { params });
    const result = await classroomBusinessService.getAllClassrooms(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllClassrooms:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load classrooms',
      data: []
    };
  }
};

export const getAvailableClassrooms = async (params) => {
  try {
    info(`${serviceName}:getAvailableClassrooms`, { params });
    const result = await classroomBusinessService.getAvailableClassrooms(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAvailableClassrooms:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load available classrooms',
      data: []
    };
  }
};

export const getClassroomsByProgram = async (programId) => {
  try {
    info(`${serviceName}:getClassroomsByProgram`, { programId });
    const result = await classroomBusinessService.getClassroomsByProgram(programId);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getClassroomsByProgram:error`, { error: err.message, programId });
    return {
      success: false,
      error: err.message || 'Failed to load classrooms',
      data: []
    };
  }
};

export const getClassroomById = async (id) => {
  try {
    info(`${serviceName}:getClassroomById`, { id });
    const result = await classroomBusinessService.getClassroomById(id);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getClassroomById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve classroom',
      data: null
    };
  }
};

export const createClassroom = async (classroomData, user = null) => {
  try {
    const result = await classroomBusinessService.createClassroom(classroomData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createClassroom:error`, { error: err.message, data: classroomData });
    return {
      success: false,
      error: err.message || 'Failed to create classroom',
      data: null
    };
  }
};

export const updateClassroom = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateClassroom`, { id, data: updateData });
    const result = await classroomBusinessService.updateClassroom(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateClassroom:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update classroom',
      data: null
    };
  }
};

export const deleteClassroom = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteClassroom`, { id });
    const result = await classroomBusinessService.deleteClassroom(id, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteClassroom:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete classroom'
    };
  }
};
