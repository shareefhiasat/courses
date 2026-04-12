/**
 * Enrollment Business Service
 * 
 * PURPOSE:
 * Business logic layer for enrollment-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE:
 * Frontend Components → Business Services → Database Services → PostgreSQL
 */

const { dbService } = require('../other/dbService.js');
const { info, error, warn, debug } = require('../utils/logger.js');

const serviceName = 'enrollmentBusinessService';

const getAllEnrollments = async (params = {}) => {
  try {
    info(`${serviceName}:getAllEnrollments`, { params });
    const result = await dbService.findMany('enrollment', params);
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.pagination?.total || 0,
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllEnrollments:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load enrollments',
      data: []
    };
  }
};

const getEnrollmentById = async (id) => {
  try {
    info(`${serviceName}:getEnrollmentById`, { id });
    const result = await dbService.findUnique('enrollment', id);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentById:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to load enrollment',
      data: null
    };
  }
};

const createEnrollment = async (enrollmentData, user = null) => {
  try {
    info(`${serviceName}:createEnrollment`, { data: enrollmentData });
    
    // Business rules validation
    if (!enrollmentData.userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    if (!enrollmentData.classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    // Check for duplicate enrollment
    const existingEnrollments = await dbService.findMany('enrollment', {
      where: {
        userId: enrollmentData.userId,
        classId: enrollmentData.classId,
        isActive: true
      }
    });
    
    if (existingEnrollments.success && existingEnrollments.data.length > 0) {
      return {
        success: false,
        error: 'Student is already enrolled in this class',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...enrollmentData,
      status: 'active',
      enrollmentDate: new Date(),
      isActive: true
    };
    
    const result = await dbService.create('enrollment', processedData, user);
    
    if (result.success) {
      info(`${serviceName}:createEnrollment:success`, { enrollmentId: result.data.id });
      return {
        success: true,
        data: result.data,
        message: 'Enrollment created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create enrollment',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createEnrollment:error`, { error: error.message, data: enrollmentData });
    return {
      success: false,
      error: error.message || 'Failed to create enrollment',
      data: null
    };
  }
};

const updateEnrollment = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateEnrollment`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Enrollment ID is required',
        data: null
      };
    }
    
    const result = await dbService.update('enrollment', id, updateData, user);
    
    if (result.success) {
      info(`${serviceName}:updateEnrollment:success`, { enrollmentId: id });
      return {
        success: true,
        data: result.data,
        message: 'Enrollment updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update enrollment',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateEnrollment:error`, { error: error.message, id, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update enrollment',
      data: null
    };
  }
};

const deleteEnrollment = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteEnrollment`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Enrollment ID is required',
        data: null
      };
    }
    
    // Soft delete enrollment
    const result = await dbService.softDelete('enrollment', id, user);
    
    if (result.success) {
      info(`${serviceName}:deleteEnrollment:success`, { enrollmentId: id });
      return {
        success: true,
        message: 'Enrollment deactivated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to deactivate enrollment',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteEnrollment:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to deactivate enrollment',
      data: null
    };
  }
};

const getEnrollmentsByStudent = async (studentId) => {
  try {
    info(`${serviceName}:getEnrollmentsByStudent`, { studentId });
    
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: []
      };
    }
    
    const result = await dbService.findMany('enrollment', {
      where: { userId: parseInt(studentId) },
      include: { class: true }
    });
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.pagination?.total || 0
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentsByStudent:error`, { error: error.message, studentId });
    return {
      success: false,
      error: error.message || 'Failed to load student enrollments',
      data: []
    };
  }
};

const getEnrollmentsByClass = async (classId, params = {}) => {
  try {
    info(`${serviceName}:getEnrollmentsByClass`, { classId, params });
    
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: []
      };
    }
    
    const result = await dbService.findMany('enrollment', {
      where: { classId: parseInt(classId) },
      include: { user: true },
      ...params
    });
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.pagination?.total || 0
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentsByClass:error`, { error: error.message, classId, params });
    return {
      success: false,
      error: error.message || 'Failed to load class enrollments',
      data: []
    };
  }
};

module.exports = {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getEnrollmentsByStudent,
  getEnrollmentsByClass
};
