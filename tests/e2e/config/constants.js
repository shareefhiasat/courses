/**
 * Test Configuration Constants
 * Centralized configuration for all E2E tests
 */

// Base URL Configuration
export const BASE_URL = process.env.BASE_URL || 'https://localhost:5174';

// Test Timeouts (in milliseconds)
export const TIMEOUTS = {
  NAVIGATION: 30000,
  ACTION: 10000,
  LOGIN: 5000,
  PAGE_LOAD: 5000,
  ELEMENT_WAIT: 3000,
  AUTH_STATE: 2000,
};

// Test User Roles
export const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  HR: 'hr',
  STUDENT: 'student',
};

// Page Paths
export const PATHS = {
  LOGIN: '/login',
  HOME: '/',
  DASHBOARD: '/dashboard',
  ACTIVITIES: '/?mode=activities',
  RESOURCES: '/?mode=resources',
  QUIZZES: '/?mode=quizzes',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

// Selectors (Common)
export const SELECTORS = {
  // Auth
  EMAIL_INPUT: 'input[name="email"], input[type="email"]',
  PASSWORD_INPUT: 'input[name="password"], input[type="password"]',
  SUBMIT_BUTTON: 'button[type="submit"]',
  
  // Navigation
  LOGOUT_BUTTON: 'button:has-text("Logout"), button:has-text("Sign Out"), a[href*="logout"]',
  
  // Common elements
  LOADING_SPINNER: '.loading, [data-testid="loading"], .spinner',
  ERROR_MESSAGE: '.error-message, [role="alert"], .toast-error',
  SUCCESS_MESSAGE: '.success-message, .toast-success',
};

// Test Data
export const TEST_DATA = {
  DEFAULT_PASSWORD: 'Test123!@#',
  SAMPLE_ACTIVITY: 'Sample Activity',
  SAMPLE_QUIZ: 'Sample Quiz',
};

export default {
  BASE_URL,
  TIMEOUTS,
  ROLES,
  PATHS,
  SELECTORS,
  TEST_DATA,
};
