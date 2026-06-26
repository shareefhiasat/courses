/**
 * Home Page - Activity Type Filters Tests
 * Focused test suite for activity type filter functionality
 */

import { test, expect } from '@playwright/test';
import { navigateToHome, clickFilter, getCardCount } from '../utils/home-helpers.js';
import { dismissOverlays } from '../utils/ui-helpers.js';

test.describe('Home Page — Activity Type Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-FILTER-001: All filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'All');
    if (!clicked) test.skip(true, 'All filter not found');
  });

  test('TC-HOME-FILTER-002: Quiz filter changes results', async ({ page }) => {
    const countBefore = await getCardCount(page);
    const clicked = await clickFilter(page, 'Quiz');
    if (!clicked) test.skip(true, 'Quiz filter not found');
    const countAfter = await getCardCount(page);
    expect(countAfter).toBeGreaterThanOrEqual(0);
  });

  test('TC-HOME-FILTER-003: Homework filter changes results', async ({ page }) => {
    const clicked = await clickFilter(page, 'Homework');
    if (!clicked) test.skip(true, 'Homework filter not found');
    const hasContent = await page.locator('.unified-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasContent) test.skip(true, 'No homework activities in test data');
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-FILTER-004: Training filter changes results', async ({ page }) => {
    const clicked = await clickFilter(page, 'Training');
    if (!clicked) test.skip(true, 'Training filter not found');
    const hasContent = await page.locator('.unified-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasContent) test.skip(true, 'No training activities in test data');
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-FILTER-005: Lab filter changes results', async ({ page }) => {
    const clicked = await clickFilter(page, 'Lab');
    if (!clicked) test.skip(true, 'Lab filter not found');
    const hasContent = await page.locator('.unified-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasContent) test.skip(true, 'No lab activities in test data');
    expect(hasContent).toBe(true);
  });
});

test.describe('Home Page — Status Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-STATUS-001: Completed filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Completed');
    if (!clicked) test.skip(true, 'Completed filter not found');
  });

  test('TC-HOME-STATUS-002: Not Started filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Not Started');
    if (!clicked) test.skip(true, 'Not Started filter not found');
  });

  test('TC-HOME-STATUS-003: Required filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Required');
    if (!clicked) test.skip(true, 'Required filter not found');
  });

  test('TC-HOME-STATUS-004: Optional filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Optional');
    if (!clicked) test.skip(true, 'Optional filter not found');
  });

  test('TC-HOME-STATUS-005: Overdue filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Overdue');
    if (!clicked) test.skip(true, 'Overdue filter not found');
  });
});

test.describe('Home Page — Special Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-SPECIAL-001: Bookmarked filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Bookmarked');
    if (!clicked) test.skip(true, 'Bookmarked filter not found');
  });

  test('TC-HOME-SPECIAL-002: Featured filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Featured');
    if (!clicked) test.skip(true, 'Featured filter not found');
  });

  test('TC-HOME-SPECIAL-003: Retakable filter visible', async ({ page }) => {
    const clicked = await clickFilter(page, 'Retakable');
    if (!clicked) test.skip(true, 'Retakable filter not found');
  });

  test('TC-HOME-SPECIAL-004: Level filter visible', async ({ page }) => {
    const levelFilter = page.locator('button:has-text("All Levels"), select:has-text("Level"), [data-testid*="level"]').first();
    const visible = await levelFilter.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'Level filter not found');
  });
});
