/**
 * AI Quick-Questions E2E Test
 *
 * Validates that the AI assistant:
 * - Opens from the floating AI Assistant (Sparkles) button on /welcome.
 * - Offers a quick-question autocomplete.
 * - Returns real data for a selected quick question.
 */
import { test, expect } from '@playwright/test';
import { gotoWithAuth } from '../utils/ui-helpers.js';

test.setTimeout(120000);

async function waitForPageReady(page) {
  // Wait for any full-screen loading overlay to disappear.
  const loading = page.locator('.simple-loading--fullscreen, .simple-loading');
  for (let i = 0; i < 30; i++) {
    const visible = await loading.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) break;
    await page.waitForTimeout(1000);
  }
}

async function maybeSkipTour(page) {
  // Onboarding tour may appear on first load; try to click Skip.
  try {
    const skip = page.getByText('Skip', { exact: false }).first();
    await skip.click({ timeout: 3000, force: true });
    await page.waitForTimeout(500);
  } catch {
    // No tour or already skipped.
  }
}

async function openAiDialog(page) {
  await waitForPageReady(page);
  await maybeSkipTour(page);

  const aiButton = page.locator('[data-testid="ai-assistant-fab"]').first();
  await expect(aiButton).toBeVisible({ timeout: 15000 });
  await aiButton.click({ force: true });

  const dialog = page.locator('[role="dialog"]').filter({ hasText: /AI Quick Questions|Smart Query Assistant|المساعد الذكي/ });
  await expect(dialog).toBeVisible({ timeout: 10000 });
  return dialog;
}

async function waitForAssistantReply(page, timeout = 30000) {
  const aiMessage = page.locator('[role="dialog"] [data-testid="ai-message"]').first();
  await expect(aiMessage).toBeVisible({ timeout });
  return aiMessage;
}

test.describe('AI Assistant — quick questions only', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, '/welcome', 'admin');
  });

  test('opens the quick-question picker', async ({ page }) => {
    const dialog = await openAiDialog(page);
    await expect(dialog.locator('[role="combobox"]').first()).toBeVisible();
  });

  test('uses the quick-question autocomplete to get a student count answer', async ({ page }) => {
    await openAiDialog(page);
    const combo = page.locator('[role="combobox"]').first();
    await combo.fill('enrolled');
    const option = page.locator('[role="option"]').filter({ hasText: /Enrolled student count/ }).first();
    await expect(option).toBeVisible({ timeout: 3000 });
    await option.click();
    const reply = await waitForAssistantReply(page, 30000);
    const text = await reply.textContent();
    expect(text).toMatch(/Unique Students|Total Class Enrollments|students/);
  });
});
