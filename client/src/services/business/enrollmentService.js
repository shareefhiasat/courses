import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { notificationGateway } from './notificationGateway';
import logger from '@utils/logger';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import { 
  getEnrollments as getEnrollmentsFromDb,
  getEnrollmentsByUser as getEnrollmentsByUserFromDb,
  getEnrollmentsByClass as getEnrollmentsByClassFromDb,
  getEnrollment as getEnrollmentFromDb,
  setEnrollment as setEnrollmentToDb,
  update as updateEnrollmentInDb,
  deleteEnrollment as deleteEnrollmentFromDb
} from '../db/enrollmentDbService';
import { getUserById, updateUser } from './userService';
import { getClassById, updateClass } from './classService';

/**
 * Unified Enrollment Service
 * 
 * Handles all enrollment-related operations including:
 * - Basic CRUD operations for enrollments
 * - Enrollment management (student access, class statistics)
 * - Student enrollment/unenrollment with notifications
 * - Class-level access control
 * 
 * This service combines functionality from the previous enrollmentService.js 
 * and enrollmentManagementService.js files for better organization.
 */

// Get all enrollments - with performance monitoring
export const getEnrollments = async () => {
  try {
    return await getEnrollmentsFromDb();
  } catch (error) {
    logger.error('ENROLLMENT: Failed to fetch enrollments', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Add new enrollment
export const addEnrollment = async (data, user) => {
  try {
    const { userId, classId } = data || {};
    if (!userId || !classId)
      return { success: false, error: "userId and classId are required" };
    const detId = `${userId}_${classId}`;
    
    // Use database service to set enrollment
    const auditData = getCreateAuditData(user);
    const enrollmentData = {
      ...data,
      ...auditData
    };
    const result = await setEnrollmentToDb(detId, enrollmentData);
    
    if (!result.success) {
      return result;
    }
    
    // Update user's enrolledClasses array
    try {
      const userResult = await getUserById(userId);
      if (userResult.success) {
        const currentEnrolledClasses = userResult.data.enrolledClasses || [];
        const updatedEnrolledClasses = [...new Set([...currentEnrolledClasses, classId])];
        await updateUser(userId, { enrolledClasses: updatedEnrolledClasses });
      }
    } catch (error) {
      logger.warn("Failed to update user enrolledClasses:", error);
    }

    // Update student progress (if needed)
    try {
      // This would need to be implemented in studentProgressDbService
      const { updateStudentProgress } = await import('../db/studentProgressDbService');
      await updateStudentProgress(userId, { enrolledClasses: 1 });
    } catch (e) {
      logger.warn("Failed to update student progress:", e);
    }

    return { success: true, id: detId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete enrollment
export const deleteEnrollment = async (id) => {
  try {
    // Use database service to get enrollment data before deletion
    const { getEnrollment } = await import('../db/enrollmentDbService');
    const enrollmentResult = await getEnrollment(id);
    
    if (enrollmentResult.success && enrollmentResult.data) {
      const enrollmentData = enrollmentResult.data;
      const userId = enrollmentData.userId;
      const classId = enrollmentData.classId;

      // Cascade delete: attendance records for this enrollment
      try {
        const { deleteAttendanceByStudentClass } = await import('../db/attendanceDbService');
        await deleteAttendanceByStudentClass(userId, classId);
      } catch (error) {
        logger.warn("Failed to cascade delete attendance records:", error);
      }
    }

    // Use database service to delete enrollment
    const result = await deleteEnrollmentFromDb(id);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get enrollments by user ID - with performance monitoring
export const getEnrollmentsByUser = async (userId) => {
  try {
    return await getEnrollmentsByUserFromDb(userId);
  } catch (error) {
    logger.error('ENROLLMENT: Failed to fetch enrollments by user', { error: error.message, userId });
    return { success: false, error: error.message };
  }
};

// Get enrollments by class ID - with performance monitoring
export const getEnrollmentsByClass = async (classId) => {
  try {
    return await getEnrollmentsByClassFromDb(classId);
  } catch (error) {
    logger.error('ENROLLMENT: Failed to fetch enrollments by class', { error: error.message, classId });
    return { success: false, error: error.message };
  }
};

/**
 * Get students enrolled in a class with their user data
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getStudentsByClass = async (classId) => {
  try {
    // Get enrollments for this class
    const enrollmentsResult = await getEnrollmentsByClassFromDb(classId);
    
    if (!enrollmentsResult.success) {
      return enrollmentsResult;
    }
    
    const enrollmentIds = enrollmentsResult.data
      .map(enrollment => enrollment.userId)
      .filter(Boolean);
    
    if (enrollmentIds.length === 0) {
      return { success: true, data: [] };
    }
    
    // Fetch user data for all enrolled students
    const studentsData = await Promise.all(
      enrollmentIds.map(async (studentId) => {
        const userResult = await getUserById(studentId);
        if (userResult.success && userResult.data) {
          const data = userResult.data;
          return { id: studentId, ...data, displayName: data.displayName || data.email };
        }
        return null;
      })
    );
    
    // Filter out null values
    const students = studentsData.filter(Boolean);
    return { success: true, data: students };
  } catch (error) {
    logger.error('Error fetching students by class:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// ENROLLMENT MANAGEMENT FUNCTIONS (moved from enrollmentManagementService.js)
// ============================================================================

/**
 * Get class document with disabled students information
 * @param {string} classId - The class ID
 * @returns {Promise<Object>} Class data with disabled students array
 */
export const getClassWithDisabledStudents = async (classId) => {
  try {
    // Use database service to get class data
    const classResult = await getClassById(classId);
    
    if (!classResult.success) {
      return classResult;
    }
    
    return {
      success: true,
      data: {
        ...classResult.data,
        disabledStudents: classResult.data.disabledStudents || []
      }
    };
  } catch (error) {
    logger.error('Error fetching class with disabled students:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users from Firestore
 * @returns {Promise<Object>} Result with users array
 */
export const getAllUsers = async () => {
  try {
    // Use user service to get all users
    const { getUsers } = await import('./userService');
    const result = await getUsers();
    
    if (result.success) {
      // Transform data to match expected format
      const allUsers = result.data.map(user => ({
        docId: user.id,
        id: user.id,
        ...user
      }));
      return { success: true, data: allUsers };
    }
    
    return result;
  } catch (error) {
    logger.error('Error fetching all users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enrolled students for a specific class with disabled status
 * @param {string} classId - The class ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with enrolled students array
 */
export const getEnrolledStudents = async (classId, options = {}) => {
  try {
    // Get class document to check disabledStudents
    const classResult = await getClassWithDisabledStudents(classId);
    if (!classResult.success) {
      throw new Error(classResult.error);
    }
    
    const { disabledStudents } = classResult.data;

    // Get enrollments for this class
    const enrollmentsResult = await getEnrollments();
    if (!enrollmentsResult.success) {
      throw new Error(enrollmentsResult.error);
    }
    
    const classEnrollments = (enrollmentsResult.data || []).filter(e => {
      const eClassId = e.classId || e.classDocId;
      const matchesClass = String(eClassId) === String(classId);
      const isStudentRole = e.role === 'student' || e.role === 'Student';
      return matchesClass && isStudentRole;
    });

    logger.debug('🔍 [EnrollmentManagement] Class enrollments:', classEnrollments);

    // Get user IDs from enrollments
    const studentIds = classEnrollments.map(e => {
      const uid = e.userId || e.userDocId;
      return uid;
    }).filter(Boolean);

    // Get all users
    const usersResult = await getAllUsers();
    if (!usersResult.success) {
      throw new Error(usersResult.error);
    }
    
    const allUsers = usersResult.data;

    // Filter: must be a student AND enrolled in this class
    const enrolledStudents = allUsers.filter(u => {
      const userId = u.docId || u.id;
      
      // Find enrollment for this user
      const enrollmentForUser = classEnrollments.find(e => {
        const eUserId = e.userId || e.userDocId;
        return String(eUserId) === String(userId);
      });
      
      // User is considered a student if:
      // 1. They have an enrollment with role 'student', OR
      // 2. Their user doc has role 'student' (fallback)
      const isStudent = enrollmentForUser ? 
        (enrollmentForUser.role === 'student' || enrollmentForUser.role === 'Student') :
        (u.role === 'student' || u.role === 'Student');
      
      // Check if user is archived or deleted - exclude them
      if (u.archived || u.deleted) {
        return false;
      }
      
      // Try multiple matching strategies
      const isEnrolled = studentIds.some(sid => {
        // Normalize both IDs to strings for comparison
        const normalizedSid = String(sid).trim();
        const normalizedUserId = String(userId).trim();
        return normalizedSid === normalizedUserId;
      });
      
      return isStudent && isEnrolled;
    });

    // Add disabled status
    const studentsWithStatus = enrolledStudents.map(s => ({
      ...s,
      isDisabled: disabledStudents.includes(s.docId || s.id)
    }));

    return { success: true, data: studentsWithStatus };
  } catch (error) {
    logger.error('Error getting enrolled students:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle student access (enable/disable) in a class
 * @param {string} classId - The class ID
 * @param {string} studentId - The student ID
 * @param {boolean} currentlyDisabled - Current disabled status
 * @param {Object} options - Additional options (studentEmail, className, etc.)
 * @returns {Promise<Object>} Result of the operation
 */
export const toggleStudentAccess = async (classId, studentId, currentlyDisabled, options = {}) => {
  try {
    const { studentEmail, studentName, className, instructorName, lang = 'en' } = options;
    
    // Get current class data
    const classResult = await getClassById(classId);
    if (!classResult.success) {
      return { success: false, error: 'Class not found' };
    }
    
    const currentDisabledStudents = classResult.data.disabledStudents || [];
    let updatedDisabledStudents;
    
    if (currentlyDisabled) {
      // Enable student (remove from disabledStudents array)
      updatedDisabledStudents = currentDisabledStudents.filter(id => id !== studentId);
      
      // Log activity
      await logActivity(ACTIVITY_LOG_TYPES.STUDENT_ACCESS_ENABLED, {
        classId,
        studentId,
        studentEmail,
        className: className || 'Unknown Class'
      });
      
      // Send notification
      try {
        await notificationGateway.sendStudentAccessEnabled({
          studentEmail,
          studentName,
          className,
          instructorName,
          lang
        });
      } catch (notificationError) {
        logger.warn('Failed to send student access enabled notification:', notificationError);
      }
      
    } else {
      // Disable student (add to disabledStudents array)
      updatedDisabledStudents = [...new Set([...currentDisabledStudents, studentId])];
      
      // Log activity
      await logActivity(ACTIVITY_LOG_TYPES.STUDENT_ACCESS_DISABLED, {
        classId,
        studentId,
        studentEmail,
        className: className || 'Unknown Class'
      });
      
      // Send notification
      try {
        await notificationGateway.sendStudentAccessDisabled({
          studentEmail,
          studentName,
          className,
          instructorName,
          lang
        });
      } catch (notificationError) {
        logger.warn('Failed to send student access disabled notification:', notificationError);
      }
    }
    
    // Update class with new disabledStudents array
    const updateResult = await updateClass(classId, { disabledStudents: updatedDisabledStudents });
    
    return { 
      success: updateResult.success, 
      data: { 
        enabled: currentlyDisabled,
        disabled: !currentlyDisabled,
        notificationSent: true
      }
    };
  } catch (error) {
    logger.error('Error toggling student access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enroll a student in a class
 * @param {string} classId - The class ID
 * @param {string} studentId - The student ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the operation
 */
export const enrollStudent = async (classId, studentId, options = {}) => {
  try {
    const { studentEmail, studentName, className, instructorName, lang = 'en' } = options;
    
    // Create enrollment document
    const enrollmentData = {
      userId: studentId,
      classId,
      role: 'student',
      enrolledAt: new Date(),
      enrolledBy: instructorName || 'System'
    };
    
    // Use database service to create enrollment
    const result = await setEnrollmentToDb(`${studentId}_${classId}`, enrollmentData);
    
    if (!result.success) {
      return result;
    }
    
    // Log activity
    await logActivity(ACTIVITY_LOG_TYPES.STUDENT_ENROLLED, {
      classId,
      studentId,
      studentEmail,
      className: className || 'Unknown Class'
    });
    
    // Send notification
    try {
      await notificationGateway.sendStudentEnrolled({
        studentEmail,
        studentName,
        className,
        instructorName,
        lang
      });
    } catch (notificationError) {
      logger.warn('Failed to send student enrolled notification:', notificationError);
    }
    
    return { success: true, data: enrollmentData };
  } catch (error) {
    logger.error('Error enrolling student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unenroll a student from a class
 * @param {string} classId - The class ID
 * @param {string} studentId - The student ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the operation
 */
export const unenrollStudent = async (classId, studentId, options = {}) => {
  try {
    const { studentEmail, studentName, className, instructorName, lang = 'en' } = options;
    
    // Use database service to delete enrollment
    const enrollmentId = `${studentId}_${classId}`;
    const deleteResult = await deleteEnrollmentFromDb(enrollmentId);
    
    if (!deleteResult.success) {
      throw new Error('Enrollment not found or could not be deleted');
    }
    
    // Remove from disabledStudents if present
    const classResult = await getClassById(classId);
    if (classResult.success) {
      const currentDisabledStudents = classResult.data.disabledStudents || [];
      const updatedDisabledStudents = currentDisabledStudents.filter(id => id !== studentId);
      
      await updateClass(classId, { disabledStudents: updatedDisabledStudents });
    }
    
    // Log activity
    await logActivity(ACTIVITY_LOG_TYPES.STUDENT_UNENROLLED, {
      classId,
      studentId,
      studentEmail,
      className: className || 'Unknown Class'
    });
    
    // Send notification
    try {
      await notificationGateway.sendStudentUnenrolled({
        studentEmail,
        studentName,
        className,
        instructorName,
        lang
      });
    } catch (notificationError) {
      logger.warn('Failed to send student unenrolled notification:', notificationError);
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error unenrolling student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a student has access to a class
 * @param {string} classId - The class ID
 * @param {string} studentId - The student ID
 * @returns {Promise<Object>} Access check result
 */
export const checkStudentAccess = async (classId, studentId) => {
  try {
    // Get class info
    const classResult = await getClassWithDisabledStudents(classId);
    if (!classResult.success) {
      throw new Error(classResult.error);
    }
    
    const { disabledStudents } = classResult.data;
    const isDisabled = disabledStudents.includes(studentId);
    
    return {
      success: true,
      data: {
        hasAccess: !isDisabled,
        isDisabled,
        classId,
        studentId
      }
    };
  } catch (error) {
    logger.error('Error checking student access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get class statistics including enrollment counts
 * @param {string} classId - The class ID
 * @returns {Promise<Object>} Result with class statistics
 */
export const getClassStatistics = async (classId) => {
  try {
    const studentsResult = await getEnrolledStudents(classId);
    if (!studentsResult.success) {
      throw new Error(studentsResult.error);
    }
    
    const students = studentsResult.data || [];
    const totalStudents = students.length;
    const activeStudents = students.filter(s => !s.isDisabled).length;
    const disabledStudents = students.filter(s => s.isDisabled).length;
    
    return {
      success: true,
      data: {
        totalStudents,
        activeStudents,
        disabledStudents,
        students
      }
    };
  } catch (error) {
    logger.error('Error getting class statistics:', error);
    return { success: false, error: error.message };
  }
};

