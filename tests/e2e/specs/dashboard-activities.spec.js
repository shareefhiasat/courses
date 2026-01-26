/**
 * Dashboard Activities Management Test Suite
 * Tests: Create activities (homework, activity, resource, announcement), CRUD, grid
 */
import { test, expect } from '@playwright/test';
import { ActivitiesPage } from '../pages/ActivitiesPage';
import { loginAs } from '../utils/auth';
import { testConfig, tags } from '../config/test-config';

test.describe('Dashboard - Activities Management', () => {
  let activitiesPage;
  let createdActivities = [];

  test.beforeEach(async ({ page }) => {
    await loginAs(page, testConfig.superAdmin);
    activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();
  });

  test.afterEach(async ({ page }) => {
    if (testConfig.cleanup.enabled && !testConfig.cleanup.skipCleanup && createdActivities.length > 0) {
      for (const activityTitle of createdActivities) {
        try {
          await activitiesPage.deleteActivity(activityTitle);
        } catch (e) {
          console.log(`Failed to cleanup activity: ${activityTitle}`, e);
        }
      }
      createdActivities = [];
    }
  });

  test(`TC-ACT-001: Create Homework Activity ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const activityData = {
      title_en: `Homework ${timestamp}`,
      title_ar: `واجب ${timestamp}`,
      type: 'homework',
      description_en: 'Complete the assignment',
      url: 'https://example.com/homework'
    };

    await activitiesPage.createActivity(activityData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    const exists = await activitiesPage.verifyActivityExists(activityData.title_en);
    expect(exists).toBeTruthy();
    
    createdActivities.push(activityData.title_en);
  });

  test(`TC-ACT-002: Create Activity Type ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const activityData = {
      title_en: `Activity ${timestamp}`,
      type: 'activity',
      description_en: 'Complete this activity'
    };

    await activitiesPage.createActivity(activityData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    createdActivities.push(activityData.title_en);
  });

  test(`TC-ACT-003: Create Resource Activity ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const activityData = {
      title_en: `Resource ${timestamp}`,
      type: 'resource',
      description_en: 'Study this resource',
      url: 'https://example.com/resource'
    };

    await activitiesPage.createActivity(activityData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    createdActivities.push(activityData.title_en);
  });

  test(`TC-ACT-004: Create Announcement Activity ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const activityData = {
      title_en: `Announcement ${timestamp}`,
      type: 'announcement',
      description_en: 'Important announcement'
    };

    await activitiesPage.createActivity(activityData);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    createdActivities.push(activityData.title_en);
  });

  test(`TC-ACT-005: Update Activity ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const activityData = {
      title_en: `Update Test ${timestamp}`,
      type: 'homework',
      description_en: 'Original description'
    };

    await activitiesPage.createActivity(activityData);
    await page.waitForTimeout(2000);
    createdActivities.push(activityData.title_en);
    
    const updates = {
      title_en: `Updated Activity ${timestamp}`
    };

    await activitiesPage.editActivity(activityData.title_en, updates);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    createdActivities = createdActivities.filter(a => a !== activityData.title_en);
    createdActivities.push(updates.title_en);
  });

  test(`TC-ACT-006: Delete Activity ${tags.critical} ${tags.dashboard} ${tags.crud}`, async ({ page }) => {
    const timestamp = Date.now();
    const activityData = {
      title_en: `Delete Test ${timestamp}`,
      type: 'homework'
    };

    await activitiesPage.createActivity(activityData);
    await page.waitForTimeout(2000);
    
    await activitiesPage.deleteActivity(activityData.title_en);
    
    const successMessage = page.locator('.toast-success, .success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(1000);
    const exists = await activitiesPage.verifyActivityExists(activityData.title_en);
    expect(exists).toBeFalsy();
  });

  test(`TC-ACT-007: View Activities in Grid ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await expect(activitiesPage.dataGrid).toBeVisible();
    const rows = page.locator('[role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
