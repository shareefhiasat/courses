import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit as firebaseLimit
} from 'firebase/firestore';
import { db } from '../other/config';
import { notificationGateway } from './notificationGateway';
import { sendEmail } from './emailService';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import logger from '../../utils/logger';

// ===== Notifications =====
// Model: collection "notifications" documents { userId, title, message, type, read, createdAt, data? }

export const getNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addNotification = async (notification) => {
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
      readAt: null,
      createdAt: serverTimestamp()
    };
    
    // Preserve existing data field if provided
    if (notification.data) {
      notificationData.data = notification.data;
    }
    
    const ref = await addDoc(collection(db, 'notifications'), notificationData);
    
    // Also log to notificationLogs for analytics
    try {
      await addDoc(collection(db, 'notificationLogs'), {
        ...notificationData,
        notificationId: ref.id,
        timestamp: serverTimestamp()
      });
    } catch (logError) {
      console.warn('Failed to log notification to notificationLogs:', logError);
    }
    
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const qs = await getDocs(q);
    const updates = [];
    qs.forEach(d => {
      updates.push(updateDoc(doc(db, 'notifications', d.id), { read: true }));
    });
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const archiveNotification = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { archived: true, archivedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markNotificationUnread = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: false, readAt: null });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time notifications listener
export const subscribeToNotifications = (userId, callback, includeArchived = false) => {
  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  ];
  
  if (!includeArchived) {
    constraints.push(where('archived', '!=', true));
  }
  
  const q = query(collection(db, 'notifications'), ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    callback(notifications);
  });
};

// Bulk notification helpers
export const notifyAllUsers = async (title, message, type = 'info', data = null) => {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const notifications = [];
    
    usersSnapshot.forEach(userDoc => {
      notifications.push(addNotification({
        userId: userDoc.id,
        title,
        message,
        type,
        data
      }));
    });
    
    await Promise.all(notifications);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const notifyUsersByClass = async (classId, title, message, type = 'info', data = null) => {
  try {
    // Get enrollments for this class
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('classId', '==', classId)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const notifications = [];
    
    enrollmentsSnapshot.forEach(enrollmentDoc => {
      const enrollment = enrollmentDoc.data();
      notifications.push(addNotification({
        userId: enrollment.userId,
        title,
        message,
        type,
        data: { ...data, classId }
      }));
    });
    
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
      console.error('Error sending system notification:', error);
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
      console.error('Error sending email notification:', error);
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
    const logEntry = {
      ...activity,
      timestamp: new Date().toISOString(),
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Store in notificationLogs collection
    await addDoc(collection(db, 'notificationLogs'), logEntry);
    
    // Also log to console for development
    logger.log('🔔 Notification Activity:', {
      trigger: activity.trigger,
      channel: activity.channel,
      userId: activity.userId,
      success: activity.success,
      timestamp: logEntry.timestamp
    });
    
    return { success: true, logId: logEntry.id };
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
