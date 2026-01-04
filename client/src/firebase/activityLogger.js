/**
 * Activity Logger - Centralized activity tracking
 * Logs all user activities with display names (not emails)
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

/**
 * Log user activity
 * @param {string} type - Activity type
 * @param {object} details - Additional details
 * @param {string} userId - User ID (optional, defaults to current user)
 */
export async function logActivity(type, details = {}, userId = null) {
  try {
    // Get user profile from session storage
    const userProfile = JSON.parse(
      sessionStorage.getItem("userProfile") || "{}"
    );
    const currentUser = userId || userProfile.uid;

    if (!currentUser) {
      console.warn("[Activity Logger] No user ID available");
      return { success: false, error: "No user ID" };
    }

    const activityData = {
      type,
      userId: currentUser,
      userName:
        userProfile.displayName ||
        userProfile.name ||
        userProfile.email?.split("@")[0] ||
        "Unknown",
      userEmail: userProfile.email,
      timestamp: serverTimestamp(),
      details,
      userAgent: navigator.userAgent,
      url: window.location.pathname,
    };

    await addDoc(collection(db, "activityLogs"), activityData);
    return { success: true };
  } catch (error) {
    console.error("[Activity Logger] Error logging activity:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Activity type constants (CLEANED UP - No Badges!)
 */
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: "login",
  LOGOUT: "logout",
  SESSION_TIMEOUT: "session_timeout",
  PROFILE_UPDATE: "profile_update",
  PASSWORD_CHANGE: "password_change",
  EMAIL_CHANGE: "email_change",

  // Quiz Activities
  QUIZ_STARTED: "quiz_started",
  QUIZ_SUBMITTED: "quiz_submitted",
  QUIZ_RETAKE: "quiz_retake",
  QUIZ_SAVED: "quiz_saved",
  QUIZ_VIEWED: "quiz_viewed",

  // Assignment Activities
  ASSIGNMENT_STARTED: "assignment_started",
  ASSIGNMENT_SUBMITTED: "assignment_submitted",
  ASSIGNMENT_VIEWED: "assignment_viewed",

  // Grading
  SUBMISSION_GRADED: "submission_graded",
  FEEDBACK_GIVEN: "feedback_given",

  // Resources CRUD
  RESOURCE_CREATED: "resource_created",
  RESOURCE_UPDATED: "resource_updated",
  RESOURCE_DELETED: "resource_deleted",
  RESOURCE_VIEWED: "resource_viewed",
  RESOURCE_COMPLETED: "resource_completed",
  RESOURCE_BOOKMARKED: "resource_bookmarked",
  RESOURCE_DOWNLOADED: "resource_downloaded",

  // Attendance
  ATTENDANCE_MARKED: "attendance_marked",

  // Communication
  MESSAGE_SENT: "message_sent",
  MESSAGE_RECEIVED: "message_received",
  ANNOUNCEMENT_READ: "announcement_read",
  ANNOUNCEMENT_CREATED: "announcement_created",
  ANNOUNCEMENT_UPDATED: "announcement_updated",
  ANNOUNCEMENT_DELETED: "announcement_deleted",

  // Navigation
  DASHBOARD_VIEWED: "dashboard_viewed",
  ANALYTICS_VIEWED: "analytics_viewed",
  ACTIVITY_VIEWED: "activity_viewed",

  // Tools
  CALCULATOR_OPENED: "calculator_opened",
  SCRATCH_PAD_OPENED: "scratch_pad_opened",
  FORMULA_SHEET_OPENED: "formula_sheet_opened",

  // Notifications
  NOTIFICATION_CLICKED: "notification_clicked",
  NOTIFICATION_DISMISSED: "notification_dismissed",

  // Class Activities
  CLASS_JOINED: "class_joined",
  CLASS_LEFT: "class_left",

  // Admin Activities
  USER_CREATED: "user_created",
  USER_DELETED: "user_deleted",
  USER_UPDATED: "user_updated",
  QUIZ_CREATED: "quiz_created",
  QUIZ_DELETED: "quiz_deleted",
  QUIZ_PUBLISHED: "quiz_published",

  // Activity CRUD
  ACTIVITY_CREATED: "activity_created",
  ACTIVITY_UPDATED: "activity_updated",
  ACTIVITY_DELETED: "activity_deleted",

  // Penalties CRUD
  PENALTY_CREATED: "penalty_created",
  PENALTY_UPDATED: "penalty_updated",
  PENALTY_DELETED: "penalty_deleted",
  PENALTY_VIEWED: "penalty_viewed",
  PENALTY_SEARCHED: "penalty_searched",

  // Participation CRUD
  PARTICIPATION_CREATED: "participation_created",
  PARTICIPATION_UPDATED: "participation_updated",
  PARTICIPATION_DELETED: "participation_deleted",
  PARTICIPATION_VIEWED: "participation_viewed",
  PARTICIPATION_SEARCHED: "participation_searched",

  // Behavior CRUD
  BEHAVIOR_CREATED: "behavior_created",
  BEHAVIOR_UPDATED: "behavior_updated",
  BEHAVIOR_DELETED: "behavior_deleted",
  BEHAVIOR_VIEWED: "behavior_viewed",
  BEHAVIOR_SEARCHED: "behavior_searched",

  // Class CRUD
  CLASS_CREATED: "class_created",
  CLASS_UPDATED: "class_updated",
  CLASS_DELETED: "class_deleted",
  CLASS_VIEWED: "class_viewed",
  CLASS_SEARCHED: "class_searched",

  // Subject CRUD
  SUBJECT_CREATED: "subject_created",
  SUBJECT_UPDATED: "subject_updated",
  SUBJECT_DELETED: "subject_deleted",
  SUBJECT_VIEWED: "subject_viewed",
  SUBJECT_SEARCHED: "subject_searched",

  // Program CRUD
  PROGRAM_CREATED: "program_created",
  PROGRAM_UPDATED: "program_updated",
  PROGRAM_DELETED: "program_deleted",
  PROGRAM_VIEWED: "program_viewed",
  PROGRAM_SEARCHED: "program_searched",

  // Enrollment CRUD
  ENROLLMENT_CREATED: "enrollment_created",
  ENROLLMENT_UPDATED: "enrollment_updated",
  ENROLLMENT_DELETED: "enrollment_deleted",
  ENROLLMENT_VIEWED: "enrollment_viewed",
  ENROLLMENT_SEARCHED: "enrollment_searched",

  // Mark Entry CRUD
  MARK_ENTRY_CREATED: "mark_entry_created",
  MARK_ENTRY_UPDATED: "mark_entry_updated",
  MARK_ENTRY_DELETED: "mark_entry_deleted",
  MARK_ENTRY_VIEWED: "mark_entry_viewed",
  MARK_ENTRY_SEARCHED: "mark_entry_searched",

  // Generic Actions
  SEARCH_PERFORMED: "search_performed",
  SAVE_ACTION: "save_action",
  EXPORT_ACTION: "export_action",

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
  quizStarted: (quizId, quizTitle) =>
    logActivity(ACTIVITY_TYPES.QUIZ_STARTED, { quizId, quizTitle }),
  quizSubmitted: (quizId, quizTitle, score) =>
    logActivity(ACTIVITY_TYPES.QUIZ_SUBMITTED, { quizId, quizTitle, score }),
  quizSaved: (quizId, quizTitle) =>
    logActivity(ACTIVITY_TYPES.QUIZ_SAVED, { quizId, quizTitle }),
  quizViewed: (quizId, quizTitle) =>
    logActivity(ACTIVITY_TYPES.QUIZ_VIEWED, { quizId, quizTitle }),

  // Resources
  resourceViewed: (resourceId, resourceTitle) =>
    logActivity(ACTIVITY_TYPES.RESOURCE_VIEWED, { resourceId, resourceTitle }),
  resourceCompleted: (resourceId, resourceTitle) =>
    logActivity(ACTIVITY_TYPES.RESOURCE_COMPLETED, {
      resourceId,
      resourceTitle,
    }),
  resourceBookmarked: (resourceId, resourceTitle) =>
    logActivity(ACTIVITY_TYPES.RESOURCE_BOOKMARKED, {
      resourceId,
      resourceTitle,
    }),

  // Navigation
  dashboardViewed: () => logActivity(ACTIVITY_TYPES.DASHBOARD_VIEWED),
  analyticsViewed: () => logActivity(ACTIVITY_TYPES.ANALYTICS_VIEWED),

  // Tools
  calculatorOpened: () => logActivity(ACTIVITY_TYPES.CALCULATOR_OPENED),
  scratchPadOpened: () => logActivity(ACTIVITY_TYPES.SCRATCH_PAD_OPENED),
  formulaSheetOpened: () => logActivity(ACTIVITY_TYPES.FORMULA_SHEET_OPENED),

  // Notifications
  notificationClicked: (notificationId, type) =>
    logActivity(ACTIVITY_TYPES.NOTIFICATION_CLICKED, { notificationId, type }),
  notificationDismissed: (notificationId) =>
    logActivity(ACTIVITY_TYPES.NOTIFICATION_DISMISSED, { notificationId }),
};

/**
 * Activity type labels for UI display
 */
export const ACTIVITY_TYPE_LABELS = {
  login: "Login",
  logout: "Logout",
  session_timeout: "Session Timeout",
  profile_update: "Profile Update",
  password_change: "Password Change",
  email_change: "Email Change",
  quiz_started: "Quiz Started",
  quiz_submitted: "Quiz Submitted",
  quiz_retake: "Quiz Retake",
  quiz_saved: "Quiz Saved",
  quiz_viewed: "Quiz Viewed",
  assignment_started: "Assignment Started",
  assignment_submitted: "Assignment Submitted",
  assignment_viewed: "Assignment Viewed",
  submission_graded: "Submission Graded",
  feedback_given: "Feedback Given",
  resource_viewed: "Resource Viewed",
  resource_completed: "Resource Completed",
  resource_bookmarked: "Resource Bookmarked",
  resource_downloaded: "Resource Downloaded",
  attendance_marked: "Attendance Marked",
  message_sent: "Message Sent",
  message_received: "Message Received",
  announcement_read: "Announcement Read",
  announcement_created: "Announcement Created",
  dashboard_viewed: "Dashboard Viewed",
  analytics_viewed: "Analytics Viewed",
  activity_viewed: "Activity Viewed",
  calculator_opened: "Calculator Opened",
  scratch_pad_opened: "Scratch Pad Opened",
  formula_sheet_opened: "Formula Sheet Opened",
  notification_clicked: "Notification Clicked",
  notification_dismissed: "Notification Dismissed",
  class_joined: "Class Joined",
  class_left: "Class Left",
  user_created: "User Created",
  user_deleted: "User Deleted",
  user_updated: "User Updated",
  quiz_created: "Quiz Created",
  quiz_deleted: "Quiz Deleted",
  quiz_published: "Quiz Published",

  // Activity CRUD
  activity_created: "Activity Created",
  activity_updated: "Activity Updated",
  activity_deleted: "Activity Deleted",

  // Penalties
  penalty_created: "Penalty Created",
  penalty_updated: "Penalty Updated",
  penalty_deleted: "Penalty Deleted",
  penalty_viewed: "Penalty Viewed",
  penalty_searched: "Penalty Searched",

  // Participation
  participation_created: "Participation Created",
  participation_updated: "Participation Updated",
  participation_deleted: "Participation Deleted",
  participation_viewed: "Participation Viewed",
  participation_searched: "Participation Searched",

  // Behavior
  behavior_created: "Behavior Created",
  behavior_updated: "Behavior Updated",
  behavior_deleted: "Behavior Deleted",
  behavior_viewed: "Behavior Viewed",
  behavior_searched: "Behavior Searched",

  // Class
  class_created: "Class Created",
  class_updated: "Class Updated",
  class_deleted: "Class Deleted",
  class_viewed: "Class Viewed",
  class_searched: "Class Searched",

  // Subject
  subject_created: "Subject Created",
  subject_updated: "Subject Updated",
  subject_deleted: "Subject Deleted",
  subject_viewed: "Subject Viewed",
  subject_searched: "Subject Searched",

  // Program
  program_created: "Program Created",
  program_updated: "Program Updated",
  program_deleted: "Program Deleted",
  program_viewed: "Program Viewed",
  program_searched: "Program Searched",

  // Enrollment
  enrollment_created: "Enrollment Created",
  enrollment_updated: "Enrollment Updated",
  enrollment_deleted: "Enrollment Deleted",
  enrollment_viewed: "Enrollment Viewed",
  enrollment_searched: "Enrollment Searched",

  // Mark Entry
  mark_entry_created: "Mark Entry Created",
  mark_entry_updated: "Mark Entry Updated",
  mark_entry_deleted: "Mark Entry Deleted",
  mark_entry_viewed: "Mark Entry Viewed",
  mark_entry_searched: "Mark Entry Searched",

  // Generic Actions
  search_performed: "Search Performed",
  save_action: "Save Action",
  export_action: "Export Action",
};
