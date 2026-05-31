/**
 * Classroom Availability DB Service (API Client)
 * 
 * PURPOSE: API client for classroom availability operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'classroomAvailabilityDbService';
const API_BASE = '/api/v1/classroom-availability';

const getClassroomAvailabilities = async (params = {}) => {
  try {
    info(`${serviceName}:getClassroomAvailabilities`, { params });
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to load classroom availabilities');
    }
    
    return {
      success: true,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getClassroomAvailabilities:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load classroom availabilities',
      data: []
    };
  }
};

const createClassroomAvailability = async (data) => {
  try {
    info(`${serviceName}:createClassroomAvailability`, { data });
    
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create classroom availability');
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    error(`${serviceName}:createClassroomAvailability:error`, { error: err.message, data });
    return {
      success: false,
      error: err.message || 'Failed to create classroom availability',
      data: null
    };
  }
};

const updateClassroomAvailability = async (id, data) => {
  try {
    info(`${serviceName}:updateClassroomAvailability`, { id, data });
    
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update classroom availability');
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    error(`${serviceName}:updateClassroomAvailability:error`, { error: err.message, id, data });
    return {
      success: false,
      error: err.message || 'Failed to update classroom availability',
      data: null
    };
  }
};

const deleteClassroomAvailability = async (id) => {
  try {
    info(`${serviceName}:deleteClassroomAvailability`, { id });
    
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete classroom availability');
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    error(`${serviceName}:deleteClassroomAvailability:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete classroom availability',
      data: null
    };
  }
};

export default {
  getClassroomAvailabilities,
  createClassroomAvailability,
  updateClassroomAvailability,
  deleteClassroomAvailability
};
