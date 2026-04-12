import { info, error, warn, debug } from '../utils/logger.js';
import enrollmentDbService from '../db/enrollmentDbService-postgres.js';

const serviceName = 'enrollmentService';

// Core enrollment operations
export const getAllEnrollments = async (params = {}) => {
  try {
    info(`${serviceName}:getAllEnrollments`, { params });
    
    const result = await enrollmentDbService.getAll(params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Enrollments retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getAllEnrollments:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve enrollments',
      data: []
    };
  }
};

export const getEnrollmentById = async (id) => {
  try {
    info(`${serviceName}:getEnrollmentById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Enrollment ID is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: null,
      message: 'Enrollment retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentById:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to retrieve enrollment',
      data: null
    };
  }
};

export const createEnrollment = async (enrollmentData, user = null) => {
  try {
    info(`${serviceName}:createEnrollment`, { data: enrollmentData });
    
    // Business rules validation
    if (!enrollmentData.studentId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: null
      };
    }
    
    if (!enrollmentData.classId && !enrollmentData.programId) {
      return {
        success: false,
        error: 'Class ID or Program ID is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...enrollmentData,
      status: enrollmentData.status || 'active',
      enrolledAt: new Date(),
      isActive: enrollmentData.isActive !== undefined ? enrollmentData.isActive : true
    };
    
    // Call the backend API
    const result = await enrollmentDbService.create(processedData);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      message: result.success ? 'Enrollment created successfully' : result.error
    };
  } catch (error) {
    error(`${serviceName}:createEnrollment:error`, { error: error.message, data: enrollmentData });
    return {
      success: false,
      error: error.message || 'Failed to create enrollment',
      data: null
    };
  }
};

export const updateEnrollment = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateEnrollment`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Enrollment ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    
    // Mock implementation - replace with actual database call
    const updatedEnrollment = {
      id: parseInt(id),
      ...updateData
    };
    
    return {
      success: true,
      data: updatedEnrollment,
      message: 'Enrollment updated successfully'
    };
  } catch (error) {
    error(`${serviceName}:updateEnrollment:error`, { error: error.message, id, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update enrollment',
      data: null
    };
  }
};

export const deleteEnrollment = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteEnrollment`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Enrollment ID is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      message: 'Enrollment deleted successfully'
    };
  } catch (error) {
    error(`${serviceName}:deleteEnrollment:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to delete enrollment',
      data: null
    };
  }
};

// Query functions
export const getEnrollmentsByStudent = async (studentId, params = {}) => {
  try {
    info(`${serviceName}:getEnrollmentsByStudent`, { studentId, params });
    
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: []
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Student enrollments retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentsByStudent:error`, { error: error.message, studentId, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve student enrollments',
      data: []
    };
  }
};

export const getEnrollmentsByClass = async (classId, params = {}) => {
  try {
    info(`${serviceName}:getEnrollmentsByClass`, { classId, params });
    
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: []
      };
    }
    
    const result = await enrollmentDbService.getByClass(classId, params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Class enrollments retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getEnrollmentsByClass:error`, { error: err.message, classId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve class enrollments',
      data: []
    };
  }
};

export const getStudentsByClass = async (classId, params = {}) => {
  try {
    info(`${serviceName}:getStudentsByClass`, { classId, params });
    
    if (!classId || classId === 'all') {
      return {
        success: false,
        error: 'Class ID is required',
        data: []
      };
    }
    
    const result = await enrollmentDbService.getStudentsByClass(classId, params);
    
    if (!result.success) {
      return {
        success: false,
        data: [],
        total: 0,
        message: result.error || 'Failed to get students'
      };
    }
    
    // Get class info to check disabled students
    let classData = null;
    // Skip class fetch when classId is 'all' (special value for all classes)
    if (classId !== 'all') {
      try {
        const classResult = await import('./classService.js').then(m => m.getClass(classId));
        if (classResult.success) {
          classData = classResult.data;
        }
      } catch (err) {
        warn(`${serviceName}:getStudentsByClass:classFetch`, { error: err.message });
      }
    }
    
    const disabledStudents = classData?.disabledStudents || [];
    
    // Return raw enrollment data with user objects (for bulk scan compatibility)
    // BulkScanContext expects enrollment.user.studentNumber to be available
    const enrollments = result.data || [];
    
    // Mark disabled students in the enrollment data
    const enrichedEnrollments = enrollments.map((enrollment) => ({
      ...enrollment,
      isDisabled: disabledStudents.includes(enrollment.userId) ||
                    disabledStudents.includes(enrollment.userId.toString()) ||
                    disabledStudents.includes(parseInt(enrollment.userId))
    }));
    
    return {
      success: true,
      data: enrichedEnrollments,
      total: enrichedEnrollments.length,
      message: 'Students retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getStudentsByClass:error`, { error: err.message, classId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve students',
      data: []
    };
  }
};

export const getEnrollmentsByProgram = async (programId, params = {}) => {
  try {
    info(`${serviceName}:getEnrollmentsByProgram`, { programId, params });

    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }

    const result = await enrollmentDbService.getByProgram(programId, params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Program enrollments retrieved successfully' : result.error
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentsByProgram:error`, { error: error.message, programId, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve program enrollments',
      data: []
    };
  }
};

// Status management functions
export const activateEnrollment = async (id, user = null) => {
  try {
    info(`${serviceName}:activateEnrollment`, { id });
    
    return await updateEnrollment(id, {
      status: 'active',
      activatedAt: new Date()
    }, user);
  } catch (error) {
    error(`${serviceName}:activateEnrollment:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to activate enrollment'
    };
  }
};

export const deactivateEnrollment = async (id, user = null) => {
  try {
    info(`${serviceName}:deactivateEnrollment`, { id });
    
    return await updateEnrollment(id, {
      status: 'inactive',
      deactivatedAt: new Date()
    }, user);
  } catch (error) {
    error(`${serviceName}:deactivateEnrollment:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to deactivate enrollment'
    };
  }
};

export const completeEnrollment = async (id, user = null) => {
  try {
    info(`${serviceName}:completeEnrollment`, { id });
    
    return await updateEnrollment(id, {
      status: 'completed',
      completedAt: new Date()
    }, user);
  } catch (error) {
    error(`${serviceName}:completeEnrollment:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to complete enrollment'
    };
  }
};

// Student access management
export const toggleStudentAccess = async (classId, studentId, isCurrentlyDisabled, options = {}) => {
  try {
    info(`${serviceName}:toggleStudentAccess`, { classId, studentId, isCurrentlyDisabled, options });
    
    if (!classId || !studentId) {
      return {
        success: false,
        error: 'Class ID and Student ID are required',
        data: null
      };
    }

    // Import enrollment service to update enrollment status
    const { getEnrollments, updateEnrollment } = await import('./enrollmentService.js');
    
    // Get enrollment for this student and class
    const enrollmentResult = await getEnrollments({ 
      classId, 
      userId: studentId 
    });
    
    if (!enrollmentResult.success || !enrollmentResult.data || enrollmentResult.data.length === 0) {
      return {
        success: false,
        error: 'Enrollment not found for this student and class',
        data: null
      };
    }

    const enrollment = enrollmentResult.data[0];
    
    // Toggle enrollment status
    const newStatusId = isCurrentlyDisabled ? 1 : 7; // 1 = ENROLLED, 7 = SUSPENDED
    
    const updateResult = await updateEnrollment(enrollment.id, {
      statusId: newStatusId
    });

    if (updateResult.success) {
      // Log activity if activity logger is available
      try {
        const { logActivity, ACTIVITY_LOG_TYPES } = await import('@services/other/activityLogger.jsx');
        await logActivity(ACTIVITY_LOG_TYPES.STUDENT_ACCESS_TOGGLED, {
          classId,
          studentId,
          action: isCurrentlyDisabled ? 'enabled' : 'disabled',
          ...options
        });
      } catch (logError) {
        warn(`${serviceName}:toggleStudentAccess:activityLog`, { error: logError.message });
      }

      return {
        success: true,
        data: {
          action: isCurrentlyDisabled ? 'enabled' : 'disabled',
          enrollmentId: enrollment.id,
          newStatusId
        }
      };
    } else {
      return {
        success: false,
        error: updateResult.error || 'Failed to update enrollment status',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:toggleStudentAccess:error`, { error: error.message, classId, studentId });
    return {
      success: false,
      error: error.message || 'Failed to toggle student access',
      data: null
    };
  }
};

// Statistics and reporting functions
export const getEnrollmentCount = async (params = {}) => {
  try {
    info(`${serviceName}:getEnrollmentCount`, { params });
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: 0,
      message: 'Enrollment count retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentCount:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to get enrollment count',
      data: 0
    };
  }
};

export const getEnrollmentStats = async (params = {}) => {
  try {
    info(`${serviceName}:getEnrollmentStats`, { params });
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: {
        total: 0,
        active: 0,
        inactive: 0,
        completed: 0
      },
      message: 'Enrollment statistics retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getEnrollmentStats:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve enrollment statistics',
      data: null
    };
  }
};

// Aliases for commonly expected function names
export const getEnrollments = getAllEnrollments;
export const getEnrollment = getEnrollmentById;
export const addEnrollment = createEnrollment;
export const updateEnrollmentData = updateEnrollment;
export const removeEnrollment = deleteEnrollment;
export const getStudentEnrollments = getEnrollmentsByStudent;
export const getClassEnrollments = getEnrollmentsByClass;
export const getProgramEnrollments = getEnrollmentsByProgram;

// Default export
export default {
  // Core functions
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  
  // Query functions
  getEnrollmentsByStudent,
  getEnrollmentsByClass,
  getEnrollmentsByProgram,
  
  // Status management
  activateEnrollment,
  deactivateEnrollment,
  completeEnrollment,
  
  // Student access management
  toggleStudentAccess,
  
  // Statistics and reporting
  getEnrollmentCount,
  getEnrollmentStats,
  
  // Aliases
  getEnrollments,
  getEnrollment,
  addEnrollment,
  updateEnrollmentData,
  removeEnrollment,
  getStudentEnrollments,
  getClassEnrollments,
  getProgramEnrollments
};
