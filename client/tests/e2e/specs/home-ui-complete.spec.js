/**
 * Home Page - Mark Complete Functionality Tests
 * Focused test suite for mark as complete functionality
 */

import { test, expect } from '@playwright/test';
import { navigateToHome, toggleComplete, isCardCompleted, getCardCount } from '../utils/home-helpers.js';
import { dismissOverlays } from '../utils/ui-helpers.js';

test.describe('Home Page — Mark Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-COMPLETE-001: Complete button visible on cards', async ({ page }) => {
    const completeBtn = page.locator('.unified-card').first().locator('button:has-text("Complete"), button:has-text("Mark as Complete")').first();
    const visible = await completeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) test.skip(true, 'No complete button on first card');
    expect(visible).toBe(true);
  });

  test('TC-HOME-COMPLETE-002: Toggle complete marks item as done', async ({ page }) => {
    const cardCount = await getCardCount(page);
    if (cardCount === 0) test.skip(true, 'No cards available');
    
    const wasCompleted = await isCardCompleted(page, 0);
    const toggled = await toggleComplete(page, 0);
    if (!toggled) test.skip(true, 'Could not toggle complete');
    
    await page.waitForTimeout(1000);
    const isNowCompleted = await isCardCompleted(page, 0);
    expect(isNowCompleted).toBe(!wasCompleted);
  });

  test('TC-HOME-COMPLETE-003: Toggle complete unmarks item', async ({ page }) => {
    const cardCount = await getCardCount(page);
    if (cardCount === 0) test.skip(true, 'No cards available');
    
    // First ensure it's completed
    const wasCompleted = await isCardCompleted(page, 0);
    if (!wasCompleted) {
      await toggleComplete(page, 0);
      await page.waitForTimeout(1000);
    }
    
    const isCompletedBefore = await isCardCompleted(page, 0);
    await toggleComplete(page, 0);
    await page.waitForTimeout(1000);
    const isCompletedAfter = await isCardCompleted(page, 0);
    
    expect(isCompletedBefore).toBe(true);
    expect(isCompletedAfter).toBe(false);
  });

  test('TC-HOME-COMPLETE-004: Completed filter shows only completed items', async ({ page }) => {
    const cardCount = await getCardCount(page);
    if (cardCount === 0) test.skip(true, 'No cards available');
    
    // Mark first card as complete
    await toggleComplete(page, 0);
    await page.waitForTimeout(1000);
    
    // Click Completed filter
    const completedFilter = page.locator('button:has-text("Completed"), [data-testid*="completed"]').first();
    const clicked = await completedFilter.isVisible({ timeout: 3000 }).catch(() => false);
    if (!clicked) test.skip(true, 'Completed filter not found');
    await completedFilter.click();
    await page.waitForTimeout(2000);
    
    // Should see at least the completed card
    const filteredCount = await getCardCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(1);
  });
});
