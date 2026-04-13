/**
 * Enrollments Service - Business Logic Layer
 *
 * PURPOSE: Business logic for enrollment operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import enrollmentDbService from "../db/enrollments-postgres.js";
import { LMS_ROLES } from './keycloakAdminService.js';

const serviceName = "enrollmentsBusinessService";

/**
 * Get all enrollments with business logic validation
 *
 * @param {object} params - Query parameters
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with enrollments data
 */
export const getAllEnrollments = async (params = {}, user = null) => {
  try {
    console.log(`[${serviceName}] getAllEnrollments`, { params, user });

    // Add business logic filters if needed
    const businessParams = { ...params };

    // Role-based data filtering
    if (user && user.roles) {
      const roles = user.roles;
      
      // HR, Admin, and Super Admin can see all enrollments (no userId filter)
      if (roles.includes(LMS_ROLES.HR) || roles.includes(LMS_ROLES.ADMIN) || roles.includes(LMS_ROLES.SUPER_ADMIN)) {
        // No userId filter - can see all enrollments
      }
      // Instructor can only see enrollments for classes they teach
      else if (roles.includes(LMS_ROLES.INSTRUCTOR)) {
        // This will be handled at the DB level by filtering by class.instructorId
        // For now, we don't add userId filter for instructors
      }
      // Student can only see their own enrollments
      else if (roles.includes(LMS_ROLES.STUDENT)) {
        businessParams.userId = user.id;
      }
      // Fallback: if no recognized role, filter by userId for safety
      else {
        businessParams.userId = user.id;
      }
    }

    const result = await enrollmentDbService.getEnrollments(businessParams);

    return {
      ...result,
      message: result.success
        ? "Enrollments retrieved successfully"
        : result.error,
    };
  } catch (error) {
    console.error(`[${serviceName}] Error in getAllEnrollments:`, error);
    return {
      success: false,
      error: error.message || "Failed to retrieve enrollments",
      data: [],
      total: 0,
    };
  }
};

/**
 * Get enrollment by ID with business logic validation
 *
 * @param {number} id - Enrollment ID
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with enrollment data
 */
export const getEnrollmentById = async (id, user = null) => {
  try {
    console.log(`[${serviceName}] getEnrollmentById`, { id });

    const result = await enrollmentDbService.getEnrollmentById(id);

    // Business logic: Users can only see their own enrollments unless admin
    if (result.success && result.data && user && !user.isAdmin) {
      if (result.data.userId !== user.id) {
        return {
          success: false,
          error: "Access denied: Cannot view other users' enrollments",
          code: "ACCESS_DENIED",
        };
      }
    }

    return {
      ...result,
      message: result.success
        ? "Enrollment retrieved successfully"
        : result.error,
    };
  } catch (error) {
    console.error(`[${serviceName}] Error in getEnrollmentById:`, error);
    return {
      success: false,
      error: error.message || "Failed to retrieve enrollment",
      data: null,
    };
  }
};

/**
 * Create new enrollment with business logic validation
 *
 * @param {object} enrollmentData - Enrollment data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with created enrollment
 */
export const createEnrollment = async (enrollmentData, user = null) => {
  try {
    console.log(`[${serviceName}] createEnrollment`, { data: enrollmentData });

    // Business rules validation
    if (!enrollmentData.studentId) {
      return {
        success: false,
        error: "Student ID is required",
        data: null,
      };
    }

    if (!enrollmentData.classId && !enrollmentData.programId) {
      return {
        success: false,
        error: "Class ID or Program ID is required",
        data: null,
      };
    }

    // Additional business rule: Must have programId and subjectId if classId is provided
    if (
      enrollmentData.classId &&
      (!enrollmentData.programId || !enrollmentData.subjectId)
    ) {
      return {
        success: false,
        error:
          "Program ID and Subject ID are required when enrolling in a class",
        data: null,
      };
    }

    // Business logic: Users can only enroll themselves unless admin
    if (user && !user.isAdmin && enrollmentData.studentId !== user.id) {
      return {
        success: false,
        error: "Access denied: Cannot enroll other users",
        code: "ACCESS_DENIED",
      };
    }

    const result = await enrollmentDbService.create(enrollmentData, user);

    return {
      ...result,
      message: result.success
        ? "Enrollment created successfully"
        : result.error,
    };
  } catch (error) {
    console.error(`[${serviceName}] Error in createEnrollment:`, error);
    return {
      success: false,
      error: error.message || "Failed to create enrollment",
      data: null,
    };
  }
};

/**
 * Update enrollment with business logic validation
 *
 * @param {number} id - Enrollment ID
 * @param {object} updateData - Update data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with updated enrollment
 */
export const updateEnrollment = async (id, updateData, user = null) => {
  try {
    console.log(`[${serviceName}] updateEnrollment`, { id, updateData });

    // Business logic: Users can only update their own enrollments unless admin
    if (user && !user.isAdmin) {
      const existingEnrollment =
        await enrollmentDbService.getEnrollmentById(id);
      if (existingEnrollment.success && existingEnrollment.data) {
        if (existingEnrollment.data.userId !== user.id) {
          return {
            success: false,
            error: "Access denied: Cannot update other users' enrollments",
            code: "ACCESS_DENIED",
          };
        }
      }
    }

    // Business rules: Prevent updating certain fields
    const allowedUpdateFields = ["statusId"];
    const updateKeys = Object.keys(updateData);
    const invalidFields = updateKeys.filter(
      (key) => !allowedUpdateFields.includes(key),
    );

    if (invalidFields.length > 0 && (!user || !user.isAdmin)) {
      return {
        success: false,
        error: `Cannot update fields: ${invalidFields.join(", ")}. Only status can be updated.`,
        code: "INVALID_UPDATE_FIELDS",
      };
    }

    const result = await enrollmentDbService.update(id, updateData, user);

    return {
      ...result,
      message: result.success
        ? "Enrollment updated successfully"
        : result.error,
    };
  } catch (error) {
    console.error(`[${serviceName}] Error in updateEnrollment:`, error);
    return {
      success: false,
      error: error.message || "Failed to update enrollment",
      data: null,
    };
  }
};

/**
 * Delete enrollment with business logic validation
 *
 * @param {number} id - Enrollment ID
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object
 */
export const deleteEnrollment = async (id, user = null) => {
  try {
    console.log(`[${serviceName}] deleteEnrollment`, { id });

    // Business logic: Users can only delete their own enrollments unless admin
    if (user && !user.isAdmin) {
      const existingEnrollment =
        await enrollmentDbService.getEnrollmentById(id);
      if (existingEnrollment.success && existingEnrollment.data) {
        if (existingEnrollment.data.userId !== user.id) {
          return {
            success: false,
            error: "Access denied: Cannot delete other users' enrollments",
            code: "ACCESS_DENIED",
          };
        }
      }
    }

    const result = await enrollmentDbService.deleteEnrollment(id);

    return {
      ...result,
      message: result.success
        ? "Enrollment deleted successfully"
        : result.error,
    };
  } catch (error) {
    console.error(`[${serviceName}] Error in deleteEnrollment:`, error);
    return {
      success: false,
      error: error.message || "Failed to delete enrollment",
    };
  }
};

/**
 * Get enrollments by student ID with business logic validation
 *
 * @param {number} studentId - Student ID
 * @param {object} params - Query parameters
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with enrollments data
 */
export const getEnrollmentsByStudent = async (
  studentId,
  params = {},
  user = null,
) => {
  try {
    console.log(`[${serviceName}] getEnrollmentsByStudent`, {
      studentId,
      params,
    });

    // Business logic: Users can only see their own enrollments unless admin
    if (user && !user.isAdmin && studentId !== user.id) {
      return {
        success: false,
        error: "Access denied: Cannot view other users' enrollments",
        code: "ACCESS_DENIED",
      };
    }

    const result = await enrollmentDbService.getEnrollmentsByStudent(
      studentId,
      params,
    );

    return {
      ...result,
      message: result.success
        ? "Student enrollments retrieved successfully"
        : result.error,
    };
  } catch (error) {
    console.error(`[${serviceName}] Error in getEnrollmentsByStudent:`, error);
    return {
      success: false,
      error: error.message || "Failed to retrieve student enrollments",
      data: [],
      total: 0,
    };
  }
};

export default {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getEnrollmentsByStudent,
};

export const getEnrollmentsByClass = async (
  classId,
  params = {},
  user = null,
) => {
  try {
    // Use the db service which already supports classId filtering
    const result = await enrollmentDbService.getEnrollments({
      ...params,
      classId,
    });

    return {
      ...result,
      message: result.success
        ? "Class enrollments retrieved successfully"
        : result.error,
    };
  } catch (error) {
    console.error("Error in getEnrollmentsByClass:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};
export const getEnrollmentsByProgram = async (
  programId,
  params = {},
  user = null,
) => {
  try {
    console.log('🔍 [EnrollmentsService] getEnrollmentsByProgram - programId:', programId);
    console.log('🔍 [EnrollmentsService] getEnrollmentsByProgram - params:', params);
    console.log('🔍 [EnrollmentsService] getEnrollmentsByProgram - user:', user);
    
    // Add business logic filters if needed
    const businessParams = { ...params, programId };

    // Role-based data filtering
    if (user && user.roles) {
      const roles = user.roles;
      
      // HR, Admin, and Super Admin can see all enrollments (no userId filter)
      if (roles.includes(LMS_ROLES.HR) || roles.includes(LMS_ROLES.ADMIN) || roles.includes(LMS_ROLES.SUPER_ADMIN)) {
        // No userId filter - can see all enrollments
      }
      // Instructor can only see enrollments for classes they teach
      else if (roles.includes(LMS_ROLES.INSTRUCTOR)) {
        // This will be handled at the DB level by filtering by class.instructorId
        // For now, we don't add userId filter for instructors
      }
      // Student can only see their own enrollments
      else if (roles.includes(LMS_ROLES.STUDENT)) {
        businessParams.userId = user.id;
      }
      // Fallback: if no recognized role, filter by userId for safety
      else {
        businessParams.userId = user.id;
      }
    }
    
    // Use the db service which already supports programId filtering
    const result = await enrollmentDbService.getEnrollments(businessParams);

    console.log('🔍 [EnrollmentsService] getEnrollmentsByProgram - result:', result);

    return {
      ...result,
      message: result.success
        ? "Program enrollments retrieved successfully"
        : result.error,
    };
  } catch (error) {
    console.error("Error in getEnrollmentsByProgram:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};
