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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { sendEmail } from './emailService';

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
export async function notifyQuizAvailable(quiz, students) {
  try {
    const notifications = [];

    for (const student of students) {
      await addNotification({
        userId: student.id,
        title: 'New Quiz Available',
        message: `${quiz.title} is now available. Due: ${formatDate(quiz.settings.dueDate)}`,
        type: 'quiz',
        classId: quiz.classId || null,
        metadata: {
          quizId: quiz.id,
          quizTitle: quiz.title,
          dueDate: quiz.settings.dueDate
        },
        data: { quizId: quiz.id }
      });

      try {
        await sendEmail({
          to: student.email,
          template: 'quizAvailable',
          type: 'quiz',
          classId: quiz.classId || null,
          data: {
            studentName: student.displayName || student.email,
            quizTitle: quiz.title,
            quizDescription: quiz.description,
            dueDate: formatDate(quiz.settings.dueDate),
            quizUrl: `${window.location.origin}/quiz/${quiz.id}`,
            estimatedTime: quiz.estimatedTime || 30
          }
        });
      } catch (emailError) {
        console.error('Error sending quiz email:', emailError);
      }

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
        await addNotification({
          userId: student.id,
          title: 'Assignment Deadline Reminder',
          message: `${assignment.title} is due soon. Deadline: ${formatDate(assignment.dueDate)}`,
          type: 'deadline',
          classId: assignment.classId || null,
          metadata: {
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            dueDate: assignment.dueDate
          },
          data: { assignmentId: assignment.id }
        });

        try {
          await sendEmail({
            to: student.email,
            template: 'deadlineReminder',
            type: 'deadline',
            classId: assignment.classId || null,
            data: {
              studentName: student.displayName || student.email,
              assignmentTitle: assignment.title,
              assignmentDescription: assignment.description,
              dueDate: formatDate(assignment.dueDate),
              assignmentUrl: `${window.location.origin}/assignment/${assignment.id}`
            }
          });
        } catch (emailError) {
          console.error('Error sending deadline email:', emailError);
        }

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
export async function notifyGradeReleased(grade, student) {
  try {
    await addNotification({
      userId: student.id,
      title: 'Grade Released',
      message: `Your grade for ${grade.title} has been released. Score: ${grade.score}/${grade.maxScore}`,
      type: 'grade',
      classId: grade.classId || null,
      metadata: {
        gradeId: grade.id,
        assignmentTitle: grade.title,
        score: grade.score,
        maxScore: grade.maxScore
      },
      data: { gradeId: grade.id }
    });

    try {
      await sendEmail({
        to: student.email,
        template: 'gradeReleased',
        type: 'grade',
        classId: grade.classId || null,
        data: {
          studentName: student.displayName || student.email,
          assignmentTitle: grade.title,
          score: grade.score,
          maxScore: grade.maxScore,
          percentage: Math.round((grade.score / grade.maxScore) * 100),
          gradeUrl: `${window.location.origin}/grades/${grade.id}`
        }
      });
    } catch (emailError) {
      console.error('Error sending grade email:', emailError);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification
 */
export async function sendPushNotification(userId, title, message, data = {}) {
  try {
    return await addNotification({
      userId,
      title,
      message,
      type: 'push',
      metadata: {
        ...data,
        pushSent: true,
        sentAt: new Date().toISOString()
      }
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
      const notification = await addNotification({
        userId: reminder.userId,
        title: reminder.title,
        message: reminder.message,
        type: 'reminder',
        scheduledFor: reminder.scheduledFor,
        metadata: {
          reminderId: reminder.id,
          scheduledAt: new Date().toISOString()
        }
      });
      notifications.push(notification);
    }

    return { success: true, data: notifications };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== UTILITY FUNCTIONS =====

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
