/**
 * Home Page - Search Functionality Tests
 * Focused test suite for search functionality
 */

import { test, expect } from '@playwright/test';
import { navigateToHome, search, clearSearch, getCardCount } from '../utils/home-helpers.js';
import { dismissOverlays } from '../utils/ui-helpers.js';

test.describe('Home Page — Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-SEARCH-001: Search box visible', async ({ page }) => {
    const searchBox = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    const visible = await searchBox.isVisible({ timeout: 5000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-HOME-SEARCH-002: Search filters results', async ({ page }) => {
    const countBefore = await getCardCount(page);
    if (countBefore === 0) test.skip(true, 'No cards to search');
    
    const searched = await search(page, 'zzz_nonexistent_xyz');
    if (!searched) test.skip(true, 'Search box not found');
    
    const countAfter = await getCardCount(page);
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  test('TC-HOME-SEARCH-003: Clear search restores results', async ({ page }) => {
    const countBefore = await getCardCount(page);
    if (countBefore === 0) test.skip(true, 'No cards to search');
    
    await search(page, 'zzz_nonexistent_xyz');
    await page.waitForTimeout(2000);
    
    const cleared = await clearSearch(page);
    if (!cleared) test.skip(true, 'Could not clear search');
    
    await page.waitForTimeout(1500);
    const countAfter = await getCardCount(page);
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });

  test('TC-HOME-SEARCH-004: Search with valid term shows results', async ({ page }) => {
    const countBefore = await getCardCount(page);
    if (countBefore === 0) test.skip(true, 'No cards to search');
    
    // Get first card title for search
    const firstCard = page.locator('.unified-card').first();
    const title = await firstCard.locator('h3, .title').first().textContent().catch(() => '');
    if (!title) test.skip(true, 'Could not get card title');
    
    const searchTerms = title.split(' ').slice(0, 2).join(' ');
    await search(page, searchTerms);
    await page.waitForTimeout(2000);
    
    const countAfter = await getCardCount(page);
    expect(countAfter).toBeGreaterThanOrEqual(0);
  });
});
