/**
 * Home Page Test Helpers
 * Reusable functions for home page E2E tests
 */

/**
 * Navigate to home page with specific mode and activity type
 * @param {Page} page - Playwright page instance
 * @param {string} mode - 'activities' | 'resources' | 'announcements'
 * @param {string} activityType - 'all' | 'quiz' | 'homework' | 'training' | 'lab'
 * @param {string} role - User role for authentication
 */
export async function navigateToHome(page, mode = 'activities', activityType = 'all', role = 'superAdmin') {
  const { gotoWithAuth } = await import('./ui-helpers.js');
  const url = mode === 'activities' && activityType !== 'all' 
    ? `/?mode=${mode}&activityType=${activityType}`
    : `/?mode=${mode}`;
  await gotoWithAuth(page, url, role);
}

/**
 * Wait for content to appear on page
 * @param {Page} page - Playwright page instance
 */
export async function waitForContent(page) {
  const { waitForContent: wc } = await import('./ui-helpers.js');
  return await wc(page);
}

/**
 * Click a tab by name
 * @param {Page} page - Playwright page instance
 * @param {string} tabName - Tab name (Activities, Resources, Announcements, Review Results)
 */
export async function clickTab(page, tabName) {
  const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}"), a:has-text("${tabName}")`).first();
  const visible = await tab.isVisible({ timeout: 5000 }).catch(() => false);
  if (!visible) return false;
  await tab.click();
  await page.waitForTimeout(1000);
  return true;
}

/**
 * Click a filter button by name
 * @param {Page} page - Playwright page instance
 * @param {string} filterName - Filter button text
 */
export async function clickFilter(page, filterName) {
  const filter = page.locator(`button:has-text("${filterName}"), [data-testid*="${filterName.toLowerCase()}"]`).first();
  const visible = await filter.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return false;
  await filter.click();
  await page.waitForTimeout(2000);
  return true;
}

/**
 * Toggle bookmark on a card
 * @param {Page} page - Playwright page instance
 * @param {number} cardIndex - Index of the card (0-based)
 */
export async function toggleBookmark(page, cardIndex = 0) {
  const bookmarkBtn = page.locator('.unified-card').nth(cardIndex).locator('button[aria-label*="bookmark"], button[aria-label*="Bookmark"]').first();
  const visible = await bookmarkBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return false;
  await bookmarkBtn.click();
  await page.waitForTimeout(500);
  return true;
}

/**
 * Toggle complete status on a card
 * @param {Page} page - Playwright page instance
 * @param {number} cardIndex - Index of the card (0-based)
 */
export async function toggleComplete(page, cardIndex = 0) {
  const completeBtn = page.locator('.unified-card').nth(cardIndex).locator('button:has-text("Complete"), button:has-text("Mark as Complete")').first();
  const visible = await completeBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return false;
  await completeBtn.click();
  await page.waitForTimeout(500);
  return true;
}

/**
 * Check if card is bookmarked
 * @param {Page} page - Playwright page instance
 * @param {number} cardIndex - Index of the card (0-based)
 */
export async function isCardBookmarked(page, cardIndex = 0) {
  const bookmarkBtn = page.locator('.unified-card').nth(cardIndex).locator('button[aria-label*="bookmark"], button[aria-label*="Bookmark"]').first();
  const ariaLabel = await bookmarkBtn.getAttribute('aria-label').catch(() => '');
  return ariaLabel?.toLowerCase().includes('bookmarked') || false;
}

/**
 * Check if card is completed
 * @param {Page} page - Playwright page instance
 * @param {number} cardIndex - Index of the card (0-based)
 */
export async function isCardCompleted(page, cardIndex = 0) {
  const card = page.locator('.unified-card').nth(cardIndex);
  const hasCompletedBadge = await card.locator('[class*="completed"], [class*="done"], text=/completed/i').isVisible({ timeout: 1000 }).catch(() => false);
  return hasCompletedBadge;
}

/**
 * Get date text from a card
 * @param {Page} page - Playwright page instance
 * @param {number} cardIndex - Index of the card (0-based)
 */
export async function getCardDateText(page, cardIndex = 0) {
  const card = page.locator('.unified-card').nth(cardIndex);
  const dateText = await card.locator('text=/\\d{4}-\\d{2}-\\d{2}|\\d{2}\\/\\d{2}\\/\\d{4}/').first().textContent().catch(() => '');
  return dateText;
}

/**
 * Verify date is formatted (not ISO format)
 * @param {string} dateText - Date text to check
 */
export function isDateFormatted(dateText) {
  // ISO format: 2026-06-25T14:22:21
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  // Formatted format: 25/06/2026 or similar
  const formattedPattern = /^\d{2}\/\d{2}\/\d{4}/;
  
  if (!dateText) return false;
  return !isoPattern.test(dateText) && formattedPattern.test(dateText);
}

/**
 * Search in search box
 * @param {Page} page - Playwright page instance
 * @param {string} searchTerm - Search term
 */
export async function search(page, searchTerm) {
  const search = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
  const visible = await search.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return false;
  await search.fill(searchTerm);
  await page.waitForTimeout(2000);
  return true;
}

/**
 * Clear search
 * @param {Page} page - Playwright page instance
 */
export async function clearSearch(page) {
  const search = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
  const visible = await search.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return false;
  await search.fill('');
  await page.waitForTimeout(1500);
  return true;
}

/**
 * Get number of visible cards
 * @param {Page} page - Playwright page instance
 */
export async function getCardCount(page) {
  return await page.locator('.unified-card').count();
}
