/**
 * Test User Fixtures
 * These users should be pre-created in Firebase for testing
 * Use Firebase Emulator for isolated testing
 * 
 * Credentials come from test-config.js which reads from environment variables
 */

import { testConfig } from '../config/test-config';

export const testUsers = {
  superAdmin: {
    email: testConfig.superAdmin.email,
    password: testConfig.superAdmin.password,
    role: 'superAdmin',
    uid: 'test-superadmin-uid',
    displayName: testConfig.superAdmin.displayName
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Test123!@#',
    role: 'admin',
    uid: 'test-admin-uid',
    displayName: 'Admin Test User'
  },
  instructor: {
    email: process.env.TEST_INSTRUCTOR_EMAIL || 'instructor@test.com',
    password: process.env.TEST_INSTRUCTOR_PASSWORD || 'Test123!@#',
    role: 'instructor',
    uid: 'test-instructor-uid',
    displayName: 'Instructor Test User'
  },
  hr: {
    email: process.env.TEST_HR_EMAIL || 'hr@test.com',
    password: process.env.TEST_HR_PASSWORD || 'Test123!@#',
    role: 'hr',
    uid: 'test-hr-uid',
    displayName: 'HR Test User'
  },
  student: {
    email: process.env.TEST_STUDENT_EMAIL || 'student@test.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'Test123!@#',
    role: 'student',
    uid: 'test-student-uid',
    displayName: 'Student Test User'
  },
  student2: {
    email: process.env.TEST_STUDENT2_EMAIL || 'student2@test.com',
    password: process.env.TEST_STUDENT2_PASSWORD || 'Test123!@#',
    role: 'student',
    uid: 'test-student2-uid',
    displayName: 'Student 2 Test User'
  }
};

/**
 * Get user by role
 */
export function getUserByRole(role) {
  const roleMap = {
    superAdmin: testUsers.superAdmin,
    admin: testUsers.admin,
    instructor: testUsers.instructor,
    hr: testUsers.hr,
    student: testUsers.student
  };
  return roleMap[role];
}

/**
 * Get all test user emails (for allowlist setup)
 */
export function getAllTestUserEmails() {
  return Object.values(testUsers).map(user => user.email);
}
