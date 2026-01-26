/**
 * Role-Based Access Control Tests
 * Tests all role permissions and route protection
 */
import { test, expect } from '@playwright/test';
import { loginByRole, logout } from '../utils/auth';
import { testUsers } from '../fixtures/users';
import { BASE_URL } from '../config/constants.js';

test.describe('Role-Based Access Control', () => {
  
  test.describe('Super Admin Access', () => {
    test('TC-RBAC-001: Super Admin can access Role Access Pro', async ({ page }) => {
      await loginByRole(page, 'superAdmin');
      await page.goto(BASE_URL + '/role-access-pro');
      await expect(page).toHaveURL(/.*role-access-pro.*/i);
    });

    test('TC-RBAC-002: Super Admin can access all admin screens', async ({ page }) => {
      await loginByRole(page, 'superAdmin');
      
      const adminScreens = [
        '/dashboard',
        '/quiz-management',
        '/quiz-builder',
        '/attendance',
        '/analytics',
        '/advanced-analytics'
      ];
      
      for (const screen of adminScreens) {
        await page.goto(BASE_URL + screen);
        await expect(page).toHaveURL(new RegExp(screen.replace('/', '\\/')));
      }
    });
  });

  test.describe('Admin Access', () => {
    test('TC-RBAC-003: Admin cannot access Role Access Pro', async ({ page }) => {
      await loginByRole(page, 'admin');
      await page.goto(BASE_URL + '/role-access-pro');
      // Should redirect away from role-access-pro
      await expect(page).not.toHaveURL(/.*role-access-pro.*/i);
    });

    test('TC-RBAC-004: Admin can access dashboard', async ({ page }) => {
      await loginByRole(page, 'admin');
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).toHaveURL(/.*dashboard.*/i);
    });
  });

  test.describe('Instructor Access', () => {
    test('TC-RBAC-005: Instructor can create quizzes', async ({ page }) => {
      await loginByRole(page, 'instructor');
      await page.goto(BASE_URL + '/quiz-builder');
      await expect(page).toHaveURL(/.*quiz-builder.*/i);
    });

    test('TC-RBAC-006: Instructor cannot access dashboard', async ({ page }) => {
      await loginByRole(page, 'instructor');
      await page.goto(BASE_URL + '/dashboard');
      // Should redirect (instructor doesn't have dashboard access)
      await expect(page).not.toHaveURL(/.*dashboard.*/i);
    });

    test('TC-RBAC-007: Instructor can start attendance sessions', async ({ page }) => {
      await loginByRole(page, 'instructor');
      await page.goto(BASE_URL + '/attendance');
      await expect(page).toHaveURL(/.*attendance.*/i);
      
      // Verify start session button is visible
      const startButton = page.locator('button:has-text("Start Session"), button:has-text("Start")');
      await expect(startButton).toBeVisible();
    });
  });

  test.describe('HR Access', () => {
    test('TC-RBAC-008: HR can access HR Attendance', async ({ page }) => {
      await loginByRole(page, 'hr');
      await page.goto(BASE_URL + '/hr-attendance');
      await expect(page).toHaveURL(/.*hr-attendance.*/i);
    });

    test('TC-RBAC-009: HR cannot access quiz features', async ({ page }) => {
      await loginByRole(page, 'hr');
      await page.goto(BASE_URL + '/quiz-builder');
      // Should redirect (HR doesn't have quiz access)
      await expect(page).not.toHaveURL(/.*quiz-builder.*/i);
    });

    test('TC-RBAC-010: HR cannot access instructor attendance', async ({ page }) => {
      await loginByRole(page, 'hr');
      await page.goto(BASE_URL + '/attendance');
      // Should redirect (HR uses /hr-attendance instead)
      await expect(page).not.toHaveURL(/.*\/attendance$/);
    });
  });

  test.describe('Student Access', () => {
    test('TC-RBAC-011: Student can access student dashboard', async ({ page }) => {
      await loginByRole(page, 'student');
      await page.goto(BASE_URL + '/student-dashboard');
      await expect(page).toHaveURL(/.*student-dashboard.*/i);
    });

    test('TC-RBAC-012: Student cannot create quizzes', async ({ page }) => {
      await loginByRole(page, 'student');
      await page.goto(BASE_URL + '/quiz-builder');
      // Should redirect (student cannot create quizzes)
      await expect(page).not.toHaveURL(/.*quiz-builder.*/i);
    });

    test('TC-RBAC-013: Student can scan attendance', async ({ page }) => {
      await loginByRole(page, 'student');
      await page.goto(BASE_URL + '/my-attendance');
      await expect(page).toHaveURL(/.*my-attendance.*/i);
    });

    test('TC-RBAC-014: Student cannot access dashboard', async ({ page }) => {
      await loginByRole(page, 'student');
      await page.goto(BASE_URL + '/dashboard');
      // Should redirect (student doesn't have dashboard access)
      await expect(page).not.toHaveURL(/.*dashboard.*/i);
    });
  });

  test.describe('Unauthorized Access', () => {
    test('TC-RBAC-015: Unauthenticated user redirected to login', async ({ page }) => {
      // Don't login
      await page.goto(BASE_URL + '/dashboard');
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/i);
    });

    test('TC-RBAC-016: Student accessing admin route gets redirected', async ({ page }) => {
      await loginByRole(page, 'student');
      await page.goto(BASE_URL + '/dashboard');
      // Should redirect away
      await expect(page).not.toHaveURL(/.*dashboard.*/i);
    });
  });
});
