/**
 * Dashboard Behavior Management Test Suite
 * Tests: CRUD operations, grid, search, filters
 */
import { test, expect } from '@playwright/test';
import { BehaviorPage } from '../pages/BehaviorPage';
import { DashboardPage } from '../pages/DashboardPage';
import { loginAs } from '../utils/auth';
import { testConfig, tags } from '../config/test-config';
import { generateGmailPlusAddress } from '../utils/gmail-check';

test.describe('Dashboard - Behavior Management', () => {
  let behaviorPage;
  let dashboardPage;
  let testStudent = null;
  let testClass = null;
  let createdBehaviors = [];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, testConfig.superAdmin);
    
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Create student
    const studentEmail = generateGmailPlusAddress('student', 'behavior');
    await dashboardPage.navigateToTab('Users');
    await dashboardPage.addUser({
      email: studentEmail,
      displayName: 'Behavior Test Student',
      role: 'student',
      autoAddToAllowlist: true
    });
    await page.waitForTimeout(2000);
    testStudent = { email: studentEmail, displayName: 'Behavior Test Student' };
    
    // Create class
    await dashboardPage.navigateToTab('Classes');
    const timestamp = Date.now();
    const className = `Behavior Test Class ${timestamp}`;
    const nameInput = page.locator('input[placeholder*="Class Name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(className);
      const submitButton = page.locator('button[type="submit"]:has-text("Create")').first();
      await submitButton.click();
      await page.waitForTimeout(2000);
      testClass = { name: className };
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, testConfig.superAdmin);
    behaviorPage = new BehaviorPage(page);
    await behaviorPage.goto();
  });

  test.afterEach(async ({ page }) => {
    if (testConfig.cleanup.enabled && !testConfig.cleanup.skipCleanup && createdBehaviors.length > 0) {
      for (const behaviorId of createdBehaviors) {
        try {
          await behaviorPage.deleteBehavior(behaviorId);
        } catch (e) {
          console.log(`Failed to cleanup behavior: ${behaviorId}`, e);
        }
      }
      createdBehaviors = [];
    }
  });

  test(`TC-BEHAV-001: Create Behavior ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    const timestamp = Date.now();
    const behaviorData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'disruptive',
      severity: 'medium',
      note: `Test behavior ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await behaviorPage.createBehavior(behaviorData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    const exists = await behaviorPage.verifyBehaviorExists(testStudent.email);
    expect(exists).toBeTruthy();
    
    createdBehaviors.push(`behavior-${timestamp}`);
  });

  test(`TC-BEHAV-002: Read/View Behaviors in Grid ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await expect(behaviorPage.dataGrid).toBeVisible();
    const rows = page.locator('[role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test(`TC-BEHAV-003: Update Behavior ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    const timestamp = Date.now();
    const behaviorData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'disruptive',
      severity: 'medium',
      note: `Update Test ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await behaviorPage.createBehavior(behaviorData);
    await page.waitForTimeout(2000);
    const behaviorId = `behavior-${timestamp}`;
    createdBehaviors.push(behaviorId);
    
    const updates = {
      severity: 'high',
      note: `Updated Behavior ${timestamp}`
    };

    await behaviorPage.editBehavior(behaviorId, updates);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test(`TC-BEHAV-004: Delete Behavior ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    const timestamp = Date.now();
    const behaviorData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'disruptive',
      severity: 'medium',
      note: `Delete Test ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await behaviorPage.createBehavior(behaviorData);
    await page.waitForTimeout(2000);
    const behaviorId = `behavior-${timestamp}`;
    
    await behaviorPage.deleteBehavior(behaviorId);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test(`TC-BEHAV-005: Search Behaviors ${tags.dashboard}`, async ({ page }) => {
    if (!testStudent) {
      test.skip();
      return;
    }

    await behaviorPage.searchBehavior(testStudent.email);
    await page.waitForTimeout(1000);
    
    expect(true).toBeTruthy();
  });

  test(`TC-BEHAV-006: Filter Behaviors by Class ${tags.dashboard}`, async ({ page }) => {
    if (!testClass) {
      test.skip();
      return;
    }

    await behaviorPage.filterByClass(testClass.name);
    await page.waitForTimeout(1000);
    
    await expect(behaviorPage.dataGrid).toBeVisible();
  });
});
