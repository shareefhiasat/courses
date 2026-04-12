/**
 * Consolidated User Utilities
 * Combines userHelpers.js, roleAccess.js, and other user-related utilities
 * Single source of truth for all role-related data and functions
 */

import { info, error, warn, debug } from '../services/utils/logger.js';
import userService from '../services/business/userService.js';

export const ROLE_STRINGS = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor', 
  ADMIN: 'admin',
  HR: 'hr',
  SUPER_ADMIN: 'super_admin'
};

export const ROLE_DISPLAY_NAMES = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
  HR: 'HR',
  SUPER_ADMIN: 'Super Admin'
};

export const ROLE_HIERARCHY = {
  [ROLE_STRINGS.SUPER_ADMIN]: 100,
  [ROLE_STRINGS.ADMIN]: 80,
  [ROLE_STRINGS.HR]: 60,
  [ROLE_STRINGS.INSTRUCTOR]: 40,
  [ROLE_STRINGS.STUDENT]: 20
};

export const ROLE_PRECEDENCE = {
  [ROLE_STRINGS.SUPER_ADMIN]: 1,
  [ROLE_STRINGS.ADMIN]: 2,
  [ROLE_STRINGS.HR]: 3,
  [ROLE_STRINGS.INSTRUCTOR]: 4,
  [ROLE_STRINGS.STUDENT]: 5
};

export const DEFAULT_ROLE = ROLE_STRINGS.STUDENT;

export const ALL_ROLES = Object.values(ROLE_STRINGS);

export const ROLE_KEYS = Object.keys(ROLE_STRINGS);

// Helper functions
export const hasScreenAccess = (userRole, screenName) => {
  // Basic implementation - can be expanded
  const screenAccess = {
    [ROLE_STRINGS.SUPER_ADMIN]: ['dashboard', 'users', 'programs', 'classes', 'attendance', 'reports', 'settings'],
    [ROLE_STRINGS.ADMIN]: ['dashboard', 'programs', 'classes', 'attendance', 'reports'],
    [ROLE_STRINGS.HR]: ['dashboard', 'users', 'reports'],
    [ROLE_STRINGS.INSTRUCTOR]: ['dashboard', 'classes', 'attendance', 'reports'],
    [ROLE_STRINGS.STUDENT]: ['dashboard', 'classes', 'attendance']
  };
  
  return screenAccess[userRole]?.includes(screenName) || false;
};

export const getUserRoleDisplay = (role) => {
  return ROLE_DISPLAY_NAMES[role] || 'Unknown';
};

export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  
  if (user.displayName) return user.displayName;
  if (user.name) return user.name;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email;
  
  return 'Unknown User';
};

export const getUserInitials = (user) => {
  if (!user) return '??';
  
  const name = getUserDisplayName(user);
  const parts = name.split(' ');
  
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  
  return name.substring(0, 2).toUpperCase();
};

export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isProfileComplete = (user) => {
  if (!user) return false;
  
  const requiredFields = ['firstName', 'lastName', 'email'];
  return requiredFields.every(field => user[field] && user[field].trim() !== '');
};

export const getUserProfile = (userId) => {
  // Mock implementation - would normally fetch from database
  return {
    id: userId,
    displayName: 'Test User',
    email: 'test@example.com',
    role: ROLE_STRINGS.STUDENT,
    isProfileComplete: true
  };
};

export const getUserDisplayNameAsync = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    return getUserDisplayName(profile);
  } catch (error) {
    error('getUserDisplayNameAsync:error', { error: error.message, userId });
    return 'Unknown User';
  }
};

// Role checking functions
export const isAdmin = (user) => user?.isAdmin || user?.role === ROLE_STRINGS.ADMIN;
export const isSuperAdmin = (user) => user?.isSuperAdmin || user?.role === ROLE_STRINGS.SUPER_ADMIN;
export const isHR = (user) => user?.isHR || user?.role === ROLE_STRINGS.HR;
export const isInstructor = (user) => user?.isInstructor || user?.role === ROLE_STRINGS.INSTRUCTOR;
export const isStudent = (user) => user?.isStudent || user?.role === ROLE_STRINGS.STUDENT;

// Default export
export default {
  ROLE_STRINGS,
  ROLE_DISPLAY_NAMES,
  ROLE_HIERARCHY,
  ROLE_PRECEDENCE,
  DEFAULT_ROLE,
  ALL_ROLES,
  ROLE_KEYS,
  hasScreenAccess,
  getUserRoleDisplay,
  getUserDisplayName,
  getUserInitials,
  isValidEmail,
  isProfileComplete,
  getUserProfile,
  getUserDisplayNameAsync,
  isAdmin,
  isSuperAdmin,
  isHR,
  isInstructor,
  isStudent
};
