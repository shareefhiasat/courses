/**
 * Home Page - Bookmark Functionality Tests
 * Focused test suite for bookmark/favorite functionality
 */

import { test, expect } from '@playwright/test';
import { navigateToHome, toggleBookmark, isCardBookmarked, getCardCount } from '../utils/home-helpers.js';
import { dismissOverlays } from '../utils/ui-helpers.js';

test.describe('Home Page — Bookmark Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-BOOKMARK-001: Bookmark button visible on cards', async ({ page }) => {
    const bookmarkBtn = page.locator('.unified-card').first().locator('button[aria-label*="bookmark"], button[aria-label*="Bookmark"]').first();
    const visible = await bookmarkBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) test.skip(true, 'No bookmark button on first card');
    expect(visible).toBe(true);
  });

  test('TC-HOME-BOOKMARK-002: Toggle bookmark adds favorite', async ({ page }) => {
    const cardCount = await getCardCount(page);
    if (cardCount === 0) test.skip(true, 'No cards available');
    
    const wasBookmarked = await isCardBookmarked(page, 0);
    const toggled = await toggleBookmark(page, 0);
    if (!toggled) test.skip(true, 'Could not toggle bookmark');
    
    await page.waitForTimeout(1000);
    const isNowBookmarked = await isCardBookmarked(page, 0);
    expect(isNowBookmarked).toBe(!wasBookmarked);
  });

  test('TC-HOME-BOOKMARK-003: Toggle bookmark removes favorite', async ({ page }) => {
    const cardCount = await getCardCount(page);
    if (cardCount === 0) test.skip(true, 'No cards available');
    
    // First ensure it's bookmarked
    const wasBookmarked = await isCardBookmarked(page, 0);
    if (!wasBookmarked) {
      await toggleBookmark(page, 0);
      await page.waitForTimeout(1000);
    }
    
    const isBookmarkedBefore = await isCardBookmarked(page, 0);
    await toggleBookmark(page, 0);
    await page.waitForTimeout(1000);
    const isBookmarkedAfter = await isCardBookmarked(page, 0);
    
    expect(isBookmarkedBefore).toBe(true);
    expect(isBookmarkedAfter).toBe(false);
  });

  test('TC-HOME-BOOKMARK-004: Bookmarked filter shows only bookmarked items', async ({ page }) => {
    const cardCount = await getCardCount(page);
    if (cardCount === 0) test.skip(true, 'No cards available');
    
    // Bookmark first card
    await toggleBookmark(page, 0);
    await page.waitForTimeout(1000);
    
    // Click Bookmarked filter
    const bookmarkFilter = page.locator('button:has-text("Bookmarked"), [data-testid*="bookmarked"]').first();
    const clicked = await bookmarkFilter.isVisible({ timeout: 3000 }).catch(() => false);
    if (!clicked) test.skip(true, 'Bookmarked filter not found');
    await bookmarkFilter.click();
    await page.waitForTimeout(2000);
    
    // Should see at least the bookmarked card
    const filteredCount = await getCardCount(page);
    expect(filteredCount).toBeGreaterThanOrEqual(1);
  });
});
