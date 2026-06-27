/**
 * Consolidated User Utilities
 * Combines userHelpers.js, roleAccess.js, and other user-related utilities
 * Single source of truth for all role-related data and functions
 */

import { info, error, warn, debug } from '../services/utils/logger.js';
import userService from '../services/business/userService.js';
import { getLocalizedUserName } from './localizedUserName.js';

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

// Map workflow status to the assigned role (shared across components)
export const STATUS_ROLE_MAP = {
  UNDER_HR_REVIEW: ROLE_STRINGS.HR,
  UNDER_REVIEW: ROLE_STRINGS.HR,
  UNDER_ADMIN_REVIEW: ROLE_STRINGS.ADMIN,
};

export const getWorkflowRole = (workflow) => {
  if (!workflow) return null;
  return STATUS_ROLE_MAP[workflow.status?.toUpperCase()] || null;
};

// Extract role string from any user object (Prisma roleAssignments, roles array, or role string)
export const getUserRoleFromObject = (user) => {
  if (!user) return null;
  if (user.roleAssignments && Array.isArray(user.roleAssignments) && user.roleAssignments.length > 0) {
    const code = user.roleAssignments[0]?.role?.code;
    if (code) return code.toLowerCase();
  }
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0]?.toLowerCase?.() || user.roles[0];
  }
  if (user.role) return user.role.toLowerCase?.() || user.role;
  return null;
};

// Helper functions
export const getUserRoleDisplay = (userOrRole, t, lang) => {
  // Handle user object with role property
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    // Check boolean flags first (from AuthContext)
    if (userOrRole.isSuperAdmin) return ROLE_DISPLAY_NAMES.SUPER_ADMIN;
    if (userOrRole.isAdmin) return ROLE_DISPLAY_NAMES.ADMIN;
    if (userOrRole.isHR) return ROLE_DISPLAY_NAMES.HR;
    if (userOrRole.isInstructor) return ROLE_DISPLAY_NAMES.INSTRUCTOR;
    if (userOrRole.isStudent) return ROLE_DISPLAY_NAMES.STUDENT;
    
    // Check role property
    const role = userOrRole.role || userOrRole.roles?.[0];
    return ROLE_DISPLAY_NAMES[role] || 'Unknown';
  }
  // Handle direct role string
  return ROLE_DISPLAY_NAMES[userOrRole] || 'Unknown';
};

export const getEnglishUserName = (user, fallback = 'Unknown User') => {
  if (!user) return fallback;
  if (user.displayName) return user.displayName;
  if (user.realName) return user.realName;
  if (user.name) return user.name;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email;
  return fallback;
};

export const getUserDisplayName = (user, lang = 'en') => {
  return getLocalizedUserName(user, lang);
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
  getUserRoleDisplay,
  getLocalizedUserName,
  getEnglishUserName,
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
