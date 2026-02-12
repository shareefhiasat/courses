/**
 * Enrollment Management Service
 * 
 * Handles enrollment-related operations for ManageEnrollmentsPage
 * following the service layer pattern for separation of concerns.
 * Includes notifications and access control enforcement.
 */

import { db } from './config';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { getEnrollments } from './enrollmentService';
import { logActivity, ACTIVITY_LOG_TYPES } from './activityLogger';
import { notificationGateway } from './notificationGateway';
import logger from '@utils/logger';

/**
 * Get class document with disabled students information
 * @param {string} classId - The class ID
 * @returns {Promise<Object>} Class data with disabled students array
 */
export const getClassWithDisabledStudents = async (classId) => {
  try {
    const classDoc = await getDoc(doc(db, 'classes', classId));
    const classData = classDoc.exists() ? classDoc.data() : {};
    return {
      success: true,
      data: {
        ...classData,
        disabledStudents: classData.disabledStudents || []
      }
    };
  } catch (error) {
    logger.error('Failed to get class with disabled students:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all users from Firestore
 * @returns {Promise<Object>} Result with users array
 */
export const getAllUsers = async () => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map(d => ({ 
      docId: d.id, 
      id: d.id, 
      ...d.data() 
    }));
    
    return {
      success: true,
      data: allUsers
    };
  } catch (error) {
    logger.error('Failed to get all users:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get enrolled students for a specific class
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
      
      // Check if enrolled in this class
      const isEnrolled = studentIds.some(sid => {
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

    return {
      success: true,
      data: studentsWithStatus
    };
  } catch (error) {
    logger.error('Failed to get enrolled students:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Toggle student access (enable/disable) for a class
 * @param {string} classId - The class ID
 * @param {string} studentId - The student ID
 * @param {boolean} currentlyDisabled - Current disabled status
 * @param {Object} options - Additional options (studentEmail, className, etc.)
 * @returns {Promise<Object>} Result of the operation
 */
export const toggleStudentAccess = async (classId, studentId, currentlyDisabled, options = {}) => {
  try {
    const { studentEmail, studentName, className, instructorName, lang = 'en' } = options;
    const classRef = doc(db, 'classes', classId);
    
    if (currentlyDisabled) {
      // Enable access - remove from disabledStudents array
      await updateDoc(classRef, {
        disabledStudents: arrayRemove(studentId)
      });
      
      // Log activity
      await logActivity(ACTIVITY_LOG_TYPES.STUDENT_ACCESS_ENABLED, {
        classId,
        studentId,
        studentEmail,
        action: 'enabled'
      });
      
      // Send notification to student
      if (studentEmail) {
        await notificationGateway.send('STUDENT_ACCESS_ENABLED', {
          userId: studentId,
          role: 'student',
          classId: classId,
          email: studentEmail,
          title: 'Access Enabled',
          message: lang === 'ar' 
            ? `تم تفعيل وصولك إلى الفصل ${className || 'غير محدد'}. يمكنك الآن المشاركة في جميع أنشطة الفصل.`
            : `Your access to ${className || 'Unknown Class'} has been enabled. You can now participate in all class activities.`,
          variables: {
            className: className || 'Unknown Class',
            instructorName: instructorName || 'Your Instructor'
          }
        });
      }
      
    } else {
      // Disable access - add to disabledStudents array
      await updateDoc(classRef, {
        disabledStudents: arrayUnion(studentId)
      });
      
      // Log activity
      await logActivity(ACTIVITY_LOG_TYPES.STUDENT_ACCESS_DISABLED, {
        classId,
        studentId,
        studentEmail,
        action: 'disabled'
      });
      
      // Send notification to student
      if (studentEmail) {
        await notificationGateway.send('STUDENT_ACCESS_DISABLED', {
          userId: studentId,
          role: 'student',
          classId: classId,
          email: studentEmail,
          title: 'Access Disabled',
          message: lang === 'ar'
            ? `تم تعطيل وصولك إلى الفصل ${className || 'غير محدد'}. لن تتمكن من المشاركة في أنشطة الفصل حتى يتم تفعيل وصولك مرة أخرى.`
            : `Your access to ${className || 'Unknown Class'} has been disabled. You will not be able to participate in class activities until your access is re-enabled.`,
          variables: {
            className: className || 'Unknown Class',
            instructorName: instructorName || 'Your Instructor'
          }
        });
      }
    }
    
    return {
      success: true,
      data: {
        action: currentlyDisabled ? 'enabled' : 'disabled',
        studentId,
        classId,
        notificationSent: !!studentEmail
      }
    };
  } catch (error) {
    logger.error('Failed to toggle student access:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enroll student in class with notifications
 * @param {string} classId - The class ID
 * @param {string} studentId - The student ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the operation
 */
export const enrollStudent = async (classId, studentId, options = {}) => {
  try {
    const { studentEmail, studentName, className, instructorName, lang = 'en' } = options;
    
    // Add enrollment record
    const enrollmentRef = doc(db, 'enrollments');
    await updateDoc(enrollmentRef, {
      [`${studentId}_${classId}`]: {
        userId: studentId,
        classId,
        role: 'student',
        enrolledAt: new Date(),
        enrolledBy: instructorName || 'System'
      }
    });
    
    // Log activity
    await logActivity(ACTIVITY_LOG_TYPES.STUDENT_ENROLLED, {
      classId,
      studentId,
      studentEmail,
      action: 'enrolled'
    });
    
    // Send notification to student
    if (studentEmail) {
      await notificationGateway.send('STUDENT_ENROLLED', {
        userId: studentId,
        role: 'student',
        classId: classId,
        email: studentEmail,
        title: 'Enrolled in Class',
        message: lang === 'ar'
          ? `تم تسجيلك في الفصل ${className || 'غير محدد'}. يمكنك الآن الوصول إلى جميع مواد الفصل والأنشطة.`
          : `You have been enrolled in ${className || 'Unknown Class'}. You can now access all class materials and activities.`,
        variables: {
          className: className || 'Unknown Class',
          instructorName: instructorName || 'Your Instructor'
        }
      });
    }
    
    return {
      success: true,
      data: {
        action: 'enrolled',
        studentId,
        classId,
        notificationSent: !!studentEmail
      }
    };
  } catch (error) {
    logger.error('Failed to enroll student:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Unenroll student from class with notifications
 * @param {string} classId - The class ID
 * @param {string} studentId - The student ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the operation
 */
export const unenrollStudent = async (classId, studentId, options = {}) => {
  try {
    const { studentEmail, studentName, className, instructorName, lang = 'en' } = options;
    
    // Remove enrollment record
    const enrollmentRef = doc(db, 'enrollments');
    await updateDoc(enrollmentRef, {
      [`${studentId}_${classId}`]: null
    });
    
    // Also remove from disabled students if they were disabled
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      disabledStudents: arrayRemove(studentId)
    });
    
    // Log activity
    await logActivity(ACTIVITY_LOG_TYPES.STUDENT_UNENROLLED, {
      classId,
      studentId,
      studentEmail,
      action: 'unenrolled'
    });
    
    // Send notification to student
    if (studentEmail) {
      await notificationGateway.send('STUDENT_UNENROLLED', {
        userId: studentId,
        role: 'student',
        classId: classId,
        email: studentEmail,
        title: 'Unenrolled from Class',
        message: lang === 'ar'
          ? `تم إلغاء تسجيلك من الفصل ${className || 'غير محدد'}. لن تتمكن من الوصول إلى مواد الفصل بعد الآن.`
          : `You have been unenrolled from ${className || 'Unknown Class'}. You will no longer have access to class materials.`,
        variables: {
          className: className || 'Unknown Class',
          instructorName: instructorName || 'Your Instructor'
        }
      });
    }
    
    return {
      success: true,
      data: {
        action: 'unenrolled',
        studentId,
        classId,
        notificationSent: !!studentEmail
      }
    };
  } catch (error) {
    logger.error('Failed to unenroll student:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if student has access to class (not disabled and enrolled)
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
    
    // Check if student is disabled
    const isDisabled = disabledStudents.includes(studentId);
    
    // Check if student is enrolled
    const enrollmentsResult = await getEnrollments();
    if (!enrollmentsResult.success) {
      throw new Error(enrollmentsResult.error);
    }
    
    const isEnrolled = enrollmentsResult.data.some(e => 
      (e.userId === studentId || e.userDocId === studentId) && 
      (e.classId === classId || e.classDocId === classId) &&
      (e.role === 'student' || e.role === 'Student')
    );
    
    return {
      success: true,
      data: {
        hasAccess: !isDisabled && isEnrolled,
        isDisabled,
        isEnrolled,
        reason: isDisabled ? 'Student access is disabled' : 
                !isEnrolled ? 'Student is not enrolled' : 
                'Student has full access'
      }
    };
  } catch (error) {
    logger.error('Failed to check student access:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get class statistics
 * @param {string} classId - The class ID
 * @returns {Promise<Object>} Result with class statistics
 */
export const getClassStatistics = async (classId) => {
  try {
    const studentsResult = await getEnrolledStudents(classId);
    if (!studentsResult.success) {
      throw new Error(studentsResult.error);
    }
    
    const students = studentsResult.data;
    const totalStudents = students.length;
    const enabledStudents = students.filter(s => !s.isDisabled).length;
    const disabledStudents = totalStudents - enabledStudents;
    
    return {
      success: true,
      data: {
        total: totalStudents,
        enabled: enabledStudents,
        disabled: disabledStudents,
        disabledPercentage: totalStudents > 0 ? (disabledStudents / totalStudents * 100).toFixed(1) : 0
      }
    };
  } catch (error) {
    logger.error('Failed to get class statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
