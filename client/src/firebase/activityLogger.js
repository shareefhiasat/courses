/**
 * Activity Logger - Centralized activity tracking
 * Logs all user activities with display names (not emails)
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Log user activity
 * @param {string} type - Activity type
 * @param {object} details - Additional details
 * @param {string} userId - User ID (optional, defaults to current user)
 */
export async function logActivity(type, details = {}, userId = null) {
  try {
    // Get user profile from session storage
    const userProfile = JSON.parse(sessionStorage.getItem('userProfile') || '{}');
    const currentUser = userId || userProfile.uid;
    
    if (!currentUser) {
      console.warn('[Activity Logger] No user ID available');
      return { success: false, error: 'No user ID' };
    }
    
    const activityData = {
      type,
      userId: currentUser,
      userName: userProfile.displayName || userProfile.name || userProfile.email?.split('@')[0] || 'Unknown',
      userEmail: userProfile.email,
      timestamp: serverTimestamp(),
      details,
      userAgent: navigator.userAgent,
      url: window.location.pathname
    };
    
    await addDoc(collection(db, 'activityLogs'), activityData);
    return { success: true };
  } catch (error) {
    console.error('[Activity Logger] Error logging activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Activity type constants (CLEANED UP - No Badges!)
 */
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SESSION_TIMEOUT: 'session_timeout',
  PROFILE_UPDATE: 'profile_update',
  PASSWORD_CHANGE: 'password_change',
  EMAIL_CHANGE: 'email_change',
  
  // Quiz Activities
  QUIZ_STARTED: 'quiz_started',
  QUIZ_SUBMITTED: 'quiz_submitted',
  QUIZ_RETAKE: 'quiz_retake',
  QUIZ_SAVED: 'quiz_saved',
  QUIZ_VIEWED: 'quiz_viewed',
  
  // Assignment Activities
  ASSIGNMENT_STARTED: 'assignment_started',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ASSIGNMENT_VIEWED: 'assignment_viewed',
  
  // Grading
  SUBMISSION_GRADED: 'submission_graded',
  FEEDBACK_GIVEN: 'feedback_given',
  
  // Resources
  RESOURCE_VIEWED: 'resource_viewed',
  RESOURCE_COMPLETED: 'resource_completed',
  RESOURCE_BOOKMARKED: 'resource_bookmarked',
  RESOURCE_DOWNLOADED: 'resource_downloaded',
  
  // Attendance
  ATTENDANCE_MARKED: 'attendance_marked',
  
  // Communication
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  ANNOUNCEMENT_READ: 'announcement_read',
  ANNOUNCEMENT_CREATED: 'announcement_created',
  
  // Navigation
  DASHBOARD_VIEWED: 'dashboard_viewed',
  ANALYTICS_VIEWED: 'analytics_viewed',
  ACTIVITY_VIEWED: 'activity_viewed',
  
  // Tools
  CALCULATOR_OPENED: 'calculator_opened',
  SCRATCH_PAD_OPENED: 'scratch_pad_opened',
  FORMULA_SHEET_OPENED: 'formula_sheet_opened',
  
  // Notifications
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
  
  // Class Activities
  CLASS_JOINED: 'class_joined',
  CLASS_LEFT: 'class_left',
  
  // Admin Activities
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  USER_UPDATED: 'user_updated',
  QUIZ_CREATED: 'quiz_created',
  QUIZ_DELETED: 'quiz_deleted',
  QUIZ_PUBLISHED: 'quiz_published',
  
  // REMOVED (Not Supported):
  // - BADGE_EARNED
  // - ACHIEVEMENT_UNLOCKED
  // - MEDAL_AWARDED
};

/**
 * Convenience functions for common activities
 */
export const ActivityLogger = {
  // Authentication
  login: () => logActivity(ACTIVITY_TYPES.LOGIN),
  logout: () => logActivity(ACTIVITY_TYPES.LOGOUT),
  profileUpdate: () => logActivity(ACTIVITY_TYPES.PROFILE_UPDATE),
  
  // Quiz
  quizStarted: (quizId, quizTitle) => logActivity(ACTIVITY_TYPES.QUIZ_STARTED, { quizId, quizTitle }),
  quizSubmitted: (quizId, quizTitle, score) => logActivity(ACTIVITY_TYPES.QUIZ_SUBMITTED, { quizId, quizTitle, score }),
  quizSaved: (quizId, quizTitle) => logActivity(ACTIVITY_TYPES.QUIZ_SAVED, { quizId, quizTitle }),
  quizViewed: (quizId, quizTitle) => logActivity(ACTIVITY_TYPES.QUIZ_VIEWED, { quizId, quizTitle }),
  
  // Resources
  resourceViewed: (resourceId, resourceTitle) => logActivity(ACTIVITY_TYPES.RESOURCE_VIEWED, { resourceId, resourceTitle }),
  resourceCompleted: (resourceId, resourceTitle) => logActivity(ACTIVITY_TYPES.RESOURCE_COMPLETED, { resourceId, resourceTitle }),
  resourceBookmarked: (resourceId, resourceTitle) => logActivity(ACTIVITY_TYPES.RESOURCE_BOOKMARKED, { resourceId, resourceTitle }),
  
  // Navigation
  dashboardViewed: () => logActivity(ACTIVITY_TYPES.DASHBOARD_VIEWED),
  analyticsViewed: () => logActivity(ACTIVITY_TYPES.ANALYTICS_VIEWED),
  
  // Tools
  calculatorOpened: () => logActivity(ACTIVITY_TYPES.CALCULATOR_OPENED),
  scratchPadOpened: () => logActivity(ACTIVITY_TYPES.SCRATCH_PAD_OPENED),
  formulaSheetOpened: () => logActivity(ACTIVITY_TYPES.FORMULA_SHEET_OPENED),
  
  // Notifications
  notificationClicked: (notificationId, type) => logActivity(ACTIVITY_TYPES.NOTIFICATION_CLICKED, { notificationId, type }),
  notificationDismissed: (notificationId) => logActivity(ACTIVITY_TYPES.NOTIFICATION_DISMISSED, { notificationId })
};

/**
 * Activity type labels for UI display
 */
export const ACTIVITY_TYPE_LABELS = {
  login: 'Login',
  logout: 'Logout',
  session_timeout: 'Session Timeout',
  profile_update: 'Profile Update',
  password_change: 'Password Change',
  email_change: 'Email Change',
  quiz_started: 'Quiz Started',
  quiz_submitted: 'Quiz Submitted',
  quiz_retake: 'Quiz Retake',
  quiz_saved: 'Quiz Saved',
  quiz_viewed: 'Quiz Viewed',
  assignment_started: 'Assignment Started',
  assignment_submitted: 'Assignment Submitted',
  assignment_viewed: 'Assignment Viewed',
  submission_graded: 'Submission Graded',
  feedback_given: 'Feedback Given',
  resource_viewed: 'Resource Viewed',
  resource_completed: 'Resource Completed',
  resource_bookmarked: 'Resource Bookmarked',
  resource_downloaded: 'Resource Downloaded',
  attendance_marked: 'Attendance Marked',
  message_sent: 'Message Sent',
  message_received: 'Message Received',
  announcement_read: 'Announcement Read',
  announcement_created: 'Announcement Created',
  dashboard_viewed: 'Dashboard Viewed',
  analytics_viewed: 'Analytics Viewed',
  activity_viewed: 'Activity Viewed',
  calculator_opened: 'Calculator Opened',
  scratch_pad_opened: 'Scratch Pad Opened',
  formula_sheet_opened: 'Formula Sheet Opened',
  notification_clicked: 'Notification Clicked',
  notification_dismissed: 'Notification Dismissed',
  class_joined: 'Class Joined',
  class_left: 'Class Left',
  user_created: 'User Created',
  user_deleted: 'User Deleted',
  user_updated: 'User Updated',
  quiz_created: 'Quiz Created',
  quiz_deleted: 'Quiz Deleted',
  quiz_published: 'Quiz Published'
};
