/**
 * Centralized Test Configuration
 * Single source of truth for all test settings
 *
 * SECURITY: All credentials must come from environment variables.
 * No hardcoded passwords or real email addresses in source code.
 * Tests will fail fast if required env vars are missing.
 */

function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Set it in your .env or CI environment before running tests.`
    );
  }
  return val;
}

function optionalEnv(key, fallback) {
  return process.env[key] || fallback;
}

export const testConfig = {
  // Application URLs
  baseUrl: optionalEnv('BASE_URL', 'https://localhost:5174'),

  // Keycloak Configuration
  keycloakUrl: optionalEnv('VITE_KEYCLOAK_URL', 'http://localhost:8080'),
  keycloakRealm: optionalEnv('VITE_KEYCLOAK_REALM', 'master'),
  keycloakClientId: optionalEnv('VITE_KEYCLOAK_CLIENT_ID', 'military-lms-app'),
  keycloakClientSecret: requireEnv('KEYCLOAK_CLIENT_SECRET'),

  // Test Users — credentials must be provided via environment variables
  superAdmin: {
    email: requireEnv('TEST_SUPER_ADMIN_EMAIL'),
    password: requireEnv('TEST_SUPER_ADMIN_PASSWORD'),
    role: 'super-admin'
  },

  admin: {
    email: requireEnv('TEST_ADMIN_EMAIL'),
    password: requireEnv('TEST_ADMIN_PASSWORD'),
    role: 'admin'
  },

  instructor: {
    email: requireEnv('TEST_INSTRUCTOR_EMAIL'),
    password: requireEnv('TEST_INSTRUCTOR_PASSWORD'),
    role: 'instructor'
  },

  student: {
    email: requireEnv('TEST_STUDENT_EMAIL'),
    password: requireEnv('TEST_STUDENT_PASSWORD'),
    role: 'student'
  },

  hr: {
    email: requireEnv('TEST_HR_EMAIL'),
    password: requireEnv('TEST_HR_PASSWORD'),
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
