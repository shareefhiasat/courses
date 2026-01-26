/**
 * Dashboard Categories Management Test Suite
 * Tests: Create, update, delete category, grid
 */
import { test, expect } from '@playwright/test';
import { CategoriesPage } from '../pages/CategoriesPage';
import { loginAs } from '../utils/auth';
import { testConfig, tags } from '../config/test-config';

test.describe('Dashboard - Categories Management', () => {
  let categoriesPage;
  let createdCategories = [];

  test.beforeEach(async ({ page }) => {
    await loginAs(page, testConfig.superAdmin);
    categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();
  });

  test.afterEach(async ({ page }) => {
    if (testConfig.cleanup.enabled && !testConfig.cleanup.skipCleanup && createdCategories.length > 0) {
      for (const categoryId of createdCategories) {
        try {
          await categoriesPage.deleteCategory(categoryId);
        } catch (e) {
          console.log(`Failed to cleanup category: ${categoryId}`, e);
        }
      }
      createdCategories = [];
    }
  });

  test(`TC-CAT-001: Create Category ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const categoryData = {
      id: `test-cat-${timestamp}`,
      name_en: `Test Category ${timestamp}`,
      name_ar: `فئة اختبار ${timestamp}`,
      order: 10
    };

    await categoriesPage.createCategory(categoryData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    const exists = await categoriesPage.verifyCategoryExists(categoryData.id);
    expect(exists).toBeTruthy();
    
    createdCategories.push(categoryData.id);
  });

  test(`TC-CAT-002: Update Category ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const categoryData = {
      id: `test-cat-update-${timestamp}`,
      name_en: `Test Category ${timestamp}`,
      name_ar: `فئة ${timestamp}`,
      order: 10
    };

    await categoriesPage.createCategory(categoryData);
    await page.waitForTimeout(2000);
    createdCategories.push(categoryData.id);
    
    const updates = {
      name_en: `Updated Category ${timestamp}`,
      order: 20
    };

    await categoriesPage.editCategory(categoryData.id, updates);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test(`TC-CAT-003: Delete Category ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const categoryData = {
      id: `test-cat-del-${timestamp}`,
      name_en: `Delete Test Category ${timestamp}`,
      name_ar: `حذف ${timestamp}`,
      order: 10
    };

    await categoriesPage.createCategory(categoryData);
    await page.waitForTimeout(2000);
    
    await categoriesPage.deleteCategory(categoryData.id);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(1000);
    const exists = await categoriesPage.verifyCategoryExists(categoryData.id);
    expect(exists).toBeFalsy();
  });

  test(`TC-CAT-004: View Categories in Grid ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await expect(categoriesPage.dataGrid).toBeVisible();
    const rows = page.locator('[role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test(`TC-CAT-005: Add Default Categories ${tags.dashboard}`, async ({ page }) => {
    // Only if no categories exist
    const gridRows = page.locator('[role="row"]');
    const rowCount = await gridRows.count();
    
    if (rowCount <= 1) { // Only header row
      await categoriesPage.addDefaultCategories();
      await page.waitForTimeout(2000);
      
      const successMessage = page.locator('.toast-success, .success-message');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }
  });
});
