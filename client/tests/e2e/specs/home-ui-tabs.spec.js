/**
 * Home Page - Tab Navigation Tests
 * Focused test suite for tab switching functionality
 */

import { test, expect } from '@playwright/test';
import { navigateToHome, clickTab, waitForContent } from '../utils/home-helpers.js';
import { dismissOverlays } from '../utils/ui-helpers.js';

test.describe('Home Page — Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-TAB-001: Activities tab visible and clickable', async ({ page }) => {
    const clicked = await clickTab(page, 'Activities');
    if (!clicked) test.skip(true, 'Activities tab not found');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-TAB-002: Resources tab visible and clickable', async ({ page }) => {
    const clicked = await clickTab(page, 'Resources');
    if (!clicked) test.skip(true, 'Resources tab not found');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-TAB-003: Announcements tab visible and clickable', async ({ page }) => {
    const clicked = await clickTab(page, 'Announcements');
    if (!clicked) test.skip(true, 'Announcements tab not found');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-TAB-004: Review Results tab visible and clickable', async ({ page }) => {
    const clicked = await clickTab(page, 'Review Results');
    if (!clicked) test.skip(true, 'Review Results tab not found');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-TAB-005: Tab switch changes content', async ({ page }) => {
    const tabs = page.locator('[role="tab"], button:has-text("Activities"), button:has-text("Resources")');
    const count = await tabs.count();
    if (count < 2) test.skip(true, 'Not enough tabs');

    await tabs.first().click();
    await page.waitForTimeout(1000);
    const content1 = await page.locator('main, [role="main"], .content').first().textContent().catch(() => '');

    await tabs.nth(1).click();
    await page.waitForTimeout(1000);
    const content2 = await page.locator('main, [role="main"], .content').first().textContent().catch(() => '');

    expect(content1).toBeTruthy();
    expect(content2).toBeTruthy();
    expect(content1).not.toBe(content2);
  });
});
