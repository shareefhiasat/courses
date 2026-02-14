/**
 * QR Code Email Service
 * 
 * PURPOSE:
 * Service for sending QR codes via email to students. This service handles
 * the business logic for generating and emailing student QR codes using
 * the Firebase Cloud Function.
 * 
 * USAGE:
 * Import these functions in business services, UI components, or hooks.
 * This service abstracts the complexity of QR code email delivery.
 * 
 * ARCHITECTURE:
 * - Firebase Cloud Function integration
 * - Error handling and validation
 * - Activity logging
 * - Toast notification integration
 * 
 * EXAMPLES:
 * ```javascript
 * // In business service:
 * import { sendQRCodeEmail } from '@services/business/qrCodeEmailService';
 * 
 * const result = await sendQRCodeEmail(studentId, studentEmail);
 * 
 * if (result.success) {
 *   toast?.showSuccess('QR code email sent successfully');
 * }
 * ```
 * 
 * @author Service Layer Architecture
 * @since v2.0.0
 */

import logger from '@utils/logger';
import analytics from '@utils/analytics';

/**
 * Send QR code email to student
 * @param {string} studentId - Student's document ID
 * @param {string} studentEmail - Student's email address
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendQRCodeEmail = async (studentId, studentEmail) => {
  const startTime = Date.now();
  
  try {
    // Validate inputs
    if (!studentId || !studentEmail) {
      throw new Error('Student ID and email are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      throw new Error('Invalid email format');
    }

    logger.info('QR_CODE_EMAIL: Sending QR code email', { 
      studentId, 
      studentEmail,
      timestamp: new Date().toISOString()
    });

    // Import Firebase functions dynamically
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    
    // Call the Firebase function
    const sendQRCodeFn = httpsCallable(functions, 'sendQRCodeEmail');
    const result = await sendQRCodeFn({
      studentId,
      studentEmail
    });

    if (result.data?.success) {
      logger.info('QR_CODE_EMAIL: QR code email sent successfully', {
        studentId,
        studentEmail,
        messageId: result.data.messageId
      });

      analytics.trackFirebaseOperation('qr_code_email_send', true, Date.now() - startTime);
      
      return {
        success: true,
        messageId: result.data.messageId,
        message: result.data.message || 'QR code email sent successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(result.data?.message || 'Failed to send QR code email');
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    analytics.trackFirebaseOperation('qr_code_email_send', false, duration);
    
    logger.error('QR_CODE_EMAIL: Failed to send QR code email', {
      studentId,
      studentEmail,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });

    // Handle Firebase function errors
    let userFriendlyMessage = 'Failed to send QR code email';
    
    if (error.code === 'unauthenticated') {
      userFriendlyMessage = 'You must be authenticated to send QR code emails';
    } else if (error.code === 'invalid-argument') {
      userFriendlyMessage = 'Invalid student information provided';
    } else if (error.code === 'not-found') {
      userFriendlyMessage = 'Student not found';
    } else if (error.code === 'failed-precondition') {
      userFriendlyMessage = 'Email configuration not found. Please contact administrator.';
    } else if (error.code === 'unavailable') {
      userFriendlyMessage = 'Email service temporarily unavailable. Please try again later.';
    } else if (error.code === 'permission-denied') {
      userFriendlyMessage = 'You do not have permission to send QR code emails';
    } else if (error.message) {
      userFriendlyMessage = error.message;
    }

    return {
      success: false,
      error: userFriendlyMessage,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Send QR code email with additional student data
 * @param {Object} student - Student object with id, email, displayName, etc.
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendQRCodeEmailToStudent = async (student) => {
  if (!student) {
    throw new Error('Student object is required');
  }

  const studentId = student.docId || student.id;
  const studentEmail = student.email;
  const studentName = student.displayName || student.realName || 'Student';

  if (!studentId || !studentEmail) {
    throw new Error('Student must have ID and email');
  }

  logger.info('QR_CODE_EMAIL: Sending QR code email to student', {
    studentId,
    studentEmail,
    studentName,
    timestamp: new Date().toISOString()
  });

  return await sendQRCodeEmail(studentId, studentEmail);
};

/**
 * Send QR code emails to multiple students (batch)
 * @param {Array} students - Array of student objects
 * @returns {Promise<Object>} - Batch result with success/failure counts
 */
export const sendQRCodeEmailBatch = async (students) => {
  if (!Array.isArray(students) || students.length === 0) {
    throw new Error('Students array is required');
  }

  const startTime = Date.now();
  const results = [];
  
  logger.info('QR_CODE_EMAIL: Starting batch QR code email sending', {
    studentCount: students.length,
    timestamp: new Date().toISOString()
  });

  for (const student of students) {
    try {
      const result = await sendQRCodeEmailToStudent(student);
      results.push({
        student,
        ...result
      });
      
      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        student,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const duration = Date.now() - startTime;

  logger.info('QR_CODE_EMAIL: Batch QR code email sending completed', {
    totalSent: students.length,
    successful,
    failed,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });

  analytics.trackEmailOperation('qr_code_batch', students.length, failed === 0, {
    successful,
    failed,
    duration
  });

  return {
    success: failed === 0,
    totalSent: students.length,
    successful,
    failed,
    results,
    duration,
    timestamp: new Date().toISOString()
  };
};

/**
 * Get QR code email service status
 * @returns {Object} - Service status information
 */
export const getQRCodeEmailStatus = () => {
  return {
    available: true,
    features: {
      singleEmail: true,
      batchEmail: true,
      attachments: true,
      logging: true
    },
    requirements: {
      authentication: true,
      emailConfig: true,
      studentData: true
    }
  };
};

export default {
  sendQRCodeEmail,
  sendQRCodeEmailToStudent,
  sendQRCodeEmailBatch,
  getQRCodeEmailStatus
};
