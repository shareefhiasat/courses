/**
 * Home Page - Date Format Tests
 * Focused test suite for date formatting verification
 */

import { test, expect } from '@playwright/test';
import { navigateToHome, getCardDateText, isDateFormatted } from '../utils/home-helpers.js';
import { dismissOverlays } from '../utils/ui-helpers.js';

test.describe('Home Page — Date Format Verification', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-DATE-001: Due dates are formatted (not ISO format)', async ({ page }) => {
    const dateText = await getCardDateText(page, 0);
    if (!dateText) test.skip(true, 'No date found on first card');
    
    const formatted = isDateFormatted(dateText);
    expect(formatted).toBe(true);
  });

  test('TC-HOME-DATE-002: No ISO format dates visible on cards', async ({ page }) => {
    const cards = page.locator('.unified-card');
    const count = await cards.count();
    if (count === 0) test.skip(true, 'No cards available');
    
    // Check first 5 cards for ISO format dates
    let hasIsoDate = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const dateText = await getCardDateText(page, i);
      if (dateText && dateText.includes('T')) {
        hasIsoDate = true;
        break;
      }
    }
    
    expect(hasIsoDate).toBe(false);
  });

  test('TC-HOME-DATE-003: Date format consistent across cards', async ({ page }) => {
    const cards = page.locator('.unified-card');
    const count = await cards.count();
    if (count < 2) test.skip(true, 'Need at least 2 cards to compare');
    
    const date1 = await getCardDateText(page, 0);
    const date2 = await getCardDateText(page, 1);
    
    if (!date1 || !date2) test.skip(true, 'No dates found on cards');
    
    // Both should be formatted (not ISO)
    expect(isDateFormatted(date1)).toBe(true);
    expect(isDateFormatted(date2)).toBe(true);
  });
});
