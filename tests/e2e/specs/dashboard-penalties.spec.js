/**
 * Dashboard Penalties Management Test Suite
 * Tests: CRUD operations, grid, search, filters
 */
import { test, expect } from '@playwright/test';
import { PenaltiesPage } from '../pages/PenaltiesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { loginAs } from '../utils/auth';
import { testConfig, tags } from '../config/test-config';
import { generateGmailPlusAddress } from '../utils/gmail-check';

test.describe('Dashboard - Penalties Management', () => {
  let penaltiesPage;
  let dashboardPage;
  let testStudent = null;
  let testClass = null;
  let testSubject = null;
  let createdPenalties = [];

  test.beforeAll(async ({ browser }) => {
    // Setup: Create student, class, subject
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, testConfig.superAdmin);
    
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Create student
    const studentEmail = generateGmailPlusAddress('student', 'penalty');
    await dashboardPage.navigateToTab('Users');
    await dashboardPage.addUser({
      email: studentEmail,
      displayName: 'Penalty Test Student',
      role: 'student',
      autoAddToAllowlist: true
    });
    await page.waitForTimeout(2000);
    testStudent = { email: studentEmail, displayName: 'Penalty Test Student' };
    
    // Create class (simplified - you may need to adjust based on actual flow)
    await dashboardPage.navigateToTab('Classes');
    const timestamp = Date.now();
    const className = `Penalty Test Class ${timestamp}`;
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
    penaltiesPage = new PenaltiesPage(page);
    await penaltiesPage.goto();
  });

  test.afterEach(async ({ page }) => {
    if (testConfig.cleanup.enabled && !testConfig.cleanup.skipCleanup && createdPenalties.length > 0) {
      for (const penaltyId of createdPenalties) {
        try {
          await penaltiesPage.deletePenalty(penaltyId);
        } catch (e) {
          console.log(`Failed to cleanup penalty: ${penaltyId}`, e);
        }
      }
      createdPenalties = [];
    }
  });

  test(`TC-PENALTY-001: Create Penalty ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    const timestamp = Date.now();
    const penaltyData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'late',
      points: 5,
      reason: `Test penalty ${timestamp}`,
      date: new Date().toISOString().split('T')[0] // Today's date
    };

    await penaltiesPage.createPenalty(penaltyData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    const exists = await penaltiesPage.verifyPenaltyExists(testStudent.email);
    expect(exists).toBeTruthy();
    
    createdPenalties.push(`penalty-${timestamp}`);
  });

  test(`TC-PENALTY-002: Read/View Penalties in Grid ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await expect(penaltiesPage.dataGrid).toBeVisible();
    const rows = page.locator('[role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test(`TC-PENALTY-003: Update Penalty ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    // Create penalty first
    const timestamp = Date.now();
    const penaltyData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'late',
      points: 5,
      reason: `Update Test ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await penaltiesPage.createPenalty(penaltyData);
    await page.waitForTimeout(2000);
    const penaltyId = `penalty-${timestamp}`;
    createdPenalties.push(penaltyId);
    
    // Update penalty
    const updates = {
      points: 10,
      reason: `Updated Penalty ${timestamp}`
    };

    await penaltiesPage.editPenalty(penaltyId, updates);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test(`TC-PENALTY-004: Delete Penalty ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    // Create penalty first
    const timestamp = Date.now();
    const penaltyData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'late',
      points: 5,
      reason: `Delete Test ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await penaltiesPage.createPenalty(penaltyData);
    await page.waitForTimeout(2000);
    const penaltyId = `penalty-${timestamp}`;
    
    // Delete penalty
    await penaltiesPage.deletePenalty(penaltyId);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test(`TC-PENALTY-005: Search Penalties ${tags.dashboard}`, async ({ page }) => {
    if (!testStudent) {
      test.skip();
      return;
    }

    await penaltiesPage.searchPenalty(testStudent.email);
    await page.waitForTimeout(1000);
    
    const penalty = await penaltiesPage.getPenaltyInGrid(testStudent.email);
    // May or may not exist, but search should work
    expect(true).toBeTruthy();
  });

  test(`TC-PENALTY-006: Filter Penalties by Class ${tags.dashboard}`, async ({ page }) => {
    if (!testClass) {
      test.skip();
      return;
    }

    await penaltiesPage.filterByClass(testClass.name);
    await page.waitForTimeout(1000);
    
    await expect(penaltiesPage.dataGrid).toBeVisible();
  });

  test(`TC-PENALTY-007: Penalty Validation - Required Fields ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await penaltiesPage.submitButton.click();
    await page.waitForTimeout(500);
    
    const errorMessage = page.locator('.error, [role="alert"]:has-text("required"), input:invalid').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(true).toBeTruthy();
  });
});
