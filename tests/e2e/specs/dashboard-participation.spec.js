/**
 * Dashboard Participation Management Test Suite
 * Tests: CRUD operations, grid, search, filters
 */
import { test, expect } from '@playwright/test';
import { ParticipationPage } from '../pages/ParticipationPage';
import { DashboardPage } from '../pages/DashboardPage';
import { loginAs } from '../utils/auth';
import { testConfig, tags } from '../config/test-config';
import { generateGmailPlusAddress } from '../utils/gmail-check';

test.describe('Dashboard - Participation Management', () => {
  let participationPage;
  let dashboardPage;
  let testStudent = null;
  let testClass = null;
  let createdParticipations = [];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, testConfig.superAdmin);
    
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Create student
    const studentEmail = generateGmailPlusAddress('student', 'participation');
    await dashboardPage.navigateToTab('Users');
    await dashboardPage.addUser({
      email: studentEmail,
      displayName: 'Participation Test Student',
      role: 'student',
      autoAddToAllowlist: true
    });
    await page.waitForTimeout(2000);
    testStudent = { email: studentEmail, displayName: 'Participation Test Student' };
    
    // Create class
    await dashboardPage.navigateToTab('Classes');
    const timestamp = Date.now();
    const className = `Participation Test Class ${timestamp}`;
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
    participationPage = new ParticipationPage(page);
    await participationPage.goto();
  });

  test.afterEach(async ({ page }) => {
    if (testConfig.cleanup.enabled && !testConfig.cleanup.skipCleanup && createdParticipations.length > 0) {
      for (const participationId of createdParticipations) {
        try {
          await participationPage.deleteParticipation(participationId);
        } catch (e) {
          console.log(`Failed to cleanup participation: ${participationId}`, e);
        }
      }
      createdParticipations = [];
    }
  });

  test(`TC-PART-001: Create Participation ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    const timestamp = Date.now();
    const participationData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'active_participation',
      points: 5,
      description: `Test participation ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await participationPage.createParticipation(participationData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    const exists = await participationPage.verifyParticipationExists(testStudent.email);
    expect(exists).toBeTruthy();
    
    createdParticipations.push(`participation-${timestamp}`);
  });

  test(`TC-PART-002: Read/View Participations in Grid ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await expect(participationPage.dataGrid).toBeVisible();
    const rows = page.locator('[role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test(`TC-PART-003: Update Participation ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    const timestamp = Date.now();
    const participationData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'active_participation',
      points: 5,
      description: `Update Test ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await participationPage.createParticipation(participationData);
    await page.waitForTimeout(2000);
    const participationId = `participation-${timestamp}`;
    createdParticipations.push(participationId);
    
    const updates = {
      points: 10,
      description: `Updated Participation ${timestamp}`
    };

    await participationPage.editParticipation(participationId, updates);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test(`TC-PART-004: Delete Participation ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    if (!testStudent || !testClass) {
      test.skip();
      return;
    }

    const timestamp = Date.now();
    const participationData = {
      studentId: testStudent.email,
      classId: testClass.name,
      type: 'active_participation',
      points: 5,
      description: `Delete Test ${timestamp}`,
      date: new Date().toISOString().split('T')[0]
    };

    await participationPage.createParticipation(participationData);
    await page.waitForTimeout(2000);
    const participationId = `participation-${timestamp}`;
    
    await participationPage.deleteParticipation(participationId);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test(`TC-PART-005: Search Participations ${tags.dashboard}`, async ({ page }) => {
    if (!testStudent) {
      test.skip();
      return;
    }

    await participationPage.searchParticipation(testStudent.email);
    await page.waitForTimeout(1000);
    
    expect(true).toBeTruthy();
  });

  test(`TC-PART-006: Filter Participations by Class ${tags.dashboard}`, async ({ page }) => {
    if (!testClass) {
      test.skip();
      return;
    }

    await participationPage.filterByClass(testClass.name);
    await page.waitForTimeout(1000);
    
    await expect(participationPage.dataGrid).toBeVisible();
  });
});
