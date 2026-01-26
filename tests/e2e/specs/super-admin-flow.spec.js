/**
 * Super Admin Flow Tests
 * Priority: CRITICAL - Start here before all other tests
 * 
 * Flow: Super Admin Login → Create Users (Instructor, Student, HR, Admin) → Test Their Signup/Login
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { loginAs, logout } from '../utils/auth';
import { testConfig, testData, tags } from '../config/test-config';
import { generateGmailPlusAddress } from '../utils/gmail-check';
import { BASE_URL } from '../config/constants.js';

// Use Gmail plus addressing for all test emails
// Format: shareef.hiasat+DDMMYYYYHHMMrole@gmail.com
// All emails go to shareef.hiasat@gmail.com inbox

test.describe('Super Admin Flow - User Creation & Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Always start with super admin login
    await loginAs(page, testConfig.superAdmin);
  });

  test.describe('Super Admin Login', () => {
    test(`TC-SA-001: Super Admin can login successfully ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(testConfig.superAdmin.email, testConfig.superAdmin.password);
      await loginPage.waitForRedirect();
      
      // Verify we're logged in (not on login page)
      await expect(page).not.toHaveURL(/.*login.*/i);
      
      // Verify super admin can access dashboard
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).toHaveURL(/.*dashboard.*/i);
      
      // Verify Role Access Pro is visible (super admin exclusive)
      const dashboardPage = new DashboardPage(page);
      const hasRoleAccess = await dashboardPage.isRoleAccessVisible();
      expect(hasRoleAccess).toBeTruthy();
    });
  });

  test.describe('Create Instructor via Dashboard', () => {
    test(`TC-SA-002: Super Admin creates Instructor ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      await page.waitForTimeout(1000);
      
      // Generate unique email using Gmail plus addressing
      // Format: shareef.hiasat+DDMMYYYYHHMMinstructor@gmail.com
      const instructorEmail = generateGmailPlusAddress('instructor', 'inst');
      const instructorName = testData.generateDisplayName('Instructor', 'Test');
      
      console.log('Creating instructor with email:', instructorEmail);
      
      // Create instructor
      await dashboardPage.addUser({
        email: instructorEmail,
        displayName: instructorName,
        role: 'instructor',
        autoAddToAllowlist: true
      });
      
      // Verify success
      const successMessage = page.locator('.toast-success, .success-message');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
      
      // Verify instructor in table
      await dashboardPage.searchUser(instructorEmail);
      await expect(dashboardPage.getUserInTable(instructorEmail)).toBeVisible();
      
      // Verify role
      const userRow = await dashboardPage.getUserInTable(instructorEmail);
      await expect(userRow.locator('text=instructor')).toBeVisible();
    });

    test(`TC-SA-003: Created Instructor can sign up ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      // Create instructor with Gmail plus address
      const instructorEmail = generateGmailPlusAddress('instructor', 'signup');
      const instructorName = testData.generateDisplayName('Instructor', 'Signup');
      
      console.log('Testing instructor signup with email:', instructorEmail);
      
      await dashboardPage.addUser({
        email: instructorEmail,
        displayName: instructorName,
        role: 'instructor',
        autoAddToAllowlist: true
      });
      
      await page.waitForTimeout(2000);
      
      // Logout super admin
      await logout(page);
      
      // Test instructor signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Switch to signup
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      // Fill signup form
      await page.locator('input[type="email"]').fill(instructorEmail);
      await page.locator('input[type="password"]').first().fill(testData.defaultPassword);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(testData.defaultPassword);
      }
      const displayNameInput = page.locator('input[type="text"][name*="display"], input[type="text"][name*="name"]').first();
      if (await displayNameInput.isVisible()) {
        await displayNameInput.fill(instructorName);
      }
      
      // Submit
      await page.locator('button[type="submit"]').first().click();
      
      // Wait for redirect
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      await expect(page).not.toHaveURL(/.*login.*/i);
      
      // Verify instructor access
      await page.goto(BASE_URL + '/quiz-builder');
      await expect(page).toHaveURL(/.*quiz-builder.*/i);
    });
  });

  test.describe('Create Student via Dashboard', () => {
    test(`TC-SA-004: Super Admin creates Student ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      // Generate unique email using Gmail plus addressing
      const studentEmail = generateGmailPlusAddress('student', 'test');
      const studentName = testData.generateDisplayName('Student', 'Test');
      
      console.log('Creating student with email:', studentEmail);
      
      await dashboardPage.addUser({
        email: studentEmail,
        displayName: studentName,
        role: 'student',
        autoAddToAllowlist: true
      });
      
      const successMessage = page.locator('.toast-success, .success-message');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
      
      await dashboardPage.searchUser(studentEmail);
      await expect(dashboardPage.getUserInTable(studentEmail)).toBeVisible();
    });

    test(`TC-SA-005: Created Student can sign up ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      const studentEmail = testData.generateEmail('student-signup', 'student');
      const studentName = testData.generateDisplayName('Student', 'Signup');
      
      await dashboardPage.addUser({
        email: studentEmail,
        displayName: studentName,
        role: 'student',
        autoAddToAllowlist: true
      });
      
      await page.waitForTimeout(2000);
      await logout(page);
      
      // Test student signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(studentEmail);
      await page.locator('input[type="password"]').first().fill(testData.defaultPassword);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(testData.defaultPassword);
      }
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      
      // Verify student access
      await page.goto(BASE_URL + '/student-dashboard');
      await expect(page).toHaveURL(/.*student-dashboard.*/i);
      
      // Verify student CANNOT access admin features
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).not.toHaveURL(/.*\/dashboard$/);
    });
  });

  test.describe('Create HR via Dashboard', () => {
    test(`TC-SA-006: Super Admin creates HR ${tags.critical}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      // Generate unique email using Gmail plus addressing
      const hrEmail = generateGmailPlusAddress('hr', 'test');
      const hrName = testData.generateDisplayName('HR', 'Test');
      
      console.log('Creating HR with email:', hrEmail);
      
      await dashboardPage.addUser({
        email: hrEmail,
        displayName: hrName,
        role: 'hr',
        autoAddToAllowlist: true
      });
      
      const successMessage = page.locator('.toast-success, .success-message');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
      
      await dashboardPage.searchUser(hrEmail);
      await expect(dashboardPage.getUserInTable(hrEmail)).toBeVisible();
    });

    test(`TC-SA-007: Created HR can sign up and access HR features ${tags.critical}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      const hrEmail = testData.generateEmail('hr-signup', 'hr');
      const hrName = testData.generateDisplayName('HR', 'Signup');
      
      await dashboardPage.addUser({
        email: hrEmail,
        displayName: hrName,
        role: 'hr',
        autoAddToAllowlist: true
      });
      
      await page.waitForTimeout(2000);
      await logout(page);
      
      // Test HR signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(hrEmail);
      await page.locator('input[type="password"]').first().fill(testData.defaultPassword);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(testData.defaultPassword);
      }
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      
      // Verify HR access
      await page.goto(BASE_URL + '/hr-attendance');
      await expect(page).toHaveURL(/.*hr-attendance.*/i);
      
      // Verify HR CANNOT access instructor features
      await page.goto(BASE_URL + '/quiz-builder');
      await expect(page).not.toHaveURL(/.*quiz-builder.*/i);
    });
  });

  test.describe('Create Admin via Dashboard', () => {
    test(`TC-SA-008: Super Admin creates Admin ${tags.critical}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      // Generate unique email using Gmail plus addressing
      const adminEmail = generateGmailPlusAddress('admin', 'test');
      const adminName = testData.generateDisplayName('Admin', 'Test');
      
      console.log('Creating admin with email:', adminEmail);
      
      await dashboardPage.addUser({
        email: adminEmail,
        displayName: adminName,
        role: 'admin',
        autoAddToAllowlist: true
      });
      
      const successMessage = page.locator('.toast-success, .success-message');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
      
      await dashboardPage.searchUser(adminEmail);
      await expect(dashboardPage.getUserInTable(adminEmail)).toBeVisible();
    });

    test(`TC-SA-009: Created Admin can sign up and access admin features ${tags.critical}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      const adminEmail = testData.generateEmail('admin-signup', 'admin');
      const adminName = testData.generateDisplayName('Admin', 'Signup');
      
      await dashboardPage.addUser({
        email: adminEmail,
        displayName: adminName,
        role: 'admin',
        autoAddToAllowlist: true
      });
      
      await page.waitForTimeout(2000);
      await logout(page);
      
      // Test admin signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(adminEmail);
      await page.locator('input[type="password"]').first().fill(testData.defaultPassword);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(testData.defaultPassword);
      }
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      
      // Verify admin access
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).toHaveURL(/.*dashboard.*/i);
      
      // Verify admin CANNOT access Role Access Pro (super admin only)
      await page.goto(BASE_URL + '/role-access-pro');
      await expect(page).not.toHaveURL(/.*role-access-pro.*/i);
    });
  });

  test.describe('User Creation Validation', () => {
    test(`TC-SA-010: Cannot create user without email ${tags.critical}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      await dashboardPage.addUserButton.click();
      await page.waitForTimeout(500);
      
      // Try to submit without email
      const saveButton = page.locator('button[type="submit"]:has-text("Save")').first();
      await saveButton.click();
      
      // Should show validation error
      const errorMessage = page.locator('.toast-error, .error-message, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test(`TC-SA-011: Cannot create user with invalid email format ${tags.critical}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      await dashboardPage.addUserButton.click();
      await page.waitForTimeout(500);
      
      // Fill invalid email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill('invalid-email');
      
      // Try to submit
      const saveButton = page.locator('button[type="submit"]:has-text("Save")').first();
      await saveButton.click();
      
      // HTML5 validation should prevent submission or show error
      const isInvalid = await emailInput.evaluate(el => el.validity.valid === false);
      expect(isInvalid).toBeTruthy();
    });

    test(`TC-SA-012: Can create user with only email (display name optional) ${tags.critical}`, async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      // Generate unique email using Gmail plus addressing
      const userEmail = generateGmailPlusAddress('user', 'minimal');
      
      console.log('Testing minimal user creation with email:', userEmail);
      
      await dashboardPage.addUser({
        email: userEmail,
        displayName: '', // No display name
        role: 'student',
        autoAddToAllowlist: true
      });
      
      // Should still succeed
      const successMessage = page.locator('.toast-success, .success-message');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    });
  });
});
