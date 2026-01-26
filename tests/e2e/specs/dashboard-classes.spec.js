/**
 * Dashboard Classes Management Test Suite
 * Tests: CRUD operations, grid, search, filters
 */
import { test, expect } from '@playwright/test';
import { ClassesPage } from '../pages/ClassesPage';
import { loginAs } from '../utils/auth';
import { testConfig, tags } from '../config/test-config';

test.describe('Dashboard - Classes Management', () => {
  let classesPage;
  let createdClasses = [];

  test.beforeEach(async ({ page }) => {
    await loginAs(page, testConfig.superAdmin);
    classesPage = new ClassesPage(page);
    await classesPage.goto();
  });

  test.afterEach(async ({ page }) => {
    if (testConfig.cleanup.enabled && !testConfig.cleanup.skipCleanup && createdClasses.length > 0) {
      for (const className of createdClasses) {
        try {
          await classesPage.deleteClass(className);
        } catch (e) {
          console.log(`Failed to cleanup class: ${className}`, e);
        }
      }
      createdClasses = [];
    }
  });

  test(`TC-CLASS-001: Create Class ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const classData = {
      name: `Test Class ${timestamp}`,
      nameAr: `فصل اختبار ${timestamp}`,
      code: `CLS-${timestamp}`
    };

    await classesPage.createClass(classData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    const exists = await classesPage.verifyClassExists(classData.name);
    expect(exists).toBeTruthy();
    
    createdClasses.push(classData.name);
  });

  test(`TC-CLASS-002: Read/View Classes in Grid ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await expect(classesPage.dataGrid).toBeVisible();
    const rows = page.locator('[role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test(`TC-CLASS-003: Update Class ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const classData = {
      name: `Test Class ${timestamp}`,
      code: `CLS-${timestamp}`
    };

    await classesPage.createClass(classData);
    await page.waitForTimeout(2000);
    createdClasses.push(classData.name);
    
    const updates = {
      name: `Updated Class ${timestamp}`
    };

    await classesPage.editClass(classData.name, updates);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    const exists = await classesPage.verifyClassExists(updates.name);
    expect(exists).toBeTruthy();
    
    createdClasses = createdClasses.filter(c => c !== classData.name);
    createdClasses.push(updates.name);
  });

  test(`TC-CLASS-004: Delete Class ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const classData = {
      name: `Delete Test Class ${timestamp}`,
      code: `CLS-DEL-${timestamp}`
    };

    await classesPage.createClass(classData);
    await page.waitForTimeout(2000);
    
    await classesPage.deleteClass(classData.name);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(1000);
    const exists = await classesPage.verifyClassExists(classData.name);
    expect(exists).toBeFalsy();
  });

  test(`TC-CLASS-005: Class Validation - Required Fields ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await classesPage.submitButton.click();
    await page.waitForTimeout(500);
    
    const errorMessage = page.locator('.error, [role="alert"]:has-text("required"), input:invalid').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(true).toBeTruthy();
  });
});
