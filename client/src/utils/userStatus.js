/**
 * User Status Utility
 * 
 * Centralized system for managing and checking user status across the application.
 * Handles: Active, Deleted, Archived, Disabled, and enrollment-based statuses.
 */

/**
 * User Status Types
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  ARCHIVED: 'archived',
  DISABLED: 'disabled',
  NO_ENROLLMENTS: 'no_enrollments'
};

/**
 * User Status Labels
 */
export const USER_STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: 'Active',
  [USER_STATUS.DELETED]: 'Deleted',
  [USER_STATUS.ARCHIVED]: 'Archived',
  [USER_STATUS.DISABLED]: 'Disabled',
  [USER_STATUS.NO_ENROLLMENTS]: 'No Enrollments'
};

/**
 * Determine user status based on user data and enrollments
 * 
 * @param {Object} user - User document from Firestore
 * @param {Array} enrollments - Array of enrollment documents (optional)
 * @returns {string} User status
 */
export const getUserStatus = (user, enrollments = []) => {
  if (!user) return USER_STATUS.DELETED;

  // Check deleted first (highest priority)
  if (user.deleted === true || user.deletedAt) {
    return USER_STATUS.DELETED;
  }

  // Check archived
  if (user.archived === true || user.archivedAt) {
    return USER_STATUS.ARCHIVED;
  }

  // Check disabled
  if (user.disabled === true || user.disabledAt) {
    return USER_STATUS.DISABLED;
  }

  // Check enrollments
  const activeEnrollments = Array.isArray(enrollments) 
    ? enrollments.filter(e => !e.deleted && !e.archived)
    : [];

  if (activeEnrollments.length === 0) {
    return USER_STATUS.NO_ENROLLMENTS;
  }

  return USER_STATUS.ACTIVE;
};

/**
 * Check if user can log in
 * 
 * @param {Object} user - User document
 * @returns {boolean}
 */
export const canUserLogin = (user) => {
  if (!user) return false;
  
  const status = getUserStatus(user);
  
  // Only deleted users cannot login
  return status !== USER_STATUS.DELETED;
};

/**
 * Check if user has full access (can perform actions)
 * 
 * @param {Object} user - User document
 * @param {Array} enrollments - User's enrollments (optional)
 * @returns {boolean}
 */
export const hasFullAccess = (user, enrollments = []) => {
  if (!user) return false;
  
  const status = getUserStatus(user, enrollments);
  
  // Only active users with enrollments have full access
  return status === USER_STATUS.ACTIVE;
};

/**
 * Check if user has read-only access (can view but not modify)
 * 
 * @param {Object} user - User document
 * @param {Array} enrollments - User's enrollments (optional)
 * @returns {boolean}
 */
export const hasReadOnlyAccess = (user, enrollments = []) => {
  if (!user) return false;
  
  const status = getUserStatus(user, enrollments);
  
  // Archived users have read-only access to their historical data
  return status === USER_STATUS.ARCHIVED;
};

/**
 * Check if user can participate in activities (chat, quizzes, etc.)
 * 
 * @param {Object} user - User document
 * @param {Array} enrollments - User's enrollments (optional)
 * @returns {boolean}
 */
export const canParticipate = (user, enrollments = []) => {
  if (!user) return false;
  
  const status = getUserStatus(user, enrollments);
  
  // Only active users with enrollments can participate
  return status === USER_STATUS.ACTIVE;
};

/**
 * Check if user can view dashboard
 * 
 * @param {Object} user - User document
 * @returns {boolean}
 */
export const canViewDashboard = (user) => {
  if (!user) return false;
  
  const status = getUserStatus(user);
  
  // Deleted users cannot view dashboard
  // All others (archived, disabled, no enrollments) can view
  return status !== USER_STATUS.DELETED;
};

/**
 * Get status icon component props
 * 
 * @param {string} status - User status
 * @returns {Object} Icon props
 */
export const getStatusIconProps = (status) => {
  const iconProps = { size: 16 };
  
  switch (status) {
    case USER_STATUS.ACTIVE:
      return { ...iconProps, color: '#10B981', name: 'UserCheck' };
    case USER_STATUS.DELETED:
      return { ...iconProps, color: '#EF4444', name: 'UserX' };
    case USER_STATUS.ARCHIVED:
      return { ...iconProps, color: '#F59E0B', name: 'UserMinus' };
    case USER_STATUS.DISABLED:
      return { ...iconProps, color: '#6B7280', name: 'UserX' };
    case USER_STATUS.NO_ENROLLMENTS:
      return { ...iconProps, color: '#3B82F6', name: 'AlertCircle' };
    default:
      return { ...iconProps, color: '#6B7280', name: 'Info' };
  }
};

/**
 * Get status description
 * 
 * @param {string} status - User status
 * @param {Function} t - Translation function (optional)
 * @returns {string} Status description
 */
export const getStatusDescription = (status, t = null) => {
  const descriptions = {
    [USER_STATUS.ACTIVE]: t?.('status_active_desc') || 'User is active and has enrollments',
    [USER_STATUS.DELETED]: t?.('status_deleted_desc') || 'User is deleted and cannot access the system',
    [USER_STATUS.ARCHIVED]: t?.('status_archived_desc') || 'User is archived and has read-only access',
    [USER_STATUS.DISABLED]: t?.('status_disabled_desc') || 'User is disabled and has limited access',
    [USER_STATUS.NO_ENROLLMENTS]: t?.('status_no_enrollments_desc') || 'User is active but has no enrollments'
  };
  
  return descriptions[status] || 'Unknown status';
};

/**
 * Filter users by status
 * 
 * @param {Array} users - Array of user documents
 * @param {Array} enrollmentsMap - Map of userId -> enrollments array
 * @param {Array} allowedStatuses - Array of allowed statuses
 * @returns {Array} Filtered users
 */
export const filterUsersByStatus = (users, enrollmentsMap = {}, allowedStatuses = [USER_STATUS.ACTIVE]) => {
  if (!Array.isArray(users)) return [];
  if (!Array.isArray(allowedStatuses) || allowedStatuses.length === 0) return users;
  
  return users.filter(user => {
    const userEnrollments = enrollmentsMap[user.id] || enrollmentsMap[user.docId] || [];
    const status = getUserStatus(user, userEnrollments);
    return allowedStatuses.includes(status);
  });
};

/**
 * Get user status summary for display
 * 
 * @param {Object} user - User document
 * @param {Array} enrollments - User's enrollments
 * @returns {Object} Status summary
 */
export const getUserStatusSummary = (user, enrollments = []) => {
  const status = getUserStatus(user, enrollments);
  const activeEnrollments = Array.isArray(enrollments) 
    ? enrollments.filter(e => !e.deleted && !e.archived)
    : [];
  
  return {
    status,
    label: USER_STATUS_LABELS[status] || status,
    canLogin: canUserLogin(user),
    hasFullAccess: hasFullAccess(user, enrollments),
    hasReadOnlyAccess: hasReadOnlyAccess(user, enrollments),
    canParticipate: canParticipate(user, enrollments),
    canViewDashboard: canViewDashboard(user),
    enrollmentCount: activeEnrollments.length,
    iconProps: getStatusIconProps(status),
    description: getStatusDescription(status)
  };
};

