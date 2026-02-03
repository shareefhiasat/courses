/**
 * User Roles Constants
 * 
 * Centralized constants for user roles and permissions used throughout the application.
 * This provides type safety and makes role management easier to maintain.
 */

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  INSTRUCTOR: 'instructor',
  HR: 'hr',
  STUDENT: 'student'
};

// Role Display Names (for UI)
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.INSTRUCTOR]: 'Instructor',
  [USER_ROLES.HR]: 'HR',
  [USER_ROLES.STUDENT]: 'Student'
};

// Role Display Names (Arabic)
export const ROLE_DISPLAY_NAMES_AR = {
  [USER_ROLES.ADMIN]: 'مدير',
  [USER_ROLES.SUPER_ADMIN]: 'مدير عام',
  [USER_ROLES.INSTRUCTOR]: 'مدرب',
  [USER_ROLES.HR]: 'الموارد البشرية',
  [USER_ROLES.STUDENT]: 'طالب'
};

// Role Permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'view_analytics',
    'manage_classes',
    'view_students',
    'manage_penalties',
    'view_attendance',
    'manage_programs',
    'manage_subjects'
  ],
  [USER_ROLES.SUPER_ADMIN]: ['*'], // All permissions
  [USER_ROLES.INSTRUCTOR]: [
    'manage_classes',
    'view_students',
    'view_attendance',
    'manage_penalties',
    'view_analytics'
  ],
  [USER_ROLES.HR]: [
    'manage_penalties',
    'view_attendance',
    'view_students',
    'view_analytics'
  ],
  [USER_ROLES.STUDENT]: [
    'view_own_data',
    'view_own_attendance',
    'view_own_grades',
    'view_own_schedule'
  ]
};

// Helper Functions
export const getRoleDisplayName = (role, lang = 'en') => {
  const displayNames = lang === 'ar' ? ROLE_DISPLAY_NAMES_AR : ROLE_DISPLAY_NAMES;
  return displayNames[role] || role || 'Unknown';
};

export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  
  return permissions.includes('*') || permissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissionList) => {
  if (!userRole || !permissionList || !Array.isArray(permissionList)) return false;
  
  return permissionList.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissionList) => {
  if (!userRole || !permissionList || !Array.isArray(permissionList)) return false;
  
  return permissionList.every(permission => hasPermission(userRole, permission));
};

export const isAdmin = (role) => {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
};

export const isInstructor = (role) => {
  return role === USER_ROLES.INSTRUCTOR;
};

export const isHR = (role) => {
  return role === USER_ROLES.HR;
};

export const isStudent = (role) => {
  return role === USER_ROLES.STUDENT;
};

export const isSuperAdmin = (role) => {
  return role === USER_ROLES.SUPER_ADMIN;
};

export const canManageUsers = (role) => {
  return hasPermission(role, 'manage_users');
};

export const canViewAnalytics = (role) => {
  return hasPermission(role, 'view_analytics');
};

export const canManageClasses = (role) => {
  return hasPermission(role, 'manage_classes');
};

export const canManagePenalties = (role) => {
  return hasPermission(role, 'manage_penalties');
};

export const canViewAttendance = (role) => {
  return hasPermission(role, 'view_attendance');
};

// Role hierarchy for access control
export const ROLE_HIERARCHY = {
  [USER_ROLES.STUDENT]: 1,
  [USER_ROLES.HR]: 2,
  [USER_ROLES.INSTRUCTOR]: 3,
  [USER_ROLES.ADMIN]: 4,
  [USER_ROLES.SUPER_ADMIN]: 5
};

export const hasHigherOrEqualRole = (userRole, targetRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  return userLevel >= targetLevel;
};

export const hasHigherRole = (userRole, targetRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  return userLevel > targetLevel;
};
