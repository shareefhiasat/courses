/**
 * Centralized Test Configuration
 * Single source of truth for all test settings
 */

export const testConfig = {
  // Application URLs
  baseUrl: process.env.BASE_URL || 'https://localhost:5174',
  
  // Keycloak Configuration
  keycloakUrl: process.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  keycloakRealm: process.env.VITE_KEYCLOAK_REALM || 'master',
  keycloakClientId: process.env.VITE_KEYCLOAK_CLIENT_ID || 'military-lms-app',
  keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'military-lms-secret',
  
  // Test Users (configurable via environment variables)
  superAdmin: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'shareef.hiasat@gmail.com',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'Jordan123$',
    role: 'super-admin'
  },
  
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin1',
    password: process.env.TEST_ADMIN_PASSWORD || 'Test123$',
    role: 'admin'
  },
  
  instructor: {
    email: process.env.TEST_INSTRUCTOR_EMAIL || 'instructor1',
    password: process.env.TEST_INSTRUCTOR_PASSWORD || 'Test123$',
    role: 'instructor'
  },
  
  student: {
    email: process.env.TEST_STUDENT_EMAIL || 'student1',
    password: process.env.TEST_STUDENT_PASSWORD || 'Test123$',
    role: 'student'
  },

  hr: {
    email: process.env.TEST_HR_EMAIL || 'hr1@example.com',
    password: process.env.TEST_HR_PASSWORD || 'hr123',
    role: 'hr'
  },
  
  // Test Timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    apiCall: 15000
  },
  
  // Test Data
  testData: {
    programPrefix: 'E2E Program',
    subjectPrefix: 'E2E Subject',
    classPrefix: 'E2E Class'
  },
  
  // Feature Flags
  features: {
    enableE2ETests: true,
    enablePerformanceTests: false,
    enableAccessibilityTests: false
  },
  
  // Retry Configuration
  retries: {
    flaky: 2,
    stable: 0
  }
};
