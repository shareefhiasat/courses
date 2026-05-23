/**
 * Activity Logger - Centralized activity tracking
 * 
 * Replaced Firebase with console logging and future GraphQL integration
 */

import { info, error, warn, debug } from '@services/utils/logger.js';
import { serverTimestamp } from '@utils/timezone';

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
  XCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Users,
  Calendar,
  FileText,
  Settings,
  Shield,
  Zap
} from 'lucide-react';

// Activity types with icons
export const ACTIVITY_LOG_TYPES = {
  LOGIN: { icon: LogIn, color: '#10b981', label: 'Login' },
  LOGOUT: { icon: LogOut, color: '#ef4444', label: 'Logout' },
  USER_CREATED: { icon: UserPlus, color: '#3b82f6', label: 'User Created' },
  SESSION_TIMEOUT: { icon: Clock, color: '#f59e0b', label: 'Session Timeout' },
  PASSWORD_CHANGE: { icon: Key, color: '#8b5cf6', label: 'Password Change' },
  EMAIL_VERIFICATION: { icon: Mail, color: '#06b6d4', label: 'Email Verified' },
  ATTENDANCE_MARKED: { icon: CheckCircle, color: '#10b981', label: 'Attendance Marked' },
  ATTENDANCE_ABSENT: { icon: XCircle, color: '#ef4444', label: 'Absent' },
  BEHAVIOR_RECORDED: { icon: AlertTriangle, color: '#f59e0b', label: 'Behavior Recorded' },
  PARTICIPATION_AWARDED: { icon: Award, color: '#8b5cf6', label: 'Participation Awarded' },
  PENALTY_ISSUED: { icon: XCircle, color: '#ef4444', label: 'Penalty Issued' },
  CLASS_CREATED: { icon: BookOpen, color: '#10b981', label: 'Class Created' },
  CLASS_UPDATED: { icon: Settings, color: '#3b82f6', label: 'Class Updated' },
  USER_ENROLLED: { icon: Users, color: '#06b6d4', label: 'User Enrolled' },
  ENROLLMENT_CREATED: { icon: Users, color: '#06b6d4', label: 'Enrollment Created' },
  ENROLLMENT_DELETED: { icon: Users, color: '#ef4444', label: 'Enrollment Deleted' },
  STUDENT_ACCESS_TOGGLED: { icon: Shield, color: '#f59e0b', label: 'Student Access Toggled' },
  ASSIGNMENT_CREATED: { icon: FileText, color: '#8b5cf6', label: 'Assignment Created' },
  SYSTEM_CONFIG: { icon: Settings, color: '#6b7280', label: 'System Configuration' },
  SECURITY_EVENT: { icon: Shield, color: '#ef4444', label: 'Security Event' },
  PERFORMANCE: { icon: Zap, color: '#f59e0b', label: 'Performance' },
  RESOURCE_VIEWED: { icon: FileText, color: '#3b82f6', label: 'Resource Viewed' },
  ANNOUNCEMENT_READ: { icon: FileText, color: '#3b82f6', label: 'Announcement Read' },
  ACTIVITY_VIEWED: { icon: BookOpen, color: '#3b82f6', label: 'Activity Viewed' }
};

/**
 * Log user activity
 * @param {string} type - Activity type from ACTIVITY_LOG_TYPES
 * @param {string} description - Activity description
 * @param {Object} metadata - Additional metadata
 * @param {Object} user - User object
 */
export async function logActivity(type, description, metadata = {}, user = null) {
  try {
    const activity = {
      type,
      description,
      metadata,
      userId: user?.id || 'anonymous',
      userEmail: user?.email || 'anonymous',
      userDisplayName: user?.displayName || user?.email || 'Anonymous User',
      timestamp: serverTimestamp(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      ip: typeof window !== 'undefined' ? window.location?.hostname : 'server'
    };

    // Mock implementation - replace with GraphQL mutation
    info('📝 Activity Log:', activity);
    info('Activity logged:', { type, description, userId: user?.id });

    // TODO: Replace with GraphQL mutation
    // await graphqlClient.mutation(CREATE_ACTIVITY_LOG, { input: activity });

    return { success: true, activity };
  } catch (error) {
    error('Failed to log activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log login activity
 */
export async function logLogin(user, metadata = {}) {
  return logActivity(
    ACTIVITY_LOG_TYPES.LOGIN,
    `User ${user.displayName || user.email} logged in`,
    { ...metadata, loginTime: new Date().toISOString() },
    user
  );
}

/**
 * Log logout activity
 */
export async function logLogout(user, metadata = {}) {
  return logActivity(
    ACTIVITY_LOG_TYPES.LOGOUT,
    `User ${user.displayName || user.email} logged out`,
    { ...metadata, logoutTime: new Date().toISOString() },
    user
  );
}

/**
 * Log session timeout
 */
export async function sessionTimeout(user = null, metadata = {}) {
  return logActivity(
    ACTIVITY_LOG_TYPES.SESSION_TIMEOUT,
    'Session timed out',
    { ...metadata, timeoutTime: new Date().toISOString() },
    user
  );
}

/**
 * Log attendance marking
 */
export async function logAttendance(user, studentName, status, className, metadata = {}) {
  return logActivity(
    status === 'present' ? ACTIVITY_LOG_TYPES.ATTENDANCE_MARKED : ACTIVITY_LOG_TYPES.ATTENDANCE_ABSENT,
    `Marked ${studentName} as ${status} in ${className}`,
    { ...metadata, studentName, status, className },
    user
  );
}

/**
 * Log behavior recording
 */
export async function logBehavior(user, studentName, behaviorType, severity, metadata = {}) {
  return logActivity(
    ACTIVITY_LOG_TYPES.BEHAVIOR_RECORDED,
    `Recorded ${behaviorType} behavior for ${studentName} (${severity})`,
    { ...metadata, studentName, behaviorType, severity },
    user
  );
}

/**
 * Log penalty issuance
 */
export async function logPenalty(user, studentName, penaltyType, points, metadata = {}) {
  return logActivity(
    ACTIVITY_LOG_TYPES.PENALTY_ISSUED,
    `Issued ${penaltyType} penalty to ${studentName} (${points} points)`,
    { ...metadata, studentName, penaltyType, points },
    user
  );
}

/**
 * Log participation award
 */
export async function logParticipation(user, studentName, delta, metadata = {}) {
  const description = `${studentName} awarded ${delta > 0 ? '+' : ''}${delta} participation points`;
  return logActivity('PARTICIPATION_AWARDED', description, { studentName, delta, ...metadata }, user);
}

export async function logResourceViewed(resourceId, resourceTitle, metadata = {}) {
  const description = `Viewed resource: ${resourceTitle}`;
  return logActivity('RESOURCE_VIEWED', description, { resourceId, resourceTitle, ...metadata });
}

export async function logAnnouncementRead(announcementId, announcementTitle, metadata = {}) {
  const description = `Read announcement: ${announcementTitle}`;
  return logActivity('ANNOUNCEMENT_READ', description, { announcementId, announcementTitle, ...metadata });
}

export async function logActivityViewed(activityId, activityTitle, metadata = {}) {
  const description = `Viewed activity: ${activityTitle}`;
  return logActivity('ACTIVITY_VIEWED', description, { activityId, activityTitle, ...metadata });
}

/**
 * Get activity icon component
 */
export function getActivityIcon(type, size = 16, color = null) {
  const activityType = ACTIVITY_LOG_TYPES[type];
  if (!activityType) return null;
  
  const IconComponent = activityType.icon;
  const iconColor = color || activityType.color;
  
  return <IconComponent size={size} color={iconColor} />;
}

/**
 * Get activity display label
 */
export function getActivityLabel(type) {
  const activityType = ACTIVITY_LOG_TYPES[type];
  return activityType?.label || type;
}

// Named export for components that expect ActivityLogger
export const ActivityLogger = {
  logActivity,
  logLogin,
  logLogout,
  sessionTimeout,
  logAttendance,
  logBehavior,
  logPenalty,
  logParticipation,
  logResourceViewed,
  logAnnouncementRead,
  logActivityViewed,
  getActivityIcon,
  getActivityLabel,
  ACTIVITY_LOG_TYPES,
  resourceViewed: logResourceViewed,
  announcementRead: logAnnouncementRead,
  activityViewed: logActivityViewed,
  quizViewed: logActivityViewed,
  quizStarted: logActivityViewed
};

export default ActivityLogger;
