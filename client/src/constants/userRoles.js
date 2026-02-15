/**
 * User Roles Constants
 * 
 * Centralized constants for user roles and permissions used throughout the application.
 * This provides type safety and makes role management easier to maintain.
 */

// User Roles - Single source of truth for role values
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  INSTRUCTOR: 'instructor',
  HR: 'hr',
  STUDENT: 'student'
};

// Role Display Names (for UI)
export const ROLE_DISPLAY_NAMES = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  instructor: 'Instructor',
  hr: 'HR',
  student: 'Student'
};

// Role Display Names (Arabic)
export const ROLE_DISPLAY_NAMES_AR = {
  admin: 'مدير',
  super_admin: 'مدير عام',
  instructor: 'مدرب',
  hr: 'الموارد البشرية',
  student: 'طالب'
};

// Role Color Mappings (semantic colors for UI consistency)
export const ROLE_COLORS = {
  student: 'success',    // Green - represents active learners
  instructor: 'info',    // Blue - represents teachers/guides  
  hr: 'primary',         // Purple/Indigo - represents support staff
  admin: 'danger',       // Red - represents administrative power
  super_admin: 'warning' // Orange - represents highest level
};

// Role Icon Mappings (Lucide React icons)
export const ROLE_ICONS = {
  student: 'User',
  instructor: 'BookOpen', 
  hr: 'Users',
  admin: 'Shield',
  super_admin: 'Crown'
};

// Role Permissions
export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'view_analytics',
    'manage_classes',
    'view_students',
    'manage_penalties',
    'view_attendance',
    'manage_programs',
    'manage_subjects'
  ],
  super_admin: ['*'], // All permissions
  instructor: [
    'manage_classes',
    'view_students',
    'view_attendance',
    'manage_penalties',
    'view_analytics'
  ],
  hr: [
    'manage_penalties',
    'view_attendance',
    'view_students',
    'view_analytics'
  ],
  student: [
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
  student: 1,
  hr: 2,
  instructor: 3,
  admin: 4,
  super_admin: 5
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

// Helper function to get role color
export const getRoleColor = (role) => {
  return ROLE_COLORS[role] || 'default';
};

// Helper function to get role icon name  
export const getRoleIcon = (role) => {
  return ROLE_ICONS[role] || 'User';
};
