/**
 * Manual AI Assistant verification using user-provided admin credentials.
 * Logs in via Keycloak, opens the AI assistant, sends a greeting and a data query.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:5174';
const USER = {
  email: 'all.admin@example.com',
  password: 'Jordan123$',
};

async function login(page) {
  await page.goto(`${BASE_URL}/welcome`);
  await page.waitForLoadState('networkidle');

  // Wait for Keycloak redirect
  await page.waitForURL((url) => url.toString().includes('keycloak') || url.toString().includes('8080'), {
    timeout: 20000,
  });

  await page.locator('input[name="username"], input[type="email"], input#username').first().fill(USER.email);
  await page.locator('input[name="password"], input[type="password"], input#password').first().fill(USER.password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();

  // Wait for redirect back to the app
  await page.waitForURL((url) => !url.toString().includes('keycloak') && !url.toString().includes('8080'), {
    timeout: 30000,
  });
  await page.waitForLoadState('networkidle');
}

async function maybeSkipTour(page) {
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], .MuiButtonBase-root'));
    const skip = buttons.find((b) => b.textContent?.includes('Skip'));
    if (skip) skip.click();
  });
  await page.waitForTimeout(800);
}

async function openAiDialog(page) {
  await maybeSkipTour(page);
  const aiButton = page.locator('[data-testid="ai-assistant-fab"]').first();
  await expect(aiButton).toBeVisible({ timeout: 15000 });
  await aiButton.click();
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /Smart Query Assistant|AI Query Assistant|المساعد الذكي/ });
  await expect(dialog).toBeVisible({ timeout: 10000 });
}

test.setTimeout(180000);

test.describe('AI Assistant — greetings and queries', () => {
  test('AI assistant greets and answers a query', async ({ page }) => {
    await login(page);
    await openAiDialog(page);

    // 1. Greeting
    const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
    await input.fill('hi');
    await input.press('Enter');

  const allAiMessages = page.locator('[role="dialog"] [data-testid="ai-message"]');
  await expect(allAiMessages.first()).toBeVisible({ timeout: 15000 });
  const greetingText = await allAiMessages.first().textContent();
  expect(greetingText).toMatch(/Smart Query Assistant|المساعد الذكي/);
  expect(greetingText).not.toContain('unknown');

  // 2. Data query via suggestion chip
  const attendanceChip = page.locator('[role="dialog"] .MuiChip-root, [role="dialog"] button').filter({ hasText: /Last month absences|How many absences/ }).first();
  if (await attendanceChip.isVisible({ timeout: 3000 }).catch(() => false)) {
    await attendanceChip.click();
  } else {
    await input.fill('How many absences last month?');
    await input.press('Enter');
  }

  await expect(allAiMessages).toHaveCount(2, { timeout: 120000 });
  const reply = allAiMessages.nth(1);
  const replyText = await reply.textContent();
  expect(replyText.length).toBeGreaterThan(10);
  expect(replyText).not.toContain('I\'m not sure I understood');
});

  test('AI assistant answers a human cases query in English', async ({ page }) => {
    await login(page);
    await openAiDialog(page);

    const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
    await input.fill('How many human cases this month?');
    await input.press('Enter');

    const allAiMessages = page.locator('[role="dialog"] [data-testid="ai-message"]');
    await expect(allAiMessages.first()).toBeVisible({ timeout: 120000 });
    const replyText = await allAiMessages.first().textContent();
    expect(replyText.length).toBeGreaterThan(10);
    expect(replyText).not.toContain('An error occurred');
    expect(replyText).not.toContain('I\'m not sure I understood');
  });

  test('AI assistant answers a human cases query in Arabic', async ({ page }) => {
    // Force Arabic UI language before the app loads
    await page.goto(`${BASE_URL}/welcome`);
    await page.evaluate(() => {
      localStorage.setItem('lang', 'ar');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for Keycloak redirect
    await page.waitForURL((url) => url.toString().includes('keycloak') || url.toString().includes('8080'), {
      timeout: 20000,
    });

    await page.locator('input[name="username"], input[type="email"], input#username').first().fill(USER.email);
    await page.locator('input[name="password"], input[type="password"], input#password').first().fill(USER.password);
    await page.locator('button[type="submit"], input[type="submit"]').first().click();

    await page.waitForURL((url) => !url.toString().includes('keycloak') && !url.toString().includes('8080'), {
      timeout: 30000,
    });
    await page.waitForLoadState('networkidle');

    await openAiDialog(page);

    const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
    await input.fill('كم عدد الحالات الإنسانية هذا الشهر؟');
    await input.press('Enter');

    const allAiMessages = page.locator('[role="dialog"] [data-testid="ai-message"]');
    await expect(allAiMessages.first()).toBeVisible({ timeout: 120000 });
    const replyText = await allAiMessages.first().textContent();
    expect(replyText.length).toBeGreaterThan(10);
    expect(replyText).toContain('الحالات الإنسانية');
    expect(replyText).not.toContain('Human Cases');
    expect(replyText).not.toContain('I\'m not sure I understood');
  });
});
