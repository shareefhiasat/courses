import { notificationGateway } from './notificationGateway';
import { sendEmail } from './emailService';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import logger from '@utils/logger';
import { 
  getNotifications as getNotificationsFromDb,
  create as createNotificationToDb,
  markNotificationAsRead as markNotificationAsReadInDb,
  markAllNotificationsAsRead as markAllNotificationsAsReadInDb,
  archiveNotification as archiveNotificationInDb,
  deleteNotification as deleteNotificationFromDb,
  onNotificationsChange as onNotificationsChangeFromDb,
  logNotificationActivity as logNotificationActivityFromDb
} from '../db/notificationDbService';

// ===== Notifications =====
// Model: collection "notifications" documents { userId, title, message, type, read, createdAt, data? }

export const getNotifications = async (userId) => {
  try {
    return await getNotificationsFromDb(userId);
  } catch (error) {
    logger.error('Error getting notifications:', error);
    return { success: false, error: error.message };
  }
};

export const addNotification = async (notification, user) => {
  try {
    const notificationData = {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info', // system, class, quiz, attendance, activity, info
      classId: notification.classId || null,
      metadata: notification.metadata || {},
      deliveryStatus: 'sent', // sent, failed, pending
      read: false,
      readAt: null
    };
    
    // Preserve existing data field if provided
    if (notification.data) {
      notificationData.data = notification.data;
    }
    
    const result = await createNotificationToDb(notificationData, user);
    
    if (result.success) {
      // Also log to notificationLogs for analytics
      try {
        const { logNotificationActivity } = await import('../db/notificationDbService');
        await logNotificationActivity({
          ...notificationData,
          notificationId: result.id,
          timestamp: new Date().toISOString()
        });
      } catch (logError) {
        logger.warn('Failed to log notification to notificationLogs:', logError);
      }
      
      return { success: true, id: result.id };
    }
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    return await markNotificationAsReadInDb(notificationId);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    return await markAllNotificationsAsReadInDb(userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    return await deleteNotificationFromDb(notificationId);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const archiveNotification = async (notificationId) => {
  try {
    return await archiveNotificationInDb(notificationId);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markNotificationUnread = async (notificationId) => {
  try {
    // This function needs to be implemented in the DB service
    const { markNotificationAsUnread } = await import('../db/notificationDbService');
    return await markNotificationAsUnread(notificationId);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time notifications listener
export const subscribeToNotifications = (userId, callback, includeArchived = false) => {
  try {
    return onNotificationsChangeFromDb(userId, callback, includeArchived);
  } catch (error) {
    logger.error('Error setting up notifications listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Bulk notification helpers
export const notifyAllUsers = async (title, message, type = 'info', data = null) => {
  try {
    // Get all users
    const { getUsers } = await import('./userService');
    const usersResult = await getUsers();
    
    if (!usersResult.success) {
      return usersResult;
    }
    
    const notifications = [];
    
    for (const user of usersResult.data) {
      notifications.push(addNotification({
        userId: user.id,
        title,
        message,
        type,
        data
      }));
    }
    
    await Promise.all(notifications);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const notifyUsersByClass = async (classId, title, message, type = 'info', data = null) => {
  try {
    // Get enrollments for this class
    const { getEnrollmentsByClass } = await import('./enrollmentService');
    const enrollmentsResult = await getEnrollmentsByClass(classId);
    
    if (!enrollmentsResult.success) {
      return enrollmentsResult;
    }
    
    const notifications = [];
    
    for (const enrollment of enrollmentsResult.data) {
      notifications.push(addNotification({
        userId: enrollment.userId,
        title,
        message,
        type,
        data: { ...data, classId }
      }));
    }
    
    await Promise.all(notifications);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== HIGH-LEVEL NOTIFICATION FUNCTIONS =====

/**
 * Send a notification and/or email to a student
 */
export const sendStudentNotification = async ({
  userId,
  email,
  title,
  message,
  type,
  templateId,
  variables,
  sendSystem = true,
  sendEmailNotification = true
}) => {
  const results = { system: null, email: null };

  if (sendSystem && userId) {
    try {
      results.system = await addNotification({
        userId,
        title,
        message,
        type,
        metadata: { ...variables, sentAt: new Date().toISOString() }
      });
    } catch (error) {
      logger.error('Error sending system notification:', error);
      results.system = { success: false, error: error.message };
    }
  }

  if (sendEmailNotification && email && templateId) {
    try {
      results.email = await sendEmail({
        to: email,
        templateId,
        variables: {
          ...variables,
          link: window.location.origin + '/dashboard',
          siteName: 'QAF Learning Management System',
          currentDate: new Date().toLocaleDateString('en-GB')
        }
      });
    } catch (error) {
      logger.error('Error sending email notification:', error);
      results.email = { success: false, error: error.message };
    }
  }

  return results;
};

/**
 * Send quiz availability notification
 */
export async function sendQuizAvailable(quiz, students) {
  try {
    const notifications = [];

    for (const student of students) {
      // Use notification gateway for centralized management
      await notificationGateway.send(NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE, {
        userId: student.id,
        role: 'student',
        classId: quiz.classId || null,
        title: 'notify.quiz_available.title',
        message: 'notify.quiz_available.message',
        variables: {
          quizTitle: quiz.title,
          dueDate: formatDate(quiz.settings.dueDate)
        },
        metadata: {
          quizId: quiz.id,
          quizTitle: quiz.title,
          dueDate: quiz.settings.dueDate
        },
        data: { quizId: quiz.id },
        templateId: 'quizAvailable',
        email: student.email
      });

      notifications.push({ success: true, userId: student.id });
    }

    return { success: true, data: notifications };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send deadline reminders
 */
export async function sendDeadlineReminders(assignments, students) {
  try {
    const notifications = [];

    for (const assignment of assignments) {
      for (const student of students) {
        // Use notification gateway for centralized management
        await notificationGateway.send(NOTIFICATION_TRIGGERS.ACTIVITY_NEW, {
          userId: student.id,
          role: 'student',
          classId: assignment.classId || null,
          title: 'notify.activity_new.title',
          message: 'notify.activity_new.message',
          variables: {
            activityTitle: assignment.title,
            dueDate: formatDate(assignment.dueDate)
          },
          metadata: {
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            dueDate: assignment.dueDate
          },
          data: { assignmentId: assignment.id },
          templateId: 'deadlineReminder',
          email: student.email
        });

        notifications.push({ success: true, userId: student.id });
      }
    }

    return { success: true, data: notifications };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send grade released notification
 */
export async function sendGradeReleased(grade, student) {
  try {
    // Use notification gateway for centralized management
    await notificationGateway.send(NOTIFICATION_TRIGGERS.ACTIVITY_GRADED, {
      userId: student.id,
      role: 'student',
      classId: grade.classId || null,
      title: 'notify.activity_graded.title',
      message: 'notify.activity_graded.message',
      variables: {
        activityTitle: grade.title,
        grade: grade.score,
        totalScore: grade.maxScore
      },
      metadata: {
        gradeId: grade.id,
        assignmentTitle: grade.title,
        score: grade.score,
        maxScore: grade.maxScore
      },
      data: { gradeId: grade.id },
      templateId: 'gradeReleased',
      email: student.email
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification
 */
export async function sendPushNotification(userId, title, message, data = {}, trigger = null) {
  try {
    // Use notification gateway for centralized management
    // Allow trigger parameter for flexibility, fallback to ANNOUNCEMENT_NEW for backward compatibility
    const notificationTrigger = trigger || NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW;
    
    return await notificationGateway.send(notificationTrigger, {
      userId,
      title,
      message,
      variables: {},
      metadata: {
        ...data,
        pushSent: true,
        sentAt: new Date().toISOString()
      },
      templateId: null
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Schedule reminders
 */
export async function scheduleReminders(reminders) {
  try {
    const notifications = [];
    
    for (const reminder of reminders) {
      // Use notification gateway for centralized management
      const notification = await notificationGateway.send(NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW, {
        userId: reminder.userId,
        title: reminder.title,
        message: reminder.message,
        variables: {},
        metadata: {
          reminderId: reminder.id,
          scheduledAt: new Date().toISOString(),
          scheduledFor: reminder.scheduledFor
        },
        templateId: null
      });
      notifications.push(notification);
    }

    return { success: true, data: notifications };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== NOTIFICATION LOGGING & FILTERING =====

/**
 * Log notification activity for tracking and debugging
 */
export async function logNotificationActivity(activity) {
  try {
    // Use the database service instead of direct Firebase access
    return await logNotificationActivityFromDb(activity);
  } catch (error) {
    logger.error('Error logging notification activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get notifications by type (trigger)
 */
export async function getNotificationsByType(userId, trigger, limit = 50) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('metadata.trigger', '==', trigger),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get notifications by category (activity, announcement, quiz, etc.)
 */
export async function getNotificationsByCategory(userId, category, limit = 50) {
  try {
    // Define category to trigger mappings
    const categoryTriggers = {
      'activity': [
        NOTIFICATION_TRIGGERS.ACTIVITY_NEW,
        NOTIFICATION_TRIGGERS.ACTIVITY_GRADED
      ],
      'announcement': [
        NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW
      ],
      'quiz': [
        NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE
      ],
      'attendance': [
        NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED,
        NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT
      ],
      'behavior': [
        NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED,
        NOTIFICATION_TRIGGERS.PENALTY_ISSUED
      ],
      'participation': [
        NOTIFICATION_TRIGGERS.PARTICIPATION_RECORDED
      ],
      'resource': [
        NOTIFICATION_TRIGGERS.RESOURCE_NEW
      ]
    };

    const triggers = categoryTriggers[category] || [];
    
    if (triggers.length === 0) {
      return { success: true, data: [] };
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('metadata.trigger', 'in', triggers),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get notification statistics for monitoring
 */
export async function getNotificationStats(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'desc')
    );
    const qs = await getDocs(q);
    
    const stats = {
      total: qs.size,
      byTrigger: {},
      byType: {},
      read: 0,
      unread: qs.size
    };
    
    qs.forEach(doc => {
      const data = doc.data();
      const trigger = data.metadata?.trigger || 'unknown';
      const type = data.type || 'info';
      
      stats.byTrigger[trigger] = (stats.byTrigger[trigger] || 0) + 1;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      if (data.read) {
        stats.read++;
        stats.unread--;
      }
    });
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get notification logs for admin monitoring
 */
export async function getNotificationLogs(filters = {}, limitCount = 100) {
  try {
    let q = query(
      collection(db, 'notificationLogs'),
      orderBy('timestamp', 'desc'),
      firebaseLimit(limitCount)
    );
    
    // Apply filters if provided
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    if (filters.trigger) {
      q = query(q, where('trigger', '==', filters.trigger));
    }
    
    if (filters.channel) {
      q = query(q, where('channel', '==', filters.channel));
    }
    
    if (filters.success !== undefined && filters.success !== null && filters.success !== '') {
      q = query(q, where('success', '==', filters.success === 'true' || filters.success === true));
    }
    
    if (filters.startDate) {
      q = query(q, where('timestamp', '>=', filters.startDate));
    }
    
    if (filters.endDate) {
      q = query(q, where('timestamp', '<=', filters.endDate));
    }
    
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Format date for notifications
 */
// ===== NOTIFICATION SETTINGS =====

/**
 * Get notification settings for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getNotificationSettings = async (userId) => {
  try {
    if (!userId) return { success: false, error: 'User ID is required' };
    const { getUserById } = await import('./userService');
    const result = await getUserById(userId);
    if (!result.success) return { success: false, error: result.error };
    const data = result.data;
    return {
      success: true,
      data: {
        soundEnabled: data.notificationSoundEnabled !== false,
        vibrationEnabled: data.notificationVibrationEnabled !== false,
        browserNotificationsEnabled: data.browserNotificationsEnabled !== false,
        permissionsRequested: data.notificationPermissionsRequested || false
      }
    };
  } catch (error) {
    logger.error('NOTIFICATION: Failed to get notification settings', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Save notification settings for a user
 * @param {string} userId - User ID
 * @param {Object} settings - Settings object
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveNotificationSettings = async (userId, settings) => {
  try {
    if (!userId) return { success: false, error: 'User ID is required' };
    const { updateUser } = await import('./userService');
    return await updateUser(userId, {
      notificationSoundEnabled: settings.soundEnabled,
      notificationVibrationEnabled: settings.vibrationEnabled,
      browserNotificationsEnabled: settings.browserNotificationsEnabled,
      notificationPermissionsRequested: settings.permissionsRequested
    });
  } catch (error) {
    logger.error('NOTIFICATION: Failed to save notification settings', { error: error.message });
    return { success: false, error: error.message };
  }
};

function formatDate(date) {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ===== USER NOTIFICATIONS =====
// Centralized user notification methods using the notification gateway

/**
 * Send welcome email to a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.role - User's role
 * @param {string} userData.displayName - User's display name
 * @param {string} userData.userId - User's ID (optional)
 * @param {string} userData.lang - User's language (optional, defaults to 'en')
 */
export const sendUserWelcomeEmail = async (userData) => {
  const { email, role, displayName, userId, lang = 'en' } = userData;
  
  try {
    logger.info('👋 Sending user welcome notification', { email, role, displayName });
    
    const result = await notificationGateway.sendWelcomeNotification(
      email, 
      role, 
      displayName, 
      userId, 
      lang
    );
    
    return result;
  } catch (error) {
    logger.error('❌ Failed to send user welcome notification', { 
      email, 
      role, 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email to user
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.role - User's role
 * @param {string} userData.displayName - User's display name
 * @param {string} userData.userId - User's ID (optional)
 * @param {string} userData.lang - User's language (optional, defaults to 'en')
 */
export const sendUserPasswordReset = async (userData) => {
  const { email, role, displayName, userId, lang = 'en' } = userData;
  
  try {
    logger.info('🔑 Sending user password reset notification', { email, role });
    
    const result = await notificationGateway.send(NOTIFICATION_TRIGGERS.PASSWORD_RESET, {
      email,
      role,
      userId,
      lang,
      variables: {
        email,
        role,
        displayName: displayName || email.split('@')[0],
        resetUrl: `${window.location.origin}/reset-password`,
        loginUrl: `${window.location.origin}/login`,
        siteName: 'QAF Learning Hub',
        siteUrl: window.location.origin
      }
    });
    
    return result;
  } catch (error) {
    logger.error('❌ Failed to send user password reset notification', { 
      email, 
      role, 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send QR code email to student
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.role - User's role
 * @param {string} userData.displayName - User's display name
 * @param {string} userData.studentNumber - Student's number
 * @param {string} userData.userId - User's ID (optional)
 * @param {string} userData.lang - User's language (optional, defaults to 'en')
 */
export const sendUserQRCode = async (userData) => {
  const { email, role, displayName, studentNumber, userId, lang = 'en' } = userData;
  
  try {
    logger.info('📱 Sending user QR code notification', { email, role, studentNumber });
    
    const result = await notificationGateway.send(NOTIFICATION_TRIGGERS.QR_CODE_SENT, {
      email,
      role,
      userId,
      lang,
      variables: {
        email,
        role,
        displayName: displayName || email.split('@')[0],
        studentNumber,
        qrUrl: `${window.location.origin}/qrcode/${studentNumber}`,
        loginUrl: `${window.location.origin}/login`,
        siteName: 'QAF Learning Hub',
        siteUrl: window.location.origin
      }
    });
    
    return result;
  } catch (error) {
    logger.error('❌ Failed to send user QR code notification', { 
      email, 
      role, 
      studentNumber,
      error: error.message 
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send enrollment confirmation email
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.role - User's role
 * @param {string} userData.displayName - User's display name
 * @param {string} userData.className - Class name
 * @param {string} userData.userId - User's ID (optional)
 * @param {string} userData.lang - User's language (optional, defaults to 'en')
 */
export const sendUserEnrollmentConfirmation = async (userData) => {
  const { email, role, displayName, className, userId, lang = 'en' } = userData;
  
  try {
    logger.info('✅ Sending user enrollment confirmation', { email, role, className });
    
    const result = await notificationGateway.send(NOTIFICATION_TRIGGERS.ENROLLMENT_CONFIRMED, {
      email,
      role,
      userId,
      lang,
      variables: {
        email,
        role,
        displayName: displayName || email.split('@')[0],
        className,
        loginUrl: `${window.location.origin}/login`,
        dashboardUrl: `${window.location.origin}/dashboard`,
        siteName: 'QAF Learning Hub',
        siteUrl: window.location.origin
      }
    });
    
    return result;
  } catch (error) {
    logger.error('❌ Failed to send user enrollment confirmation', { 
      email, 
      role, 
      className,
      error: error.message 
    });
    return { success: false, error: error.message };
  }
};

// Export all user notifications as a unified object
export const userNotifications = {
  welcome: sendUserWelcomeEmail,
  passwordReset: sendUserPasswordReset,
  qrCode: sendUserQRCode,
  enrollmentConfirmation: sendUserEnrollmentConfirmation
};
