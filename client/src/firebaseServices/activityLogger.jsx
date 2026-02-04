/**
 * Activity Logger - Centralized activity tracking
 * Logs all user activities with display names (not emails)
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

// Activity Log Types for Dashboard
export const ACTIVITY_LOG_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  SESSION_TIMEOUT: 'session_timeout',
  PROFILE_UPDATE: 'profile_update',
  PASSWORD_CHANGE: 'password_change',
  EMAIL_CHANGE: 'email_change',
  
  // Quiz Activities
  QUIZ_STARTED: 'quiz_started',
  QUIZ_SUBMITTED: 'quiz_submitted',
  QUIZ_CREATED: 'quiz_created',
  QUIZ_DELETED: 'quiz_deleted',
  QUIZ_PUBLISHED: 'quiz_published',
  
  // Activity CRUD
  ACTIVITY_CREATED: 'activity_created',
  ACTIVITY_UPDATED: 'activity_updated',
  ACTIVITY_DELETED: 'activity_deleted',
  ACTIVITY_VIEWED: 'activity_viewed',
  
  // Assignment/Submission
  ASSIGNMENT_STARTED: 'assignment_started',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  SUBMISSION_GRADED: 'submission_graded',
  
  // Resources CRUD
  RESOURCE_CREATED: 'resource_created',
  RESOURCE_UPDATED: 'resource_updated',
  RESOURCE_DELETED: 'resource_deleted',
  RESOURCE_COMPLETED: 'resource_completed',
  RESOURCE_BOOKMARKED: 'resource_bookmarked',
  
  // Attendance
  ATTENDANCE_MARKED: 'attendance_marked',
  
  // Communication
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  ANNOUNCEMENT_READ: 'announcement_read',
  ANNOUNCEMENT_CREATED: 'announcement_created',
  ANNOUNCEMENT_UPDATED: 'announcement_updated',
  ANNOUNCEMENT_DELETED: 'announcement_deleted',
  
  // Penalties CRUD
  PENALTY_CREATED: 'penalty_created',
  PENALTY_UPDATED: 'penalty_updated',
  PENALTY_DELETED: 'penalty_deleted',
  PENALTY_VIEWED: 'penalty_viewed',
  
  // Participation CRUD
  PARTICIPATION_CREATED: 'participation_created',
  PARTICIPATION_UPDATED: 'participation_updated',
  PARTICIPATION_DELETED: 'participation_deleted',
  PARTICIPATION_VIEWED: 'participation_viewed',
  
  // Behavior CRUD
  BEHAVIOR_CREATED: 'behavior_created',
  BEHAVIOR_UPDATED: 'behavior_updated',
  BEHAVIOR_DELETED: 'behavior_deleted',
  BEHAVIOR_VIEWED: 'behavior_viewed',
  
  // Class CRUD
  CLASS_CREATED: 'class_created',
  CLASS_UPDATED: 'class_updated',
  CLASS_DELETED: 'class_deleted',
  CLASS_VIEWED: 'class_viewed',
  
  // Subject CRUD
  SUBJECT_CREATED: 'subject_created',
  SUBJECT_UPDATED: 'subject_updated',
  SUBJECT_DELETED: 'subject_deleted',
  SUBJECT_VIEWED: 'subject_viewed',
  
  // Program CRUD
  PROGRAM_CREATED: 'program_created',
  PROGRAM_UPDATED: 'program_updated',
  PROGRAM_DELETED: 'program_deleted',
  PROGRAM_VIEWED: 'program_viewed',
  
  // Enrollment CRUD
  ENROLLMENT_CREATED: 'enrollment_created',
  ENROLLMENT_UPDATED: 'enrollment_updated',
  ENROLLMENT_DELETED: 'enrollment_deleted',
  ENROLLMENT_VIEWED: 'enrollment_viewed',
  
  // Mark Entry CRUD
  MARK_ENTRY_CREATED: 'mark_entry_created',
  MARK_ENTRY_UPDATED: 'mark_entry_updated',
  MARK_ENTRY_DELETED: 'mark_entry_deleted',
  MARK_ENTRY_VIEWED: 'mark_entry_viewed',
  
  // User CRUD
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  
  // Navigation
  DASHBOARD_VIEWED: 'dashboard_viewed',
  ANALYTICS_VIEWED: 'analytics_viewed'
};

// Activity Log Options for Dashboard Filter
import { 
  Filter,
  LogIn, 
  LogOut, 
  UserPlus, 
  Clock, 
  User, 
  Key, 
  Mail, 
  Target, 
  CheckCircle, 
  FileText, 
  Trash, 
  Send, 
  Edit,
  PenTool, 
  Award, 
  BookOpen, 
  Bookmark, 
  Eye, 
  MessageSquare, 
  Bell, 
  AlertTriangle, 
  Users, 
  UserMinus, 
  Home, 
  GraduationCap, 
  BarChart3 
} from 'lucide-react';

export const getActivityLogOptions = (t) => [
  { value: 'all', label: t('all_activity_types') || 'All Activity Types', icon: <Filter size={16} color="var(--text-secondary, #374151)" /> },
  
  // Authentication
  { value: ACTIVITY_LOG_TYPES.LOGIN, label: t('login') || 'Login', icon: <LogIn size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.LOGOUT, label: t('logout') || 'Logout', icon: <LogOut size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.SIGNUP, label: t('signup') || 'Signup', icon: <UserPlus size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.SESSION_TIMEOUT, label: t('session_timeout') || 'Session Timeout', icon: <Clock size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PROFILE_UPDATE, label: t('profile_update') || 'Profile Update', icon: <User size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PASSWORD_CHANGE, label: t('password_change') || 'Password Change', icon: <Key size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.EMAIL_CHANGE, label: t('email_change') || 'Email Change', icon: <Mail size={16} color="var(--text-secondary, #374151)" /> },
  
  // Quiz Activities
  { value: ACTIVITY_LOG_TYPES.QUIZ_STARTED, label: t('quiz_started') || 'Quiz Started', icon: <Target size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.QUIZ_SUBMITTED, label: t('quiz_submitted') || 'Quiz Submitted', icon: <CheckCircle size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.QUIZ_CREATED, label: t('quiz_created') || 'Quiz Created', icon: <FileText size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.QUIZ_DELETED, label: t('quiz_deleted') || 'Quiz Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.QUIZ_PUBLISHED, label: t('quiz_published') || 'Quiz Published', icon: <Send size={16} color="var(--text-secondary, #374151)" /> },
  
  // Activity CRUD
  { value: ACTIVITY_LOG_TYPES.ACTIVITY_CREATED, label: t('activity_created') || 'Activity Created', icon: <FileText size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ACTIVITY_UPDATED, label: t('activity_updated') || 'Activity Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ACTIVITY_DELETED, label: t('activity_deleted') || 'Activity Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ACTIVITY_VIEWED, label: t('activity_viewed') || 'Activity Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Assignment/Submission
  { value: ACTIVITY_LOG_TYPES.ASSIGNMENT_STARTED, label: t('assignment_started') || 'Assignment Started', icon: <PenTool size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ASSIGNMENT_SUBMITTED, label: t('assignment_submitted') || 'Assignment Submitted', icon: <CheckCircle size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.SUBMISSION_GRADED, label: t('submission_graded') || 'Submission Graded', icon: <Award size={16} color="var(--text-secondary, #374151)" /> },
  
  // Resources CRUD
  { value: ACTIVITY_LOG_TYPES.RESOURCE_CREATED, label: t('resource_created') || 'Resource Created', icon: <BookOpen size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.RESOURCE_UPDATED, label: t('resource_updated') || 'Resource Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.RESOURCE_DELETED, label: t('resource_deleted') || 'Resource Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.RESOURCE_COMPLETED, label: t('resource_completed') || 'Resource Completed', icon: <CheckCircle size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.RESOURCE_BOOKMARKED, label: t('resource_bookmarked') || 'Resource Bookmarked', icon: <Bookmark size={16} color="var(--text-secondary, #374151)" /> },
  
  // Attendance
  { value: ACTIVITY_LOG_TYPES.ATTENDANCE_MARKED, label: t('attendance_marked') || 'Attendance Marked', icon: <CheckCircle size={16} color="var(--text-secondary, #374151)" /> },
  
  // Communication
  { value: ACTIVITY_LOG_TYPES.MESSAGE_SENT, label: t('message_sent') || 'Message Sent', icon: <Send size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.MESSAGE_RECEIVED, label: t('message_received') || 'Message Received', icon: <MessageSquare size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ANNOUNCEMENT_READ, label: t('announcement_read') || 'Announcement Read', icon: <Bell size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ANNOUNCEMENT_CREATED, label: t('announcement_created') || 'Announcement Created', icon: <Bell size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ANNOUNCEMENT_UPDATED, label: t('announcement_updated') || 'Announcement Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ANNOUNCEMENT_DELETED, label: t('announcement_deleted') || 'Announcement Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  
  // Penalties CRUD
  { value: ACTIVITY_LOG_TYPES.PENALTY_CREATED, label: t('penalty_created') || 'Penalty Created', icon: <AlertTriangle size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PENALTY_UPDATED, label: t('penalty_updated') || 'Penalty Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PENALTY_DELETED, label: t('penalty_deleted') || 'Penalty Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PENALTY_VIEWED, label: t('penalty_viewed') || 'Penalty Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Participation CRUD
  { value: ACTIVITY_LOG_TYPES.PARTICIPATION_CREATED, label: t('participation_created') || 'Participation Created', icon: <Users size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PARTICIPATION_UPDATED, label: t('participation_updated') || 'Participation Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PARTICIPATION_DELETED, label: t('participation_deleted') || 'Participation Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PARTICIPATION_VIEWED, label: t('participation_viewed') || 'Participation Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Behavior CRUD
  { value: ACTIVITY_LOG_TYPES.BEHAVIOR_CREATED, label: t('behavior_created') || 'Behavior Created', icon: <UserMinus size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.BEHAVIOR_UPDATED, label: t('behavior_updated') || 'Behavior Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.BEHAVIOR_DELETED, label: t('behavior_deleted') || 'Behavior Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.BEHAVIOR_VIEWED, label: t('behavior_viewed') || 'Behavior Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Class CRUD
  { value: ACTIVITY_LOG_TYPES.CLASS_CREATED, label: t('class_created') || 'Class Created', icon: <Home size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.CLASS_UPDATED, label: t('class_updated') || 'Class Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.CLASS_DELETED, label: t('class_deleted') || 'Class Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.CLASS_VIEWED, label: t('class_viewed') || 'Class Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Subject CRUD
  { value: ACTIVITY_LOG_TYPES.SUBJECT_CREATED, label: t('subject_created') || 'Subject Created', icon: <BookOpen size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.SUBJECT_UPDATED, label: t('subject_updated') || 'Subject Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.SUBJECT_DELETED, label: t('subject_deleted') || 'Subject Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.SUBJECT_VIEWED, label: t('subject_viewed') || 'Subject Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Program CRUD
  { value: ACTIVITY_LOG_TYPES.PROGRAM_CREATED, label: t('program_created') || 'Program Created', icon: <GraduationCap size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PROGRAM_UPDATED, label: t('program_updated') || 'Program Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PROGRAM_DELETED, label: t('program_deleted') || 'Program Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.PROGRAM_VIEWED, label: t('program_viewed') || 'Program Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Enrollment CRUD
  { value: ACTIVITY_LOG_TYPES.ENROLLMENT_CREATED, label: t('enrollment_created') || 'Enrollment Created', icon: <Users size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ENROLLMENT_UPDATED, label: t('enrollment_updated') || 'Enrollment Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ENROLLMENT_DELETED, label: t('enrollment_deleted') || 'Enrollment Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ENROLLMENT_VIEWED, label: t('enrollment_viewed') || 'Enrollment Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // Mark Entry CRUD
  { value: ACTIVITY_LOG_TYPES.MARK_ENTRY_CREATED, label: t('mark_entry_created') || 'Mark Entry Created', icon: <FileText size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.MARK_ENTRY_UPDATED, label: t('mark_entry_updated') || 'Mark Entry Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.MARK_ENTRY_DELETED, label: t('mark_entry_deleted') || 'Mark Entry Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.MARK_ENTRY_VIEWED, label: t('mark_entry_viewed') || 'Mark Entry Viewed', icon: <Eye size={16} color="var(--text-secondary, #374151)" /> },
  
  // User CRUD
  { value: ACTIVITY_LOG_TYPES.USER_CREATED, label: t('user_created') || 'User Created', icon: <UserPlus size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.USER_UPDATED, label: t('user_updated') || 'User Updated', icon: <Edit size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.USER_DELETED, label: t('user_deleted') || 'User Deleted', icon: <Trash size={16} color="var(--text-secondary, #374151)" /> },
  
  // Navigation
  { value: ACTIVITY_LOG_TYPES.DASHBOARD_VIEWED, label: t('dashboard_viewed') || 'Dashboard Viewed', icon: <Home size={16} color="var(--text-secondary, #374151)" /> },
  { value: ACTIVITY_LOG_TYPES.ANALYTICS_VIEWED, label: t('analytics_viewed') || 'Analytics Viewed', icon: <BarChart3 size={16} color="var(--text-secondary, #374151)" /> }
];

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
      userEmail: userProfile.email || null,
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
  sessionTimeout: () => logActivity(ACTIVITY_TYPES.SESSION_TIMEOUT),
  profileUpdate: () => logActivity(ACTIVITY_TYPES.PROFILE_UPDATE),
  passwordChange: () => logActivity(ACTIVITY_TYPES.PASSWORD_CHANGE),
  emailChange: () => logActivity(ACTIVITY_TYPES.EMAIL_CHANGE),

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
