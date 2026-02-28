/**
 * Shared User Constants
 * 
 * Centralized constants for user-related operations.
 * Used by both frontend and backend to ensure consistency.
 */

// User Activity Types
export const USER_ACTIVITY_TYPES = {
  USER_DISABLED: 'USER_DISABLED',
  USER_ENABLED: 'USER_ENABLED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT'
};

// User Role Types
export const USER_ROLES = {
  STUDENT: 'student',
  STAFF: 'staff',
  INSTRUCTOR: 'instructor',
  HR: 'hr',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// User Status Types
export const USER_STATUS_TYPES = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

// Helper function to determine user role from user data
export const getUserRole = (userData) => {
  if (userData.isSuperAdmin) return USER_ROLES.SUPER_ADMIN;
  if (userData.isAdmin) return USER_ROLES.ADMIN;
  if (userData.isHR) return USER_ROLES.HR;
  if (userData.isInstructor) return USER_ROLES.INSTRUCTOR;
  if (userData.isStudent) return USER_ROLES.STUDENT;
  return USER_ROLES.STAFF;
};
