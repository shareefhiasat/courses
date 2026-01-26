/**
 * Main Flow Tests - Priority 1
 * Focus: Admin creates Instructor and Student via Dashboard
 * This is the primary workflow for the platform
 */
import { test, expect } from '@playwright/test';
import { loginByRole } from '../utils/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { BASE_URL } from '../config/constants.js';

test.describe('Main Flow: Admin Creates Users', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginByRole(page, 'admin');
  });

  test('TC-MAIN-001: Admin can create Instructor via Dashboard @smoke @critical', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Navigate to Users tab
    await dashboardPage.navigateToTab('Users');
    await page.waitForTimeout(1000);
    
    // Generate unique email for this test
    const timestamp = Date.now();
    const instructorEmail = `instructor-${timestamp}@test.com`;
    const instructorName = `Test Instructor ${timestamp}`;
    
    // Create instructor
    await dashboardPage.addUser({
      email: instructorEmail,
      displayName: instructorName,
      role: 'instructor',
      autoAddToAllowlist: true
    });
    
    // Verify success message
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Verify instructor appears in table
    await dashboardPage.searchUser(instructorEmail);
    await expect(dashboardPage.getUserInTable(instructorEmail)).toBeVisible();
    
    // Verify role is correct
    const userRow = await dashboardPage.getUserInTable(instructorEmail);
    await expect(userRow.locator('text=instructor')).toBeVisible();
  });

  test('TC-MAIN-002: Admin can create Student via Dashboard @smoke @critical', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Navigate to Users tab
    await dashboardPage.navigateToTab('Users');
    await page.waitForTimeout(1000);
    
    // Generate unique email for this test
    const timestamp = Date.now();
    const studentEmail = `student-${timestamp}@test.com`;
    const studentName = `Test Student ${timestamp}`;
    
    // Create student
    await dashboardPage.addUser({
      email: studentEmail,
      displayName: studentName,
      role: 'student',
      autoAddToAllowlist: true
    });
    
    // Verify success message
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Verify student appears in table
    await dashboardPage.searchUser(studentEmail);
    await expect(dashboardPage.getUserInTable(studentEmail)).toBeVisible();
    
    // Verify role is correct
    const userRow = await dashboardPage.getUserInTable(studentEmail);
    await expect(userRow.locator('text=student')).toBeVisible();
  });

  test('TC-MAIN-003: Created Instructor can sign up and login @smoke @critical', async ({ page, context }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Navigate to Users tab
    await dashboardPage.navigateToTab('Users');
    await page.waitForTimeout(1000);
    
    // Generate unique email
    const timestamp = Date.now();
    const instructorEmail = `instructor-signup-${timestamp}@test.com`;
    const instructorName = `Instructor Signup ${timestamp}`;
    const instructorPassword = 'Test123!@#';
    
    // Create instructor via dashboard
    await dashboardPage.addUser({
      email: instructorEmail,
      displayName: instructorName,
      role: 'instructor',
      autoAddToAllowlist: true
    });
    
    // Wait for user to be created
    await page.waitForTimeout(2000);
    
    // Now test signup flow in a new context (simulating the instructor)
    // Note: In real scenario, instructor would sign up separately
    // For E2E test, we'll simulate by logging out and signing up
    
    // Logout admin
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a[href*="logout"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/.*(login|home|\/).*/i);
    }
    
    // Navigate to login/signup
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Switch to signup mode (if there's a signup link)
    const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForTimeout(500);
    }
    
    // Fill signup form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const confirmPasswordInput = page.locator('input[type="password"][name*="confirm"], input[type="password"]').nth(1);
    const displayNameInput = page.locator('input[type="text"][name*="display"], input[type="text"][name*="name"]').first();
    
    await emailInput.fill(instructorEmail);
    await passwordInput.fill(instructorPassword);
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill(instructorPassword);
    }
    if (await displayNameInput.isVisible()) {
      await displayNameInput.fill(instructorName);
    }
    
    // Submit signup
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for redirect (should go to home or dashboard)
    await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
    
    // Verify we're logged in (not on login page)
    await expect(page).not.toHaveURL(/.*login.*/i);
    
    // Verify instructor can access instructor features
    // Try to navigate to quiz builder (instructor should have access)
    await page.goto(BASE_URL + '/quiz-builder');
    // Should not redirect to login (instructor has access)
    await expect(page).toHaveURL(/.*quiz-builder.*/i);
  });

  test('TC-MAIN-004: Created Student can sign up and login @smoke @critical', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Navigate to Users tab
    await dashboardPage.navigateToTab('Users');
    await page.waitForTimeout(1000);
    
    // Generate unique email
    const timestamp = Date.now();
    const studentEmail = `student-signup-${timestamp}@test.com`;
    const studentName = `Student Signup ${timestamp}`;
    const studentPassword = 'Test123!@#';
    
    // Create student via dashboard
    await dashboardPage.addUser({
      email: studentEmail,
      displayName: studentName,
      role: 'student',
      autoAddToAllowlist: true
    });
    
    // Wait for user to be created
    await page.waitForTimeout(2000);
    
    // Logout admin
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a[href*="logout"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/.*(login|home|\/).*/i);
    }
    
    // Navigate to login/signup
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Switch to signup mode
    const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForTimeout(500);
    }
    
    // Fill signup form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const confirmPasswordInput = page.locator('input[type="password"][name*="confirm"], input[type="password"]').nth(1);
    const displayNameInput = page.locator('input[type="text"][name*="display"], input[type="text"][name*="name"]').first();
    
    await emailInput.fill(studentEmail);
    await passwordInput.fill(studentPassword);
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill(studentPassword);
    }
    if (await displayNameInput.isVisible()) {
      await displayNameInput.fill(studentName);
    }
    
    // Submit signup
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for redirect
    await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
    
    // Verify we're logged in
    await expect(page).not.toHaveURL(/.*login.*/i);
    
    // Verify student can access student features
    // Try to navigate to student dashboard (student should have access)
    await page.goto(BASE_URL + '/student-dashboard');
    // Should not redirect to login
    await expect(page).toHaveURL(/.*student-dashboard.*/i);
    
    // Verify student CANNOT access admin features
    await page.goto(BASE_URL + '/dashboard');
    // Should redirect away from dashboard (student doesn't have access)
    await expect(page).not.toHaveURL(/.*\/dashboard$/);
  });

  test('TC-MAIN-005: Admin can view created users in table @critical', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Navigate to Users tab
    await dashboardPage.navigateToTab('Users');
    await page.waitForTimeout(1000);
    
    // Create both instructor and student
    const timestamp = Date.now();
    const instructorEmail = `instructor-view-${timestamp}@test.com`;
    const studentEmail = `student-view-${timestamp}@test.com`;
    
    // Create instructor
    await dashboardPage.addUser({
      email: instructorEmail,
      displayName: `Instructor View ${timestamp}`,
      role: 'instructor',
      autoAddToAllowlist: true
    });
    
    await page.waitForTimeout(1000);
    
    // Create student
    await dashboardPage.addUser({
      email: studentEmail,
      displayName: `Student View ${timestamp}`,
      role: 'student',
      autoAddToAllowlist: true
    });
    
    await page.waitForTimeout(1000);
    
    // Verify both appear in table
    await dashboardPage.searchUser(instructorEmail);
    await expect(dashboardPage.getUserInTable(instructorEmail)).toBeVisible();
    
    await dashboardPage.searchUser(studentEmail);
    await expect(dashboardPage.getUserInTable(studentEmail)).toBeVisible();
    
    // Verify roles are displayed correctly
    const instructorRow = await dashboardPage.getUserInTable(instructorEmail);
    await expect(instructorRow.locator('text=instructor')).toBeVisible();
    
    const studentRow = await dashboardPage.getUserInTable(studentEmail);
    await expect(studentRow.locator('text=student')).toBeVisible();
  });
});
