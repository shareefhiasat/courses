/**
 * Quiz Notifications System (Phase 4.3)
 * Email reminders, push notifications, deadline alerts
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc,
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { sendEmail } from './firestore';

/**
 * Send quiz availability notification
 */
export async function notifyQuizAvailable(quiz, students) {
  try {
    const notifications = [];

    for (const student of students) {
      // In-app notification
      await addDoc(collection(db, 'notifications'), {
        userId: student.id,
        title: 'New Quiz Available',
        message: `${quiz.title} is now available. Due: ${formatDate(quiz.settings.dueDate)}`,
        type: 'quiz_available',
        data: { quizId: quiz.id },
        read: false,
        createdAt: serverTimestamp()
      });

      // Email notification
      try {
        await sendEmail({
          to: student.email,
          template: 'quizAvailable',
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
        console.error(`Failed to send email to ${student.email}:`, emailError);
      }

      notifications.push({ success: true, userId: student.id });
    }

    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error sending quiz available notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send quiz deadline reminder (24 hours before)
 */
export async function sendDeadlineReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find quizzes with deadlines in next 24 hours
    const quizzesRef = collection(db, 'quizzes');
    const q = query(
      quizzesRef,
      where('settings.dueDate', '>=', now),
      where('settings.dueDate', '<=', tomorrow)
    );
    
    const quizzesSnapshot = await getDocs(q);
    const reminders = [];

    for (const quizDoc of quizzesSnapshot.docs) {
      const quiz = { id: quizDoc.id, ...quizDoc.data() };

      // Get students who haven't completed the quiz
      const submissionsRef = collection(db, 'quizSubmissions');
      const submissionsQuery = query(
        submissionsRef,
        where('quizId', '==', quiz.id)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const completedUserIds = new Set(
        submissionsSnapshot.docs.map(doc => doc.data().userId)
      );

      // Get enrolled students
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('classId', '==', quiz.classId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        if (completedUserIds.has(enrollment.userId)) continue;

        // Send reminder
        await addDoc(collection(db, 'notifications'), {
          userId: enrollment.userId,
          title: 'Quiz Deadline Approaching',
          message: `${quiz.title} is due in 24 hours!`,
          type: 'deadline_reminder',
          data: { quizId: quiz.id },
          read: false,
          createdAt: serverTimestamp()
        });

        // Email reminder
        try {
          const userDoc = await getDoc(doc(db, 'users', enrollment.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            await sendEmail({
              to: userData.email,
              template: 'quizDeadlineReminder',
              data: {
                studentName: userData.displayName || userData.email,
                quizTitle: quiz.title,
                dueDate: formatDate(quiz.settings.dueDate),
                quizUrl: `${window.location.origin}/quiz/${quiz.id}`,
                hoursRemaining: Math.round(
                  (new Date(quiz.settings.dueDate) - now) / (1000 * 60 * 60)
                )
              }
            });
          }
        } catch (emailError) {
          console.error('Failed to send deadline reminder email:', emailError);
        }

        reminders.push({ quizId: quiz.id, userId: enrollment.userId });
      }
    }

    return { success: true, data: { count: reminders.length, reminders } };
  } catch (error) {
    console.error('Error sending deadline reminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send grade release notification
 */
export async function notifyGradeReleased(quiz, submission) {
  try {
    // In-app notification
    await addDoc(collection(db, 'notifications'), {
      userId: submission.userId,
      title: 'Quiz Graded',
      message: `Your quiz "${quiz.title}" has been graded. Score: ${submission.percentage}%`,
      type: 'grade_released',
      data: { quizId: quiz.id, submissionId: submission.id },
      read: false,
      createdAt: serverTimestamp()
    });

    // Email notification
    try {
      const userDoc = await getDoc(doc(db, 'users', submission.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await sendEmail({
          to: userData.email,
          template: 'quizGradeReleased',
          data: {
            studentName: userData.displayName || userData.email,
            quizTitle: quiz.title,
            score: submission.score,
            totalPoints: submission.totalPoints,
            percentage: submission.percentage,
            passed: submission.percentage >= (quiz.settings.passingScore || 70),
            resultsUrl: `${window.location.origin}/quiz/${quiz.id}/results/${submission.id}`,
            instructorFeedback: submission.instructorFeedback || ''
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send grade notification email:', emailError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending grade notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification (requires service worker)
 */
export async function sendPushNotification(userId, notification) {
  try {
    // Check if Push API is supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return { success: false, error: 'Push notifications not supported' };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permission denied' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Send push notification
    await registration.showNotification(notification.title, {
      body: notification.message,
      icon: '/logo192.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      data: notification.data,
      actions: [
        { action: 'view', title: 'View Quiz' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule reminder notifications (called by cron job)
 */
export async function scheduleReminders() {
  try {
    // This would typically run on a server via Firebase Cloud Functions
    // For now, we'll implement the logic for deadline reminders
    const result = await sendDeadlineReminders();
    return result;
  } catch (error) {
    console.error('Error scheduling reminders:', error);
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

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId) {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Default preferences
      return {
        email: true,
        push: true,
        quizAvailable: true,
        deadlineReminders: true,
        gradeReleased: true
      };
    }
    
    return docSnap.data().notifications || {};
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(userId, preferences) {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    await setDoc(docRef, {
      notifications: preferences,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: error.message };
  }
}
