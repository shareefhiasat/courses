/**
 * Comprehensive User Flow Tests
 * Tests complete workflows: Create → Signup → Login → Access Control
 * 
 * Groups:
 * - Super Admin creates all user types
 * - Each user type signs up
 * - Each user type logs in
 * - Each user type accesses appropriate features
 * - Each user type is blocked from inappropriate features
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { loginAs, logout } from '../utils/auth';
import { BASE_URL } from '../config/constants.js';
import { testConfig, testData, tags } from '../config/test-config';
import { generateGmailPlusAddress } from '../utils/gmail-check';

// Use Gmail plus addressing for all test emails
// Format: shareef.hiasat+DDMMYYYYHHMMrole@gmail.com
// All emails go to shareef.hiasat@gmail.com inbox

test.describe('Comprehensive User Flow - Complete Workflows', () => {
  
  // Store created user emails for cleanup
  const createdUsers = {
    instructor: null,
    student: null,
    hr: null,
    admin: null
  };

  test.beforeAll(async ({ browser }) => {
    // Create all users first (super admin)
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await loginAs(page, testConfig.superAdmin);
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      await page.waitForTimeout(1000);
      
      // Create all user types using Gmail plus addressing
      const roles = ['instructor', 'student', 'hr', 'admin'];
      for (const role of roles) {
        const email = generateGmailPlusAddress(role, 'e2e');
        const name = testData.generateDisplayName(role, 'E2E Test');
        
        await dashboardPage.addUser({
          email,
          displayName: name,
          role,
          autoAddToAllowlist: true
        });
        
        await page.waitForTimeout(1000);
        createdUsers[role] = { email, name, password: testData.defaultPassword };
      }
    } finally {
      await context.close();
    }
  });

  test.describe('Instructor Complete Flow', () => {
    test(`TC-FLOW-001: Instructor signup → login → access instructor features ${tags.critical} ${tags.smoke} ${tags.mainFlow}`, async ({ page }) => {
      if (!createdUsers.instructor) {
        test.skip();
        return;
      }

      const { email, name, password } = createdUsers.instructor;
      
      // Step 1: Signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(password);
      }
      const displayNameInput = page.locator('input[type="text"][name*="display"], input[type="text"][name*="name"]').first();
      if (await displayNameInput.isVisible()) {
        await displayNameInput.fill(name);
      }
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      await expect(page).not.toHaveURL(/.*login.*/i);
      
      // Step 2: Verify instructor access
      await page.goto(BASE_URL + '/quiz-builder');
      await expect(page).toHaveURL(/.*quiz-builder.*/i);
      
      await page.goto(BASE_URL + '/attendance');
      await expect(page).toHaveURL(/.*attendance.*/i);
      
      await page.goto(BASE_URL + '/quiz-management');
      await expect(page).toHaveURL(/.*quiz-management.*/i);
      
      // Step 3: Verify instructor blocked from admin features
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).not.toHaveURL(/.*\/dashboard$/);
      
      await page.goto(BASE_URL + '/role-access-pro');
      await expect(page).not.toHaveURL(/.*role-access-pro.*/i);
    });

    test(`TC-FLOW-002: Instructor login after signup ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      if (!createdUsers.instructor) {
        test.skip();
        return;
      }

      const { email, password } = createdUsers.instructor;
      
      // Logout if logged in
      await page.goto(BASE_URL + '/');
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);
      await loginPage.waitForRedirect();
      
      // Verify logged in
      await expect(page).not.toHaveURL(/.*login.*/i);
      
      // Verify instructor features accessible
      await page.goto(BASE_URL + '/quiz-builder');
      await expect(page).toHaveURL(/.*quiz-builder.*/i);
    });
  });

  test.describe('Student Complete Flow', () => {
    test(`TC-FLOW-003: Student signup → login → access student features ${tags.critical} ${tags.smoke} ${tags.mainFlow}`, async ({ page }) => {
      if (!createdUsers.student) {
        test.skip();
        return;
      }

      const { email, name, password } = createdUsers.student;
      
      // Signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(password);
      }
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      
      // Verify student access
      await page.goto(BASE_URL + '/student-dashboard');
      await expect(page).toHaveURL(/.*student-dashboard.*/i);
      
      await page.goto(BASE_URL + '/my-attendance');
      await expect(page).toHaveURL(/.*my-attendance.*/i);
      
      await page.goto(BASE_URL + '/progress');
      await expect(page).toHaveURL(/.*progress.*/i);
      
      // Verify student blocked from admin/instructor features
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).not.toHaveURL(/.*\/dashboard$/);
      
      await page.goto(BASE_URL + '/quiz-builder');
      await expect(page).not.toHaveURL(/.*quiz-builder.*/i);
    });

    test(`TC-FLOW-004: Student login after signup ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      if (!createdUsers.student) {
        test.skip();
        return;
      }

      const { email, password } = createdUsers.student;
      
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);
      await loginPage.waitForRedirect();
      
      await expect(page).not.toHaveURL(/.*login.*/i);
      
      await page.goto(BASE_URL + '/student-dashboard');
      await expect(page).toHaveURL(/.*student-dashboard.*/i);
    });
  });

  test.describe('HR Complete Flow', () => {
    test(`TC-FLOW-005: HR signup → login → access HR features ${tags.critical} ${tags.smoke} ${tags.mainFlow}`, async ({ page }) => {
      if (!createdUsers.hr) {
        test.skip();
        return;
      }

      const { email, name, password } = createdUsers.hr;
      
      // Signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(password);
      }
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      
      // Verify HR access
      await page.goto(BASE_URL + '/hr-attendance');
      await expect(page).toHaveURL(/.*hr-attendance.*/i);
      
      await page.goto(BASE_URL + '/hr-penalties');
      await expect(page).toHaveURL(/.*hr-penalties.*/i);
      
      // Verify HR blocked from other features
      await page.goto(BASE_URL + '/quiz-builder');
      await expect(page).not.toHaveURL(/.*quiz-builder.*/i);
      
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).not.toHaveURL(/.*\/dashboard$/);
    });
  });

  test.describe('Admin Complete Flow', () => {
    test(`TC-FLOW-006: Admin signup → login → access admin features ${tags.critical} ${tags.smoke} ${tags.mainFlow}`, async ({ page }) => {
      if (!createdUsers.admin) {
        test.skip();
        return;
      }

      const { email, name, password } = createdUsers.admin;
      
      // Signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(password);
      }
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      
      // Verify admin access
      await page.goto(BASE_URL + '/dashboard');
      await expect(page).toHaveURL(/.*dashboard.*/i);
      
      await page.goto(BASE_URL + '/quiz-management');
      await expect(page).toHaveURL(/.*quiz-management.*/i);
      
      // Verify admin CANNOT access Role Access Pro (super admin only)
      await page.goto(BASE_URL + '/role-access-pro');
      await expect(page).not.toHaveURL(/.*role-access-pro.*/i);
    });
  });
});
